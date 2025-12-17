import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for resizable table columns with localStorage persistence
 * @param {string} tableId - Unique identifier for the table (used for localStorage key)
 * @param {number} defaultColumnCount - Number of columns in the table
 * @param {Array<number>} defaultWidths - Optional default column widths in pixels
 * @returns {Object} - Object containing refs and handlers for column resizing
 */
export function useTableColumnResize(tableId, defaultColumnCount, defaultWidths = []) {
  const [columnWidths, setColumnWidths] = useState(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem(`sophos-table-columns-${tableId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === defaultColumnCount) {
          return parsed
        }
      } catch (e) {
        console.warn('Failed to parse stored column widths:', e)
      }
    }
    // Use default widths if provided, otherwise return empty array (auto width)
    return defaultWidths.length === defaultColumnCount ? defaultWidths : []
  })

  const tableRef = useRef(null)
  const resizingRef = useRef({ columnIndex: null, startX: 0, startWidth: 0 })

  // Save to localStorage whenever column widths change
  useEffect(() => {
    if (columnWidths.length > 0) {
      localStorage.setItem(`sophos-table-columns-${tableId}`, JSON.stringify(columnWidths))
    }
  }, [tableId, columnWidths])

  const handleMouseDown = useCallback((e, columnIndex) => {
    e.preventDefault()
    e.stopPropagation()
    
    const th = e.currentTarget.parentElement
    const startWidth = th.offsetWidth
    const startX = e.clientX

    resizingRef.current = { columnIndex, startX, startWidth }

    const handleMouseMove = (e) => {
      if (resizingRef.current.columnIndex === null) return

      const diff = e.clientX - resizingRef.current.startX
      const newWidth = Math.max(50, resizingRef.current.startWidth + diff) // Minimum 50px

      setColumnWidths(prev => {
        const newWidths = [...prev]
        // Initialize array if needed
        while (newWidths.length <= columnIndex) {
          newWidths.push(0)
        }
        newWidths[columnIndex] = newWidth
        return newWidths
      })
    }

    const handleMouseUp = () => {
      resizingRef.current = { columnIndex: null, startX: 0, startWidth: 0 }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // Apply column widths to table headers and cells
  useEffect(() => {
    if (!tableRef.current || columnWidths.length === 0) return

    const thead = tableRef.current.querySelector('thead')
    const tbody = tableRef.current.querySelector('tbody')
    if (!thead) return

    const headers = thead.querySelectorAll('th')
    headers.forEach((th, index) => {
      if (columnWidths[index] && columnWidths[index] > 0) {
        th.style.width = `${columnWidths[index]}px`
        th.style.minWidth = `${columnWidths[index]}px`
        th.style.maxWidth = `${columnWidths[index]}px`
        
        // Also apply to corresponding cells in tbody
        if (tbody) {
          const rows = tbody.querySelectorAll('tr')
          rows.forEach(row => {
            const cell = row.querySelectorAll('td')[index]
            if (cell) {
              cell.style.width = `${columnWidths[index]}px`
              cell.style.minWidth = `${columnWidths[index]}px`
              cell.style.maxWidth = `${columnWidths[index]}px`
            }
          })
        }
      }
    })
  }, [columnWidths])

  // Automatically add resize handles to all headers
  useEffect(() => {
    if (!tableRef.current) return

    const thead = tableRef.current.querySelector('thead')
    if (!thead) return

    const headers = thead.querySelectorAll('th')
    headers.forEach((th, index) => {
      // Check if resize handle already exists
      if (th.querySelector('.sophos-resize-handle')) return

      // Create and add resize handle
      const handle = document.createElement('span')
      handle.className = 'sophos-resize-handle'
      handle.onmousedown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        handleMouseDown(e, index)
      }
      th.appendChild(handle)
    })

    // Cleanup function
    return () => {
      headers.forEach(th => {
        const handle = th.querySelector('.sophos-resize-handle')
        if (handle && handle.parentNode) {
          handle.parentNode.removeChild(handle)
        }
      })
    }
  }, [handleMouseDown, columnWidths])

  return {
    tableRef,
    handleMouseDown,
    columnWidths
  }
}

