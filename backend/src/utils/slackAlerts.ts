export async function sendBillingFailAlert(brand: any, reason?: string): Promise<void> {
  // Mock implementation for Slack alerts
  console.log('Billing Fail Alert for brand:', brand.name || brand.id, 'Reason:', reason);
}

export async function sendSecurityAlert(alert: any): Promise<void> {
  console.log('Security Alert:', alert);
}

export async function sendPerformanceAlert(data: any): Promise<void> {
  console.log('Performance Alert:', data);
}
