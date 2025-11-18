# Theme System Documentation

This project uses a centralized theme system for easy theming and styling consistency.

## Files

- **`src/theme.js`** - Main theme configuration file containing all colors, fonts, spacing, and styling constants
- **`src/utils/themeUtils.js`** - Utility functions for accessing theme values in components
- **`tailwind.config.js`** - Tailwind CSS configuration that extends the theme

## Quick Theming Guide

To change the application's appearance, simply edit values in `src/theme.js`:

### Changing Primary Colors

```javascript
// In src/theme.js
colors: {
  primary: {
    main: '#005BC8',    // Change this to your primary color
    dark: '#004A9F',    // Darker shade
    light: '#E6F2FF',   // Lighter shade
    // ...
  }
}
```

### Changing Fonts

```javascript
// In src/theme.js
typography: {
  fontFamily: {
    primary: 'Your Font, Arial, sans-serif',  // Change this
    // ...
  }
}
```

### Changing Spacing

```javascript
// In src/theme.js
spacing: {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  // ...
}
```

## Using Theme in Components

### Method 1: Direct Import (Recommended for inline styles)

```javascript
import theme from '../theme'

// Use directly
<div style={{ color: theme.colors.primary.main }}>
  Hello
</div>
```

### Method 2: Using Theme Utilities

```javascript
import { getThemeStyles, combineStyles } from '../utils/themeUtils'

// Generate styles from theme paths
<div style={getThemeStyles({ 
  backgroundColor: 'colors.primary.main',
  color: 'colors.text.inverse'
})}>
  Hello
</div>

// Combine theme styles with additional styles
<div style={combineStyles(
  { backgroundColor: 'colors.primary.main' },
  { padding: '1rem' }
)}>
  Hello
</div>
```

### Method 3: Tailwind Classes (when available)

After updating `tailwind.config.js`, you can use Tailwind classes:

```javascript
<div className="bg-primary text-white">
  Hello
</div>
```

## Theme Structure

The theme is organized into logical sections:

- **colors** - All color definitions (primary, secondary, status, text, etc.)
- **typography** - Font families, sizes, weights, spacing
- **spacing** - Consistent spacing values
- **borderRadius** - Border radius values
- **shadows** - Box shadow definitions
- **transitions** - Transition durations and easing
- **zIndex** - Z-index layering values
- **components** - Component-specific styling

## Creating a New Theme

To create a completely new theme:

1. Copy `src/theme.js` to `src/theme-dark.js` (or your theme name)
2. Modify all color and styling values
3. Update imports in components to use the new theme file
4. Or create a theme switcher that dynamically imports themes

## Best Practices

1. **Always use theme values** - Don't hardcode colors or spacing in components
2. **Use semantic names** - Use `colors.primary.main` instead of `colors.blue.500`
3. **Keep it consistent** - If you add a new color, add it to the theme first
4. **Document custom values** - If you add theme values, document them in this file

## Examples

### Changing the entire color scheme

```javascript
// In src/theme.js, change:
colors: {
  primary: {
    main: '#6366f1',    // New indigo primary
    dark: '#4f46e5',
    light: '#eef2ff',
  },
  // ... update other colors
}
```

### Adding a new color

```javascript
// In src/theme.js
colors: {
  // ... existing colors
  accent: {
    main: '#f59e0b',
    light: '#fef3c7',
    dark: '#d97706',
  }
}

// Then use in components:
<div style={{ color: theme.colors.accent.main }}>
  Accent text
</div>
```

