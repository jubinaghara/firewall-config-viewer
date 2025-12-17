/**
 * Theme Configuration
 * 
 * Centralized styling configuration for easy theming.
 * Modify values here to change the entire application's appearance.
 */

export const theme = {
  // ============================================
  // Colors
  // ============================================
  colors: {
    // Primary Brand Colors
    primary: {
      main: '#0049BD',
      dark: '#004A9F',
      light: '#E6F2FF',
      gradient: 'linear-gradient(180deg, #0049BD 0%, #002157 100%)',
      gradientHorizontal: 'linear-gradient(90deg, #005BC8 0%, #004A9F 100%)',
    },
    
    // Secondary/Accent Colors
    secondary: {
      main: '#00A651',
      dark: '#008A43',
      light: '#E6F7ED',
      gradient: 'linear-gradient(90deg, #00A651 0%, #008A43 100%)',
    },
    
    // Status Colors
    status: {
      success: {
        bg: '#E5F3E8',
        text: '#00851D',
        border: '#00851D',
        badge: {
          bg: '#E5F3E8',
          text: '#00851D',
        },
      },
      error: {
        bg: '#fef2f2',
        text: '#DA3E00',
        border: '#DA3E00',
        badge: {
          bg: '#fee2e2',
          text: '#DA3E00',
        },
      },
      warning: {
        bg: '#FFF4E5',
        text: '#FF8F00',
        border: '#FF8F00',
        badge: {
          bg: '#FFF4E5',
          text: '#FF8F00',
        },
      },
      info: {
        bg: '#eff6ff',
        text: '#1e40af',
        border: '#93c5fd',
        badge: {
          bg: '#dbeafe',
          text: '#1e40af',
        },
      },
    },
    
    // Action Colors
    action: {
      accept: '#10b981', // green-500
      deny: '#ef4444',    // red-500
      neutral: '#6b7280', // gray-500
    },
    
    // Policy Type Colors
    policy: {
      user: '#9333ea',    // purple-600
      network: '#2563eb',  // blue-600
      default: '#4b5563',  // gray-600
    },
    
    // Entity Type Colors
    entity: {
      country: '#dc2626',      // red-600
      webFilterPolicy: '#059669', // emerald-600
      schedule: '#2563eb',     // blue-600
      zone: '#9333ea',         // purple-600
      network: '#4f46e5',      // indigo-600
      application: '#ea580c',  // orange-600
      webFilter: '#0d9488',    // teal-600
      intrusionPrevention: '#e11d48', // rose-600
      virusScanning: '#f59e0b', // amber-600
      default: '#374151',      // gray-700
    },
    
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f3f4f6',
      hover: '#f9fafb',
      active: '#f3f4f6',
    },
    
    // Text Colors
    text: {
      primary: '#2C2D2E',      // gray-900
      secondary: '#777A7D',    // gray-600
      tertiary: '#6b7280',     // gray-500
      disabled: '#9ca3af',      // gray-400
      inverse: '#ffffff',
      heading: '#2C2D2E',
    },
    
    // Border Colors
    border: {
      light: '#e5e7eb',   // gray-200
      medium: '#d1d5db',  // gray-300
      dark: '#9ca3af',    // gray-400
    },
    
    // Badge Colors
    badge: {
      enabled: {
        bg: '#dcfce7',    // green-100
        text: '#166534',  // green-800
      },
      disabled: {
        bg: '#f3f4f6',    // gray-100
        text: '#374151',  // gray-800
      },
      tag: {
        bg: '#dbeafe',    // blue-50
        text: '#1e40af',  // blue-700
      },
    },
    
    // Privacy Notice Colors
    privacy: {
      bg: '#FFE0B2',      // green-50
      border: '#EC6500',  // green-200
      icon: '#EC6500',    // green-600
      text: {
        primary: '#000000', // green-900
        secondary: '#15803d', // green-700
      },
    },
  },
  
  // ============================================
  // Typography
  // ============================================
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.025em',
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // ============================================
  // Spacing
  // ============================================
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // ============================================
  // Border Radius
  // ============================================
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.25rem',    // 4px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  // ============================================
  // Shadows
  // ============================================
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  // ============================================
  // Transitions
  // ============================================
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easing: {
      default: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    },
  },
  
  // ============================================
  // Z-Index
  // ============================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
  
  // ============================================
  // Component-Specific Styles
  // ============================================
  components: {
    header: {
      bg: '#001a47',
      border: '#004A9F',
      text: '#ffffff',
    },
    
    table: {
      header: {
        bg: '#f9fafb',  // gray-50
        text: '#6b7280', // gray-500
        border: '#e5e7eb', // gray-200
      },
      row: {
        hover: '#f9fafb', // gray-50
        border: '#e5e7eb', // gray-200
      },
    },
    
    card: {
      bg: '#ffffff',
      border: '1px solid #0000001a',
      shadow: '0px 0px 6px 0px #0000001a',
      borderRadius: '0.75rem', // xl
    },
    
    landingCard: {
      border: '1px solid #0000001a',
      shadow: '0px 0px 6px 0px #0000001a',
      linkColor: '#003EA4',
    },
    
    button: {
      primary: {
        bg: '#005BC8',
        text: '#ffffff',
        hover: '#004A9F',
      },
      secondary: {
        bg: '#ffffff',
        text: '#005BC8',
        border: '#d1d5db', // gray-300
        hover: '#f5f5f5',
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    
    input: {
      border: '#d1d5db', // gray-300
      focus: '#005BC8',
      error: '#ef4444', // red-500
    },
    
    pagination: {
      bg: '#f9fafb', // gray-50
      border: '#e5e7eb', // gray-200
      text: '#374151', // gray-700
    },
    
    footer: {
      bg: '#f8f9fa', // matches colors.background.secondary
      text: '#2C2D2E', // matches colors.text.primary
      textSecondary: '#777A7D', // matches colors.text.secondary
    },
  },
}

/**
 * Helper function to get theme value by path
 * @param {string} path - Dot-separated path to theme value (e.g., 'colors.primary.main')
 * @returns {any} Theme value or undefined
 */
export const getThemeValue = (path) => {
  const keys = path.split('.')
  let value = theme
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

/**
 * Helper function to generate inline style object from theme
 * @param {string} path - Dot-separated path to theme value
 * @param {string} cssProperty - CSS property name (e.g., 'color', 'backgroundColor')
 * @returns {object} Style object
 */
export const getThemeStyle = (path, cssProperty) => {
  const value = getThemeValue(path)
  if (!value) return {}
  return { [cssProperty]: value }
}

/**
 * React hook for accessing theme (if using hooks)
 * Usage: const theme = useTheme()
 */
export const useTheme = () => theme

export default theme

