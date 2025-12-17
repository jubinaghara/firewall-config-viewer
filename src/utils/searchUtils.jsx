/**
 * Search utility functions for global search functionality
 * Used by both ReportView.jsx (React) and htmlGenerator.js (HTML export)
 */

import React from 'react'

/**
 * Escapes special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Validates a regex pattern
 * @param {string} pattern - Regex pattern to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
export function validateRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'Invalid pattern' }
  }
  try {
    new RegExp(pattern)
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: e.message }
  }
}

/**
 * Builds a regex pattern from a search query based on options
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @param {boolean} options.caseSensitive - Case-sensitive search
 * @param {boolean} options.useRegex - Use regex pattern
 * @param {boolean} options.wholeWord - Match whole words only
 * @returns {object} - { regex: RegExp|null, error: string|null }
 */
export function buildSearchRegex(query, options = {}) {
  const { caseSensitive = false, useRegex = false, wholeWord = false } = options

  if (!query || query.trim() === '') {
    return { regex: null, error: null }
  }

  let pattern = query

  // If not using regex, escape special characters
  if (!useRegex) {
    pattern = escapeRegex(pattern)
  } else {
    // Validate regex pattern
    const validation = validateRegex(pattern)
    if (!validation.valid) {
      return { regex: null, error: validation.error }
    }
  }

  // Add whole word boundaries if needed
  if (wholeWord && !useRegex) {
    // For non-regex, use word boundaries
    pattern = `\\b${pattern}\\b`
  } else if (wholeWord && useRegex) {
    // For regex, check if word boundaries are already present
    // If not, wrap the pattern (but be careful with complex regex)
    if (!pattern.includes('\\b') && !pattern.startsWith('^') && !pattern.endsWith('$')) {
      pattern = `\\b(?:${pattern})\\b`
    }
  }

  try {
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(pattern, flags)
    return { regex, error: null }
  } catch (e) {
    return { regex: null, error: e.message }
  }
}

/**
 * Finds all matches in a text string
 * @param {string} text - Text to search
 * @param {RegExp} regex - Regex pattern to match
 * @returns {Array} - Array of match objects: { index: number, text: string, length: number }
 */
export function findMatchesInText(text, regex) {
  if (!text || !regex) return []
  
  const matches = []
  let match
  
  // Reset regex lastIndex to ensure we start from the beginning
  regex.lastIndex = 0
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      text: match[0],
      length: match[0].length
    })
    
    // Prevent infinite loop for zero-length matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
  }
  
  return matches
}

/**
 * Highlights text with search matches (for React/JSX)
 * @param {string} text - Text to highlight
 * @param {RegExp} regex - Regex pattern to match
 * @param {boolean} isCurrent - Whether this is the current match
 * @returns {Array} - Array of React elements (text and highlight spans)
 */
export function highlightTextReact(text, regex, isCurrent = false) {
  if (!text || !regex) return [text]
  
  const parts = []
  let lastIndex = 0
  let match
  regex.lastIndex = 0
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    
    // Add highlighted match
    const highlightStyle = {
      backgroundColor: isCurrent ? '#FF9800' : '#FFEB3B', // Orange for current, yellow for others
      padding: '0 2px',
      borderRadius: '2px',
      fontWeight: isCurrent ? 'bold' : 'normal',
      border: isCurrent ? '2px solid #FF6F00' : 'none'
    }
    
    parts.push(
      <mark key={`match-${match.index}`} style={highlightStyle}>
        {match[0]}
      </mark>
    )
    
    lastIndex = regex.lastIndex
    
    // Prevent infinite loop
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
      lastIndex++
    }
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

/**
 * Highlights text with search matches (for HTML strings)
 * @param {string} text - Text to highlight
 * @param {RegExp} regex - Regex pattern to match
 * @param {boolean} isCurrent - Whether this is the current match
 * @returns {string} - HTML string with highlighted matches
 */
export function highlightTextHTML(text, regex, isCurrent = false) {
  if (!text || !regex) return escapeHtml(text)
  
  // Escape HTML in the text first
  const escapedText = escapeHtml(text)
  const parts = []
  let lastIndex = 0
  let match
  regex.lastIndex = 0
  
  // Create a new regex from the escaped text (we need to match the escaped version)
  // This is a simplified approach - for complex cases, we might need to track positions
  const textMatches = findMatchesInText(text, regex)
  
  if (textMatches.length === 0) {
    return escapedText
  }
  
  // Build HTML with highlights
  let result = ''
  let currentPos = 0
  
  textMatches.forEach((matchObj, idx) => {
    // Add text before match
    if (matchObj.index > currentPos) {
      result += escapedText.substring(
        escapeHtml(text.substring(0, currentPos)).length,
        escapeHtml(text.substring(0, matchObj.index)).length
      )
    }
    
    // Add highlighted match
    const matchText = escapeHtml(text.substring(matchObj.index, matchObj.index + matchObj.length))
    const highlightClass = isCurrent ? 'search-highlight-current' : 'search-highlight'
    result += `<mark class="${highlightClass}">${matchText}</mark>`
    
    currentPos = matchObj.index + matchObj.length
  })
  
  // Add remaining text
  if (currentPos < text.length) {
    const beforeEscaped = escapeHtml(text.substring(0, currentPos))
    const afterEscaped = escapeHtml(text.substring(currentPos))
    result += afterEscaped
  }
  
  return result || escapedText
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML string
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return String(text)
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

