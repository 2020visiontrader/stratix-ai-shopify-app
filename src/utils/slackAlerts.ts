interface SlackAlertOptions {
  type: 'TRIAL_ENDING' | 'USAGE_OVERAGE' | 'BILLING_FAILED';
  brand: {
    name: string;
    email: string;
    plan?: string;
  };
  message: string;
  details?: Record<string, any>;
}

export async function sendSlackAlert(options: SlackAlertOptions): Promise<void> {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${options.type}*\n${options.message}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Brand:*\n${options.brand.name}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${options.brand.email}`
          }
        ]
      }
    ];

    if (options.brand.plan) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Plan:*\n${options.brand.plan}`
          }
        ]
      });
    }

    if (options.details) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n${JSON.stringify(options.details, null, 2)}`
        }
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blocks })
    });

    if (!response.ok) {
      throw new Error(`Failed to send Slack alert: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    throw error;
  }
}

export async function sendTrialEndingAlert(brand: any): Promise<void> {
  await sendSlackAlert({
    type: 'TRIAL_ENDING',
    brand,
    message: `Trial ending tomorrow for ${brand.name}. Follow up needed.`
  });
}

export async function sendOverageAlert(brand: any, feature: string, usage: number, limit: number): Promise<void> {
  await sendSlackAlert({
    type: 'USAGE_OVERAGE',
    brand,
    message: `Usage limit exceeded for ${feature}`,
    details: {
      feature,
      current_usage: usage,
      limit,
      overage_percent: Math.round((usage / limit - 1) * 100)
    }
  });
}

export async function sendBillingFailAlert(brand: any, reason: string): Promise<void> {
  await sendSlackAlert({
    type: 'BILLING_FAILED',
    brand,
    message: `Billing failed for ${brand.name}`,
    details: {
      reason,
      timestamp: new Date().toISOString()
    }
  });
} 