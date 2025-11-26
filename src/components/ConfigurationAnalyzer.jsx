import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, AlertTriangle, X, ArrowLeft, Loader2, Download, Search } from 'lucide-react'
import { analyzeDuplicates, getTotalDuplicateCount, getTotalDuplicateEntityCount } from '../utils/duplicateDetector'
import { combineStyles } from '../utils/themeUtils'
import theme from '../theme'

/**
 * Configuration Analyzer Component
 * 
 * Displays duplicate entities and misconfigurations found in the configuration
 */
function ConfigurationAnalyzer({ parsedData, onClose, onLoadingChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [duplicateResults, setDuplicateResults] = useState(null)

  // Analyze duplicates from parsed data
  useEffect(() => {
    if (!parsedData) {
      setDuplicateResults(null)
      setIsAnalyzing(false)
      if (onLoadingChange) onLoadingChange(false)
      return
    }

    setIsAnalyzing(true)
    if (onLoadingChange) onLoadingChange(true)

    // Use setTimeout to allow UI to render loading state first
    const analyze = () => {
      try {
        const results = analyzeDuplicates(parsedData)
        setDuplicateResults(results)
      } catch (error) {
        console.error('Error analyzing duplicates:', error)
        setDuplicateResults(null)
      } finally {
        setIsAnalyzing(false)
        if (onLoadingChange) onLoadingChange(false)
      }
    }

    // Small delay to ensure loading state is visible
    const timeoutId = setTimeout(analyze, 50)
    
    return () => clearTimeout(timeoutId)
  }, [parsedData, onLoadingChange])

  // Organize duplicate results by category
  const categories = useMemo(() => {
    if (!duplicateResults) return []
    
      const cats = [
      {
        key: 'ipHosts',
        label: 'IP Hosts',
        icon: 'dns',
        groups: duplicateResults.ipHosts,
        color: theme.colors.primary.main
      },
      {
        key: 'fqdnHosts',
        label: 'FQDN Hosts',
        icon: 'language',
        groups: duplicateResults.fqdnHosts,
        color: theme.colors.secondary.main
      },
      {
        key: 'macHosts',
        label: 'MAC Hosts',
        icon: 'devices',
        groups: duplicateResults.macHosts,
        color: theme.colors.status.info.text
      },
      {
        key: 'services',
        label: 'Services',
        icon: 'settings',
        groups: duplicateResults.services,
        color: theme.colors.status.warning.text
      },
      {
        key: 'ipHostGroups',
        label: 'IP Host Groups',
        icon: 'network',
        groups: duplicateResults.ipHostGroups,
        color: theme.colors.status.info.text
      },
      {
        key: 'fqdnHostGroups',
        label: 'FQDN Host Groups',
        icon: 'globe',
        groups: duplicateResults.fqdnHostGroups,
        color: theme.colors.status.success.text
      },
      {
        key: 'serviceGroups',
        label: 'Service Groups',
        icon: 'layers',
        groups: duplicateResults.serviceGroups,
        color: theme.colors.status.error.text
      }
    ]
    
    return cats.filter(cat => cat.groups.length > 0)
  }, [duplicateResults])

  // Filter categories and groups based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories
    
    const term = searchTerm.toLowerCase()
    return categories.map(cat => {
      const filteredGroups = cat.groups.filter(group => {
        return group.entities.some(entity => 
          entity.name?.toLowerCase().includes(term) ||
          entity.entityType?.toLowerCase().includes(term)
        )
      })
      return { ...cat, groups: filteredGroups }
    }).filter(cat => cat.groups.length > 0)
  }, [categories, searchTerm])

  // Toggle category expansion
  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryKey)) {
        next.delete(categoryKey)
      } else {
        next.add(categoryKey)
      }
      return next
    })
  }

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Expand all
  const expandAll = () => {
    const allCategories = new Set(categories.map(cat => cat.key))
    setExpandedCategories(allCategories)
    const allGroups = new Set()
    categories.forEach(cat => {
      cat.groups.forEach((group, idx) => {
        allGroups.add(`${cat.key}-${idx}`)
      })
    })
    setExpandedGroups(allGroups)
  }

  // Collapse all
  const collapseAll = () => {
    setExpandedCategories(new Set())
    setExpandedGroups(new Set())
  }

  // Handle group selection
  const handleGroupSelect = (categoryKey, groupIndex) => {
    const groupId = `${categoryKey}-${groupIndex}`
    setSelectedGroup(groupId)
    setExpandedGroups(prev => new Set([...prev, groupId]))
  }

  // Format field value for display
  const formatFieldValue = (value, depth = 0) => {
    if (value == null) return '(empty)'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty array)'
      // Handle arrays of objects (like ServiceDetail)
      if (value.every(item => typeof item === 'object' && item !== null)) {
        return value.map((item, idx) => {
          const itemStr = formatFieldValue(item, depth + 1)
          return `[${idx + 1}] ${itemStr}`
        }).join('\n')
      }
      // Handle arrays of primitives
      return value.join(', ')
    }
    
    if (typeof value === 'object') {
      // Special handling for ServiceDetails
      if (value.ServiceDetail && Array.isArray(value.ServiceDetail)) {
        const details = value.ServiceDetail.map((detail, idx) => {
          const parts = []
          if (detail.Protocol) parts.push(`Protocol: ${detail.Protocol}`)
          if (detail.SourcePort) parts.push(`SourcePort: ${detail.SourcePort}`)
          if (detail.DestinationPort) parts.push(`DestinationPort: ${detail.DestinationPort}`)
          return `  [${idx + 1}] ${parts.join(', ')}`
        }).join('\n')
        return `ServiceDetails:\n${details}`
      }
      
      // For other nested objects, format nicely
      if (depth > 2) {
        return JSON.stringify(value, null, 2)
      }
      
      const entries = Object.entries(value).map(([k, v]) => {
        const formatted = formatFieldValue(v, depth + 1)
        return `${k}: ${formatted}`
      }).join('\n')
      return entries || '(empty object)'
    }
    
    return String(value)
  }

  // Get selected group data
  const selectedGroupData = useMemo(() => {
    if (!selectedGroup || !duplicateResults) return null
    
    const [categoryKey, groupIndex] = selectedGroup.split('-')
    const category = categories.find(cat => cat.key === categoryKey)
    if (!category) return null
    
    const group = category.groups[parseInt(groupIndex)]
    return group ? { category, group } : null
  }, [selectedGroup, categories, duplicateResults])

  // Handle HTML export
  const handleExportHTML = () => {
    if (!duplicateResults) {
      alert('No duplicate data available to export')
      return
    }

    try {
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Analyzer Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .category { background: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .category-header { padding: 15px 20px; border-bottom: 1px solid #e5e5e5; font-weight: bold; }
    .group { padding: 15px 20px; border-bottom: 1px solid #f0f0f0; }
    .group:last-child { border-bottom: none; }
    .entity { padding: 10px; margin: 5px 0; background: #f9f9f9; border-left: 3px solid #4CAF50; border-radius: 4px; }
    .entity-name { font-weight: bold; color: #333; }
    .entity-fields { margin-top: 8px; font-size: 0.9em; color: #666; }
    .field { margin: 3px 0; }
    .field-key { font-weight: 600; color: #555; }
    .summary { background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Configuration Analyzer Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <div class="summary">
      <strong>Summary:</strong> Found ${getTotalDuplicateCount(duplicateResults)} duplicate groups 
      containing ${getTotalDuplicateEntityCount(duplicateResults)} duplicate entities
    </div>
  </div>
`

      categories.forEach(category => {
        if (category.groups.length === 0) return
        
        htmlContent += `
  <div class="category">
    <div class="category-header">${category.label} (${category.groups.length} duplicate groups)</div>
`
        
        category.groups.forEach((group, groupIdx) => {
          htmlContent += `
    <div class="group">
      <h3>Duplicate Group ${groupIdx + 1} (${group.entities.length} entities)</h3>
`
          
          group.entities.forEach((entity, entityIdx) => {
            htmlContent += `
      <div class="entity">
        <div class="entity-name">${entityIdx + 1}. ${entity.name || '(Unnamed)'}</div>
        <div class="entity-fields">
`
            
            if (entity.fields) {
              Object.entries(entity.fields).forEach(([key, value]) => {
                if (key !== 'Name') {
                  htmlContent += `
          <div class="field">
            <span class="field-key">${key}:</span> ${formatFieldValue(value)}
          </div>
`
                }
              })
            }
            
            htmlContent += `
        </div>
      </div>
`
          })
          
          htmlContent += `
    </div>
`
        })
        
        htmlContent += `
  </div>
`
      })
      
      htmlContent += `
</body>
</html>
`
      
      // Create and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `configuration-analyzer-report-${new Date().toISOString().split('T')[0]}.html`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating HTML:', error)
      alert('Error generating HTML report. Please check the console for details.')
    }
  }

  const totalDuplicateCount = duplicateResults ? getTotalDuplicateCount(duplicateResults) : 0
  const totalEntityCount = duplicateResults ? getTotalDuplicateEntityCount(duplicateResults) : 0

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg" style={{ 
      minHeight: '600px',
      maxHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: theme.colors.border.light }}
      >
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
              style={{ color: theme.colors.text.secondary }}
              aria-label="Back to Report"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Report</span>
            </button>
          )}
          <AlertTriangle className="w-6 h-6" style={{ color: theme.colors.status.warning.text }} />
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text.heading }}>
            Configuration Analyzer
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHTML}
            disabled={isAnalyzing || !duplicateResults || totalDuplicateCount === 0}
            className="px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={combineStyles(
              { 
                color: 'components.button.primary.text',
                backgroundColor: 'components.button.primary.bg',
                fontFamily: 'typography.fontFamily.primary',
                border: 'none'
              }
            )}
            onMouseEnter={(e) => {
              if (!isAnalyzing && duplicateResults && totalDuplicateCount > 0) {
                e.target.style.backgroundColor = theme.components.button.primary.hover
              }
            }}
            onMouseLeave={(e) => {
              if (!isAnalyzing && duplicateResults && totalDuplicateCount > 0) {
                e.target.style.backgroundColor = theme.components.button.primary.bg
              }
            }}
          >
            <Download className="w-4 h-4" />
            Download as HTML
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="px-6 py-4 border-b" style={{ borderColor: theme.colors.border.light }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search duplicate entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{
                borderColor: theme.colors.border.medium,
                focusRingColor: theme.colors.primary.main
              }}
            />
          </div>
          <button
            onClick={expandAll}
            className="px-3 py-2 text-sm font-medium rounded transition-colors"
            style={{
              color: theme.colors.primary.main,
              backgroundColor: theme.colors.primary.light,
              border: `1px solid ${theme.colors.primary.light}`
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.primary.main}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.colors.primary.light}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-sm font-medium rounded transition-colors"
            style={{
              color: theme.colors.text.secondary,
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.light}`
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.background.hover}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.colors.background.secondary}
          >
            Collapse All
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {totalDuplicateCount} duplicate {totalDuplicateCount === 1 ? 'group' : 'groups'} found 
          ({totalEntityCount} duplicate {totalEntityCount === 1 ? 'entity' : 'entities'})
        </div>
      </div>

      {/* Main Content */}
      {!parsedData ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No configuration data available</p>
            <p className="text-sm">Please upload a configuration file first</p>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: theme.colors.primary.main }} />
            <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text.heading }}>
              Analyzing configuration
            </p>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Detecting duplicates and misconfigurations...
            </p>
          </div>
        </div>
      ) : totalDuplicateCount === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No duplicates found</p>
            <p className="text-sm">All entities appear to be unique</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>
          {/* Categories List */}
          <div
            className="w-1/3 border-r flex flex-col"
            style={{ 
              borderColor: theme.colors.border.light,
              maxHeight: 'calc(100vh - 280px)',
              minHeight: 0
            }}
          >
            <div className="p-4 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              {filteredCategories.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No duplicates found matching your search' : 'No duplicates found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => {
                    const isExpanded = expandedCategories.has(category.key)
                    const groupCount = category.groups.length
                    const entityCount = category.groups.reduce((sum, g) => sum + g.entities.length, 0)
                    
                    return (
                      <div key={category.key} className="border rounded-lg" style={{ borderColor: theme.colors.border.light }}>
                        <div
                          onClick={() => toggleCategory(category.key)}
                          className="px-3 py-2 cursor-pointer transition-colors flex items-center justify-between"
                          style={{
                            backgroundColor: isExpanded ? theme.colors.background.hover : 'transparent'
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {category.groups.length > 0 && (
                              <div className="flex-shrink-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                            )}
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.status.warning.text }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: theme.colors.text.heading }}>
                                {category.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {groupCount} {groupCount === 1 ? 'group' : 'groups'}, {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="pl-4 pb-2 space-y-1">
                            {category.groups.map((group, groupIdx) => {
                              const groupId = `${category.key}-${groupIdx}`
                              const isGroupSelected = selectedGroup === groupId
                              
                              return (
                                <div key={groupIdx} className="space-y-1">
                                  {group.entities.map((entity, entityIdx) => {
                                    const entityKey = `${groupId}-${entityIdx}`
                                    return (
                                      <div
                                        key={entityKey}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleGroupSelect(category.key, groupIdx)
                                        }}
                                        className="px-3 py-2 rounded cursor-pointer transition-colors text-sm"
                                        style={{
                                          backgroundColor: isGroupSelected ? theme.colors.primary.light : 'transparent',
                                          color: isGroupSelected ? theme.colors.primary.main : theme.colors.text.primary,
                                          borderLeft: entityIdx === 0 ? `3px solid ${theme.colors.status.info.text}` : 'none',
                                          marginLeft: entityIdx > 0 ? '8px' : '0'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isGroupSelected) {
                                            e.target.style.backgroundColor = theme.colors.background.hover
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isGroupSelected) {
                                            e.target.style.backgroundColor = 'transparent'
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{entity.name || '(Unnamed)'}</span>
                                          {entityIdx === 0 && (
                                            <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                                              ({group.entities.length} {group.entities.length === 1 ? 'duplicate' : 'duplicates'})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  {groupIdx < category.groups.length - 1 && (
                                    <div className="my-2 border-t" style={{ borderColor: theme.colors.border.light }}></div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details View */}
          <div 
            className="flex-1 overflow-y-auto p-6"
            style={{ 
              maxHeight: 'calc(100vh - 280px)',
              minHeight: 0
            }}
          >
            {!selectedGroupData ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select duplicate entities to view details</p>
                  <p className="text-sm">Choose duplicate entities from the list to see their configuration</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 pb-4 border-b" style={{ borderColor: theme.colors.border.light }}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.heading }}>
                      {selectedGroupData.category.label} - {selectedGroupData.group.isPartial ? 'Partial Duplicates' : 'Duplicates'}
                    </h3>
                    {selectedGroupData.group.isPartial && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                        backgroundColor: theme.colors.status.warning.bg,
                        color: theme.colors.status.warning.text,
                        border: `1px solid ${theme.colors.status.warning.border}`
                      }}>
                        Partial Match
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedGroupData.group.entities.length} {selectedGroupData.group.entities.length === 1 ? 'entity' : 'entities'} 
                    {selectedGroupData.group.isPartial 
                      ? ' with overlapping members' 
                      : ' with identical configuration'}
                    {selectedGroupData.group.typeKey && selectedGroupData.group.typeKey !== 'default' && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{
                        backgroundColor: theme.colors.badge.tag.bg,
                        color: theme.colors.badge.tag.text
                      }}>
                        {selectedGroupData.group.typeKey}
                      </span>
                    )}
                  </p>
                  {selectedGroupData.group.isPartial && selectedGroupData.group.commonMembers && (
                    <p className="text-xs text-gray-500 mt-1">
                      Common members: {selectedGroupData.group.commonMembers.join(', ')}
                    </p>
                  )}
                </div>
                
                <div className="space-y-4">
                  {selectedGroupData.group.entities.map((entity, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border"
                      style={{
                        borderColor: theme.colors.border.medium,
                        backgroundColor: theme.colors.background.secondary
                      }}
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" style={{ color: theme.colors.status.warning.text }} />
                          <span className="font-semibold text-sm" style={{ color: theme.colors.text.heading }}>
                            {idx + 1}. {entity.name || '(Unnamed)'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: theme.colors.badge.tag.bg,
                            color: theme.colors.badge.tag.text
                          }}>
                            {entity.entityType}
                          </span>
                        </div>
                      </div>
                      
                      {entity.fields && Object.keys(entity.fields).filter(k => k !== 'Name').length > 0 && (
                        <div className="space-y-3 text-sm">
                          {Object.entries(entity.fields).map(([key, value]) => {
                            if (key === 'Name') return null
                            
                            // Special handling for member arrays in groups - highlight duplicates
                            const isMemberArray = (key === 'HostList' || key === 'FQDNHostList' || key === 'Member' || key === 'Members') &&
                                                  selectedGroupData.group.isPartial && entity.commonMembers
                            
                            // Special handling for ServiceDetails - render as table
                            if (key === 'ServiceDetails' && typeof value === 'object' && value !== null && 
                                value.ServiceDetail && Array.isArray(value.ServiceDetail) && value.ServiceDetail.length > 0) {
                              return (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium text-gray-600">{key}:</span>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse" style={{ borderColor: theme.colors.border.medium }}>
                                      <thead>
                                        <tr style={{ backgroundColor: theme.colors.background.tertiary }}>
                                          <th className="px-3 py-2 text-left font-semibold border" style={{ 
                                            borderColor: theme.colors.border.medium,
                                            color: theme.colors.text.heading
                                          }}>
                                            Source Port
                                          </th>
                                          <th className="px-3 py-2 text-left font-semibold border" style={{ 
                                            borderColor: theme.colors.border.medium,
                                            color: theme.colors.text.heading
                                          }}>
                                            Destination Port
                                          </th>
                                          <th className="px-3 py-2 text-left font-semibold border" style={{ 
                                            borderColor: theme.colors.border.medium,
                                            color: theme.colors.text.heading
                                          }}>
                                            Protocol
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {value.ServiceDetail.map((detail, idx) => (
                                          <tr key={idx} style={{ 
                                            backgroundColor: idx % 2 === 0 ? 'transparent' : theme.colors.background.secondary
                                          }}>
                                            <td className="px-3 py-2 border" style={{ 
                                              borderColor: theme.colors.border.medium,
                                              color: theme.colors.text.primary
                                            }}>
                                              {detail.SourcePort || '-'}
                                            </td>
                                            <td className="px-3 py-2 border" style={{ 
                                              borderColor: theme.colors.border.medium,
                                              color: theme.colors.text.primary
                                            }}>
                                              {detail.DestinationPort || '-'}
                                            </td>
                                            <td className="px-3 py-2 border" style={{ 
                                              borderColor: theme.colors.border.medium,
                                              color: theme.colors.text.primary
                                            }}>
                                              {detail.Protocol || '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )
                            }
                            
                            // Handle member arrays with highlighting for partial duplicates
                            if (isMemberArray && Array.isArray(value)) {
                              const memberArray = value
                              return (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium text-gray-600">{key}:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {memberArray.map((member, memIdx) => {
                                      const memberStr = typeof member === 'string' ? member.trim() : 
                                                       (typeof member === 'object' && member !== null ? 
                                                        (member.Host || member.FQDNHost || member.Member || Object.values(member)[0] || String(member)) : 
                                                        String(member))
                                      const isCommon = entity.commonMembers && entity.commonMembers.includes(memberStr)
                                      return (
                                        <span
                                          key={memIdx}
                                          className="px-2 py-1 rounded text-xs"
                                          style={{
                                            backgroundColor: isCommon 
                                              ? theme.colors.status.warning.bg 
                                              : theme.colors.status.info.bg,
                                            border: `1px solid ${isCommon 
                                              ? theme.colors.status.warning.border 
                                              : theme.colors.status.info.border}`,
                                            color: isCommon 
                                              ? theme.colors.status.warning.text 
                                              : theme.colors.status.info.text,
                                            fontWeight: isCommon ? 600 : 500
                                          }}
                                        >
                                          {memberStr}
                                          {isCommon && (
                                            <span className="ml-1" title="Common member">✓</span>
                                          )}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            
                            // Handle HostList.Host structure
                            if ((key === 'HostList' || key === 'FQDNHostList') && typeof value === 'object' && value !== null) {
                              const hostArray = value.Host || value.FQDNHost || (Array.isArray(value) ? value : [])
                              if (Array.isArray(hostArray) && hostArray.length > 0 && selectedGroupData.group.isPartial && entity.commonMembers) {
                                return (
                                  <div key={key} className="space-y-1">
                                    <span className="font-medium text-gray-600">{key}:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {hostArray.map((host, hostIdx) => {
                                        const hostStr = typeof host === 'string' ? host.trim() : String(host)
                                        const isCommon = entity.commonMembers && entity.commonMembers.includes(hostStr)
                                        return (
                                          <span
                                            key={hostIdx}
                                            className="px-2 py-1 rounded text-xs"
                                            style={{
                                              backgroundColor: isCommon 
                                                ? theme.colors.status.warning.bg 
                                                : theme.colors.status.info.bg,
                                              border: `1px solid ${isCommon 
                                                ? theme.colors.status.warning.border 
                                                : theme.colors.status.info.border}`,
                                              color: isCommon 
                                                ? theme.colors.status.warning.text 
                                                : theme.colors.status.info.text,
                                              fontWeight: isCommon ? 600 : 500
                                            }}
                                          >
                                            {hostStr}
                                            {isCommon && (
                                              <span className="ml-1" title="Common member">✓</span>
                                            )}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              }
                            }
                            
                            const formattedValue = formatFieldValue(value)
                            const isMultiline = formattedValue.includes('\n')
                            return (
                              <div key={key} className={isMultiline ? 'flex flex-col gap-1' : 'flex gap-2'}>
                                <span className="font-medium text-gray-600 min-w-[120px]">{key}:</span>
                                {isMultiline ? (
                                  <pre className="text-gray-800 text-xs whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded border" style={{ 
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    fontSize: '0.75rem'
                                  }}>
                                    {formattedValue}
                                  </pre>
                                ) : (
                                  <span className="text-gray-800 break-words">{formattedValue}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigurationAnalyzer

