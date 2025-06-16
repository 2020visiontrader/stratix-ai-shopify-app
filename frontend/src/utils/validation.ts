export class ValidationManager {
  private static instance: ValidationManager;
  private validators: Map<string, Validator>;
  private customValidators: Map<string, CustomValidator>;

  private constructor() {
    this.validators = new Map();
    this.customValidators = new Map();
    this.initializeDefaultValidators();
  }

  public static getInstance(): ValidationManager {
    if (!ValidationManager.instance) {
      ValidationManager.instance = new ValidationManager();
    }
    return ValidationManager.instance;
  }

  private initializeDefaultValidators(): void {
    // Required field validation
    this.addValidator('required', {
      validate: (value: any) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      },
      message: 'This field is required'
    });

    // Email validation
    this.addValidator('email', {
      validate: (value: string) => {
        if (!value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Please enter a valid email address'
    });

    // URL validation
    this.addValidator('url', {
      validate: (value: string) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    });

    // Number validation
    this.addValidator('number', {
      validate: (value: any) => {
        if (!value) return true;
        return !isNaN(Number(value));
      },
      message: 'Please enter a valid number'
    });

    // Integer validation
    this.addValidator('integer', {
      validate: (value: any) => {
        if (!value) return true;
        return Number.isInteger(Number(value));
      },
      message: 'Please enter a valid integer'
    });

    // Minimum length validation
    this.addValidator('minLength', {
      validate: (value: string | any[], minLength: number) => {
        if (!value) return true;
        return value.length >= minLength;
      },
      message: (minLength: number) => `Minimum length is ${minLength} characters`
    });

    // Maximum length validation
    this.addValidator('maxLength', {
      validate: (value: string | any[], maxLength: number) => {
        if (!value) return true;
        return value.length <= maxLength;
      },
      message: (maxLength: number) => `Maximum length is ${maxLength} characters`
    });

    // Minimum value validation
    this.addValidator('min', {
      validate: (value: number, min: number) => {
        if (!value) return true;
        return Number(value) >= min;
      },
      message: (min: number) => `Minimum value is ${min}`
    });

    // Maximum value validation
    this.addValidator('max', {
      validate: (value: number, max: number) => {
        if (!value) return true;
        return Number(value) <= max;
      },
      message: (max: number) => `Maximum value is ${max}`
    });

    // Pattern validation
    this.addValidator('pattern', {
      validate: (value: string, pattern: string | RegExp) => {
        if (!value) return true;
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return regex.test(value);
      },
      message: 'Please match the required pattern'
    });

    // Password strength validation
    this.addValidator('password', {
      validate: (value: string) => {
        if (!value) return true;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      },
      message: 'Password must contain uppercase, lowercase, number, and special character'
    });

    // Phone number validation
    this.addValidator('phone', {
      validate: (value: string) => {
        if (!value) return true;
        const phoneRegex = /^\+?[\d\s-()]{10,}$/;
        return phoneRegex.test(value);
      },
      message: 'Please enter a valid phone number'
    });

    // Date validation
    this.addValidator('date', {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
      },
      message: 'Please enter a valid date'
    });

    // Future date validation
    this.addValidator('futureDate', {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return date > new Date();
      },
      message: 'Please enter a future date'
    });

    // Past date validation
    this.addValidator('pastDate', {
      validate: (value: string) => {
        if (!value) return true;
        const date = new Date(value);
        return date < new Date();
      },
      message: 'Please enter a past date'
    });
  }

  public addValidator(
    name: string,
    validator: Validator
  ): void {
    this.validators.set(name, validator);
  }

  public addCustomValidator(
    name: string,
    validator: CustomValidator
  ): void {
    this.customValidators.set(name, validator);
  }

  public removeValidator(name: string): void {
    this.validators.delete(name);
  }

  public removeCustomValidator(name: string): void {
    this.customValidators.delete(name);
  }

  public validate(
    value: any,
    rules: ValidationRule[]
  ): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const validator = this.validators.get(rule.type);
      if (!validator) {
        console.warn(`Validator not found: ${rule.type}`);
        continue;
      }

      const isValid = validator.validate(value, rule.params);
      if (!isValid) {
        const message = typeof validator.message === 'function'
          ? validator.message(rule.params)
          : validator.message;
        errors.push(message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public async validateCustom(
    value: any,
    validatorName: string,
    params?: any
  ): Promise<ValidationResult> {
    const validator = this.customValidators.get(validatorName);
    if (!validator) {
      return {
        isValid: false,
        errors: [`Custom validator not found: ${validatorName}`]
      };
    }

    try {
      const result = await Promise.resolve(validator(value, params));
      return {
        isValid: result.isValid,
        errors: result.errors || []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      return {
        isValid: false,
        errors: [`Validation error: ${errorMessage}`]
      };
    }
  }

  public async validateAsync(
    value: any,
    rules: ValidationRule[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    for (const rule of rules) {
      const validator = this.validators.get(rule.type);
      if (!validator) {
        console.warn(`Validator not found: ${rule.type}`);
        continue;
      }

      try {
        const isValid = await Promise.resolve(validator.validate(value, rule.params));
        if (!isValid) {
          const message = typeof validator.message === 'function'
            ? validator.message(rule.params)
            : validator.message;
          errors.push(message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
        errors.push(`Validation error: ${errorMessage}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public getValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  public getCustomValidators(): string[] {
    return Array.from(this.customValidators.keys());
  }

  public async exportValidators(format: 'json' | 'typescript'): Promise<string> {
    const validators = Array.from(this.validators.entries()).map(([name, validator]) => ({
      name,
      validator
    }));

    if (format === 'json') {
      return JSON.stringify(validators, null, 2);
    } else {
      return `export const validators = ${JSON.stringify(validators, null, 2)};`;
    }
  }

  public async importValidators(data: string, format: 'json' | 'typescript'): Promise<void> {
    try {
      let parsedData: Array<{ name: string; validator: Validator }>;

      if (format === 'json') {
        parsedData = JSON.parse(data);
      } else {
        // Extract the validators object from TypeScript code
        const match = data.match(/export const validators = ({[\s\S]*});/);
        if (!match) {
          throw new Error('Invalid TypeScript format');
        }
        parsedData = JSON.parse(match[1]);
      }

      parsedData.forEach(({ name, validator }) => {
        this.addValidator(name, validator);
      });
    } catch (error) {
      console.error('Failed to import validators:', error);
    }
  }
}

interface Validator {
  validate: (value: any, params?: any) => boolean | Promise<boolean>;
  message: string | ((params?: any) => string);
}

type CustomValidator = (
  value: any,
  params?: any
) => ValidationResult | Promise<ValidationResult>;

interface ValidationRule {
  type: string;
  params?: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
} 