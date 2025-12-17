import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, AlertTriangle, X, ArrowLeft, Loader2, Download, Search, CheckCircle2, XCircle } from 'lucide-react'
import { analyzeDuplicates, getTotalDuplicateCount, getTotalDuplicateEntityCount } from '../utils/duplicateDetector'
import { analyzeFirewallRules, analyzeNATRules, analyzeSSLTLSRules } from '../utils/firewallRuleAnalyzer'
import { flattenFirewallRule, flattenNATRule, flattenSSLTLSInspectionRule } from '../utils/xmlParser'
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
  const [firewallRuleIssues, setFirewallRuleIssues] = useState([])
  const [natRuleIssues, setNATRuleIssues] = useState([])
  const [sslTlsRuleIssues, setSSLTLSRuleIssues] = useState([])
  const [expandedFirewallSections, setExpandedFirewallSections] = useState({ duplicates: true, shadowed: true })
  const [expandedNATSections, setExpandedNATSections] = useState({ duplicates: true, shadowed: true })
  const [expandedSSLTLSections, setExpandedSSLTLSections] = useState({ duplicates: true, shadowed: true })
  const [expandedFirewallRules, setExpandedFirewallRules] = useState(new Set())
  const [expandedNATRules, setExpandedNATRules] = useState(new Set())
  const [expandedSSLTLSRules, setExpandedSSLTLSRules] = useState(new Set())

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
        
        // Analyze firewall rules
        if (parsedData.firewallRules && parsedData.firewallRules.length > 0) {
          const ruleIssues = analyzeFirewallRules(parsedData.firewallRules)
          setFirewallRuleIssues(ruleIssues)
        } else {
          setFirewallRuleIssues([])
        }
        
        // Analyze NAT rules
        if (parsedData.entitiesByTag?.NATRule && parsedData.entitiesByTag.NATRule.length > 0) {
          const natIssues = analyzeNATRules(parsedData.entitiesByTag.NATRule)
          setNATRuleIssues(natIssues)
        } else {
          setNATRuleIssues([])
        }
        
        // Analyze SSL/TLS inspection rules
        if (parsedData.sslTlsInspectionRules && parsedData.sslTlsInspectionRules.length > 0) {
          const sslTlsIssues = analyzeSSLTLSRules(parsedData.sslTlsInspectionRules)
          setSSLTLSRuleIssues(sslTlsIssues)
        } else {
          setSSLTLSRuleIssues([])
        }
      } catch (error) {
        console.error('Error analyzing duplicates:', error)
        setDuplicateResults(null)
        setFirewallRuleIssues([])
        setNATRuleIssues([])
        setSSLTLSRuleIssues([])
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
    const cats = []
    
    if (duplicateResults) {
      cats.push(
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
      )
    }
    
    // Add firewall rules category if there are issues
    if (firewallRuleIssues && firewallRuleIssues.length > 0 && parsedData && parsedData.firewallRules) {
      // Group issues by type
      const duplicateIssues = firewallRuleIssues.filter(i => i.type === 'duplicate')
      const shadowIssues = firewallRuleIssues.filter(i => i.type === 'shadow')
      
      // Group duplicates together
      const duplicateGroups = []
      const duplicateMap = new Map()
      duplicateIssues.forEach(issue => {
        const key = `duplicate-${issue.of}`
        if (!duplicateMap.has(key)) {
          const rule = parsedData.firewallRules[issue.of]
          duplicateMap.set(key, {
            key: key,
            keyString: key,
            typeKey: 'duplicate',
            entities: [{ 
              name: rule?.name || `Rule ${issue.of}`, 
              index: issue.of, 
              entityType: 'FirewallRule',
              rule: rule,
              fields: rule?.networkPolicy || rule?.userPolicy || {}
            }]
          })
        }
        const rule = parsedData.firewallRules[issue.rule_id]
        duplicateMap.get(key).entities.push({
          name: rule?.name || `Rule ${issue.rule_id}`,
          index: issue.rule_id,
          entityType: 'FirewallRule',
          issueType: 'duplicate',
          of: issue.of,
          rule: rule,
          fields: rule?.networkPolicy || rule?.userPolicy || {}
        })
      })
      duplicateGroups.push(...Array.from(duplicateMap.values()).filter(g => g.entities.length > 1))
      
      // Group shadowed rules
      const shadowGroups = []
      shadowIssues.forEach(issue => {
        const shadowingRule = parsedData.firewallRules[issue.by]
        const shadowedRule = parsedData.firewallRules[issue.rule_id]
        shadowGroups.push({
          key: `shadow-${issue.rule_id}`,
          keyString: `shadow-${issue.rule_id}`,
          typeKey: 'shadow',
          entities: [
            { 
              name: shadowingRule?.name || `Rule ${issue.by}`, 
              index: issue.by, 
              entityType: 'FirewallRule',
              rule: shadowingRule,
              fields: shadowingRule?.networkPolicy || shadowingRule?.userPolicy || {}
            },
            { 
              name: shadowedRule?.name || `Rule ${issue.rule_id}`, 
              index: issue.rule_id, 
              entityType: 'FirewallRule',
              issueType: 'shadow',
              by: issue.by,
              reason: issue.reason,
              rule: shadowedRule,
              fields: shadowedRule?.networkPolicy || shadowedRule?.userPolicy || {}
            }
          ]
        })
      })
      
      const allFirewallGroups = [...duplicateGroups, ...shadowGroups]
      
      if (allFirewallGroups.length > 0) {
        cats.push({
          key: 'firewallRules',
          label: 'Firewall Rules',
          icon: 'shield',
          groups: allFirewallGroups,
          color: theme.colors.status.error.text
        })
      }
    }
    
    // Add NAT rules category if there are issues
    if (natRuleIssues && natRuleIssues.length > 0 && parsedData && parsedData.entitiesByTag?.NATRule) {
      const duplicateIssues = natRuleIssues.filter(i => i.type === 'duplicate')
      const shadowIssues = natRuleIssues.filter(i => i.type === 'shadow')
      
      const duplicateGroups = []
      const duplicateMap = new Map()
      duplicateIssues.forEach(issue => {
        const key = `duplicate-${issue.of}`
        if (!duplicateMap.has(key)) {
          const rule = parsedData.entitiesByTag.NATRule[issue.of]
          duplicateMap.set(key, {
            key: key,
            keyString: key,
            typeKey: 'duplicate',
            entities: [{ 
              name: rule?.name || rule?.fields?.Name || `NAT Rule ${issue.of}`, 
              index: issue.of, 
              entityType: 'NATRule',
              rule: rule,
              fields: rule?.fields || {}
            }]
          })
        }
        const rule = parsedData.entitiesByTag.NATRule[issue.rule_id]
        duplicateMap.get(key).entities.push({
          name: rule?.name || rule?.fields?.Name || `NAT Rule ${issue.rule_id}`,
          index: issue.rule_id,
          entityType: 'NATRule',
          issueType: 'duplicate',
          of: issue.of,
          rule: rule,
          fields: rule?.fields || {}
        })
      })
      duplicateGroups.push(...Array.from(duplicateMap.values()).filter(g => g.entities.length > 1))
      
      const shadowGroups = []
      shadowIssues.forEach(issue => {
        const shadowingRule = parsedData.entitiesByTag.NATRule[issue.by]
        const shadowedRule = parsedData.entitiesByTag.NATRule[issue.rule_id]
        shadowGroups.push({
          key: `shadow-${issue.rule_id}`,
          keyString: `shadow-${issue.rule_id}`,
          typeKey: 'shadow',
          entities: [
            { 
              name: shadowingRule?.name || shadowingRule?.fields?.Name || `NAT Rule ${issue.by}`, 
              index: issue.by, 
              entityType: 'NATRule',
              rule: shadowingRule,
              fields: shadowingRule?.fields || {}
            },
            { 
              name: shadowedRule?.name || shadowedRule?.fields?.Name || `NAT Rule ${issue.rule_id}`, 
              index: issue.rule_id, 
              entityType: 'NATRule',
              issueType: 'shadow',
              by: issue.by,
              reason: issue.reason,
              rule: shadowedRule,
              fields: shadowedRule?.fields || {}
            }
          ]
        })
      })
      
      const allNATGroups = [...duplicateGroups, ...shadowGroups]
      
      if (allNATGroups.length > 0) {
        cats.push({
          key: 'natRules',
          label: 'NAT Rules',
          icon: 'swap_horiz',
          groups: allNATGroups,
          color: theme.colors.status.error.text
        })
      }
    }
    
    // Add SSL/TLS rules category if there are issues
    if (sslTlsRuleIssues && sslTlsRuleIssues.length > 0 && parsedData && parsedData.sslTlsInspectionRules) {
      const duplicateIssues = sslTlsRuleIssues.filter(i => i.type === 'duplicate')
      const shadowIssues = sslTlsRuleIssues.filter(i => i.type === 'shadow')
      
      const duplicateGroups = []
      const duplicateMap = new Map()
      duplicateIssues.forEach(issue => {
        const key = `duplicate-${issue.of}`
        if (!duplicateMap.has(key)) {
          const rule = parsedData.sslTlsInspectionRules[issue.of]
          duplicateMap.set(key, {
            key: key,
            keyString: key,
            typeKey: 'duplicate',
            entities: [{ 
              name: rule?.name || `SSL/TLS Rule ${issue.of}`, 
              index: issue.of, 
              entityType: 'SSLTLSInspectionRule',
              rule: rule,
              fields: rule || {}
            }]
          })
        }
        const rule = parsedData.sslTlsInspectionRules[issue.rule_id]
        duplicateMap.get(key).entities.push({
          name: rule?.name || `SSL/TLS Rule ${issue.rule_id}`,
          index: issue.rule_id,
          entityType: 'SSLTLSInspectionRule',
          issueType: 'duplicate',
          of: issue.of,
          rule: rule,
          fields: rule || {}
        })
      })
      duplicateGroups.push(...Array.from(duplicateMap.values()).filter(g => g.entities.length > 1))
      
      const shadowGroups = []
      shadowIssues.forEach(issue => {
        const shadowingRule = parsedData.sslTlsInspectionRules[issue.by]
        const shadowedRule = parsedData.sslTlsInspectionRules[issue.rule_id]
        shadowGroups.push({
          key: `shadow-${issue.rule_id}`,
          keyString: `shadow-${issue.rule_id}`,
          typeKey: 'shadow',
          entities: [
            { 
              name: shadowingRule?.name || `SSL/TLS Rule ${issue.by}`, 
              index: issue.by, 
              entityType: 'SSLTLSInspectionRule',
              rule: shadowingRule,
              fields: shadowingRule || {}
            },
            { 
              name: shadowedRule?.name || `SSL/TLS Rule ${issue.rule_id}`, 
              index: issue.rule_id, 
              entityType: 'SSLTLSInspectionRule',
              issueType: 'shadow',
              by: issue.by,
              reason: issue.reason,
              rule: shadowedRule,
              fields: shadowedRule || {}
            }
          ]
        })
      })
      
      const allSSLTLSGroups = [...duplicateGroups, ...shadowGroups]
      
      if (allSSLTLSGroups.length > 0) {
        cats.push({
          key: 'sslTlsRules',
          label: 'SSL/TLS Inspection Rules',
          icon: 'lock',
          groups: allSSLTLSGroups,
          color: theme.colors.status.error.text
        })
      }
    }
    
    return cats.filter(cat => cat.groups.length > 0)
  }, [duplicateResults, firewallRuleIssues, natRuleIssues, sslTlsRuleIssues, parsedData])

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
    if (!selectedGroup) return null
    
    const [categoryKey, groupIndex] = selectedGroup.split('-')
    const category = categories.find(cat => cat.key === categoryKey)
    if (!category) return null
    
    const group = category.groups[parseInt(groupIndex)]
    return group ? { category, group } : null
  }, [selectedGroup, categories])

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
  const totalFirewallIssues = firewallRuleIssues ? firewallRuleIssues.length : 0
  const totalNATIssues = natRuleIssues ? natRuleIssues.length : 0
  const totalSSLTLSIssues = sslTlsRuleIssues ? sslTlsRuleIssues.length : 0
  const totalIssues = totalDuplicateCount + (totalFirewallIssues > 0 ? 1 : 0) + (totalNATIssues > 0 ? 1 : 0) + (totalSSLTLSIssues > 0 ? 1 : 0) // Count each rule type as one category

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
          {totalFirewallIssues > 0 && (
            <span className="ml-2">
              • {totalFirewallIssues} firewall rule {totalFirewallIssues === 1 ? 'issue' : 'issues'} found
            </span>
          )}
          {totalNATIssues > 0 && (
            <span className="ml-2">
              • {totalNATIssues} NAT rule {totalNATIssues === 1 ? 'issue' : 'issues'} found
            </span>
          )}
          {totalSSLTLSIssues > 0 && (
            <span className="ml-2">
              • {totalSSLTLSIssues} SSL/TLS rule {totalSSLTLSIssues === 1 ? 'issue' : 'issues'} found
            </span>
          )}
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
      ) : totalDuplicateCount === 0 && totalFirewallIssues === 0 && totalNATIssues === 0 && totalSSLTLSIssues === 0 ? (
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
                                          {entity.issueType === 'shadow' && (
                                            <span className="text-xs px-2 py-0.5 rounded ml-2" style={{
                                              backgroundColor: theme.colors.status.warning.bg,
                                              color: theme.colors.status.warning.text
                                            }}>
                                              Shadowed
                                            </span>
                                          )}
                                          {entity.issueType === 'duplicate' && (
                                            <span className="text-xs px-2 py-0.5 rounded ml-2" style={{
                                              backgroundColor: theme.colors.status.error.bg,
                                              color: theme.colors.status.error.text
                                            }}>
                                              Duplicate
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
            ) : selectedGroupData.category.key === 'firewallRules' ? (
              // Special handling for firewall rules - grouped display similar to ReportView
              (() => {
                // Separate entities by issue type
                // For duplicate groups, first entity is the original, rest are duplicates
                // For shadow groups, first entity is the shadowing rule, second is the shadowed rule
                const isDuplicateGroup = selectedGroupData.group.typeKey === 'duplicate'
                const isShadowGroup = selectedGroupData.group.typeKey === 'shadow'
                
                // Get all entities in this group
                const allEntities = selectedGroupData.group.entities
                
                // For duplicate groups, show all entities together
                // For shadow groups, we already have the structure (shadowing + shadowed)
                const duplicateEntities = isDuplicateGroup ? allEntities : []
                const shadowEntities = isShadowGroup ? allEntities : []
                
                const toggleFirewallSection = (section) => {
                  setExpandedFirewallSections(prev => ({
                    ...prev,
                    [section]: !prev[section]
                  }))
                }
                
                const toggleFirewallRule = (ruleId) => {
                  setExpandedFirewallRules(prev => {
                    const next = new Set(prev)
                    if (next.has(ruleId)) {
                      next.delete(ruleId)
                    } else {
                      next.add(ruleId)
                    }
                    return next
                  })
                }
                
                const CollapsibleSection = ({ title, isExpanded, onToggle, children, count }) => (
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)' }}>
                    <button
                      onClick={onToggle}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        {count !== undefined && (
                          <span className="text-xs text-gray-500 font-normal">({count})</span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-3">
                        {children}
                      </div>
                    )}
                  </div>
                )
                
                return (
                  <div>
                    {/* Duplicate Rules Section */}
                    {isDuplicateGroup && duplicateEntities.length > 0 && (
                      <CollapsibleSection
                        title="Duplicate Firewall Rules"
                        isExpanded={expandedFirewallSections.duplicates}
                        onToggle={() => toggleFirewallSection('duplicates')}
                        count={duplicateEntities.length}
                      >
                        <div className="space-y-3">
                          {duplicateEntities.map((entity, idx) => {
                            const rule = entity.rule || parsedData?.firewallRules?.[entity.index]
                            if (!rule) return null
                            const flat = flattenFirewallRule(rule)
                            const isRuleExpanded = expandedFirewallRules.has(`duplicate-${entity.index}`)
                            
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleFirewallRule(`duplicate-${entity.index}`)}
                                  className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {isRuleExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                                        Rule #{entity.index + 1}: {flat.name || 'Unnamed Rule'}
                                      </h4>
                                      {flat.description && (
                                        <p className="text-xs text-gray-600">{flat.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                    {entity.issueType === 'duplicate' && (() => {
                                      const originalRule = parsedData?.firewallRules?.[entity.of]
                                      const originalRuleName = originalRule?.name || `Rule ${entity.of}`
                                      return (
                                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                          backgroundColor: theme.colors.status.error.bg,
                                          color: theme.colors.status.error.text,
                                          border: `1px solid ${theme.colors.status.error.border}`
                                        }}>
                                          Duplicate of {originalRuleName} (ID: {entity.of})
                                        </span>
                                      )
                                    })()}
                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                      flat.status === 'Enable' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {flat.status === 'Enable' ? (
                                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-0.5" />
                                      )}
                                      {flat.status === 'Enable' ? 'Enabled' : 'Disabled'}
                                    </div>
                                  </div>
                                </button>
                                
                                {isRuleExpanded && (
                                  <div className="p-3 pt-0 border-t border-gray-200">
                                    {(() => {
                                      // Helper to check if a value is duplicate across all entities in the group
                                      const isDuplicateValue = (fieldKey, fieldValue) => {
                                        if (duplicateEntities.length < 2) return false
                                        return duplicateEntities.every(otherEntity => {
                                          if (otherEntity.index === entity.index) return true
                                          const otherRule = otherEntity.rule || parsedData?.firewallRules?.[otherEntity.index]
                                          if (!otherRule) return false
                                          const otherPolicy = otherRule.networkPolicy || otherRule.userPolicy || {}
                                          const otherValue = otherPolicy[fieldKey]
                                          const normalizeForCompare = (val) => {
                                            if (val == null) return 'Any'
                                            if (Array.isArray(val)) {
                                              const normalized = val.map(v => String(v).trim()).filter(v => v).sort()
                                              return normalized.length === 0 ? 'Any' : normalized.join(',')
                                            }
                                            const str = String(val).trim()
                                            return str === '' ? 'Any' : str
                                          }
                                          return normalizeForCompare(otherValue) === normalizeForCompare(fieldValue)
                                        })
                                      }
                                      
                                      const policy = rule.networkPolicy || rule.userPolicy || {}
                                      
                                      return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Basic Information */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Basic Information
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Transaction ID:</span>
                                                <span className="text-gray-900 flex-1 text-left">{rule.transactionId || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Policy Type:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.policyType || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>IP Family:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.ipFamily || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Position:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.position || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Action & Traffic Control */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Action & Traffic Control
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Action:</span>
                                                <span className={`flex-1 text-left font-semibold ${
                                                  flat.action === 'Accept' ? 'text-green-700' : 
                                                  flat.action === 'Deny' ? 'text-red-700' : 
                                                  'text-gray-900'
                                                }`}>
                                                  {flat.action || 'N/A'}
                                                </span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Log Traffic:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.logTraffic || 'Disable'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Schedule:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.schedule || 'All The Time'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Source Configuration */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Source Configuration
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              {(() => {
                                                const sourceZones = policy.SourceZones
                                                const sourceZonesArray = Array.isArray(sourceZones) ? sourceZones : 
                                                  (sourceZones?.Zone ? (Array.isArray(sourceZones.Zone) ? sourceZones.Zone : [sourceZones.Zone]) : [])
                                                const normalizedSourceZones = sourceZonesArray.length === 0 ? ['Any'] : sourceZonesArray
                                                const isDup = isDuplicateValue('SourceZones', sourceZones)
                                                
                                                return (
                                                  <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                    <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Source Zones:</span>
                                                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                      {normalizedSourceZones.map((zone, zIdx) => (
                                                        <span
                                                          key={zIdx}
                                                          className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                            backgroundColor: isDup ? '#fee2e2' : theme.colors.badge.tag.bg,
                                                            border: `1px solid ${isDup ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                            color: isDup ? '#dc2626' : theme.colors.badge.tag.text,
                                                            fontWeight: isDup ? 600 : 500
                                                          }}
                                                        >
                                                          {String(zone).trim() || 'Any'}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )
                                              })()}
                                              {(() => {
                                                const sourceNetworks = policy.SourceNetworks
                                                const sourceNetworksArray = Array.isArray(sourceNetworks) ? sourceNetworks : 
                                                  (sourceNetworks?.Network ? (Array.isArray(sourceNetworks.Network) ? sourceNetworks.Network : [sourceNetworks.Network]) : [])
                                                const normalizedSourceNetworks = sourceNetworksArray.length === 0 ? ['Any'] : sourceNetworksArray
                                                const isDup = isDuplicateValue('SourceNetworks', sourceNetworks)
                                                
                                                return (
                                                  <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                    <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Source Networks:</span>
                                                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                      {normalizedSourceNetworks.map((net, nIdx) => (
                                                        <span
                                                          key={nIdx}
                                                          className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                            backgroundColor: isDup ? '#fee2e2' : theme.colors.badge.tag.bg,
                                                            border: `1px solid ${isDup ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                            color: isDup ? '#dc2626' : theme.colors.badge.tag.text,
                                                            fontWeight: isDup ? 600 : 500
                                                          }}
                                                        >
                                                          {String(net).trim() || 'Any'}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )
                                              })()}
                                            </div>
                                          </div>
                                          
                                          {/* Destination Configuration */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Destination Configuration
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              {(() => {
                                                const destZones = policy.DestinationZones
                                                const destZonesArray = Array.isArray(destZones) ? destZones : 
                                                  (destZones?.Zone ? (Array.isArray(destZones.Zone) ? destZones.Zone : [destZones.Zone]) : [])
                                                const normalizedDestZones = destZonesArray.length === 0 ? ['Any'] : destZonesArray
                                                const isDup = isDuplicateValue('DestinationZones', destZones)
                                                
                                                return (
                                                  <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                    <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Destination Zones:</span>
                                                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                      {normalizedDestZones.map((zone, zIdx) => (
                                                        <span
                                                          key={zIdx}
                                                          className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                            backgroundColor: isDup ? '#fee2e2' : theme.colors.badge.tag.bg,
                                                            border: `1px solid ${isDup ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                            color: isDup ? '#dc2626' : theme.colors.badge.tag.text,
                                                            fontWeight: isDup ? 600 : 500
                                                          }}
                                                        >
                                                          {String(zone).trim() || 'Any'}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )
                                              })()}
                                              {(() => {
                                                const destNetworks = policy.DestinationNetworks
                                                const destNetworksArray = Array.isArray(destNetworks) ? destNetworks : 
                                                  (destNetworks?.Network ? (Array.isArray(destNetworks.Network) ? destNetworks.Network : [destNetworks.Network]) : [])
                                                const normalizedDestNetworks = destNetworksArray.length === 0 ? ['Any'] : destNetworksArray
                                                const isDup = isDuplicateValue('DestinationNetworks', destNetworks)
                                                
                                                return (
                                                  <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                    <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Destination Networks:</span>
                                                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                      {normalizedDestNetworks.map((net, nIdx) => (
                                                        <span
                                                          key={nIdx}
                                                          className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                            backgroundColor: isDup ? '#fee2e2' : theme.colors.badge.tag.bg,
                                                            border: `1px solid ${isDup ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                            color: isDup ? '#dc2626' : theme.colors.badge.tag.text,
                                                            fontWeight: isDup ? 600 : 500
                                                          }}
                                                        >
                                                          {String(net).trim() || 'Any'}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )
                                              })()}
                                              {(() => {
                                                const services = policy.Services
                                                const servicesArray = Array.isArray(services) ? services : 
                                                  (services?.Service ? (Array.isArray(services.Service) ? services.Service : [services.Service]) : [])
                                                const normalizedServices = servicesArray.length === 0 ? ['Any'] : servicesArray
                                                const isDup = isDuplicateValue('Services', services)
                                                
                                                return (
                                                  <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                    <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Services:</span>
                                                    <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                      {normalizedServices.map((svc, sIdx) => (
                                                        <span
                                                          key={sIdx}
                                                          className="px-2 py-0.5 rounded text-xs"
                                                          style={{
                                                            backgroundColor: isDup ? '#fee2e2' : theme.colors.badge.tag.bg,
                                                            border: `1px solid ${isDup ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                            color: isDup ? '#dc2626' : theme.colors.badge.tag.text,
                                                            fontWeight: isDup ? 600 : 500
                                                          }}
                                                        >
                                                          {String(svc).trim() || 'Any'}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )
                                              })()}
                                            </div>
                                          </div>
                                          
                                          {/* Security Features */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Security Features
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Web Filter:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.webFilter || 'None'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Application Control:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.applicationControl || 'None'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Intrusion Prevention:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.intrusionPrevention || 'None'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Virus Scanning:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.scanVirus || 'Disable'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Zero Day Protection:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.zeroDayProtection || 'Disable'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Misc Flags */}
                                          <div>
                                            <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                              Additional Settings
                                            </h5>
                                            <div className="space-y-1 text-xs">
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Proxy Mode:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.proxyMode || 'Disable'}</span>
                                              </div>
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>HTTPS Decryption:</span>
                                                <span className="text-gray-900 flex-1 text-left">{flat.decryptHTTPS || 'Disable'}</span>
                                              </div>
                                              {policy.SkipLocalDestined && (
                                                <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                  <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Skip Local Destined:</span>
                                                  <span className="text-gray-900 flex-1 text-left">{policy.SkipLocalDestined}</span>
                                                </div>
                                              )}
                                              {policy.ScanFTP && (
                                                <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                  <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Scan FTP:</span>
                                                  <span className="text-gray-900 flex-1 text-left">{policy.ScanFTP}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Shadowed Rules Section */}
                    {isShadowGroup && shadowEntities.length > 0 && (
                      <CollapsibleSection
                        title="Shadowed Firewall Rules"
                        isExpanded={expandedFirewallSections.shadowed}
                        onToggle={() => toggleFirewallSection('shadowed')}
                        count={shadowEntities.length}
                      >
                        <div className="space-y-3">
                          {shadowEntities.map((entity, idx) => {
                            const rule = entity.rule || parsedData?.firewallRules?.[entity.index]
                            if (!rule) return null
                            const flat = flattenFirewallRule(rule)
                            const isRuleExpanded = expandedFirewallRules.has(`shadow-${entity.index}`)
                            const shadowingRule = parsedData?.firewallRules?.[entity.by]
                            const shadowingRuleName = shadowingRule?.name || `Rule ${entity.by}`
                            
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleFirewallRule(`shadow-${entity.index}`)}
                                  className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {isRuleExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                                        Rule #{entity.index + 1}: {flat.name || 'Unnamed Rule'}
                                      </h4>
                                      {flat.description && (
                                        <p className="text-xs text-gray-600">{flat.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                      backgroundColor: theme.colors.status.warning.bg,
                                      color: theme.colors.status.warning.text,
                                      border: `1px solid ${theme.colors.status.warning.border}`
                                    }}>
                                      Shadowed by {shadowingRuleName} (ID: {entity.by})
                                    </span>
                                    {entity.reason && (
                                      <span className="text-xs text-gray-500">({entity.reason})</span>
                                    )}
                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                      flat.status === 'Enable' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {flat.status === 'Enable' ? (
                                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-0.5" />
                                      )}
                                      {flat.status === 'Enable' ? 'Enabled' : 'Disabled'}
                                    </div>
                                  </div>
                                </button>
                                
                                {isRuleExpanded && (
                                  <div className="p-3 pt-0 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Same structure as duplicate rules */}
                                      {/* Basic Information */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                          Basic Information
                                        </h5>
                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Transaction ID:</span>
                                            <span className="text-gray-900 flex-1 text-left">{rule.transactionId || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Policy Type:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.policyType || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>IP Family:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.ipFamily || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Position:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.position || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Action & Traffic Control */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                          Action & Traffic Control
                                        </h5>
                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Action:</span>
                                            <span className={`flex-1 text-left font-semibold ${
                                              flat.action === 'Accept' ? 'text-green-700' : 
                                              flat.action === 'Deny' ? 'text-red-700' : 
                                              'text-gray-900'
                                            }`}>
                                              {flat.action || 'N/A'}
                                            </span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Log Traffic:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.logTraffic || 'Disable'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Schedule:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.schedule || 'All The Time'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Source Configuration */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                          Source Configuration
                                        </h5>
                                        <div className="space-y-1 text-xs">
                                          {(() => {
                                            const policy = rule.networkPolicy || rule.userPolicy || {}
                                            const sourceZones = policy.SourceZones
                                            const sourceZonesArray = Array.isArray(sourceZones) ? sourceZones : 
                                              (sourceZones?.Zone ? (Array.isArray(sourceZones.Zone) ? sourceZones.Zone : [sourceZones.Zone]) : [])
                                            const normalizedSourceZones = sourceZonesArray.length === 0 ? ['Any'] : sourceZonesArray
                                            
                                            return (
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Source Zones:</span>
                                                <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                  {normalizedSourceZones.map((zone, zIdx) => (
                                                    <span
                                                      key={zIdx}
                                                      className="px-2 py-0.5 rounded text-xs"
                                                      style={{
                                                        backgroundColor: theme.colors.badge.tag.bg,
                                                        border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                        color: theme.colors.badge.tag.text
                                                      }}
                                                    >
                                                      {String(zone).trim() || 'Any'}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })()}
                                          {(() => {
                                            const policy = rule.networkPolicy || rule.userPolicy || {}
                                            const sourceNetworks = policy.SourceNetworks
                                            const sourceNetworksArray = Array.isArray(sourceNetworks) ? sourceNetworks : 
                                              (sourceNetworks?.Network ? (Array.isArray(sourceNetworks.Network) ? sourceNetworks.Network : [sourceNetworks.Network]) : [])
                                            const normalizedSourceNetworks = sourceNetworksArray.length === 0 ? ['Any'] : sourceNetworksArray
                                            
                                            return (
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Source Networks:</span>
                                                <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                  {normalizedSourceNetworks.map((net, nIdx) => (
                                                    <span
                                                      key={nIdx}
                                                      className="px-2 py-0.5 rounded text-xs"
                                                      style={{
                                                        backgroundColor: theme.colors.badge.tag.bg,
                                                        border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                        color: theme.colors.badge.tag.text
                                                      }}
                                                    >
                                                      {String(net).trim() || 'Any'}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      </div>
                                      
                                      {/* Destination Configuration */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                          Destination Configuration
                                        </h5>
                                        <div className="space-y-1 text-xs">
                                          {(() => {
                                            const policy = rule.networkPolicy || rule.userPolicy || {}
                                            const destZones = policy.DestinationZones
                                            const destZonesArray = Array.isArray(destZones) ? destZones : 
                                              (destZones?.Zone ? (Array.isArray(destZones.Zone) ? destZones.Zone : [destZones.Zone]) : [])
                                            const normalizedDestZones = destZonesArray.length === 0 ? ['Any'] : destZonesArray
                                            
                                            return (
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Destination Zones:</span>
                                                <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                  {normalizedDestZones.map((zone, zIdx) => (
                                                    <span
                                                      key={zIdx}
                                                      className="px-2 py-0.5 rounded text-xs"
                                                      style={{
                                                        backgroundColor: theme.colors.badge.tag.bg,
                                                        border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                        color: theme.colors.badge.tag.text
                                                      }}
                                                    >
                                                      {String(zone).trim() || 'Any'}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })()}
                                          {(() => {
                                            const policy = rule.networkPolicy || rule.userPolicy || {}
                                            const destNetworks = policy.DestinationNetworks
                                            const destNetworksArray = Array.isArray(destNetworks) ? destNetworks : 
                                              (destNetworks?.Network ? (Array.isArray(destNetworks.Network) ? destNetworks.Network : [destNetworks.Network]) : [])
                                            const normalizedDestNetworks = destNetworksArray.length === 0 ? ['Any'] : destNetworksArray
                                            
                                            return (
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Destination Networks:</span>
                                                <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                  {normalizedDestNetworks.map((net, nIdx) => (
                                                    <span
                                                      key={nIdx}
                                                      className="px-2 py-0.5 rounded text-xs"
                                                      style={{
                                                        backgroundColor: theme.colors.badge.tag.bg,
                                                        border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                        color: theme.colors.badge.tag.text
                                                      }}
                                                    >
                                                      {String(net).trim() || 'Any'}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })()}
                                          {(() => {
                                            const policy = rule.networkPolicy || rule.userPolicy || {}
                                            const services = policy.Services
                                            const servicesArray = Array.isArray(services) ? services : 
                                              (services?.Service ? (Array.isArray(services.Service) ? services.Service : [services.Service]) : [])
                                            const normalizedServices = servicesArray.length === 0 ? ['Any'] : servicesArray
                                            
                                            return (
                                              <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                                <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Services:</span>
                                                <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                  {normalizedServices.map((svc, sIdx) => (
                                                    <span
                                                      key={sIdx}
                                                      className="px-2 py-0.5 rounded text-xs"
                                                      style={{
                                                        backgroundColor: theme.colors.badge.tag.bg,
                                                        border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                        color: theme.colors.badge.tag.text
                                                      }}
                                                    >
                                                      {String(svc).trim() || 'Any'}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      </div>
                                      
                                      {/* Security Features */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">
                                          Security Features
                                        </h5>
                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Web Filter:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.webFilter || 'None'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Application Control:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.applicationControl || 'None'}</span>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>Intrusion Prevention:</span>
                                            <span className="text-gray-900 flex-1 text-left">{flat.intrusionPrevention || 'None'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                )
              })()
            ) : selectedGroupData.category.key === 'natRules' ? (
              // Special handling for NAT rules - similar to firewall rules
              (() => {
                const isDuplicateGroup = selectedGroupData.group.typeKey === 'duplicate'
                const isShadowGroup = selectedGroupData.group.typeKey === 'shadow'
                const allEntities = selectedGroupData.group.entities
                const duplicateEntities = isDuplicateGroup ? allEntities : []
                const shadowEntities = isShadowGroup ? allEntities : []
                
                const toggleNATSection = (section) => {
                  setExpandedNATSections(prev => ({
                    ...prev,
                    [section]: !prev[section]
                  }))
                }
                
                const toggleNATRule = (ruleId) => {
                  setExpandedNATRules(prev => {
                    const next = new Set(prev)
                    if (next.has(ruleId)) {
                      next.delete(ruleId)
                    } else {
                      next.add(ruleId)
                    }
                    return next
                  })
                }
                
                const CollapsibleSection = ({ title, isExpanded, onToggle, children, count }) => (
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)' }}>
                    <button
                      onClick={onToggle}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        {count !== undefined && (
                          <span className="text-xs text-gray-500 font-normal">({count})</span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-3">
                        {children}
                      </div>
                    )}
                  </div>
                )
                
                return (
                  <div>
                    {isDuplicateGroup && duplicateEntities.length > 0 && (
                      <CollapsibleSection
                        title={`Duplicate NAT Rules (${duplicateEntities.length} rules with identical configuration)`}
                        isExpanded={expandedNATSections.duplicates}
                        onToggle={() => toggleNATSection('duplicates')}
                        count={duplicateEntities.length}
                      >
                        <div className="space-y-4">
                          {/* Group Header */}
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <h4 className="font-bold text-red-900">
                                {duplicateEntities.length} Duplicate NAT Rule{duplicateEntities.length > 1 ? 's' : ''} Found
                                      </h4>
                                    </div>
                            <p className="text-sm text-red-800">
                              All rules below have identical configuration. Consider removing duplicates to simplify your configuration.
                            </p>
                                  </div>
                          
                          {/* Table-based comparison */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse" style={{ tableLayout: 'auto' }}>
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300" style={{ minWidth: '200px', position: 'sticky', left: 0, backgroundColor: '#f3f4f6', zIndex: 10 }}>
                                    Field
                                  </th>
                                  {duplicateEntities.map((entity, idx) => {
                                    const rule = entity.rule || parsedData?.entitiesByTag?.NATRule?.[entity.index]
                                    const flat = rule ? flattenNATRule(rule) : {}
                                      return (
                                      <th key={idx} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300" style={{ minWidth: '250px' }}>
                                        <div className="font-bold text-red-900">
                                          Rule #{entity.index + 1}
                                  </div>
                                        <div className="text-xs font-normal text-gray-600 mt-1">
                                          {flat.name || 'Unnamed Rule'}
                                          </div>
                                        {flat.description && (
                                          <div className="text-xs font-normal text-gray-500 mt-1 italic">
                                            {flat.description}
                                          </div>
                                        )}
                                      </th>
                                    )
                                  })}
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {(() => {
                                  // Collect all fields from all rules
                                  const allFields = new Set()
                                  const rulesData = duplicateEntities.map(entity => {
                                    const rule = entity.rule || parsedData?.entitiesByTag?.NATRule?.[entity.index]
                                    if (!rule) return { flat: {}, fields: {}, index: entity.index }
                                    const flat = flattenNATRule(rule)
                                    const fields = rule.fields || {}
                                    
                                    // Add all flattened fields
                                    Object.keys(flat).forEach(key => allFields.add(key))
                                    // Add all raw fields
                                    Object.keys(fields).forEach(key => allFields.add(key))
                                    
                                    return { flat, fields, index: entity.index, rule }
                                  })
                                  
                                  // Helper to get field value from rule data
                                  const getFieldValue = (ruleData, fieldKey) => {
                                    // Try flattened first (case-insensitive match)
                                    const flatKey = Object.keys(ruleData.flat || {}).find(k => k.toLowerCase() === fieldKey.toLowerCase())
                                    if (flatKey && ruleData.flat[flatKey] !== undefined && ruleData.flat[flatKey] !== '') {
                                      const val = ruleData.flat[flatKey]
                                      if (val) return val
                                    }
                                    
                                    // Try raw fields (case-insensitive match)
                                    const fieldKeyMatch = Object.keys(ruleData.fields || {}).find(k => k.toLowerCase() === fieldKey.toLowerCase())
                                    if (fieldKeyMatch && ruleData.fields[fieldKeyMatch] !== undefined) {
                                      const val = ruleData.fields[fieldKeyMatch]
                                      if (val == null || val === '') return ''
                                      
                                      // Handle arrays
                                      if (Array.isArray(val)) {
                                        if (val.length === 0) return ''
                                        return val.map(v => {
                                          if (typeof v === 'object' && v !== null) {
                                            // Extract Name or first string value
                                            return v.Name || v.name || Object.values(v).find(vv => typeof vv === 'string') || String(v)
                                          }
                                          return String(v)
                                        }).filter(v => v).join(', ')
                                      }
                                      
                                      // Handle nested objects like { Zone: ['a', 'b'] } or { Network: 'x' } or { After: { Name: '...' } }
                                      if (typeof val === 'object' && val !== null) {
                                        const keys = Object.keys(val)
                                        if (keys.length === 1) {
                                          const subVal = val[keys[0]]
                                          if (Array.isArray(subVal)) {
                                            return subVal.map(v => {
                                              if (typeof v === 'object' && v !== null) {
                                                return v.Name || v.name || Object.values(v).find(vv => typeof vv === 'string') || String(v)
                                              }
                                              return String(v)
                                            }).filter(v => v).join(', ')
                                          }
                                          if (typeof subVal === 'string') {
                                            return subVal
                                          }
                                          // Handle nested object like { After: { Name: '...' } }
                                          if (typeof subVal === 'object' && subVal !== null && subVal.Name) {
                                            return subVal.Name
                                          }
                                        }
                                        // Try to extract Name property (for After field: { Name: '...' })
                                        if (val.Name) return val.Name
                                        if (val.name) return val.name
                                        // Handle Interface array structure
                                        if (val.Interface) {
                                          const interfaces = Array.isArray(val.Interface) ? val.Interface : [val.Interface]
                                          return interfaces.map(i => typeof i === 'string' ? i : (i.Name || i.name || String(i))).filter(i => i).join(', ')
                                        }
                                        const firstString = Object.values(val).find(v => typeof v === 'string')
                                        if (firstString) return firstString
                                        // Last resort: JSON stringify
                                        return JSON.stringify(val)
                                      }
                                      
                                      return String(val)
                                    }
                                    return ''
                                  }
                                  
                                  // Helper to normalize value for comparison
                                  const normalizeForCompare = (val) => {
                                    if (val == null || val === '') return ''
                                    return String(val).trim().toLowerCase()
                                  }
                                  
                                  // Helper to check if all values match
                                  const areAllValuesMatching = (fieldKey) => {
                                    if (rulesData.length < 2) return true
                                    const firstValue = normalizeForCompare(getFieldValue(rulesData[0], fieldKey))
                                    return rulesData.every(ruleData => 
                                      normalizeForCompare(getFieldValue(ruleData, fieldKey)) === firstValue
                                    )
                                  }
                                  
                                  // Field groups with labels - includes ALL NAT rule fields
                                  const fieldGroups = [
                                    {
                                      label: 'Basic Information',
                                      fields: ['name', 'Name', 'description', 'Description', 'id', 'transactionId', 'transactionid', 'ipFamily', 'IPFamily', 'status', 'Status', 'enable', 'Enable', 'position', 'Position', 'after', 'After', 'linkedFirewallrule', 'LinkedFirewallrule']
                                    },
                                    {
                                      label: 'NAT Configuration',
                                      fields: ['action', 'Action', 'natType', 'NATType', 'type', 'Type', 'natMethod', 'NATMethod', 'healthCheck', 'HealthCheck', 'overrideInterfaceNATPolicy', 'OverrideInterfaceNATPolicy', 'logTraffic', 'LogTraffic', 'schedule', 'Schedule']
                                    },
                                    {
                                      label: 'Source Configuration',
                                      fields: ['sourceZones', 'SourceZones', 'sourceNetworks', 'SourceNetworks', 'originalSource', 'OriginalSource', 'originalSourceNetworks', 'OriginalSourceNetworks']
                                    },
                                    {
                                      label: 'Destination Configuration',
                                      fields: ['destinationZones', 'DestinationZones', 'destinationNetworks', 'DestinationNetworks', 'originalDestination', 'OriginalDestination', 'originalDestinationNetworks', 'OriginalDestinationNetworks']
                                    },
                                    {
                                      label: 'Services',
                                      fields: ['services', 'Services', 'originalService', 'OriginalService', 'originalServices', 'OriginalServices']
                                    },
                                    {
                                      label: 'NAT Translation - Source',
                                      fields: ['translatedSource', 'TranslatedSource']
                                    },
                                    {
                                      label: 'NAT Translation - Destination',
                                      fields: ['translatedDestination', 'TranslatedDestination']
                                    },
                                    {
                                      label: 'NAT Translation - Service',
                                      fields: ['translatedService', 'TranslatedService']
                                    },
                                    {
                                      label: 'Interfaces',
                                      fields: ['inboundInterfaces', 'InboundInterfaces', 'InboundInterface', 'outboundInterfaces', 'OutboundInterfaces', 'OutboundInterface']
                                    }
                                  ]
                                  
                                  const rows = []
                                  fieldGroups.forEach((group, groupIdx) => {
                                    // Add group header row
                                    rows.push(
                                      <tr key={`group-${groupIdx}`} className="bg-gray-50">
                                        <td colSpan={duplicateEntities.length + 1} className="px-3 py-2 font-semibold text-xs text-gray-900 uppercase tracking-wider border border-gray-300">
                                          {group.label}
                                        </td>
                                      </tr>
                                    )
                                    
                                    // Add field rows for this group
                                    group.fields.forEach(fieldKey => {
                                      // Check if this field exists in at least one rule
                                      const fieldExists = rulesData.some(ruleData => {
                                        const value = getFieldValue(ruleData, fieldKey)
                                        return value !== '' && value !== undefined && value !== null
                                      })
                                      
                                      // Show field if it exists in at least one rule, or if it's a common field
                                      if (!fieldExists && !['name', 'description', 'id', 'transactionId', 'status', 'enable', 'action', 'natType', 'type'].includes(fieldKey)) {
                                        return
                                      }
                                      
                                      const isMatching = areAllValuesMatching(fieldKey)
                                      const fieldLabel = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                      
                                      rows.push(
                                        <tr key={fieldKey} className={isMatching ? 'bg-green-50' : 'bg-white'}>
                                          <td className="px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 align-top" style={{ 
                                            position: 'sticky', 
                                            left: 0, 
                                            backgroundColor: isMatching ? '#f0fdf4' : '#ffffff',
                                            zIndex: 5,
                                            minWidth: '200px',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {fieldLabel}
                                            {isMatching && (
                                              <span className="ml-2 text-green-600" title="All values match">✓</span>
                                            )}
                                          </td>
                                          {rulesData.map((ruleData, ruleIdx) => {
                                            const value = getFieldValue(ruleData, fieldKey)
                                            const displayValue = value === '' ? '(empty)' : value
                                            const isLongValue = String(displayValue).length > 50
                                            
                                            return (
                                              <td key={ruleIdx} className="px-3 py-2 text-xs text-gray-900 border border-gray-300 align-top" style={{
                                                backgroundColor: isMatching ? '#f0fdf4' : '#ffffff',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'anywhere',
                                                whiteSpace: isLongValue ? 'normal' : 'nowrap',
                                                maxWidth: '400px',
                                                minWidth: '250px'
                                              }}>
                                                {isLongValue || displayValue.includes(',') ? (
                                                  <div className="flex flex-wrap gap-1">
                                                    {String(displayValue).split(', ').map((item, itemIdx) => (
                                                      <span key={itemIdx} className="px-2 py-0.5 rounded text-xs inline-block" style={{
                                                        backgroundColor: isMatching ? '#dcfce7' : theme.colors.badge.tag.bg,
                                                        border: `1px solid ${isMatching ? '#86efac' : (theme.colors.badge.tag.border || theme.colors.border.medium)}`,
                                                        color: isMatching ? '#166534' : theme.colors.badge.tag.text,
                                                        marginBottom: '2px'
                                                      }}>
                                                        {item.trim() || '(empty)'}
                                                </span>
                                              ))}
                                            </div>
                                                ) : (
                                                  <span className={isMatching ? 'font-semibold text-green-700' : ''}>
                                                    {displayValue}
                                                </span>
                                                )}
                                              </td>
                                            )
                                          })}
                                        </tr>
                                      )
                                    })
                                  })
                                  
                                  return rows
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {isShadowGroup && shadowEntities.length > 0 && (
                      <CollapsibleSection
                        title="Shadowed NAT Rules"
                        isExpanded={expandedNATSections.shadowed}
                        onToggle={() => toggleNATSection('shadowed')}
                        count={shadowEntities.length}
                      >
                        <div className="space-y-3">
                          {shadowEntities.map((entity, idx) => {
                            const rule = entity.rule || parsedData?.entitiesByTag?.NATRule?.[entity.index]
                            if (!rule) return null
                            const flat = flattenNATRule(rule)
                            const isRuleExpanded = expandedNATRules.has(`shadow-${entity.index}`)
                            const shadowingRule = parsedData?.entitiesByTag?.NATRule?.[entity.by]
                            const shadowingRuleName = shadowingRule?.name || shadowingRule?.fields?.Name || `NAT Rule ${entity.by}`
                            
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleNATRule(`shadow-${entity.index}`)}
                                  className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {isRuleExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                                        Rule #{entity.index + 1}: {flat.name || 'Unnamed Rule'}
                                      </h4>
                                      {flat.description && (
                                        <p className="text-xs text-gray-600">{flat.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                    {entity.issueType === 'shadow' && (
                                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                        backgroundColor: theme.colors.status.warning.bg,
                                        color: theme.colors.status.warning.text,
                                        border: `1px solid ${theme.colors.status.warning.border}`
                                      }}>
                                        Shadowed by {shadowingRuleName} (ID: {entity.by})
                                      </span>
                                    )}
                                    {entity.reason && (
                                      <span className="text-xs text-gray-500">({entity.reason})</span>
                                    )}
                                  </div>
                                </button>
                                
                                {isRuleExpanded && (
                                  <div className="p-3 pt-0 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Basic Information</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Action:</span>
                                            <span>{flat.action || '(empty)'}</span>
                                          </div>
                                          <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">NAT Type:</span>
                                            <span>{flat.natType || '(empty)'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Network Configuration</h5>
                                        <div className="space-y-1">
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3">Source Zones:</span>
                                            <div className="flex flex-wrap gap-1 flex-1 text-left">
                                              {(flat.sourceZones || 'Any').split(', ').map((zone, zIdx) => (
                                                <span key={zIdx} className="px-2 py-0.5 rounded text-xs" style={{
                                                  backgroundColor: theme.colors.badge.tag.bg,
                                                  border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                  color: theme.colors.badge.tag.text
                                                }}>
                                                  {zone.trim() || 'Any'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3">Destination Zones:</span>
                                            <div className="flex flex-wrap gap-1 flex-1 text-left">
                                              {(flat.destinationZones || 'Any').split(', ').map((zone, zIdx) => (
                                                <span key={zIdx} className="px-2 py-0.5 rounded text-xs" style={{
                                                  backgroundColor: theme.colors.badge.tag.bg,
                                                  border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                  color: theme.colors.badge.tag.text
                                                }}>
                                                  {zone.trim() || 'Any'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                )
              })()
            ) : selectedGroupData.category.key === 'sslTlsRules' ? (
              // Special handling for SSL/TLS rules - similar to firewall rules
              (() => {
                const isDuplicateGroup = selectedGroupData.group.typeKey === 'duplicate'
                const isShadowGroup = selectedGroupData.group.typeKey === 'shadow'
                const allEntities = selectedGroupData.group.entities
                const duplicateEntities = isDuplicateGroup ? allEntities : []
                const shadowEntities = isShadowGroup ? allEntities : []
                
                const toggleSSLTLSection = (section) => {
                  setExpandedSSLTLSections(prev => ({
                    ...prev,
                    [section]: !prev[section]
                  }))
                }
                
                const toggleSSLTLSRule = (ruleId) => {
                  setExpandedSSLTLSRules(prev => {
                    const next = new Set(prev)
                    if (next.has(ruleId)) {
                      next.delete(ruleId)
                    } else {
                      next.add(ruleId)
                    }
                    return next
                  })
                }
                
                const CollapsibleSection = ({ title, isExpanded, onToggle, children, count }) => (
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)' }}>
                    <button
                      onClick={onToggle}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        {count !== undefined && (
                          <span className="text-xs text-gray-500 font-normal">({count})</span>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-3">
                        {children}
                      </div>
                    )}
                  </div>
                )
                
                return (
                  <div>
                    {isDuplicateGroup && duplicateEntities.length > 0 && (
                      <CollapsibleSection
                        title={`Duplicate SSL/TLS Inspection Rules (${duplicateEntities.length} rules with identical configuration)`}
                        isExpanded={expandedSSLTLSections.duplicates}
                        onToggle={() => toggleSSLTLSection('duplicates')}
                        count={duplicateEntities.length}
                      >
                        <div className="space-y-4">
                          {/* Group Header */}
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <h4 className="font-bold text-red-900">
                                {duplicateEntities.length} Duplicate SSL/TLS Rule{duplicateEntities.length > 1 ? 's' : ''} Found
                              </h4>
                            </div>
                            <p className="text-sm text-red-800">
                              All rules below have identical configuration. Consider removing duplicates to simplify your configuration.
                            </p>
                          </div>
                          
                          {/* Side-by-side comparison grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {duplicateEntities.map((entity, idx) => {
                            const rule = entity.rule || parsedData?.sslTlsInspectionRules?.[entity.index]
                            if (!rule) return null
                            const flat = flattenSSLTLSInspectionRule(rule)
                              
                              // Helper to check if a value matches across all duplicates
                              const isMatchingValue = (fieldKey, fieldValue) => {
                                if (duplicateEntities.length < 2) return true
                                return duplicateEntities.every(otherEntity => {
                                  if (otherEntity.index === entity.index) return true
                                  const otherRule = otherEntity.rule || parsedData?.sslTlsInspectionRules?.[otherEntity.index]
                                  if (!otherRule) return false
                                  const otherFlat = flattenSSLTLSInspectionRule(otherRule)
                                  const normalizeForCompare = (val) => {
                                    if (val == null || val === '') return '(empty)'
                                    return String(val).trim()
                                  }
                                  return normalizeForCompare(otherFlat[fieldKey]) === normalizeForCompare(fieldValue)
                                })
                              }
                            
                            return (
                                <div key={idx} className="border-2 border-red-300 rounded-lg overflow-hidden bg-white">
                                  <div className="bg-red-100 px-3 py-2 border-b border-red-300">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-red-900">
                                        Rule #{entity.index + 1}: {flat.name || 'Unnamed Rule'}
                                      </h4>
                                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-200 text-red-800">
                                        Duplicate #{idx + 1}
                                      </span>
                                    </div>
                                      {flat.description && (
                                      <p className="text-xs text-red-700 mt-1">{flat.description}</p>
                                      )}
                                    </div>
                                  
                                  <div className="p-3 space-y-3 text-xs">
                                    {/* Basic Information */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Basic Information</h5>
                                        <div className="space-y-1">
                                        {['isDefault', 'enable', 'decryptAction', 'decryptionProfile', 'logConnections'].map(fieldKey => {
                                          const value = flat[fieldKey] || '(empty)'
                                          const isMatching = isMatchingValue(fieldKey, value)
                                          const fieldLabel = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                          return (
                                            <div key={fieldKey} className={`flex justify-between py-1 border-b border-gray-100 ${isMatching ? 'bg-green-50' : ''}`}>
                                              <span className="font-medium text-gray-600">{fieldLabel}:</span>
                                              <span className={isMatching ? 'font-semibold text-green-700' : ''}>{value}</span>
                                          </div>
                                          )
                                        })}
                                          </div>
                                        </div>
                                    
                                    {/* Network Configuration */}
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Network Configuration</h5>
                                        <div className="space-y-1">
                                        {['sourceZones', 'destinationZones', 'sourceNetworks', 'destinationNetworks', 'services', 'identity'].map(fieldKey => {
                                          const value = flat[fieldKey] || 'Any'
                                          const isMatching = isMatchingValue(fieldKey, value)
                                          const fieldLabel = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                          return (
                                            <div key={fieldKey} className={`flex items-start justify-between py-1 border-b border-gray-100 ${isMatching ? 'bg-green-50' : ''}`}>
                                              <span className="font-medium text-gray-600 pr-3">{fieldLabel}:</span>
                                            <div className="flex flex-wrap gap-1 flex-1 text-left">
                                                {value.split(', ').map((item, itemIdx) => (
                                                  <span key={itemIdx} className="px-2 py-0.5 rounded text-xs" style={{
                                                    backgroundColor: isMatching ? '#dcfce7' : theme.colors.badge.tag.bg,
                                                    border: `1px solid ${isMatching ? '#86efac' : (theme.colors.badge.tag.border || theme.colors.border.medium)}`,
                                                    color: isMatching ? '#166534' : theme.colors.badge.tag.text
                                                  }}>
                                                    {item.trim() || 'Any'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          )
                                        })}
                                            </div>
                                          </div>
                                    
                                    {/* Websites */}
                                    {flat.websites && (
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Websites</h5>
                                        <div className="space-y-1">
                                          <div className={`flex items-start justify-between py-1 border-b border-gray-100 ${isMatchingValue('websites', flat.websites) ? 'bg-green-50' : ''}`}>
                                            <span className="font-medium text-gray-600 pr-3">Websites:</span>
                                            <div className="flex flex-wrap gap-1 flex-1 text-left">
                                              {flat.websites.split(', ').map((item, itemIdx) => (
                                                <span key={itemIdx} className="px-2 py-0.5 rounded text-xs" style={{
                                                  backgroundColor: isMatchingValue('websites', flat.websites) ? '#dcfce7' : theme.colors.badge.tag.bg,
                                                  border: `1px solid ${isMatchingValue('websites', flat.websites) ? '#86efac' : (theme.colors.badge.tag.border || theme.colors.border.medium)}`,
                                                  color: isMatchingValue('websites', flat.websites) ? '#166534' : theme.colors.badge.tag.text
                                                }}>
                                                  {item.trim() || 'Any'}
                                                </span>
                                              ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                  </div>
                              </div>
                            )
                          })}
                          </div>
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {isShadowGroup && shadowEntities.length > 0 && (
                      <CollapsibleSection
                        title="Shadowed SSL/TLS Inspection Rules"
                        isExpanded={expandedSSLTLSections.shadowed}
                        onToggle={() => toggleSSLTLSection('shadowed')}
                        count={shadowEntities.length}
                      >
                        <div className="space-y-3">
                          {shadowEntities.map((entity, idx) => {
                            const rule = entity.rule || parsedData?.sslTlsInspectionRules?.[entity.index]
                            if (!rule) return null
                            const flat = flattenSSLTLSInspectionRule(rule)
                            const isRuleExpanded = expandedSSLTLSRules.has(`shadow-${entity.index}`)
                            const shadowingRule = parsedData?.sslTlsInspectionRules?.[entity.by]
                            const shadowingRuleName = shadowingRule?.name || `SSL/TLS Rule ${entity.by}`
                            
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleSSLTLSRule(`shadow-${entity.index}`)}
                                  className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {isRuleExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                                        Rule #{entity.index + 1}: {flat.name || 'Unnamed Rule'}
                                      </h4>
                                      {flat.description && (
                                        <p className="text-xs text-gray-600">{flat.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                    {entity.issueType === 'shadow' && (
                                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                        backgroundColor: theme.colors.status.warning.bg,
                                        color: theme.colors.status.warning.text,
                                        border: `1px solid ${theme.colors.status.warning.border}`
                                      }}>
                                        Shadowed by {shadowingRuleName} (ID: {entity.by})
                                      </span>
                                    )}
                                    {entity.reason && (
                                      <span className="text-xs text-gray-500">({entity.reason})</span>
                                    )}
                                  </div>
                                </button>
                                
                                {isRuleExpanded && (
                                  <div className="p-3 pt-0 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Basic Information</h5>
                                        <div className="space-y-1">
                                          <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600">Decrypt Action:</span>
                                            <span>{flat.decryptAction || '(empty)'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2">Network Configuration</h5>
                                        <div className="space-y-1">
                                          <div className="flex items-start justify-between py-1 border-b border-gray-100">
                                            <span className="font-medium text-gray-600 pr-3">Source Zones:</span>
                                            <div className="flex flex-wrap gap-1 flex-1 text-left">
                                              {(flat.sourceZones || 'Any').split(', ').map((zone, zIdx) => (
                                                <span key={zIdx} className="px-2 py-0.5 rounded text-xs" style={{
                                                  backgroundColor: theme.colors.badge.tag.bg,
                                                  border: `1px solid ${theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                                  color: theme.colors.badge.tag.text
                                                }}>
                                                  {zone.trim() || 'Any'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                )
              })()
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
                          {entity.issueType === 'shadow' && (() => {
                            const shadowingRule = parsedData?.firewallRules?.[entity.by]
                            const shadowingRuleName = shadowingRule?.name || `Rule ${entity.by}`
                            return (
                              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                backgroundColor: theme.colors.status.warning.bg,
                                color: theme.colors.status.warning.text,
                                border: `1px solid ${theme.colors.status.warning.border}`
                              }}>
                                Shadowed by {shadowingRuleName} (ID: {entity.by})
                              </span>
                            )
                          })()}
                          {entity.issueType === 'duplicate' && (() => {
                            const originalRule = parsedData?.firewallRules?.[entity.of]
                            const originalRuleName = originalRule?.name || `Rule ${entity.of}`
                            return (
                              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                                backgroundColor: theme.colors.status.error.bg,
                                color: theme.colors.status.error.text,
                                border: `1px solid ${theme.colors.status.error.border}`
                              }}>
                                Duplicate of {originalRuleName} (ID: {entity.of})
                              </span>
                            )
                          })()}
                        </div>
                        {entity.reason && (
                          <p className="text-xs text-gray-600 mt-1 ml-6">
                            Reason: {entity.reason}
                          </p>
                        )}
                      </div>
                      
                      {entity.fields && Object.keys(entity.fields).filter(k => k !== 'Name').length > 0 && (() => {
                        // Helper to check if a value is duplicate across all entities in the group
                        const isDuplicateValue = (fieldKey, fieldValue) => {
                          if (selectedGroupData.group.entities.length < 2) return false
                          // Check if this value appears in all other entities in the group
                          return selectedGroupData.group.entities.every(otherEntity => {
                            if (otherEntity.index === entity.index) return true // Skip self
                            const otherValue = otherEntity.fields?.[fieldKey]
                            // Normalize and compare values
                            const normalizeForCompare = (val) => {
                              if (val == null) return 'Any'
                              if (Array.isArray(val)) {
                                const normalized = val.map(v => String(v).trim()).filter(v => v).sort()
                                return normalized.length === 0 ? 'Any' : normalized.join(',')
                              }
                              const str = String(val).trim()
                              return str === '' ? 'Any' : str
                            }
                            return normalizeForCompare(otherValue) === normalizeForCompare(fieldValue)
                          })
                        }
                        
                        return (
                          <div className="space-y-3 text-sm">
                            {Object.entries(entity.fields).map(([key, value]) => {
                              if (key === 'Name') return null
                              
                              // Check if this field value is duplicate across all entities
                              const isDuplicate = isDuplicateValue(key, value)
                              
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
                              const normalizedArray = memberArray.length === 0 ? ['Any'] : memberArray
                              return (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium text-gray-600">{key}:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {normalizedArray.map((member, memIdx) => {
                                      const memberStr = typeof member === 'string' ? member.trim() : 
                                                       (typeof member === 'object' && member !== null ? 
                                                        (member.Host || member.FQDNHost || member.Member || Object.values(member)[0] || String(member)) : 
                                                        String(member))
                                      const displayStr = memberStr === '' ? 'Any' : memberStr
                                      const isCommon = entity.commonMembers && entity.commonMembers.includes(memberStr)
                                      const isDup = isDuplicate || isCommon
                                      return (
                                        <span
                                          key={memIdx}
                                          className="px-2 py-1 rounded text-xs"
                                          style={{
                                            backgroundColor: isDup 
                                              ? '#fee2e2' 
                                              : theme.colors.status.info.bg,
                                            border: `1px solid ${isDup 
                                              ? '#fca5a5' 
                                              : theme.colors.status.info.border}`,
                                            color: isDup 
                                              ? '#dc2626' 
                                              : theme.colors.status.info.text,
                                            fontWeight: isDup ? 600 : 500
                                          }}
                                        >
                                          {displayStr}
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
                              const normalizedHostArray = hostArray.length === 0 ? ['Any'] : hostArray
                              if (Array.isArray(normalizedHostArray) && (normalizedHostArray.length > 0 || selectedGroupData.group.isPartial)) {
                                return (
                                  <div key={key} className="space-y-1">
                                    <span className="font-medium text-gray-600">{key}:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {normalizedHostArray.map((host, hostIdx) => {
                                        const hostStr = typeof host === 'string' ? host.trim() : String(host)
                                        const displayStr = hostStr === '' ? 'Any' : hostStr
                                        const isCommon = entity.commonMembers && entity.commonMembers.includes(hostStr)
                                        const isDup = isDuplicate || isCommon
                                        return (
                                          <span
                                            key={hostIdx}
                                            className="px-2 py-1 rounded text-xs"
                                            style={{
                                              backgroundColor: isDup 
                                                ? '#fee2e2' 
                                                : theme.colors.status.info.bg,
                                              border: `1px solid ${isDup 
                                                ? '#fca5a5' 
                                                : theme.colors.status.info.border}`,
                                              color: isDup 
                                                ? '#dc2626' 
                                                : theme.colors.status.info.text,
                                              fontWeight: isDup ? 600 : 500
                                            }}
                                          >
                                            {displayStr}
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
                            
                            // Handle arrays (like SourceZones, DestinationZones, Services, Networks)
                            if (Array.isArray(value)) {
                              const normalizedArray = value.length === 0 ? ['Any'] : value
                              return (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium text-gray-600">{key}:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {normalizedArray.map((item, itemIdx) => {
                                      const itemStr = String(item).trim()
                                      const displayStr = itemStr === '' ? 'Any' : itemStr
                                      return (
                                        <span
                                          key={itemIdx}
                                          className="px-2 py-1 rounded text-xs"
                                          style={{
                                            backgroundColor: isDuplicate ? '#fee2e2' : theme.colors.badge.tag.bg,
                                            border: `1px solid ${isDuplicate ? '#fca5a5' : theme.colors.badge.tag.border || theme.colors.border.medium}`,
                                            color: isDuplicate ? '#dc2626' : theme.colors.badge.tag.text,
                                            fontWeight: isDuplicate ? 600 : 500
                                          }}
                                        >
                                          {displayStr}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            
                            // Format value and show "Any" explicitly for missing/empty values
                            const formatValueWithAny = (val) => {
                              if (val == null || val === '') return 'Any'
                              if (Array.isArray(val)) {
                                if (val.length === 0) return 'Any'
                                return val.map(v => {
                                  const str = String(v).trim()
                                  return str === '' ? 'Any' : str
                                }).join(', ')
                              }
                              const str = String(val).trim()
                              return str === '' ? 'Any' : str
                            }
                            
                            const formattedValue = formatValueWithAny(value)
                            const isMultiline = formattedValue.includes('\n')
                            const displayValue = formattedValue || 'Any'
                            
                            return (
                              <div key={key} className={isMultiline ? 'flex flex-col gap-1' : 'flex gap-2'}>
                                <span className="font-medium text-gray-600 min-w-[120px]">{key}:</span>
                                {isMultiline ? (
                                  <pre 
                                    className="text-xs whitespace-pre-wrap font-mono p-2 rounded border" 
                                    style={{ 
                                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                      fontSize: '0.75rem',
                                      color: isDuplicate ? '#dc2626' : '#1f2937',
                                      backgroundColor: isDuplicate ? '#fee2e2' : '#f9fafb',
                                      borderColor: isDuplicate ? '#fca5a5' : theme.colors.border.medium
                                    }}
                                  >
                                    {displayValue}
                                  </pre>
                                ) : (
                                  <span 
                                    className="break-words px-2 py-1 rounded" 
                                    style={{
                                      color: isDuplicate ? '#dc2626' : '#1f2937',
                                      backgroundColor: isDuplicate ? '#fee2e2' : 'transparent',
                                      fontWeight: isDuplicate ? 600 : 400
                                    }}
                                  >
                                    {displayValue}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        )
                      })()}
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

