
require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const { fetchLead } = require("./service/leadService");

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const leadSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  createdTime: {
    type: Date,
    default: Date.now
  },
  formId: {
    type: String,
    default: null
  },
  fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const Lead = mongoose.model("Lead", leadSchema);

const processingLeads = new Set();

//real one
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" &&token === process.env.META_VERIFY_TOKEN &&challenge){
    return res.status(200).type("text/plain").send(challenge);
  }
  return res.sendStatus(403);
});

async function processLead(leadId, notification) {
  if (processingLeads.has(leadId)) {
    return;
  }
  processingLeads.add(leadId);
  try {
    const existingLead = await Lead.findOne({ id: leadId });
    if (existingLead) {
      return;
    }
    console.log("Fetching Meta lead:", {
      leadId,
      pageId: notification.page_id,
      formId: notification.form_id
    });
    const lead = await fetchLead(leadId);
    const savedLead = await Lead.create(lead);
    const leadData = savedLead.toObject();
    io.emit("lead:new", leadData);
    console.log("Meta lead saved:", leadData.id);
  } catch (error) {
    if (error.code === 11000) {
      return;
    }
    console.error(
      "Failed to retrieve or save Meta lead:",
      leadId,
      error.response?.data || error.message
    );
  } finally {
    processingLeads.delete(leadId);
  }
}

app.post("/webhook", (req, res) => {
  const body = req.body;
  const notifications = [];

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen") continue;

      const leadId = change.value?.leadgen_id;

      if (!leadId) continue;

      notifications.push({
        leadId,
        value: change.value
      });
    }
  }

  res.sendStatus(200);

  for (const notification of notifications) {
    void processLead(
      notification.leadId,
      notification.value
    );
  }
});
//test 
app.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find()
      .sort({ createdTime: -1 })
      .lean();
    res.json({
      success: true,
      leads
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch leads"
    });
  }
});
app.post("/test-lead", async (req, res) => {
  const { id, name, email, phone, createdTime } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Lead ID is required"
    });
  }

  try {
    const lead = await Lead.create({
      id,
      name: name || null,
      email: email || null,
      phone: phone || null,
      createdTime: createdTime || new Date()
    });

    const leadData = lead.toObject();

    io.emit("lead:new", leadData);

    return res.status(201).json({
      success: true,
      lead: leadData
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Lead already exists"
      });
    }

    console.error("Failed to save test lead:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save lead"
    });
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
