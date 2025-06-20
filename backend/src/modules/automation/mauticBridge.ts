// Source: https://github.com/mautic/mautic (adapted for Stratix)
// Campaign Automation + Segmentation Bridge
// Only essential logic included. Uses Mautic HTTP API.

import axios from 'axios';

// Mautic API base URL and credentials (should be set in environment variables)
const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL || '';
const MAUTIC_USERNAME = process.env.MAUTIC_USERNAME || '';
const MAUTIC_PASSWORD = process.env.MAUTIC_PASSWORD || '';

// Helper: Basic Auth header
function getAuthHeader() {
  return {
    auth: {
      username: MAUTIC_USERNAME,
      password: MAUTIC_PASSWORD,
    },
  };
}

// Trigger a Mautic campaign event (email, SMS, etc.) for a contact
export async function triggerMauticEvent(contactEmail: string, eventType: 'email' | 'sms' | 'loyalty', eventData: any) {
  // 1. Find or create contact
  let contactId;
  try {
    const searchRes = await axios.get(
      `${MAUTIC_BASE_URL}/api/contacts?search=email:${contactEmail}`,
      getAuthHeader()
    );
    if (searchRes.data.contacts && Object.keys(searchRes.data.contacts).length > 0) {
      contactId = Object.keys(searchRes.data.contacts)[0];
    } else {
      // Create contact
      const createRes = await axios.post(
        `${MAUTIC_BASE_URL}/api/contacts/new`,
        { email: contactEmail, ...eventData },
        getAuthHeader()
      );
      contactId = createRes.data.contact.id;
    }
  } catch (err) {
    throw new Error('Failed to find or create Mautic contact: ' + err);
  }

  // 2. Trigger event (add to campaign/segment, send email/SMS, etc.)
  try {
    if (eventType === 'email') {
      // Example: Send transactional email (Mautic must have template set up)
      await axios.post(
        `${MAUTIC_BASE_URL}/api/emails/send`,
        { id: eventData.emailId, to: contactEmail },
        getAuthHeader()
      );
    } else if (eventType === 'sms') {
      // Example: Send SMS (requires SMS plugin in Mautic)
      await axios.post(
        `${MAUTIC_BASE_URL}/api/sms/send`,
        { id: eventData.smsId, to: contactId },
        getAuthHeader()
      );
    } else if (eventType === 'loyalty') {
      // Example: Add to loyalty segment
      await axios.post(
        `${MAUTIC_BASE_URL}/api/segments/${eventData.segmentId}/contact/${contactId}/add`,
        {},
        getAuthHeader()
      );
    }
  } catch (err) {
    throw new Error('Failed to trigger Mautic event: ' + err);
  }
}

// Example usage (to be called from AI test data or product change triggers):
// await triggerMauticEvent('user@email.com', 'email', { emailId: 12 });
// await triggerMauticEvent('user@email.com', 'sms', { smsId: 5 });
// await triggerMauticEvent('user@email.com', 'loyalty', { segmentId: 3 });
