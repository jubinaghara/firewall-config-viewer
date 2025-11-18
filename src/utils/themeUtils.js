/**
 * Theme Utilities
 * 
 * Helper functions for using theme values in components
 */

import { theme } from '../theme'

/**
 * Get a theme value by path
 * @param {string} path - Dot-separated path (e.g., 'colors.primary.main')
 * @returns {any} Theme value
 */
export const getTheme = (path) => {
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
 * Generate inline style object from theme
 * @param {object} styleMap - Object mapping CSS properties to theme paths
 * @returns {object} Style object ready for React
 * 
 * @example
 * const styles = getThemeStyles({
 *   backgroundColor: 'colors.primary.main',
 *   color: 'colors.text.inverse',
 *   padding: 'spacing.md'
 * })
 */
export const getThemeStyles = (styleMap) => {
  const styles = {}
  for (const [cssProp, themePath] of Object.entries(styleMap)) {
    const value = getTheme(themePath)
    if (value !== undefined) {
      styles[cssProp] = value
    }
  }
  return styles
}

/**
 * Get Tailwind class name for a theme color
 * Note: This requires the color to be defined in Tailwind config
 * @param {string} colorPath - Theme color path (e.g., 'primary.main')
 * @returns {string} Tailwind class name or empty string
 */
export const getThemeColorClass = (colorPath) => {
  // Map theme paths to Tailwind classes
  const colorMap = {
    'primary.main': 'text-primary',
    'primary.dark': 'text-primary-dark',
    'text.primary': 'text-gray-900',
    'text.secondary': 'text-gray-600',
    'text.tertiary': 'text-gray-500',
    'background.primary': 'bg-white',
    'background.secondary': 'bg-gray-50',
    'border.light': 'border-gray-200',
    'border.medium': 'border-gray-300',
  }
  
  return colorMap[colorPath] || ''
}

/**
 * Combine theme styles with additional styles
 * @param {object} themeStyleMap - Theme style map
 * @param {object} additionalStyles - Additional inline styles
 * @returns {object} Combined style object
 */
export const combineStyles = (themeStyleMap, additionalStyles = {}) => {
  return {
    ...getThemeStyles(themeStyleMap),
    ...additionalStyles,
  }
}

export default {
  getTheme,
  getThemeStyles,
  getThemeColorClass,
  combineStyles,
}

