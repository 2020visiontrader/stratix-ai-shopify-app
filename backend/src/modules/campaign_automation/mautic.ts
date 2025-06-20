// Campaign Automation - TypeScript implementation using Mautic API
// Creates/updates contacts and adds them to campaigns using real API calls.

import axios from 'axios';

const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL!;
const MAUTIC_USER = process.env.MAUTIC_API_USER!;
const MAUTIC_PASS = process.env.MAUTIC_API_PASS!;

export async function triggerCampaign(email: string, campaignId: number): Promise<void> {
  // 1. Create or update contact
  const contactPayload = { email };
  const auth = { username: MAUTIC_USER, password: MAUTIC_PASS };
  const contactRes = await axios.post(`${MAUTIC_BASE_URL}/api/contacts/new`, contactPayload, { auth });
  const contactId = contactRes.data.contact.id;
  // 2. Add the contact to the campaign
  await axios.post(`${MAUTIC_BASE_URL}/api/campaigns/${campaignId}/contact/${contactId}/add`, {}, { auth });
} 