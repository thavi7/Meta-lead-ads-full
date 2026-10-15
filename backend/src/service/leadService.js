const axios = require("axios");

async function fetchLead(leadId) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION;

  if (!token) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not configured");
  }

  if (!version) {
    throw new Error("META_GRAPH_API_VERSION is not configured");
  }

  const response = await axios.get(
    `https://graph.facebook.com/${version}/${leadId}`,
    {
      params: {
        fields: "id,created_time,form_id,field_data",
        access_token: token
      },
      timeout: 15000
    }
  );

  const data = response.data;
  const fields = {};

  for (const field of data.field_data || []) {
    fields[field.name] = field.values?.[0] ?? null;
  }

  return {
    id: data.id,
    name: fields.full_name ?? null,
    email: fields.email ?? null,
    phone: fields.phone_number ?? fields.phone ?? null,
    createdTime: data.created_time ?? null,
    formId: data.form_id ?? null,
    fields
  };
}

module.exports = { fetchLead };