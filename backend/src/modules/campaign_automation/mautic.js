// Source: https://devdocs.mautic.org (adapted for Stratix)
// Campaign Automation - Mautic API integration for campaign triggers

const axios = require('axios');

const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL;
const MAUTIC_USER = process.env.MAUTIC_API_USER;
const MAUTIC_PASS = process.env.MAUTIC_API_PASS;

// Add (or update) a contact in Mautic and add to a specific campaign
async function triggerCampaign(email, campaignId) {
  // 1. Create or update contact
  const contactPayload = { email: email };
  const auth = { username: MAUTIC_USER, password: MAUTIC_PASS };
  const contactRes = await axios.post(`${MAUTIC_BASE_URL}/api/contacts/new`, contactPayload, { auth });
  const contactId = contactRes.data.contact.id;
  console.log(`Mautic contact upserted: ID = ${contactId}`);
  // 2. Add the contact to the campaign
  await axios.post(`${MAUTIC_BASE_URL}/api/campaigns/${campaignId}/contact/${contactId}/add`, {}, { auth });
  console.log(`Contact ${contactId} added to campaign ${campaignId} in Mautic.`);
}

// Example usage:
// triggerCampaign("customer@example.com", 3);

module.exports = { triggerCampaign }; 