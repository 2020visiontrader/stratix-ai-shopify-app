export interface BrandDNA {
  billing_active?: boolean;
  trial_start_date?: Date;
}

export interface BrandConfig {
  lockout_override: boolean;
  feature_locks: {
    autopilot: boolean;
    bulk_operations: boolean;
    advanced_analytics: boolean;
  };
} 