export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme;
  private readonly defaultTheme: Theme;
  private subscribers: Set<ThemeSubscriber>;

  private constructor() {
    this.defaultTheme = {
      id: 'default',
      name: 'Default Theme',
      colors: {
        primary: '#6B46C1',
        secondary: '#D6BCFA',
        accent: '#F6E05E',
        background: '#FFFFFF',
        surface: '#F7FAFC',
        text: '#1A202C',
        textSecondary: '#4A5568',
        border: '#E2E8F0',
        error: '#E53E3E',
        success: '#38A169',
        warning: '#DD6B20',
        info: '#3182CE'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeight: {
          none: '1',
          tight: '1.25',
          snug: '1.375',
          normal: '1.5',
          relaxed: '1.625',
          loose: '2'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      transitions: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      }
    };

    this.currentTheme = this.loadTheme() || this.defaultTheme;
    this.subscribers = new Set();
    this.applyTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private loadTheme(): Theme | null {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? JSON.parse(savedTheme) : null;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return null;
    }
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem('theme', JSON.stringify(theme));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  private applyTheme(): void {
    const root = document.documentElement;
    const { colors, typography, spacing, borderRadius, shadows } = this.currentTheme;

    // Apply colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography
    root.style.setProperty('--font-family', typography.fontFamily);
    Object.entries(typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });
    Object.entries(typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value);
    });

    // Apply spacing
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius
    Object.entries(borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Apply shadows
    Object.entries(shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Notify subscribers
    this.notifySubscribers();
  }

  public setTheme(theme: Partial<Theme>): void {
    this.currentTheme = {
      ...this.currentTheme,
      ...theme
    };
    this.saveTheme(this.currentTheme);
    this.applyTheme();
  }

  public getTheme(): Theme {
    return { ...this.currentTheme };
  }

  public resetTheme(): void {
    this.currentTheme = { ...this.defaultTheme };
    this.saveTheme(this.currentTheme);
    this.applyTheme();
  }

  public subscribe(subscriber: ThemeSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.currentTheme);
      } catch (error) {
        console.error('Error in theme subscriber:', error);
      }
    });
  }

  public async exportTheme(format: 'json' | 'css'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.currentTheme, null, 2);
    } else {
      const { colors, typography, spacing, borderRadius, shadows } = this.currentTheme;
      const css = `
:root {
  /* Colors */
${Object.entries(colors)
  .map(([key, value]) => `  --color-${key}: ${value};`)
  .join('\n')}

  /* Typography */
  --font-family: ${typography.fontFamily};
${Object.entries(typography.fontSize)
  .map(([key, value]) => `  --font-size-${key}: ${value};`)
  .join('\n')}
${Object.entries(typography.fontWeight)
  .map(([key, value]) => `  --font-weight-${key}: ${value};`)
  .join('\n')}
${Object.entries(typography.lineHeight)
  .map(([key, value]) => `  --line-height-${key}: ${value};`)
  .join('\n')}

  /* Spacing */
${Object.entries(spacing)
  .map(([key, value]) => `  --spacing-${key}: ${value};`)
  .join('\n')}

  /* Border Radius */
${Object.entries(borderRadius)
  .map(([key, value]) => `  --border-radius-${key}: ${value};`)
  .join('\n')}

  /* Shadows */
${Object.entries(shadows)
  .map(([key, value]) => `  --shadow-${key}: ${value};`)
  .join('\n')}
}
      `;
      return css;
    }
  }

  public async importTheme(data: string, format: 'json' | 'css'): Promise<void> {
    try {
      let theme: Partial<Theme>;

      if (format === 'json') {
        theme = JSON.parse(data);
      } else {
        // Parse CSS variables
        const cssVars = data.match(/--[^:]+:\s*[^;]+;/g) || [];
        theme = {
          id: 'imported',
          name: 'Imported Theme',
          colors: {
            primary: '#6B46C1',
            secondary: '#D6BCFA',
            accent: '#F6E05E',
            background: '#FFFFFF',
            surface: '#F7FAFC',
            text: '#1A202C',
            textSecondary: '#4A5568',
            border: '#E2E8F0',
            error: '#E53E3E',
            success: '#38A169',
            warning: '#DD6B20',
            info: '#3182CE'
          },
          typography: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: {},
            fontWeight: {},
            lineHeight: {}
          },
          spacing: {},
          borderRadius: {},
          shadows: {},
          transitions: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          }
        } as Theme;

        cssVars.forEach(variable => {
          const [key, value] = variable.split(':').map(s => s.trim());
          const [category, name] = key.replace('--', '').split('-');
          const cleanValue = value.replace(';', '');

          switch (category) {
            case 'color':
              (theme.colors as any)[name] = cleanValue;
              break;
            case 'font':
              if (name.startsWith('size')) {
                (theme.typography!.fontSize as any)[name.replace('size-', '')] = cleanValue;
              } else if (name.startsWith('weight')) {
                (theme.typography!.fontWeight as any)[name.replace('weight-', '')] = cleanValue;
              } else if (name.startsWith('line-height')) {
                (theme.typography!.lineHeight as any)[name.replace('line-height-', '')] = cleanValue;
              } else if (name === 'family') {
                theme.typography!.fontFamily = cleanValue;
              }
              break;
            case 'spacing':
              (theme.spacing as any)[name] = cleanValue;
              break;
            case 'border-radius':
              (theme.borderRadius as any)[name] = cleanValue;
              break;
            case 'shadow':
              (theme.shadows as any)[name] = cleanValue;
              break;
          }
        });
      }

      this.setTheme(theme);
    } catch (error) {
      console.error('Failed to import theme:', error);
    }
  }
}

type ThemeSubscriber = (theme: Theme) => void;

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
} 