export interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'section' | 'toggle' | 'switch' | 'checkbox' | 'radio';
  config: {
    defaultValue?: boolean;
    requiresAuth?: boolean;
    roles?: string[];
    conditions?: any[];
    dependencies?: string[];
  };
  state: {
    enabled: boolean;
    visible?: boolean;
    loading?: boolean;
  };
  metadata: {
    created?: number;
    updated: number;
    version: string;
    category?: string;
    tags?: string[];
    dependencies?: string[];
    icon?: string;
    tooltip?: string;
    requireConfirmation?: boolean;
    confirmationMessage?: string;
  };
} 