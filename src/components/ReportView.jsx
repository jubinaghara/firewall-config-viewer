import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { flattenFirewallRule, flattenSSLTLSInspectionRule, flattenNATRule, formatTagName } from '../utils/xmlParser'
import { Zap, CheckCircle2, XCircle, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { useTableColumnResize } from '../utils/useTableColumnResize'

// Helper to normalize exclusions into an array of strings (handles many shapes)
function getExclusionArray(value, key) {
  const out = []

  const collect = (input) => {
    if (!input) return
    if (Array.isArray(input)) {
      input.forEach(collect)
      return
    }
    if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
      out.push(String(input))
      return
    }
    if (typeof input === 'object') {
      // If has the expected key (e.g., Zone/Network/Service)
      if (input[key] !== undefined) {
        collect(input[key])
        return
      }
      // Otherwise walk all values
      Object.values(input).forEach(collect)
    }
  }

  collect(value)
  // De-duplicate while preserving order
  return Array.from(new Set(out))
}

// Reusable hook for table column filtering
const useTableFilters = (items) => {
  const [columnFilters, setColumnFilters] = useState({})
  
  useEffect(() => {
    setColumnFilters({})
  }, [items.length])
  
  // Helper to extract searchable text from a value (handles arrays, objects, etc.)
  const getSearchableText = useCallback((value, visited = new WeakSet()) => {
    if (value === null || value === undefined) return ''
    if (visited.has(value)) return ''
    if (typeof value === 'object') visited.add(value)
    
    if (Array.isArray(value)) {
      return value.map(v => getSearchableText(v, visited)).filter(Boolean).join(' ')
    }
    
    if (typeof value === 'object' && value !== null) {
      if (value.$$typeof) return '' // React element
      const values = []
      Object.entries(value).forEach(([k, v]) => {
        values.push(k)
        values.push(getSearchableText(v, visited))
      })
      return values.filter(Boolean).join(' ')
    }
    
    return String(value)
  }, [])
  
  // Filter items based on column filters
  const filterItems = useCallback((items, filterConfig) => {
    return items.filter((item) => {
      return filterConfig.every(({ key, getValue }) => {
        const filterValue = columnFilters[key]
        if (!filterValue || !filterValue.trim()) return true
        const value = getValue(item)
        const searchText = getSearchableText(value).toLowerCase()
        return searchText.includes(filterValue.toLowerCase().trim())
      })
    })
  }, [columnFilters, getSearchableText])
  
  return { columnFilters, setColumnFilters, filterItems, getSearchableText }
}

// Reusable filter input component
const FilterInput = ({ value, onChange, placeholder = 'Filter...', ariaLabel }) => (
  <div className="relative">
    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    <input
      type="text"
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      className={`w-full pl-8 pr-2 py-1 text-xs border rounded focus:outline-none transition-colors ${
        value?.trim() 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
      aria-label={ariaLabel}
    />
  </div>
)

export default function ReportView({ data, filteredRules, sectionVisibility = {}, onToggleSection, onSelectAll, onDeselectAll, isSelectionLoading = false }) {
  // State for search in sidebar
  const [sectionSearch, setSectionSearch] = useState('')
  // State for sort option
  const [sortOption, setSortOption] = useState('default') // 'default', 'name-asc', 'name-desc', 'count-desc', 'count-asc'

  // State for main content sections (all collapsed by default)
  const [expandedMainSections, setExpandedMainSections] = useState({})
  // State for individual additional entity sections (all collapsed by default)
  const [expandedAdditionalSections, setExpandedAdditionalSections] = useState({})

  // State for expanded individual rules/items
  const [expandedRules, setExpandedRules] = useState(new Set())
  
  // Loading state for expand/collapse operations
  const [isExpanding, setIsExpanding] = useState(false)
  
  // Track if we're in post-deselect mode (to auto-expand selected sections)
  const [isPostDeselectMode, setIsPostDeselectMode] = useState(false)
  
  // State for logo loading
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // State for search input values (what user types)
  const [firewallRulesSearch, setFirewallRulesSearch] = useState('')
  const [natRulesSearch, setNatRulesSearch] = useState('')
  const [sslTlsRulesSearch, setSslTlsRulesSearch] = useState('')
  const [interfacesSearch, setInterfacesSearch] = useState('')

  // Active search values (used for actual filtering - updated on Enter key)
  const [activeFirewallRulesSearch, setActiveFirewallRulesSearch] = useState('')
  const [activeNatRulesSearch, setActiveNatRulesSearch] = useState('')
  const [activeSslTlsRulesSearch, setActiveSslTlsRulesSearch] = useState('')
  const [activeInterfacesSearch, setActiveInterfacesSearch] = useState('')

  // Refs to maintain focus on inputs
  const firewallRulesSearchRef = useRef(null)
  const natRulesSearchRef = useRef(null)
  const sslTlsRulesSearchRef = useRef(null)
  const interfacesSearchRef = useRef(null)

  // Memoized onChange handlers to prevent input recreation
  const handleFirewallRulesSearchChange = useCallback((e) => {
    const value = e.target.value
    setFirewallRulesSearch(value)
    // Maintain focus after state update
    requestAnimationFrame(() => {
      if (firewallRulesSearchRef.current && document.activeElement !== firewallRulesSearchRef.current) {
        firewallRulesSearchRef.current.focus()
      }
    })
  }, [])

  const handleNatRulesSearchChange = useCallback((e) => {
    const value = e.target.value
    setNatRulesSearch(value)
    // Maintain focus after state update
    requestAnimationFrame(() => {
      if (natRulesSearchRef.current && document.activeElement !== natRulesSearchRef.current) {
        natRulesSearchRef.current.focus()
      }
    })
  }, [])

  const handleSslTlsRulesSearchChange = useCallback((e) => {
    const value = e.target.value
    setSslTlsRulesSearch(value)
    // Maintain focus after state update
    requestAnimationFrame(() => {
      if (sslTlsRulesSearchRef.current && document.activeElement !== sslTlsRulesSearchRef.current) {
        sslTlsRulesSearchRef.current.focus()
      }
    })
  }, [])

  // Handler functions for Enter key to trigger search (memoized to prevent re-renders)
  const handleFirewallRulesSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setActiveFirewallRulesSearch(firewallRulesSearch)
    }
  }, [firewallRulesSearch])

  const handleNatRulesSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setActiveNatRulesSearch(natRulesSearch)
    }
  }, [natRulesSearch])

  const handleSslTlsRulesSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setActiveSslTlsRulesSearch(sslTlsRulesSearch)
    }
  }, [sslTlsRulesSearch])

  const handleInterfacesSearchChange = useCallback((e) => {
    const value = e.target.value
    setInterfacesSearch(value)
    // Maintain focus after state update
    requestAnimationFrame(() => {
      if (interfacesSearchRef.current && document.activeElement !== interfacesSearchRef.current) {
        interfacesSearchRef.current.focus()
      }
    })
  }, [])

  const handleInterfacesSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setActiveInterfacesSearch(interfacesSearch)
    }
  }, [interfacesSearch])

  // Clear search handlers (memoized)
  const handleClearFirewallRulesSearch = useCallback(() => {
    setFirewallRulesSearch('')
    setActiveFirewallRulesSearch('')
  }, [])

  const handleClearNatRulesSearch = useCallback(() => {
    setNatRulesSearch('')
    setActiveNatRulesSearch('')
  }, [])

  const handleClearSslTlsRulesSearch = useCallback(() => {
    setSslTlsRulesSearch('')
    setActiveSslTlsRulesSearch('')
  }, [])

  const handleClearInterfacesSearch = useCallback(() => {
    setInterfacesSearch('')
    setActiveInterfacesSearch('')
  }, [])

  // Deep search function that recursively searches through nested objects and arrays
  // Must be defined before useMemo hooks that use it
  const deepSearchInObject = useCallback((obj, searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true // Empty search matches everything
    }

    const query = searchQuery.toLowerCase().trim()
    
    // Helper function to recursively search
    const searchRecursive = (value, visited = new WeakSet()) => {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return false
      }

      // Prevent circular references for objects
      if (typeof value === 'object' && value !== null) {
        // Skip Date objects and other special objects that might cause issues
        if (value instanceof Date) {
          const strValue = value.toISOString().toLowerCase()
          return strValue.includes(query)
        }
        
        if (visited.has(value)) {
          return false
        }
        visited.add(value)
      }

      // Handle primitives (string, number, boolean)
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const strValue = String(value).toLowerCase()
        if (strValue.includes(query)) {
          return true
        }
      }

      // Handle arrays - search through all elements
      if (Array.isArray(value)) {
        for (const item of value) {
          if (searchRecursive(item, visited)) {
            return true
          }
        }
        return false
      }

      // Handle objects - check both keys and values
      if (typeof value === 'object' && value !== null) {
        // Check object keys
        for (const key of Object.keys(value)) {
          const keyLower = key.toLowerCase()
          if (keyLower.includes(query)) {
            return true
          }
        }
        
        // Check object values recursively
        for (const val of Object.values(value)) {
          if (searchRecursive(val, visited)) {
            return true
          }
        }
        return false
      }

      return false
    }

    try {
      return searchRecursive(obj)
    } catch (error) {
      // If search fails (e.g., due to circular references), fallback to string search
      try {
        const strValue = JSON.stringify(obj).toLowerCase()
        return strValue.includes(query)
      } catch (e) {
        // If even JSON.stringify fails, return false
        return false
      }
    }
  }, [])

  // Memoize filtered results to prevent unnecessary recalculations
  const filteredFirewallRules = useMemo(() => {
    if (!activeFirewallRulesSearch) return filteredRules
    return filteredRules.filter((rule) => deepSearchInObject(rule, activeFirewallRulesSearch))
  }, [filteredRules, activeFirewallRulesSearch, deepSearchInObject])

  const filteredSslTlsRules = useMemo(() => {
    if (!activeSslTlsRulesSearch) return data.sslTlsInspectionRules || []
    return (data.sslTlsInspectionRules || []).filter((rule) => deepSearchInObject(rule, activeSslTlsRulesSearch))
  }, [data.sslTlsInspectionRules, activeSslTlsRulesSearch, deepSearchInObject])

  const filteredNatRules = useMemo(() => {
    if (!activeNatRulesSearch) return data.entitiesByTag?.NATRule || []
    return (data.entitiesByTag?.NATRule || []).filter((rule) => deepSearchInObject(rule, activeNatRulesSearch))
  }, [data.entitiesByTag?.NATRule, activeNatRulesSearch, deepSearchInObject])

  // Expand all sections function
  const expandAll = useCallback(() => {
    setIsExpanding(true)
    
    // Use setTimeout to allow UI to update and show loading
    setTimeout(() => {
    // Get all main section keys
    const mainSectionKeys = [
      'firewallRules',
      'ipHosts',
      'fqdnHosts',
      'macHosts',
      'countries',
      'webFilterPolicy',
      'schedules',
      'portsWithVlans'
    ]
      
      // Get all additional entity tags
      const additionalKeys = data.entitiesByTag ? Object.keys(data.entitiesByTag).filter(tag => 
        !['IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
          'Country','WebFilterPolicy','Schedule'].includes(tag)
      ) : []
      
      // Expand all main sections
      const allMainExpanded = {}
      mainSectionKeys.forEach(key => {
        allMainExpanded[key] = true
      })
      setExpandedMainSections(allMainExpanded)
      
      // Expand all additional sections
      const allAdditionalExpanded = {}
      additionalKeys.forEach(key => {
        allAdditionalExpanded[key] = true
      })
      setExpandedAdditionalSections(allAdditionalExpanded)
      
      // Expand all rules
      if (filteredRules && filteredRules.length > 0) {
        const allRuleIds = new Set(filteredRules.map(rule => rule.id))
        setExpandedRules(allRuleIds)
      }
      
      // Hide loading after a short delay to ensure rendering completes
      setTimeout(() => {
        setIsExpanding(false)
      }, 100)
    }, 50)
  }, [data, filteredRules])

  // Listen for expandAll event from export
  useEffect(() => {
    const handleExpandAll = () => {
      expandAll()
    }
    window.addEventListener('expandAllSections', handleExpandAll)
    return () => window.removeEventListener('expandAllSections', handleExpandAll)
  }, [expandAll])

  const toggleMainSection = useCallback((section) => {
    setIsExpanding(true)
    setExpandedMainSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    // Hide loading after render
    setTimeout(() => setIsExpanding(false), 100)
  }, [])

  const toggleAdditionalSection = (tag) => {
    setExpandedAdditionalSections(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }))
  }

  const toggleRule = (ruleId) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  // Collapse all sections
  const collapseAll = () => {
    setIsExpanding(true)
    setExpandedMainSections({})
    setExpandedAdditionalSections({})
    setExpandedRules(new Set())
    setTimeout(() => setIsExpanding(false), 100)
  }

  // Helper function to map section keys to their expanded state keys
  const getExpandedSectionKey = useCallback((sectionKey) => {
    // Main sections that use expandedMainSections
    const mainSections = [
      'firewallRules', 'ipHosts', 'fqdnHosts', 'macHosts', 'portsWithVlans',
      'fqdnHostGroups', 'ipHostGroups', 'serviceGroups', 'countryGroups', 'groups',
      'services', 'WebFilterPolicy', 'Schedule', 'Country', 'IPSPolicy',
      'IntrusionPrevention', 'VirusScanning', 'WebFilter', 'sslTlsInspectionRules', 'NATRule'
    ]
    
    if (mainSections.includes(sectionKey)) {
      return { type: 'main', key: sectionKey }
    }
    
    // Certificate types are handled specially - they're grouped
    const certificateTypes = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate']
    if (certificateTypes.includes(sectionKey)) {
      // Certificates don't have individual expansion, they're grouped
      return null
    }
    
    // All other sections use expandedAdditionalSections with the tag as key
    return { type: 'additional', key: sectionKey }
  }, [])

  // Wrapper for onToggleSection that auto-expands if in post-deselect mode
  const handleToggleSection = useCallback((sectionKey) => {
    if (onToggleSection) {
      // Check if this section is being selected (not deselected)
      const isCurrentlyVisible = sectionVisibility[sectionKey] !== false
      const willBeVisible = !isCurrentlyVisible
      
      // Call the original handler
      onToggleSection(sectionKey)
      
      // If in post-deselect mode and section is being selected, auto-expand it
      if (isPostDeselectMode && willBeVisible) {
        const expandedKey = getExpandedSectionKey(sectionKey)
        if (expandedKey) {
          if (expandedKey.type === 'main') {
            setExpandedMainSections(prev => ({
              ...prev,
              [expandedKey.key]: true
            }))
          } else if (expandedKey.type === 'additional') {
            setExpandedAdditionalSections(prev => ({
              ...prev,
              [expandedKey.key]: true
            }))
          }
        }
      }
    }
  }, [onToggleSection, isPostDeselectMode, sectionVisibility, getExpandedSectionKey])

  // Wrapper for onDeselectAll that sets post-deselect mode
  const handleDeselectAll = useCallback(() => {
    setIsPostDeselectMode(true)
    if (onDeselectAll) {
      onDeselectAll()
    }
  }, [onDeselectAll])

  // Wrapper for onSelectAll that clears post-deselect mode
  const handleSelectAll = useCallback(() => {
    setIsPostDeselectMode(false)
    if (onSelectAll) {
      onSelectAll()
    }
  }, [onSelectAll])

  const Icon = ({ name, className = '' }) => (
    <span className={`material-symbols-outlined align-middle ${className}`}>{name}</span>
  )

  // List of singleton entity types (entities that typically appear only once in configuration)
  const SINGLETON_ENTITIES = [
    // System Configuration
    'Time', 'AdminSettings', 'AdminAuthentication', 'AdminSetting', 'BackupRestore', 'DNS',
    // Security Settings
    'HAConfigure', 'ATP', 'MalwareProtection', 'DoSSettings', 'SpoofPrevention',
    'IPSSwitch', 'IPSFullSignaturePack', 'SSLTLSInspectionSettings',
    // Authentication
    'FirewallAuthentication', 'WebAuthentication', 'VPNAuthentication',
    'UserPortalAuthentication', 'VPNPortalAuthentication', 'SSLVPNAuthentication',
    'DirectWebProxyAuthentication', 'ChromebookSSOLogin', 'AuthCTA',
    // Email/Proxy
    'EmailConfiguration', 'PopImapScanning', 'AntiVirusFTP', 'WebProxy', 'HttpProxy',
    'SmarthostSettings', 'RelaySettings', 'SPXConfiguration', 'MTASPXConfiguration',
    'AdvancedSMTPSetting', 'DKIMVerification',
    // VPN/Network
    'VPNIPSecConnection', 'PPTPConfiguration', 'SophosConnectClient', 'SSLTunnelAccessSettings',
    'CellularWAN', 'RED', 'VLAN', 'RoutePrecedence', 'ARPConfiguration', 'ArpFlux',
    'MulticastConfiguration', 'PIMDynamicRouting', 'NetFlowConfiguration',
    // Other Settings
    'PatternDownload', 'QoSSettings', 'WebFilterSettings', 'WebFilterAdvancedSettings',
    'ZeroDayProtectionSettings', 'SNMPAgentConfiguration', 'Notification', 'Notificationlist',
    'OTPSettings', 'SupportAccess', 'AdvancedConfiguration', 'DataManagement',
    'DefaultCaptivePortal', 'SNMPCommunity', 'SelfSignedCertificateAuthority',
    'SystemServices', 'IviewCustomLogo', 'VirtualHostFailoverNotification',
    'CustomView', 'ApplicationClassification', 'ApplicationClassificationBatchAssignment',
    'WirelessProtectionGlobalSettings', 'AuthenticationServer',
    'SSLVPNPolicy', 'Hotfix', 'ApplicationObject', 'WebFilterProtectionSettings',
    'DefaultWebFilterNotificationSettings', 'OverridePolicy', 'WebFilterNotificationSettings',
    'VarPartitionUsageWatermark', 'MTASPXTemplates', 'SPXTemplates',
    'AntiVirusMailSMTPScanningRules', 'BookmarkManagement', 'AntiSpamQuarantineDigestSettings',
    'Letsencrypt', 'AntiVirusHTTPsConfiguration', 'ServiceParam', 'FqdnHostSetting',
    'GatewayConfiguration', 'IPSFullSignaturePack', 'WAFTLS', 'WAFSlowHTTP',
    'SSLTLSInspectionSettings', 'DhcpLeaseOverIpSec', 'SSLVPNAuthentication',
    'VpnConnRemoveTunnelUp', 'VpnConnRemoveOnFailover', 'CliDhcp', 'CRL'
  ]

  // HighlightedText component for search highlighting
  const HighlightedText = ({ text, className = '' }) => {
    if (!searchQuery || !text) {
      return <span className={className}>{text}</span>
    }

    const { regex, error } = buildSearchRegex(searchQuery, searchOptions)
    if (error || !regex) {
      return <span className={className}>{text}</span>
    }

    const highlighted = highlightTextReact(text, regex, false)
    return (
      <span className={className} data-searchable>
        {highlighted}
      </span>
    )
  }

  // Collapsible Section Component
  const CollapsibleSection = ({ title, isExpanded, onToggle, children, className = '', style = {} }) => (
    <div className={`${className}`} style={style}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
      >
        <div className="font-semibold text-xs text-gray-900 flex-1 text-left">{title}</div>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  )

  // Helper to check if a value represents a boolean/enable-disable state
  const isBooleanValue = (value) => {
    const str = String(value).toLowerCase().trim()
    return ['true', 'false', 'enable', 'disable', 'enabled', 'disabled', 'on', 'off', 'yes', 'no', '1', '0'].includes(str)
  }

  const getBooleanState = (value) => {
    const str = String(value).toLowerCase().trim()
    if (['true', 'enable', 'enabled', 'on', 'yes', '1'].includes(str)) return true
    if (['false', 'disable', 'disabled', 'off', 'no', '0'].includes(str)) return false
    return null
  }

  // Recursively process nested objects into the tree structure
  const processNestedObject = (obj, prefix = '') => {
    const result = {}
    
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return null
    }
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value == null) return
      
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively process nested object
        const nested = processNestedObject(value, fullKey)
        if (nested) {
          Object.assign(result, nested)
        }
      } else {
        // Leaf value
        result[fullKey] = { _value: value, _isBoolean: isBooleanValue(value) }
      }
    })
    
    return result
  }

  // Group fields hierarchically by dot notation (e.g., ApplianceAccess.AdminServices.HTTPS)
  // Also handles already nested objects (e.g., ApplianceAccess: { AdminServices: { HTTPS: true } })
  const groupFieldsHierarchically = (fields) => {
    const tree = {}
    
    Object.entries(fields).forEach(([key, value]) => {
      // Skip if value is null/undefined
      if (value == null) return
      
      // If value is already a nested object (not a primitive), process it recursively
      if (typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
        // Check if this object has nested structure (not just a simple object)
        const hasNestedStructure = Object.values(value).some(v => 
          v != null && typeof v === 'object' && !Array.isArray(v) && v.constructor === Object
        )
        
        if (hasNestedStructure) {
          // Create the root group for this key
          if (!tree[key]) {
            tree[key] = { _children: {} }
          }
          
          // Recursively process the nested object and add to the group's children
          const processObjectIntoTree = (obj, parentPath, targetTree) => {
            Object.entries(obj).forEach(([subKey, subValue]) => {
              if (subValue == null) return
              
              if (typeof subValue === 'object' && !Array.isArray(subValue) && subValue.constructor === Object) {
                // Nested object - create a subgroup
                if (!targetTree[subKey]) {
                  targetTree[subKey] = { _children: {} }
                }
                processObjectIntoTree(subValue, `${parentPath}.${subKey}`, targetTree[subKey]._children)
              } else {
                // Leaf value
                targetTree[subKey] = { 
                  _value: subValue, 
                  _isBoolean: isBooleanValue(subValue) 
                }
              }
            })
          }
          
          processObjectIntoTree(value, key, tree[key]._children)
        } else {
          // Simple object, treat as a group with direct children
          if (!tree[key]) {
            tree[key] = { _children: {} }
          }
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue != null) {
              tree[key]._children[subKey] = { 
                _value: subValue, 
                _isBoolean: isBooleanValue(subValue) 
              }
            }
          })
        }
      } else if (key.includes('.')) {
        // If key contains dots, split and create nested structure
        const parts = key.split('.')
        let current = tree
        
        // Build nested structure
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          if (!current[part]) {
            current[part] = { _children: {} }
          } else if (current[part]._value !== undefined) {
            // If this key already has a value, convert it to a group
            const existingValue = current[part]._value
            current[part] = { _children: {}, _values: { [part]: existingValue } }
          } else if (!current[part]._children) {
            current[part] = { _children: {} }
          }
          current = current[part]._children
        }
        
        // Add the final value
        const finalKey = parts[parts.length - 1]
        if (!current[finalKey] || current[finalKey]._value === undefined) {
          current[finalKey] = { _value: value, _isBoolean: isBooleanValue(value) }
        }
      } else {
        // Top-level key without dots - primitive value
        if (!tree[key] || tree[key]._value === undefined) {
          // Only set if it doesn't exist or doesn't have a value
          if (!tree[key] || !tree[key]._children) {
            tree[key] = { _value: value, _isBoolean: isBooleanValue(value) }
          }
        }
      }
    })
    
    return tree
  }

  // Component to render grouped fields hierarchically
  const GroupedFieldsView = ({ fields, itemId }) => {
    // Function to collect all group paths from the tree structure
    const collectAllGroupPaths = (group, path = '', paths = new Set()) => {
      Object.entries(group).forEach(([key, data]) => {
        if (key === '_children' || key === '_values') return
        
        if (data && typeof data === 'object' && data._children) {
          // This is a group with children
          const groupPath = path ? `${path}.${key}` : key
          paths.add(groupPath)
          // Recursively collect paths from children
          collectAllGroupPaths(data._children, groupPath, paths)
        } else if (data && typeof data === 'object' && data !== null && data._value === undefined) {
          // This might be a nested object group
          const groupPath = path ? `${path}.${key}` : key
          paths.add(groupPath)
          collectAllGroupPaths(data, groupPath, paths)
        }
      })
      return paths
    }

    const grouped = groupFieldsHierarchically(fields)
    const allPaths = collectAllGroupPaths(grouped)
    const [expandedGroups, setExpandedGroups] = useState(allPaths)
    
    const toggleGroup = (path) => {
      const newExpanded = new Set(expandedGroups)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      setExpandedGroups(newExpanded)
    }

    const renderGroup = (group, path = '', level = 0) => {
      // Collect direct values (leaf nodes)
      const directValues = []
      // Collect child groups
      const childGroups = []
      
      Object.entries(group).forEach(([key, data]) => {
        if (key === '_children' || key === '_values') return
        
        if (data && typeof data === 'object' && data._value !== undefined) {
          // This is a leaf node (value)
          directValues.push({ key, value: data._value, isBoolean: data._isBoolean })
        } else if (data && typeof data === 'object' && data._children) {
          // This is a group with children
          childGroups.push({ key, children: data._children, values: data._values })
        } else if (data && typeof data === 'object' && data !== null) {
          // This might be a nested object, treat as a group
          childGroups.push({ key, children: data })
        }
      })
      
      return (
        <div key={path || 'root'} className={level > 0 ? 'ml-4 mt-2' : ''}>
          {/* Render direct values first */}
          {directValues.length > 0 && (
            <div className="space-y-1">
              {directValues.map(({ key, value, isBoolean }) => {
                const boolState = isBoolean ? getBooleanState(value) : null
                const displayValue = String(value)
                
                return (
                  <div key={key} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 flex-shrink-0" style={{ minWidth: '150px' }}>
                          {key}:
                        </span>
                        {boolState !== null ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              boolState 
                                ? 'bg-green-500 border-green-500' 
                                : 'bg-gray-200 border-gray-300'
                            }`}>
                              {boolState && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${
                              boolState ? 'text-green-700' : 'text-gray-500'
                            }`}>
                              {boolState ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-800" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere' 
                          }}>
                            {displayValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Render child groups */}
          {childGroups.length > 0 && (
            <div className="space-y-2 mt-2">
              {childGroups.map(({ key, children }) => {
                const groupPath = path ? `${path}.${key}` : key
                const isGroupExpanded = expandedGroups.has(groupPath)
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleGroup(groupPath)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isGroupExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        <span className="text-xs font-semibold text-gray-900">{key}</span>
                      </div>
                    </button>
                    {isGroupExpanded && (
                      <div className="p-2 bg-gray-50 border-t border-gray-200">
                        {renderGroup(children, groupPath, level + 1)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const hasNestedStructure = Object.keys(grouped).some(key => {
      const item = grouped[key]
      return item && item._children && Object.keys(item._children).length > 0
    })

    // If no nested structure, fall back to flat display
    if (!hasNestedStructure) {
      return (
        <table className="sophos-field-table">
          <colgroup>
            <col className="sophos-col-250" />
            <col className="sophos-col-auto" />
          </colgroup>
          <tbody>
            {Object.entries(fields).map(([k, v]) => {
              const val = String(v)
              const isBoolean = isBooleanValue(v)
              const boolState = isBoolean ? getBooleanState(v) : null
              
              return (
                <tr key={k} className="sophos-table-row">
                  <td className="sophos-table-cell-label">
                    {k}
                  </td>
                  <td className="sophos-table-cell-value">
                    {boolState !== null ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          boolState 
                            ? 'bg-green-500 border-green-500' 
                            : 'bg-gray-200 border-gray-300'
                        }`}>
                          {boolState && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          boolState ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {boolState ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-800">{val}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }

    return (
      <div className="space-y-2">
        {renderGroup(grouped)}
      </div>
    )
  }

  // Component to render singleton entities in a card layout
  const SingletonEntityCard = ({ item, icon, title }) => {
    if (!item || !item.fields) return null

    const fields = item.fields
    const grouped = groupFieldsHierarchically(fields)
    
    // Function to collect all group paths from the tree structure
    const collectAllGroupPaths = (group, path = '', paths = new Set()) => {
      Object.entries(group).forEach(([key, data]) => {
        if (key === '_children' || key === '_values') return
        
        if (data && typeof data === 'object' && data._children) {
          const groupPath = path ? `${path}.${key}` : key
          paths.add(groupPath)
          collectAllGroupPaths(data._children, groupPath, paths)
        } else if (data && typeof data === 'object' && data !== null && data._value === undefined) {
          const groupPath = path ? `${path}.${key}` : key
          paths.add(groupPath)
          collectAllGroupPaths(data, groupPath, paths)
        }
      })
      return paths
    }

    const allPaths = collectAllGroupPaths(grouped)
    const [expandedGroups, setExpandedGroups] = useState(allPaths)
    
    const toggleGroup = (path) => {
      const newExpanded = new Set(expandedGroups)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      setExpandedGroups(newExpanded)
    }

    const renderFieldRow = (key, value, isBoolean) => {
      const boolState = isBoolean ? getBooleanState(value) : null
      const displayValue = String(value)
      
      return (
        <div key={key} className="grid grid-cols-[minmax(200px,320px)_1fr] gap-4 py-2 border-b border-gray-100 last:border-b-0">
          <div className="text-xs font-medium text-gray-700 flex-shrink-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {key}
          </div>
          <div className="text-xs text-gray-900 min-w-0">
            {boolState !== null ? (
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  boolState 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-gray-200 border-gray-300'
                }`}>
                  {boolState && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  boolState ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {boolState ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ) : (
              <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {displayValue || '-'}
              </span>
            )}
          </div>
        </div>
      )
    }

    const renderGroup = (group, path = '', level = 0) => {
      const directValues = []
      const childGroups = []
      
      Object.entries(group).forEach(([key, data]) => {
        if (key === '_children' || key === '_values') return
        
        if (data && typeof data === 'object' && data._value !== undefined) {
          directValues.push({ key, value: data._value, isBoolean: data._isBoolean })
        } else if (data && typeof data === 'object' && data._children) {
          childGroups.push({ key, children: data._children })
        } else if (data && typeof data === 'object' && data !== null) {
          childGroups.push({ key, children: data })
        }
      })
      
      return (
        <div key={path || 'root'} className={level > 0 ? 'mt-2' : ''}>
          {/* Render direct values */}
          {directValues.length > 0 && (
            <div className="space-y-0">
              {directValues.map(({ key, value, isBoolean }) => 
                renderFieldRow(key, value, isBoolean)
              )}
            </div>
          )}
          
          {/* Render child groups */}
          {childGroups.length > 0 && (
            <div className="space-y-2 mt-2">
              {childGroups.map(({ key, children }) => {
                const groupPath = path ? `${path}.${key}` : key
                const isGroupExpanded = expandedGroups.has(groupPath)
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleGroup(groupPath)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {isGroupExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-xs font-semibold text-gray-900">{key}</span>
                      </div>
                    </button>
                    {isGroupExpanded && (
                      <div className="p-3 bg-white border-t border-gray-200">
                        {renderGroup(children, groupPath, level + 1)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const hasNestedStructure = Object.keys(grouped).some(key => {
      const item = grouped[key]
      return item && item._children && Object.keys(item._children).length > 0
    })

    // If no nested structure, render flat key-value pairs
    if (!hasNestedStructure) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {icon && <Icon name={icon} className="text-gray-600 text-base" />}
              <span className="text-sm font-semibold text-gray-900">{title}</span>
            </div>
          </div>
          <div className="p-4">
            {Object.keys(fields).length === 0 ? (
              <span className="text-gray-400 italic text-xs">No configuration data</span>
            ) : (
              <div className="space-y-0">
                {Object.entries(fields).map(([k, v]) => {
                  const isBoolean = isBooleanValue(v)
                  return renderFieldRow(k, v, isBoolean)
                })}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Render with nested structure
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} className="text-gray-600 text-base" />}
            <span className="text-sm font-semibold text-gray-900">{title}</span>
          </div>
        </div>
        <div className="p-4">
          {renderGroup(grouped)}
        </div>
      </div>
    )
  }

  const flattenFields = (obj, prefix = '') => {
    const rows = []
    if (!obj || typeof obj !== 'object') return rows

    const summarizeObject = (o) => {
      if (!o || typeof o !== 'object') return String(o ?? '')
      const preferredKeys = [
        'Name','Description','Application','App','Class','Classification','Category','CategoryName',
        'Action','Policy','Protocol','Days','StartTime','StopTime','Source','Destination',
        'Id','ID','UID','Value'
      ]
      const leafEntries = []
      const collectLeaves = (node, path = []) => {
        if (node == null) return
        if (Array.isArray(node)) {
          node.forEach(n => collectLeaves(n, path))
          return
        }
        if (typeof node !== 'object') {
          leafEntries.push([path[path.length-1] || '', String(node)])
          return
        }
        Object.entries(node).forEach(([kk, vv]) => collectLeaves(vv, [...path, kk]))
      }
      collectLeaves(o)
      // Prefer preferred keys first
      const preferred = []
      for (const pk of preferredKeys) {
        const found = leafEntries.find(([k]) => k.toLowerCase() === pk.toLowerCase())
        if (found) preferred.push(found)
      }
      const rest = leafEntries.filter(([k]) => !preferred.some(([pk]) => pk === k))
      const top = [...preferred, ...rest].slice(0, 3)
      return top.map(([k, v]) => `${k}: ${v}`).join(', ')
    }

    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k
      if (Array.isArray(v)) {
        const allPrimitive = v.every(item => (item == null) || (typeof item !== 'object'))
        if (allPrimitive) {
          rows.push([`${key} (${v.length})`, v.map(String).join(', ')])
        } else {
          const summarized = v.map(item => summarizeObject(item)).join(' | ')
          rows.push([`${key} (${v.length})`, summarized])
        }
      } else if (v && typeof v === 'object') {
        rows.push(...flattenFields(v, key))
      } else {
        rows.push([key, String(v)])
      }
    })
    return rows
  }

  const EntityTable = ({ title, icon, items, primaryKeyLabel, primaryValueGetter }) => {
    if (!items || items.length === 0) return null
    
    const columnCount = primaryKeyLabel ? 4 : 3
    const tableId = `entity-${title.toLowerCase().replace(/\s+/g, '-')}`
    const { tableRef, handleMouseDown } = useTableColumnResize(tableId, columnCount)
    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    
    // Filter items based on column filters
    const filteredItems = items.filter((item) => {
      const name = item.name || item.fields?.Name || primaryValueGetter?.(item) || formatTagName(item.tag || '') || ''
      const primary = primaryValueGetter ? primaryValueGetter(item) : ''
      const details = flattenFields(item.fields || {})
      const detailsText = details.map(([k, v]) => `${k} ${v}`).join(' ')
      
      // Check Name filter
      if (columnFilters.name) {
        const nameText = getSearchableText(name).toLowerCase()
        if (!nameText.includes(columnFilters.name.toLowerCase().trim())) return false
      }
      
      // Check Primary filter
      if (primaryKeyLabel && columnFilters.primary) {
        const primaryText = getSearchableText(primary).toLowerCase()
        if (!primaryText.includes(columnFilters.primary.toLowerCase().trim())) return false
      }
      
      // Check Details filter
      if (columnFilters.details) {
        const detailsTextLower = getSearchableText(detailsText).toLowerCase()
        if (!detailsTextLower.includes(columnFilters.details.toLowerCase().trim())) return false
      }
      
      return true
    })
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name={icon} className="text-gray-600 text-base" />
          <span>{title}</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                {primaryKeyLabel && (
                  <th className="sophos-table-header">
                    {primaryKeyLabel}
                    <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                  </th>
                )}
                <th className="sophos-table-header">
                  Details
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, primaryKeyLabel ? 3 : 2)} />
                </th>
              </tr>
              {/* Filter row */}
              <tr>
                <td className="px-2 py-1.5 bg-gray-50 border-t border-gray-200"></td>
                <td className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
                  <FilterInput
                    value={columnFilters.name}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Filter..."
                    ariaLabel="Filter Name"
                  />
                </td>
                {primaryKeyLabel && (
                  <td className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
                    <FilterInput
                      value={columnFilters.primary}
                      onChange={(e) => setColumnFilters(prev => ({ ...prev, primary: e.target.value }))}
                      placeholder="Filter..."
                      ariaLabel={`Filter ${primaryKeyLabel}`}
                    />
                  </td>
                )}
                <td className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
                  <FilterInput
                    value={columnFilters.details}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Filter..."
                    ariaLabel="Filter Details"
                  />
                </td>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const name = it.name || it.fields?.Name || primaryValueGetter?.(it) || formatTagName(it.tag || '') || ''
                const primary = primaryValueGetter ? primaryValueGetter(it) : ''
                const details = flattenFields(it.fields || {})
                // Check if this entity should use grouped view (entities with nested structures)
                const entityTag = (it.tag || '').toLowerCase().replace(/\s+/g, '')
                const titleLower = title.toLowerCase().replace(/\s+/g, '')
                
                // List of entity types that should use grouped view (normalized - no spaces, lowercase)
                const groupedViewEntities = [
                  'zones', 'adminsettings', 'adminsetting',
                  'backuprestore', 'backup',
                  'authenticationserver', 'authentication',
                  'red', 'reddevice',
                  'dns', 'dnshostentry', 'dnssettings',
                  'dhcp', 'dhcpsettings', 'dhcpserver',
                  'ntp', 'ntpsettings',
                  'snmp', 'snmpsettings',
                  'systemsettings', 'systemconfiguration',
                  'logging', 'logsettings', 'auditlog',
                  'reporting', 'reportsettings',
                  'certificate', 'certificateauthority', 'selfsignedcertificate',
                  'vpn', 'vpnpolicy', 'vpnconfiguration',
                  'qos', 'qospolicy', 'qualityofservice',
                  'trafficshaping', 'bandwidthmanagement', 'trafficpolicy'
                ]
                
                // Check for matches (exact or starts with, but exclude service-related and groups)
                // Explicitly exclude "Other Groups" (title) and entities with tag "Group"
                const isGroupsEntity = titleLower === 'other groups' || entityTag === 'group'
                const useGroupedView = 
                  !isGroupsEntity &&
                  !titleLower.includes('service') && 
                  !entityTag.includes('service') &&
                  groupedViewEntities.some(entity => 
                    titleLower === entity || 
                    entityTag === entity ||
                    titleLower.startsWith(entity) ||
                    entityTag.startsWith(entity) ||
                    titleLower.includes(entity) ||
                    entityTag.includes(entity)
                  )
                return (
                  <tr key={`${title}-${it.transactionId}-${it.name}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{name}</td>
                    {primaryKeyLabel && (
                      <td className="px-4 py-2.5 text-sm text-gray-800" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '250px'
                      }}>{primary}</td>
                    )}
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '500px' }}>
                      {!it.fields || Object.keys(it.fields).length === 0 ? (
                        <span className="text-gray-400 italic">No details</span>
                      ) : useGroupedView ? (
                        <GroupedFieldsView fields={it.fields} itemId={`${title}-${it.transactionId}-${it.name}-${idx}`} />
                      ) : (
                        <table className="sophos-field-table">
                          <colgroup>
                            <col className="sophos-col-250" />
                            <col className="sophos-col-auto" />
                          </colgroup>
                          <tbody>
                            {details.map(([k, v]) => {
                              const val = String(v)
                              const isBoolean = isBooleanValue(v)
                              const boolState = isBoolean ? getBooleanState(v) : null
                              
                              // Format long comma-separated values
                              const formatValue = () => {
                                if (val.length > 150 && val.includes(',')) {
                                  return val.split(',').map((item, i) => (
                                    <span key={i}>
                                      {item.trim()}
                                      {i < val.split(',').length - 1 && ', '}
                                    </span>
                                  ))
                                }
                                return val
                              }
                              
                              return (
                                <tr key={`${title}-${idx}-${k}`} className="sophos-table-row">
                                  <td className="sophos-table-cell-label">
                                    {k}
                                  </td>
                                  <td className="sophos-table-cell-value">
                                    {boolState !== null ? (
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                          boolState 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'bg-gray-200 border-gray-300'
                                        }`}>
                                          {boolState && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </div>
                                        <span className={`text-xs font-medium ${
                                          boolState ? 'text-green-700' : 'text-gray-500'
                                        }`}>
                                          {boolState ? 'Enabled' : 'Disabled'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-800">{formatValue()}</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const FqdnHostsTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('fqdn-hosts', 4)

    const computeFqdnValues = (fields) => {
      if (!fields) return ''
      const values = []
      
      // Check for FQDN field (single or array)
      if (fields.FQDN) {
        if (Array.isArray(fields.FQDN)) {
          values.push(...fields.FQDN.map(String))
        } else {
          values.push(String(fields.FQDN))
        }
      }
      
      // Check for FQDNHostList which contains array of FQDN values
      if (fields.FQDNHostList) {
        if (Array.isArray(fields.FQDNHostList)) {
          fields.FQDNHostList.forEach(item => {
            if (typeof item === 'string') values.push(item)
            else if (item && typeof item === 'object' && item.FQDN) {
              if (Array.isArray(item.FQDN)) values.push(...item.FQDN.map(String))
              else values.push(String(item.FQDN))
            }
          })
        } else if (fields.FQDNHostList.FQDN) {
          // Single FQDNHostList with FQDN (could be array)
          if (Array.isArray(fields.FQDNHostList.FQDN)) {
            values.push(...fields.FQDNHostList.FQDN.map(String))
          } else {
            values.push(String(fields.FQDNHostList.FQDN))
          }
        }
      }
      
      // Look for any other keys that may contain FQDN-like values (fallback)
      Object.entries(fields).forEach(([k, v]) => {
        if (k.toLowerCase().includes('fqdn') && k !== 'FQDN' && k !== 'FQDNHostList') {
          if (Array.isArray(v)) {
            values.push(...v.map(String))
          } else if (typeof v === 'string') {
            values.push(v)
          } else if (v && typeof v === 'object') {
            // Recursively flatten nested structures
            const flatten = (obj) => {
              Object.values(obj).forEach((vv) => {
                if (Array.isArray(vv)) {
                  values.push(...vv.map(String))
                } else if (typeof vv === 'string') {
                  values.push(vv)
                } else if (vv && typeof vv === 'object') {
                  flatten(vv)
                }
              })
            }
            flatten(v)
          }
        }
      })
      
      // Deduplicate while preserving order
      return Array.from(new Set(values.filter(Boolean))).join(', ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, computeFqdnValues(fields)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="language" className="text-gray-600 text-base" />
          <span>FQDNHostList</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search FQDN Hosts"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Values
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => (
                <tr key={`fqdn-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '200px'
                  }}>{it.name || it.fields?.Name || ''}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '300px'
                  }}>{it.fields?.Description || ''}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-800" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '400px'
                  }}>{computeFqdnValues(it.fields)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ServicesTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { tableRef, handleMouseDown } = useTableColumnResize('services', 5)
    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)

    const formatServiceDetails = (fields) => {
      if (!fields) return <span className="text-gray-400 italic">No service details</span>
      
      const serviceDetails = fields?.ServiceDetails
      if (!serviceDetails || typeof serviceDetails !== 'object') return <span className="text-gray-400 italic">No service details</span>
      
      // Handle ServiceDetails.ServiceDetail array
      // ServiceDetail can be an array or a single object
      let details = serviceDetails.ServiceDetail
      if (!details) {
        // Try alternative structure - maybe ServiceDetail is directly an array at ServiceDetails level
        if (Array.isArray(serviceDetails) && serviceDetails.length > 0) {
          details = serviceDetails
        } else {
          return <span className="text-gray-400 italic">No service details</span>
        }
      }
      
      const arr = Array.isArray(details) ? details : [details]
      if (arr.length === 0) return <span className="text-gray-400 italic">No service details</span>
      
      const serviceType = (fields?.Type || '').trim().toUpperCase()
      
      // Filter out null/undefined entries
      const validDetails = arr.filter(d => d && typeof d === 'object')
      if (validDetails.length === 0) return <span className="text-gray-400 italic">No service details</span>
            
            // For IP type services, use ProtocolName
      if (serviceType === 'IP') {
              return (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table className="w-full border-collapse text-xs" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>#</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Protocol</th>
                </tr>
              </thead>
              <tbody>
                {validDetails.map((d, idx) => {
                  if (!d.ProtocolName) return null
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-gray-600 font-medium font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{d.ProtocolName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
                </div>
              )
            }
            
            // For ICMPv6 type services, use ICMPv6Type and ICMPv6Code
            if (serviceType === 'ICMPV6') {
        return (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table className="w-full border-collapse text-xs" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>#</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>ICMPv6 Type</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>ICMPv6 Code</th>
                </tr>
              </thead>
              <tbody>
                {validDetails.map((d, idx) => {
              const icmpv6Type = d.ICMPv6Type || d.ICMPV6Type || '-'
              const icmpv6Code = d.ICMPv6Code || d.ICMPV6Code || '-'
              return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-gray-600 font-medium font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{icmpv6Type}</td>
                      <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{icmpv6Code}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
                </div>
              )
            }
            
            // For ICMP type services, use ICMPType and ICMPCode
            if (serviceType === 'ICMP') {
        return (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table className="w-full border-collapse text-xs" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>#</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>ICMP Type</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>ICMP Code</th>
                </tr>
              </thead>
              <tbody>
                {validDetails.map((d, idx) => {
              const icmpType = d.ICMPType || d.ICMPTYPE || '-'
              const icmpCode = d.ICMPCode || d.ICMPCODE || '-'
              return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-gray-600 font-medium font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{icmpType}</td>
                      <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{icmpCode}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
                </div>
              )
            }
            
            // For TCPorUDP type services, use SourcePort, DestinationPort, Protocol
      return (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table className="w-full border-collapse text-xs" style={{ fontSize: '0.75rem' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>#</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Protocol</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Source Port</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-700" style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Destination Port</th>
              </tr>
            </thead>
            <tbody>
              {validDetails.map((d, idx) => {
            const src = d.SourcePort || d.SourcePorts || '-'
            const dst = d.DestinationPort || d.DestinationPorts || '-'
            const proto = d.Protocol || fields?.Protocol || '-'
            return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-600 font-medium font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{proto}</td>
                    <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{src}</td>
                    <td className="px-2 py-1.5 text-gray-900 font-mono" style={{ padding: '0.25rem 0.5rem', color: '#1f2937' }}>{dst}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    // Helper to extract searchable text from service details (React element)
    const getServiceDetailsText = (fields) => {
      if (!fields?.ServiceDetails) return ''
      const serviceDetails = fields.ServiceDetails
      let details = serviceDetails.ServiceDetail
      if (!details && Array.isArray(serviceDetails)) {
        details = serviceDetails
      }
      const arr = Array.isArray(details) ? details : (details ? [details] : [])
      const validDetails = arr.filter(d => d && typeof d === 'object')
      const serviceType = (fields?.Type || '').trim().toUpperCase()
      
      const texts = []
      validDetails.forEach(d => {
        if (serviceType === 'IP' && d.ProtocolName) {
          texts.push(d.ProtocolName)
        } else if (serviceType === 'ICMPV6') {
          texts.push(d.ICMPv6Type || d.ICMPV6Type || '')
          texts.push(d.ICMPv6Code || d.ICMPV6Code || '')
        } else if (serviceType === 'ICMP') {
          texts.push(d.ICMPType || d.ICMPTYPE || '')
          texts.push(d.ICMPCode || d.ICMPCODE || '')
        } else {
          texts.push(d.Protocol || fields?.Protocol || '')
          texts.push(d.SourcePort || d.SourcePorts || '')
          texts.push(d.DestinationPort || d.DestinationPorts || '')
        }
      })
      return texts.filter(Boolean).join(' ')
    }
    
    // Filter items based on unified search
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const name = item.name || fields.Name || '-'
      const type = fields.Type || '-'
      const description = fields.Description || '-'
      const serviceDetailsText = getServiceDetailsText(fields)
      
      const allText = [name, type, description, serviceDetailsText].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="construction" className="text-gray-600 text-base" />
          <span>Services</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Services"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                </th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Type</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Service Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`svc-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{it.name || fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{fields.Type || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatServiceDetails(fields)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const VPNIPSecConnectionTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { tableRef } = useTableColumnResize('vpn-ipsec-connections', 18)
    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)

    // Note: The XML parser already extracts each Configuration as a separate VPNIPSecConnection entity
    // So items already contains individual Configuration entries, not nested Configuration structures
    // We can use items directly as configurations

    // Format LocalSubnet array
    const formatLocalSubnet = (localSubnet) => {
      if (!localSubnet) return <span className="text-gray-400 italic">-</span>
      
      const subnets = []
      if (Array.isArray(localSubnet)) {
        subnets.push(...localSubnet.filter(Boolean).map(s => typeof s === 'string' ? s.trim() : String(s).trim()).filter(Boolean))
      } else if (typeof localSubnet === 'string' && localSubnet.trim()) {
        subnets.push(localSubnet.trim())
      }
      
      if (subnets.length === 0) return <span className="text-gray-400 italic">-</span>
      if (subnets.length === 1) return <span className="text-gray-900 font-mono text-xs">{subnets[0]}</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px', maxHeight: '150px', overflowY: 'auto' }}>
          {subnets.map((subnet, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 font-mono break-words">{subnet}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format RemoteNetwork
    const formatRemoteNetwork = (remoteNetwork) => {
      if (!remoteNetwork) return <span className="text-gray-400 italic">-</span>
      if (typeof remoteNetwork === 'string') return <span className="text-gray-900">{remoteNetwork}</span>
      if (typeof remoteNetwork === 'object' && remoteNetwork.Network) {
        const networks = Array.isArray(remoteNetwork.Network) ? remoteNetwork.Network : [remoteNetwork.Network]
        if (networks.length === 1) {
          return <span className="text-gray-900">{networks[0]}</span>
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
            {networks.filter(Boolean).map((net, idx) => (
              <span key={idx} className="text-gray-900 text-xs">{net}</span>
            ))}
          </div>
        )
      }
      return <span className="text-gray-400 italic">-</span>
    }

    // Format AllowedUser
    const formatAllowedUser = (allowedUser) => {
      if (!allowedUser) return <span className="text-gray-400 italic">-</span>
      
      const users = []
      if (typeof allowedUser === 'object') {
        if (allowedUser.User) {
          const userArray = Array.isArray(allowedUser.User) ? allowedUser.User : [allowedUser.User]
          users.push(...userArray.filter(Boolean).map(u => typeof u === 'string' ? u.trim() : String(u).trim()).filter(Boolean))
        } else {
          Object.values(allowedUser).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'string' && v.trim()) users.push(v.trim())
                else if (typeof v === 'object' && v.User) {
                  const userArray = Array.isArray(v.User) ? v.User : [v.User]
                  users.push(...userArray.filter(Boolean).map(u => typeof u === 'string' ? u.trim() : String(u).trim()).filter(Boolean))
                }
              })
            } else if (typeof val === 'string' && val.trim()) {
              users.push(val.trim())
            }
          })
        }
      } else if (typeof allowedUser === 'string' && allowedUser.trim()) {
        users.push(allowedUser.trim())
      }
      
      if (users.length === 0) return <span className="text-gray-400 italic">-</span>
      if (users.length === 1) return <span className="text-gray-900 text-xs">{users[0]}</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', maxHeight: '100px', overflowY: 'auto' }}>
          {users.map((user, idx) => (
            <span key={idx} className="text-gray-900 text-xs">{user}</span>
          ))}
        </div>
      )
    }

    // Format Status
    const formatStatus = (status) => {
      if (!status) return <span className="text-gray-400 italic">-</span>
      const statusMap = {
        '1': { text: 'Active', color: 'bg-green-100 text-green-700' },
        '2': { text: 'Inactive', color: 'bg-gray-100 text-gray-600' },
        '3': { text: 'Disconnected', color: 'bg-red-100 text-red-700' }
      }
      const statusInfo = statusMap[String(status)] || { text: String(status), color: 'bg-gray-100 text-gray-600' }
      return (
        <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      )
    }
    
    // Helper to extract text from formatted values
    const getLocalSubnetText = (localSubnet) => {
      if (!localSubnet) return ''
      if (Array.isArray(localSubnet)) {
        return localSubnet.filter(Boolean).map(s => String(s).trim()).filter(Boolean).join(' ')
      }
      if (typeof localSubnet === 'string') return localSubnet.trim()
      return ''
    }
    
    const getRemoteNetworkText = (remoteNetwork) => {
      if (!remoteNetwork) return ''
      if (typeof remoteNetwork === 'string') return remoteNetwork
      if (typeof remoteNetwork === 'object' && remoteNetwork.Network) {
        const networks = Array.isArray(remoteNetwork.Network) ? remoteNetwork.Network : [remoteNetwork.Network]
        return networks.filter(Boolean).join(' ')
      }
      return ''
    }
    
    const getAllowedUserText = (allowedUser) => {
      if (!allowedUser) return ''
      const users = []
      if (typeof allowedUser === 'object') {
        if (allowedUser.User) {
          const userArray = Array.isArray(allowedUser.User) ? allowedUser.User : [allowedUser.User]
          users.push(...userArray.filter(Boolean).map(u => String(u).trim()).filter(Boolean))
        } else {
          Object.values(allowedUser).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'string' && v.trim()) users.push(v.trim())
                else if (typeof v === 'object' && v.User) {
                  const userArray = Array.isArray(v.User) ? v.User : [v.User]
                  users.push(...userArray.filter(Boolean).map(u => String(u).trim()).filter(Boolean))
                }
              })
            } else if (typeof val === 'string' && val.trim()) {
              users.push(val.trim())
            }
          })
        }
      } else if (typeof allowedUser === 'string' && allowedUser.trim()) {
        users.push(allowedUser.trim())
      }
      return users.join(' ')
    }
    
    // Filter items based on unified search
    const filteredItems = items.filter((item) => {
      const config = item.fields || {}
      const name = config.Name || item.name || '-'
      const connectionType = config.ConnectionType || '-'
      const policy = config.Policy || '-'
      const authType = config.AuthenticationType || '-'
      const subnetFamily = config.SubnetFamily || '-'
      const endpointFamily = config.EndpointFamily || '-'
      const localWANPort = config.LocalWANPort || config.AliasLocalWANPort || '-'
      const remoteHost = config.RemoteHost && config.RemoteHost !== '*' ? config.RemoteHost : '-'
      const localID = config.LocalID || '-'
      const localSubnet = getLocalSubnetText(config.LocalSubnet)
      const remoteNetwork = getRemoteNetworkText(config.RemoteNetwork)
      const remoteID = config.RemoteID || '-'
      const userAuthMode = config.UserAuthenticationMode || '-'
      const allowedUser = getAllowedUserText(config.AllowedUser)
      const protocol = config.Protocol || '-'
      const status = formatStatus(config.Status).props?.children || String(config.Status || '-')
      const actionOnRestart = config.ActionOnVPNAutoRestart || '-'
      
      const allText = [
        name, connectionType, policy, authType, subnetFamily, endpointFamily,
        localWANPort, remoteHost, localID, localSubnet, remoteNetwork, remoteID,
        userAuthMode, allowedUser, protocol, status, actionOnRestart
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="vpn_key" className="text-gray-600 text-base" />
          <span>VPN IPSec Connections</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search VPN IPSec Connections"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table sophos-table-wide">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header sophos-cell-min-150">Name</th>
                <th className="sophos-table-header sophos-cell-min-120">Connection Type</th>
                <th className="sophos-table-header sophos-cell-min-120">Policy</th>
                <th className="sophos-table-header sophos-cell-min-120">Authentication Type</th>
                <th className="sophos-table-header sophos-cell-min-100">Subnet Family</th>
                <th className="sophos-table-header sophos-cell-min-100">Endpoint Family</th>
                <th className="sophos-table-header sophos-cell-min-120">Local WAN Port</th>
                <th className="sophos-table-header sophos-cell-min-120">Remote Host</th>
                <th className="sophos-table-header sophos-cell-min-150">Local ID</th>
                <th className="sophos-table-header sophos-cell-min-200">Local Subnet</th>
                <th className="sophos-table-header sophos-cell-min-150">Remote Network</th>
                <th className="sophos-table-header sophos-cell-min-150">Remote ID</th>
                <th className="sophos-table-header sophos-cell-min-120">User Auth Mode</th>
                <th className="sophos-table-header sophos-cell-min-120">Allowed User</th>
                <th className="sophos-table-header sophos-cell-min-80">Protocol</th>
                <th className="sophos-table-header sophos-cell-min-100">Status</th>
                <th className="sophos-table-header sophos-cell-min-120">Action On VPN Restart</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const config = item.fields || {}
                return (
                  <tr key={`vpn-config-${item.transactionId}-${item.configIndex || idx}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      minWidth: '150px'
                    }}>{config.Name || item.name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>{config.ConnectionType || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>{config.Policy || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>{config.AuthenticationType || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '100px' }}>{config.SubnetFamily || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '100px' }}>{config.EndpointFamily || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ fontFamily: 'monospace', minWidth: '120px' }}>{config.LocalWANPort || config.AliasLocalWANPort || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ fontFamily: 'monospace', minWidth: '120px' }}>{config.RemoteHost && config.RemoteHost !== '*' ? config.RemoteHost : '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '150px' }}>
                      {config.LocalID ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-500 text-xs">{config.LocalIDType || 'ID'}:</span>
                          <span className="text-gray-900">{config.LocalID}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '200px' }}>
                      {formatLocalSubnet(config.LocalSubnet)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '150px' }}>
                      {formatRemoteNetwork(config.RemoteNetwork)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '150px' }}>
                      {config.RemoteID ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-500 text-xs">{config.RemoteIDType || 'ID'}:</span>
                          <span className="text-gray-900">{config.RemoteID}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '120px' }}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        config.UserAuthenticationMode === 'Enable' || config.UserAuthenticationMode === 'ON' || config.UserAuthenticationMode === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.UserAuthenticationMode || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '120px' }}>
                      {formatAllowedUser(config.AllowedUser)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '80px' }}>{config.Protocol || '-'}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '100px' }}>
                      {formatStatus(config.Status)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>{config.ActionOnVPNRestart || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const UniCastRouteTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { tableRef } = useTableColumnResize('unicast-routes', 8)
    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)

    // Format destination network (IP + Netmask/CIDR)
    const formatDestination = (fields) => {
      const destIP = fields.DestinationIP || ''
      const netmask = fields.Netmask || ''
      if (!destIP) return 'N/A'
      
      const cidr = netmaskToCIDR(netmask)
      if (cidr !== null) {
        return `${destIP}/${cidr}`
      } else if (netmask) {
        return `${destIP} (${netmask})`
      }
      return destIP
    }
    
    // Filter items based on unified search
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const ipFamily = fields.IPFamily || 'N/A'
      const destination = formatDestination(fields)
      const gateway = fields.Gateway || 'N/A'
      const interface_ = fields.Interface || 'N/A'
      const distance = fields.AdministrativeDistance !== undefined && fields.AdministrativeDistance !== null
        ? `${fields.Distance || 0} (AD: ${fields.AdministrativeDistance})`
        : fields.Distance !== undefined && fields.Distance !== null
        ? String(fields.Distance)
        : 'N/A'
      const status = renderStatusBadge(fields.Status).props?.children || String(fields.Status || 'N/A')
      const description = fields.Description || '-'
      
      const allText = [ipFamily, destination, gateway, interface_, distance, status, description].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="route" className="text-gray-600 text-base" />
          <span>Unicast Routes</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Unicast Routes"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">IP Family</th>
                <th className="sophos-table-header">Destination</th>
                <th className="sophos-table-header">Gateway</th>
                <th className="sophos-table-header">Interface</th>
                <th className="sophos-table-header">Distance</th>
                <th className="sophos-table-header">Status</th>
                <th className="sophos-table-header">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const destination = formatDestination(fields)

                return (
                  <tr key={`unicast-route-${it.transactionId}-${it.configIndex || idx}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '100px'
                    }}>{fields.IPFamily || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{destination}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.Gateway || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.Interface || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '100px'
                    }}>
                      {fields.AdministrativeDistance !== undefined && fields.AdministrativeDistance !== null
                        ? `${fields.Distance || 0} (AD: ${fields.AdministrativeDistance})`
                        : fields.Distance !== undefined && fields.Distance !== null
                        ? String(fields.Distance)
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {renderStatusBadge(fields.Status)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Description || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const WirelessAccessPointTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('wireless-access-points', 25)

    // Format WirelessNetworks array
    const formatWirelessNetworks = (networks) => {
      if (!networks) return '-'
      if (Array.isArray(networks)) {
        return networks.filter(Boolean).join(', ')
      }
      if (typeof networks === 'object' && networks.Network) {
        const networkList = Array.isArray(networks.Network) ? networks.Network : [networks.Network]
        return networkList.filter(Boolean).join(', ')
      }
      return String(networks)
    }

    // Format ScanTime
    const formatScanTime = (scanTime) => {
      if (!scanTime) return '-'
      if (typeof scanTime === 'string') return scanTime
      if (typeof scanTime === 'object' && scanTime.Time) {
        return Array.isArray(scanTime.Time) ? scanTime.Time.join(', ') : scanTime.Time
      }
      return '-'
    }

    // Format AllowedChannels
    const formatAllowedChannels = (channels) => {
      if (!channels) return '-'
      if (typeof channels === 'string') {
        // If it's a comma-separated string, format it nicely
        return channels.split(',').map(c => c.trim()).join(', ')
      }
      if (Array.isArray(channels)) {
        return channels.filter(Boolean).join(', ')
      }
      return String(channels)
    }

    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.ID, fields.Label, fields.APType, fields.Country,
        formatWirelessNetworks(fields.WirelessNetworks),
        fields.Interface, fields.LanMac, fields.WifiMac, fields.Band,
        fields['Channel2.4GHz'] || fields.Channel24GHz, fields.TXPower,
        fields.Channel5GHz, fields.TXPower5GHz, fields.ChannelWidth,
        fields.ChannelWidth11a, fields.STP, fields.VLANTagging,
        fields.DynChan, fields.TimeBasedScan, formatScanTime(fields.ScanTime),
        fields.DynChan5GHz, fields.TimeBasedScan5GHz, formatScanTime(fields.ScanTime5GHz),
        formatAllowedChannels(fields.AllowedChannels)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="wifi" className="text-gray-600 text-base" />
          <span>Wireless Access Points</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Wireless Access Points"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">ID</th>
                <th className="sophos-table-header">Label</th>
                <th className="sophos-table-header">AP Type</th>
                <th className="sophos-table-header">Country</th>
                <th className="sophos-table-header">Wireless Networks</th>
                <th className="sophos-table-header">Interface</th>
                <th className="sophos-table-header">LAN MAC</th>
                <th className="sophos-table-header">WiFi MAC</th>
                <th className="sophos-table-header">Band</th>
                <th className="sophos-table-header">Channel 2.4GHz</th>
                <th className="sophos-table-header">TX Power</th>
                <th className="sophos-table-header">Channel 5GHz</th>
                <th className="sophos-table-header">TX Power 5GHz</th>
                <th className="sophos-table-header">Channel Width</th>
                <th className="sophos-table-header">Channel Width 11a</th>
                <th className="sophos-table-header">STP</th>
                <th className="sophos-table-header">VLAN Tagging</th>
                <th className="sophos-table-header">Dynamic Channel</th>
                <th className="sophos-table-header">Time Based Scan</th>
                <th className="sophos-table-header">Scan Time</th>
                <th className="sophos-table-header">Dynamic Channel 5GHz</th>
                <th className="sophos-table-header">Time Based Scan 5GHz</th>
                <th className="sophos-table-header">Scan Time 5GHz</th>
                <th className="sophos-table-header">Allowed Channels</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`wap-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-900" style={{ 
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace'
                    }}>{fields.ID || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      whiteSpace: 'nowrap'
                    }}>{fields.Label || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.APType || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '80px' }}>{fields.Country || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{formatWirelessNetworks(fields.WirelessNetworks)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-mono" style={{ maxWidth: '120px' }}>{fields.Interface || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ maxWidth: '150px' }}>{fields.LanMac || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ maxWidth: '150px' }}>{fields.WifiMac || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.Band || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields['Channel2.4GHz'] || fields.Channel24GHz || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.TXPower || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.Channel5GHz || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.TXPower5GHz || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.ChannelWidth || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '130px' }}>{fields.ChannelWidth11a || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.STP === 'Enable' || fields.STP === 'ON' || fields.STP === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.STP || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.VLANTagging === 'Enable' || fields.VLANTagging === 'ON' || fields.VLANTagging === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.VLANTagging || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.DynChan === 'Enable' || fields.DynChan === 'ON' || fields.DynChan === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.DynChan || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.TimeBasedScan === 'Enable' || fields.TimeBasedScan === 'ON' || fields.TimeBasedScan === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.TimeBasedScan || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{formatScanTime(fields.ScanTime)}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.DynChan5GHz === 'Enable' || fields.DynChan5GHz === 'ON' || fields.DynChan5GHz === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.DynChan5GHz || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.TimeBasedScan5GHz === 'Enable' || fields.TimeBasedScan5GHz === 'ON' || fields.TimeBasedScan5GHz === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.TimeBasedScan5GHz || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{formatScanTime(fields.ScanTime5GHz)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem'
                    }}>{formatAllowedChannels(fields.AllowedChannels)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const REDDeviceTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('red-devices', 16)

    // Format nested NetworkSetting
    const formatNetworkSetting = (networkSetting) => {
      if (!networkSetting || typeof networkSetting !== 'object') return <span className="text-gray-400 italic">-</span>
      
      return (
        <div className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '300px' }}>
          <div className="space-y-1.5 text-xs">
            {networkSetting.Zone && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Zone:</span>
                <span className="text-gray-900">{networkSetting.Zone}</span>
              </div>
            )}
            {networkSetting.IPAddress && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">IP:</span>
                <span className="text-gray-900 font-mono">
                  {networkSetting.IPAddress}
                  {(networkSetting.NetMask || networkSetting.Netmask) && (
                    <>
                      {(() => {
                        const netmask = networkSetting.NetMask || networkSetting.Netmask
                        const cidr = netmaskToCIDR(netmask)
                        return cidr ? `/${cidr}` : ` (${netmask})`
                      })()}
                    </>
                  )}
                </span>
              </div>
            )}
            {networkSetting.OperationMode && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Mode:</span>
                <span className="text-gray-900">{networkSetting.OperationMode}</span>
              </div>
            )}
            {networkSetting.TunnelCompression && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Compression:</span>
                <span className="text-gray-900">{networkSetting.TunnelCompression}</span>
              </div>
            )}
            {networkSetting.MACFilter && typeof networkSetting.MACFilter === 'object' && networkSetting.MACFilter.FilterType && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">MAC Filter:</span>
                <span className="text-gray-900">{networkSetting.MACFilter.FilterType}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Format UplinkSettings
    const formatUplinkSettings = (uplinkSettings) => {
      if (!uplinkSettings || typeof uplinkSettings !== 'object') return <span className="text-gray-400 italic">-</span>
      
      return (
        <div className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '300px' }}>
          <div className="space-y-1.5 text-xs">
            {uplinkSettings.Uplink && typeof uplinkSettings.Uplink === 'object' && uplinkSettings.Uplink.Connection && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Primary:</span>
                <span className="text-gray-900">{uplinkSettings.Uplink.Connection}</span>
              </div>
            )}
            {uplinkSettings.SecondUplinkMode && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Second Mode:</span>
                <span className="text-gray-900">{uplinkSettings.SecondUplinkMode}</span>
              </div>
            )}
            {uplinkSettings.SecondUplink && typeof uplinkSettings.SecondUplink === 'object' && uplinkSettings.SecondUplink.Connection && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Second:</span>
                <span className="text-gray-900">{uplinkSettings.SecondUplink.Connection}</span>
              </div>
            )}
            {uplinkSettings.UMTS3GFailover && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">3G Failover:</span>
                <span className="text-gray-900">{uplinkSettings.UMTS3GFailover}</span>
              </div>
            )}
            {uplinkSettings.FailOverSettings && typeof uplinkSettings.FailOverSettings === 'object' && (
              <div className="mt-1 pt-1 border-t border-gray-300">
                <div className="text-gray-600 font-medium mb-1">Failover Settings:</div>
                <div className="space-y-1 ml-2">
                  {uplinkSettings.FailOverSettings.MobileNetwork && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Network:</span>
                      <span className="text-gray-700 text-xs">{uplinkSettings.FailOverSettings.MobileNetwork}</span>
                    </div>
                  )}
                  {uplinkSettings.FailOverSettings.APN && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">APN:</span>
                      <span className="text-gray-700 text-xs">{uplinkSettings.FailOverSettings.APN}</span>
                    </div>
                  )}
                  {uplinkSettings.FailOverSettings.DialString && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Dial:</span>
                      <span className="text-gray-700 text-xs">{uplinkSettings.FailOverSettings.DialString}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Format SwitchSettings
    const formatSwitchSettings = (switchSettings) => {
      if (!switchSettings || typeof switchSettings !== 'object') return '-'
      if (switchSettings.LANPortMode) return `LAN Port Mode: ${switchSettings.LANPortMode}`
      return '-'
    }

    // Format AdvancedSettings
    const formatAdvancedSettings = (advancedSettings) => {
      if (!advancedSettings || typeof advancedSettings !== 'object') return '-'
      if (advancedSettings.RemoteIPAssignment) return `Remote IP: ${advancedSettings.RemoteIPAssignment}`
      return '-'
    }

    const getNetworkSettingText = (ns) => ns ? [ns.Zone, ns.IPAddress, ns.OperationMode, ns.TunnelCompression, ns.MACFilter?.FilterType].filter(Boolean).join(' ') : ''
    const getUplinkText = (us) => us ? [
      us.UplinkMode, us.Uplink?.Connection, us.SecondUplinkMode, us.SecondUplink?.Connection,
      us.UMTS3GFailover, us.FailOverSettings?.MobileNetwork, us.FailOverSettings?.APN, us.FailOverSettings?.DialString
    ].filter(Boolean).join(' ') : ''
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.BranchName, fields.Device, fields.REDDeviceID, fields.Status,
        fields.TunnelID, fields.REDMTU, fields.Authorized, fields.UTMHostName,
        fields.SecondUTMHostName, fields.Use2ndIPHostNameFor, fields.DeploymentMode,
        getNetworkSettingText(fields.NetworkSetting), getUplinkText(fields.UplinkSettings),
        formatSwitchSettings(fields.SwitchSettings), formatAdvancedSettings(fields.AdvancedSettings),
        fields.Description
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="devices" className="text-gray-600 text-base" />
          <span>RED Devices</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search RED Devices"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Branch Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Device
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  RED Device ID
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Status
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  Tunnel ID
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  RED MTU
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Authorized
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
                <th className="sophos-table-header">
                  UTM Host Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 8)} />
                </th>
                <th className="sophos-table-header">
                  Second UTM Host Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 9)} />
                </th>
                <th className="sophos-table-header">
                  Use 2nd IP For
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 10)} />
                </th>
                <th className="sophos-table-header">
                  Deployment Mode
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 11)} />
                </th>
                <th className="sophos-table-header">
                  Network Setting
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 12)} />
                </th>
                <th className="sophos-table-header">
                  Uplink Settings
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 13)} />
                </th>
                <th className="sophos-table-header">
                  Switch Settings
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 14)} />
                </th>
                <th className="sophos-table-header">
                  Advanced Settings
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 15)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 16)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`red-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.BranchName || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.Device || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '180px'
                    }}>{fields.REDDeviceID || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Status === 'Enable' || fields.Status === 'ON' || fields.Status === 'Yes' || fields.Status === '1'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Status || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.TunnelID || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.REDMTU || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Authorized === '1' || fields.Authorized === 1 || fields.Authorized === 'Yes' || fields.Authorized === 'Enable'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Authorized === '1' || fields.Authorized === 1 ? 'Yes' : (fields.Authorized || 'No')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.UTMHostName || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.SecondUTMHostName || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.Use2ndIPHostNameFor || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '150px' }}>{fields.DeploymentMode || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatNetworkSetting(fields.NetworkSetting)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatUplinkSettings(fields.UplinkSettings)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px',
                      fontSize: '0.7rem'
                    }}>{formatSwitchSettings(fields.SwitchSettings)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px',
                      fontSize: '0.7rem'
                    }}>{formatAdvancedSettings(fields.AdvancedSettings)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Description || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const DNSHostEntryTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('dns-host-entries', 2)

    // Extract all Address entries from AddressList
    const extractAddresses = (addressList) => {
      if (!addressList) return []
      if (Array.isArray(addressList)) {
        return addressList.filter(addr => typeof addr === 'object' && addr !== null)
      }
      if (typeof addressList === 'object' && addressList.Address) {
        const addresses = Array.isArray(addressList.Address) ? addressList.Address : [addressList.Address]
        return addresses.filter(addr => typeof addr === 'object' && addr !== null)
      }
      return []
    }

    // Calculate total number of address entries across all DNS host entries
    const totalAddresses = items.reduce((sum, it) => {
      const fields = it.fields || {}
      const addresses = extractAddresses(fields.AddressList)
      return sum + addresses.length
    }, 0)

    // Render AddressList as a structured list
    const renderAddressList = (addressList) => {
      const addresses = extractAddresses(addressList)
      if (addresses.length === 0) return <span className="text-gray-400 italic">No addresses</span>

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '500px' }}>
          {addresses.map((addr, addrIdx) => (
            <div key={addrIdx} className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '500px' }}>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ minWidth: '500px' }}>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '100px' }}>
                  <span className="text-gray-500 font-medium">Type:</span>
                  <span className="text-gray-900">{addr.EntryType || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '100px' }}>
                  <span className="text-gray-500 font-medium">Family:</span>
                  <span className="text-gray-900">{addr.IPFamily || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '150px' }}>
                  <span className="text-gray-500 font-medium">IP:</span>
                  <span className="text-gray-900 font-mono whitespace-nowrap">{addr.IPAddress || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '80px' }}>
                  <span className="text-gray-500 font-medium">TTL:</span>
                  <span className="text-gray-900">{addr.TTL || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '90px' }}>
                  <span className="text-gray-500 font-medium">Weight:</span>
                  <span className="text-gray-900">{addr.Weight || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '120px' }}>
                  <span className="text-gray-500 font-medium">WAN:</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                    addr.PublishOnWAN === 'Enable' || addr.PublishOnWAN === 'ON' || addr.PublishOnWAN === 'Yes'
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {addr.PublishOnWAN || 'Disable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    const getAddressListText = (addressList) => {
      const addresses = extractAddresses(addressList)
      return addresses.map(addr => 
        [addr.EntryType, addr.IPFamily, addr.IPAddress, addr.TTL, addr.Weight, addr.PublishOnWAN]
          .filter(Boolean).join(' ')
      ).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.HostName, getAddressListText(fields.AddressList), fields.AddReverseDNSLookUp].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="dns" className="text-gray-600 text-base" />
          <span>DNS Host Entries</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
          {totalAddresses > 0 && (
            <span className="text-gray-500 font-normal text-xs">- {totalAddresses} address{totalAddresses !== 1 ? 'es' : ''}</span>
          )}
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search DNS Host Entries"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Host Name</th>
                <th className="sophos-table-header">Address List</th>
                <th className="sophos-table-header">Add Reverse DNS Lookup</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`dns-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium align-top" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 align-top" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '250px',
                      fontFamily: 'monospace'
                    }}>{fields.HostName || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ 
                      minWidth: '550px'
                    }}>
                      {renderAddressList(fields.AddressList)}
                    </td>
                    <td className="px-4 py-2.5 text-xs align-top">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.AddReverseDNSLookUp === 'Enable' || fields.AddReverseDNSLookUp === 'ON' || fields.AddReverseDNSLookUp === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.AddReverseDNSLookUp || 'Disable'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const GatewayHostTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('gateway-hosts', 12)

    // Format MonitoringCondition array
    const formatMonitoringCondition = (monitoringCondition) => {
      if (!monitoringCondition) return <span className="text-gray-400 italic">-</span>
      
      const rules = []
      
      // Extract rules from different structures
      if (Array.isArray(monitoringCondition)) {
        rules.push(...monitoringCondition.filter(rule => typeof rule === 'object' && rule !== null))
      } else if (typeof monitoringCondition === 'object' && monitoringCondition.Rule) {
        const ruleArray = Array.isArray(monitoringCondition.Rule) ? monitoringCondition.Rule : [monitoringCondition.Rule]
        rules.push(...ruleArray.filter(rule => typeof rule === 'object' && rule !== null))
      } else if (typeof monitoringCondition === 'object') {
        rules.push(monitoringCondition)
      }
      
      if (rules.length === 0) return <span className="text-gray-400 italic">-</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {rules.map((rule, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '300px' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-gray-900">Rule {idx + 1}</span>
              </div>
              <div className="space-y-1 text-xs">
                {rule.Protocol && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Protocol:</span>
                    <span className="text-gray-900">{rule.Protocol}</span>
                  </div>
                )}
                {rule.Port && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Port:</span>
                    <span className="text-gray-900 font-mono">{rule.Port}</span>
                  </div>
                )}
                {rule.IPAddress && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">IP:</span>
                    <span className="text-gray-900 font-mono">{rule.IPAddress}</span>
                  </div>
                )}
                {rule.Condition && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Condition:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      rule.Condition === 'Success' || rule.Condition === 'success'
                        ? 'bg-green-100 text-green-700' 
                        : rule.Condition === 'Failure' || rule.Condition === 'failure'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.Condition}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    const getMonitoringConditionText = (monitoringCondition) => {
      if (!monitoringCondition) return ''
      const rules = []
      if (Array.isArray(monitoringCondition)) {
        rules.push(...monitoringCondition.filter(rule => typeof rule === 'object' && rule !== null))
      } else if (typeof monitoringCondition === 'object' && monitoringCondition.Rule) {
        const ruleArray = Array.isArray(monitoringCondition.Rule) ? monitoringCondition.Rule : [monitoringCondition.Rule]
        rules.push(...ruleArray.filter(rule => typeof rule === 'object' && rule !== null))
      }
      return rules.map(r => [r.Protocol, r.Port, r.IPAddress, r.Condition].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.IPFamily, fields.GatewayIP, fields.Interface,
        fields.NetworkZone, fields.Healthcheck, fields.MailNotification,
        fields.Interval, fields.FailureRetries, fields.Timeout,
        getMonitoringConditionText(fields.MonitoringCondition)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="router" className="text-gray-600 text-base" />
          <span>Gateway Hosts</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Gateway Hosts"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  IP Family
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Gateway IP
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Interface
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  Network Zone
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  Healthcheck
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Mail Notification
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
                <th className="sophos-table-header">
                  Interval
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 8)} />
                </th>
                <th className="sophos-table-header">
                  Failure Retries
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 9)} />
                </th>
                <th className="sophos-table-header">
                  Timeout
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 10)} />
                </th>
                <th className="sophos-table-header">
                  Monitoring Condition
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 11)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`gateway-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.IPFamily || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.GatewayIP || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-mono" style={{ maxWidth: '120px' }}>{fields.Interface || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.NetworkZone || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Healthcheck === 'ON' || fields.Healthcheck === 'Enable' || fields.Healthcheck === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Healthcheck || 'OFF'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.MailNotification === 'ON' || fields.MailNotification === 'Enable' || fields.MailNotification === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.MailNotification || 'OFF'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '80px' }}>{fields.Interval || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{fields.FailureRetries || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '100px' }}>{fields.Timeout || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatMonitoringCondition(fields.MonitoringCondition)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const RouterAdvertisementTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('router-advertisements', 4)

    // Format PrefixAdvertisementConfiguration
    const formatPrefixConfiguration = (prefixConfig) => {
      if (!prefixConfig) return <span className="text-gray-400 italic">No prefix configuration</span>
      
      if (prefixConfig.PrefixAdvertisementConfigurationDetail) {
        const details = Array.isArray(prefixConfig.PrefixAdvertisementConfigurationDetail)
          ? prefixConfig.PrefixAdvertisementConfigurationDetail
          : [prefixConfig.PrefixAdvertisementConfigurationDetail]
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '400px' }}>
            {details.filter(Boolean).map((detail, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '400px' }}>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '200px' }}>
                    <span className="text-gray-500 font-medium">Prefix:</span>
                    <span className="text-gray-900 font-mono whitespace-nowrap">{detail.Prefix64 || detail.Prefix || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '100px' }}>
                    <span className="text-gray-500 font-medium">On-link:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                      detail['On-link'] === 'Enable' || detail['On-link'] === 'ON' || detail['On-link'] === 'Yes'
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {detail['On-link'] || 'Disable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '120px' }}>
                    <span className="text-gray-500 font-medium">Autonomous:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                      detail.Autonomous === 'Enable' || detail.Autonomous === 'ON' || detail.Autonomous === 'Yes'
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {detail.Autonomous || 'Disable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '120px' }}>
                    <span className="text-gray-500 font-medium">Preferred Lifetime:</span>
                    <span className="text-gray-900">{detail.PreferredLifeTime || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '120px' }}>
                    <span className="text-gray-500 font-medium">Valid Lifetime:</span>
                    <span className="text-gray-900">{detail.ValidLifeTime || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      return <span className="text-gray-400 italic">No prefix details</span>
    }

    const getPrefixConfigText = (pc) => {
      if (!pc?.PrefixAdvertisementConfigurationDetail) return ''
      const details = Array.isArray(pc.PrefixAdvertisementConfigurationDetail)
        ? pc.PrefixAdvertisementConfigurationDetail
        : [pc.PrefixAdvertisementConfigurationDetail]
      return details.filter(Boolean).map(d => [
        d.Prefix64 || d.Prefix, d['On-link'], d.Autonomous, d.PreferredLifeTime, d.ValidLifeTime
      ].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Interface, fields.MinAdvertisementInterval, fields.MaxAdvertisementInterval,
        fields.ManageIPAddressfromDHCPv6, fields.ManageOtherfromDHCPv6, fields.DefaultGateway,
        getPrefixConfigText(fields.PrefixAdvertisementConfiguration), fields.LinkMTU,
        fields.ReachableTime, fields.RetransmitTime, fields.HopLimit,
        fields.DefaultGatewayLifetime, fields.Description
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="router" className="text-gray-600 text-base" />
          <span>Router Advertisements</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Router Advertisements"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Interface</th>
                <th className="sophos-table-header">Min Advertisement Interval</th>
                <th className="sophos-table-header">Max Advertisement Interval</th>
                <th className="sophos-table-header">Manage IP from DHCPv6</th>
                <th className="sophos-table-header">Manage Other from DHCPv6</th>
                <th className="sophos-table-header">Default Gateway</th>
                <th className="sophos-table-header">Prefix Configuration</th>
                <th className="sophos-table-header">Link MTU</th>
                <th className="sophos-table-header">Reachable Time</th>
                <th className="sophos-table-header">Retransmit Time</th>
                <th className="sophos-table-header">Hop Limit</th>
                <th className="sophos-table-header">Default Gateway Lifetime</th>
                <th className="sophos-table-header">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`router-adv-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 font-mono">{fields.Interface || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.MinAdvertisementInterval || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.MaxAdvertisementInterval || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.ManageIPAddressfromDHCPv6 === 'Enable' || fields.ManageIPAddressfromDHCPv6 === 'ON' || fields.ManageIPAddressfromDHCPv6 === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.ManageIPAddressfromDHCPv6 || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.ManageOtherParametersfromDHCPv6 === 'Enable' || fields.ManageOtherParametersfromDHCPv6 === 'ON' || fields.ManageOtherParametersfromDHCPv6 === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.ManageOtherParametersfromDHCPv6 || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.DefaultGateway === 'Enable' || fields.DefaultGateway === 'ON' || fields.DefaultGateway === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.DefaultGateway || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '450px' }}>
                      {formatPrefixConfiguration(fields.PrefixAdvertisementConfiguration)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.LinkMTU || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.ReachableTime || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.RetransmitTime || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.HopLimit || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.DefaultGatewayLifeTime || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Description || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const SSLVPNPolicyTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('ssl-vpn-policies', 4)

    // Extract all TunnelPolicy entries from all SSLVPNPolicy items
    const allTunnelPolicies = []
    items.forEach((item, itemIdx) => {
      const fields = item.fields || {}
      const tunnelPolicies = fields.TunnelPolicy
      
      if (!tunnelPolicies) return
      
      // Handle array of TunnelPolicy entries
      if (Array.isArray(tunnelPolicies)) {
        tunnelPolicies.forEach((tp, tpIdx) => {
          allTunnelPolicies.push({
            ...tp,
            _parentTransactionId: item.transactionId,
            _parentIndex: itemIdx,
            _tpIndex: tpIdx
          })
        })
      } else if (typeof tunnelPolicies === 'object') {
        // Single TunnelPolicy object
        allTunnelPolicies.push({
          ...tunnelPolicies,
          _parentTransactionId: item.transactionId,
          _parentIndex: itemIdx,
          _tpIndex: 0
        })
      }
    })

    // Format PermittedNetworkResourcesIPv4
    const formatResources = (permRes) => {
      if (!permRes) return <span className="text-gray-400 italic">No resources</span>
      
      const resources = []
      
      // Case 1: Direct array of strings
      if (Array.isArray(permRes)) {
        permRes.forEach(res => {
          if (typeof res === 'string') {
            resources.push(res)
          } else if (res && typeof res === 'object') {
            // Array of objects with Resource property
            if (res.Resource) {
              const resList = Array.isArray(res.Resource) ? res.Resource : [res.Resource]
              resources.push(...resList.filter(Boolean).map(r => String(r)))
            } else {
              // Try to extract any string values from the object
              Object.values(res).forEach(val => {
                if (typeof val === 'string' && val.trim()) {
                  resources.push(val)
                } else if (Array.isArray(val)) {
                  val.forEach(v => {
                    if (typeof v === 'string' && v.trim()) {
                      resources.push(v)
                    }
                  })
                }
              })
            }
          }
        })
      } 
      // Case 2: Object with Resource property
      else if (permRes && typeof permRes === 'object') {
        if (permRes.Resource) {
          const resList = Array.isArray(permRes.Resource) ? permRes.Resource : [permRes.Resource]
          resources.push(...resList.filter(Boolean).map(r => String(r)))
        } else {
          // Try to find Resource in nested structure
          Object.keys(permRes).forEach(key => {
            const val = permRes[key]
            if (key === 'Resource' || key.toLowerCase() === 'resource') {
              const resList = Array.isArray(val) ? val : [val]
              resources.push(...resList.filter(Boolean).map(r => String(r)))
            } else if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'string' && v.trim()) {
                  resources.push(v)
                } else if (v && typeof v === 'object' && v.Resource) {
                  const resList = Array.isArray(v.Resource) ? v.Resource : [v.Resource]
                  resources.push(...resList.filter(Boolean).map(r => String(r)))
                }
              })
            } else if (typeof val === 'string' && val.trim()) {
              resources.push(val)
            }
          })
        }
      }
      // Case 3: Direct string value
      else if (typeof permRes === 'string' && permRes.trim()) {
        resources.push(permRes)
      }
      
      // Remove duplicates while preserving order
      const uniqueResources = Array.from(new Set(resources.map(r => String(r).trim()))).filter(Boolean)
      
      if (uniqueResources.length === 0) return <span className="text-gray-400 italic">No resources</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {uniqueResources.map((res, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{res}</span>
            </div>
          ))}
        </div>
      )
    }

    const getResourcesText = (permRes) => {
      if (!permRes) return ''
      const resources = []
      if (Array.isArray(permRes)) {
        permRes.forEach(res => {
          if (typeof res === 'string') resources.push(res)
          else if (res?.Resource) {
            const resList = Array.isArray(res.Resource) ? res.Resource : [res.Resource]
            resources.push(...resList.filter(Boolean).map(r => String(r)))
          }
        })
      } else if (permRes?.Resource) {
        const resList = Array.isArray(permRes.Resource) ? permRes.Resource : [permRes.Resource]
        resources.push(...resList.filter(Boolean).map(r => String(r)))
      }
      return resources.join(' ')
    }
    
    const filteredPolicies = allTunnelPolicies.filter((tp) => {
      const allText = [
        tp.Name, tp.Description, tp.UseAsDefaultGateway,
        getResourcesText(tp.PermittedNetworkResourcesIPv4),
        tp.DisconnectIdleClients, tp.OverrideGlobalTimeout
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="vpn_key" className="text-gray-600 text-base" />
          <span>SSL VPN Tunnel Policies</span>
          <span className="text-gray-500 font-normal">
            ({filteredPolicies.length}{filteredPolicies.length !== allTunnelPolicies.length ? `/${allTunnelPolicies.length}` : ''} policies from {items.length} SSL VPN configuration{items.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search SSL VPN Policies"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Use As Default Gateway</th>
                <th className="sophos-table-header">Permitted Network Resources IPv4</th>
                <th className="sophos-table-header">Disconnect Idle Clients</th>
                <th className="sophos-table-header">Override Global Timeout</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((tp, idx) => (
                <tr key={`tunnel-policy-${tp._parentTransactionId}-${tp._tpIndex}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '200px'
                  }}>{tp.Name || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '300px'
                  }}>{tp.Description || '-'}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      tp.UseAsDefaultGateway === 'On' || tp.UseAsDefaultGateway === 'ON' || tp.UseAsDefaultGateway === 'Yes' || tp.UseAsDefaultGateway === 'Enable'
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tp.UseAsDefaultGateway || 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                    {formatResources(tp.PermittedNetworkResourcesIPv4)}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      tp.DisconnectIdleClients === 'On' || tp.DisconnectIdleClients === 'ON' || tp.DisconnectIdleClients === 'Yes' || tp.DisconnectIdleClients === 'Enable'
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tp.DisconnectIdleClients || 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{tp.OverrideGlobalTimeout ? `${tp.OverrideGlobalTimeout} min` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const WebFilterCategoryTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('web-filter-categories', 10)

    // Format DomainList
    const formatDomainList = (domainList) => {
      if (!domainList) return <span className="text-gray-400 italic">No domains</span>
      
      const domains = []
      
      // Handle different structures
      if (Array.isArray(domainList)) {
        domains.push(...domainList.filter(Boolean).map(d => typeof d === 'string' ? d : (d.Domain || d)))
      } else if (typeof domainList === 'object') {
        if (domainList.Domain) {
          const domainArray = Array.isArray(domainList.Domain) 
            ? domainList.Domain 
            : [domainList.Domain]
          domains.push(...domainArray.filter(Boolean).map(d => typeof d === 'string' ? d : String(d)))
        } else {
          Object.values(domainList).forEach(val => {
            if (Array.isArray(val)) {
              domains.push(...val.filter(Boolean).map(d => typeof d === 'string' ? d : String(d)))
            } else if (val && typeof val === 'string') {
              domains.push(val)
            }
          })
        }
      } else if (typeof domainList === 'string') {
        domains.push(domainList)
      }
      
      if (domains.length === 0) return <span className="text-gray-400 italic">No domains</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {domains.map((domain, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 font-mono break-words">{domain}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format KeywordList
    const formatKeywordList = (keywordList) => {
      if (!keywordList) return <span className="text-gray-400 italic">No keywords</span>
      
      const keywords = []
      
      // Handle different structures
      if (Array.isArray(keywordList)) {
        keywords.push(...keywordList.filter(Boolean).map(k => typeof k === 'string' ? k : (k.Keyword || k)))
      } else if (typeof keywordList === 'object') {
        if (keywordList.Keyword) {
          const keywordArray = Array.isArray(keywordList.Keyword) 
            ? keywordList.Keyword 
            : [keywordList.Keyword]
          keywords.push(...keywordArray.filter(Boolean).map(k => typeof k === 'string' ? k : String(k)))
        } else {
          Object.values(keywordList).forEach(val => {
            if (Array.isArray(val)) {
              keywords.push(...val.filter(Boolean).map(k => typeof k === 'string' ? k : String(k)))
            } else if (val && typeof val === 'string') {
              keywords.push(val)
            }
          })
        }
      } else if (typeof keywordList === 'string') {
        keywords.push(keywordList)
      }
      
      if (keywords.length === 0) return <span className="text-gray-400 italic">No keywords</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {keywords.map((keyword, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{keyword}</span>
            </div>
          ))}
        </div>
      )
    }

    const getDomainListText = (dl) => {
      if (!dl) return ''
      const domains = []
      if (Array.isArray(dl)) domains.push(...dl.filter(Boolean).map(d => typeof d === 'string' ? d : (d.Domain || d)))
      else if (dl?.Domain) {
        const domainArray = Array.isArray(dl.Domain) ? dl.Domain : [dl.Domain]
        domains.push(...domainArray.filter(Boolean).map(d => typeof d === 'string' ? d : String(d)))
      }
      return domains.join(' ')
    }
    const getKeywordListText = (kl) => {
      if (!kl) return ''
      const keywords = []
      if (Array.isArray(kl)) keywords.push(...kl.filter(Boolean).map(k => typeof k === 'string' ? k : (k.Keyword || k)))
      else if (kl?.Keyword) {
        const keywordArray = Array.isArray(kl.Keyword) ? kl.Keyword : [kl.Keyword]
        keywords.push(...keywordArray.filter(Boolean).map(k => typeof k === 'string' ? k : String(k)))
      }
      return keywords.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Classification, fields.ConfigureCategory, fields.QoSPolicy,
        fields.Description, fields.OverrideDefaultDeniedMessage, fields.Notification,
        getDomainListText(fields.DomainList), getKeywordListText(fields.KeywordList)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="filter_list" className="text-gray-600 text-base" />
          <span>Web Filter Categories</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Web Filter Categories"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Classification
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Configure Category
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  QoS Policy
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  Override Default Denied Message
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Notification
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
                <th className="sophos-table-header">
                  Domain List
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 8)} />
                </th>
                <th className="sophos-table-header">
                  Keyword List
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 9)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`webfilter-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.Classification || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.ConfigureCategory || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.QoSPolicy || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.OverrideDefaultDeniedMessage === 'Enable' || fields.OverrideDefaultDeniedMessage === 'ON' || fields.OverrideDefaultDeniedMessage === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.OverrideDefaultDeniedMessage || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Notification === 'Enable' || fields.Notification === 'ON' || fields.Notification === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Notification || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatDomainList(fields.DomainList)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatKeywordList(fields.KeywordList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ZoneTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('zones', 5)

    // Format ApplianceAccess
    const formatApplianceAccess = (applianceAccess) => {
      if (!applianceAccess) return <span className="text-gray-400 italic">No appliance access</span>
      
      const services = []
      
      // Extract AdminServices
      if (applianceAccess.AdminServices) {
        const adminServices = []
        if (applianceAccess.AdminServices.HTTPS) adminServices.push({ name: 'HTTPS', status: applianceAccess.AdminServices.HTTPS })
        if (applianceAccess.AdminServices.SSH) adminServices.push({ name: 'SSH', status: applianceAccess.AdminServices.SSH })
        if (adminServices.length > 0) {
          services.push({ category: 'Admin Services', items: adminServices })
        }
      }
      
      // Extract AuthenticationServices
      if (applianceAccess.AuthenticationServices) {
        const authServices = []
        if (applianceAccess.AuthenticationServices.ClientAuthentication) authServices.push({ name: 'Client Authentication', status: applianceAccess.AuthenticationServices.ClientAuthentication })
        if (applianceAccess.AuthenticationServices.CaptivePortal) authServices.push({ name: 'Captive Portal', status: applianceAccess.AuthenticationServices.CaptivePortal })
        if (authServices.length > 0) {
          services.push({ category: 'Authentication Services', items: authServices })
        }
      }
      
      // Extract NetworkServices
      if (applianceAccess.NetworkServices) {
        const networkServices = []
        if (applianceAccess.NetworkServices.DNS) networkServices.push({ name: 'DNS', status: applianceAccess.NetworkServices.DNS })
        if (applianceAccess.NetworkServices.Ping) networkServices.push({ name: 'Ping', status: applianceAccess.NetworkServices.Ping })
        if (networkServices.length > 0) {
          services.push({ category: 'Network Services', items: networkServices })
        }
      }
      
      // Extract OtherServices
      if (applianceAccess.OtherServices) {
        const otherServices = []
        if (applianceAccess.OtherServices.WebProxy) otherServices.push({ name: 'Web Proxy', status: applianceAccess.OtherServices.WebProxy })
        if (applianceAccess.OtherServices.UserPortal) otherServices.push({ name: 'User Portal', status: applianceAccess.OtherServices.UserPortal })
        if (applianceAccess.OtherServices.WirelessProtection) otherServices.push({ name: 'Wireless Protection', status: applianceAccess.OtherServices.WirelessProtection })
        if (applianceAccess.OtherServices.SMTPRelay) otherServices.push({ name: 'SMTP Relay', status: applianceAccess.OtherServices.SMTPRelay })
        if (otherServices.length > 0) {
          services.push({ category: 'Other Services', items: otherServices })
        }
      }
      
      // Extract VPNServices
      if (applianceAccess.VPNServices) {
        const vpnServices = []
        if (applianceAccess.VPNServices.RED) vpnServices.push({ name: 'RED', status: applianceAccess.VPNServices.RED })
        if (applianceAccess.VPNServices.IPsec) vpnServices.push({ name: 'IPsec', status: applianceAccess.VPNServices.IPsec })
        if (applianceAccess.VPNServices.VPNPortal) vpnServices.push({ name: 'VPN Portal', status: applianceAccess.VPNServices.VPNPortal })
        if (applianceAccess.VPNServices.SSLVPN) vpnServices.push({ name: 'SSL VPN', status: applianceAccess.VPNServices.SSLVPN })
        if (vpnServices.length > 0) {
          services.push({ category: 'VPN Services', items: vpnServices })
        }
      }
      
      if (services.length === 0) return <span className="text-gray-400 italic">No services configured</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '400px', maxHeight: '300px', overflowY: 'auto' }}>
          {services.map((serviceCategory, catIdx) => (
            <div key={catIdx} className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '400px' }}>
              <div className="text-xs font-semibold text-gray-900 mb-1.5">{serviceCategory.category}</div>
              <div className="flex flex-wrap gap-1.5">
                {serviceCategory.items.map((item, itemIdx) => (
                  <span key={itemIdx} className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.status === 'Enable' || item.status === '1' || item.status === 1
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.name}: {item.status}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    const getApplianceAccessText = (aa) => {
      if (!aa) return ''
      const parts = []
      if (aa.AdminServices) {
        if (aa.AdminServices.HTTPS) parts.push('HTTPS', aa.AdminServices.HTTPS)
        if (aa.AdminServices.SSH) parts.push('SSH', aa.AdminServices.SSH)
      }
      if (aa.AuthenticationServices) {
        if (aa.AuthenticationServices.ClientAuthentication) parts.push('ClientAuth', aa.AuthenticationServices.ClientAuthentication)
        if (aa.AuthenticationServices.CaptivePortal) parts.push('CaptivePortal', aa.AuthenticationServices.CaptivePortal)
      }
      if (aa.VPNServices) {
        if (aa.VPNServices.RED) parts.push('RED', aa.VPNServices.RED)
        if (aa.VPNServices.IPsec) parts.push('IPsec', aa.VPNServices.IPsec)
        if (aa.VPNServices.VPNPortal) parts.push('VPNPortal', aa.VPNServices.VPNPortal)
        if (aa.VPNServices.SSLVPN) parts.push('SSLVPN', aa.VPNServices.SSLVPN)
      }
      return parts.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Type, fields.Description, getApplianceAccessText(fields.ApplianceAccess)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="location_city" className="text-gray-600 text-base" />
          <span>Zones</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Zones"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Type
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Appliance Access
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`zone-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.Type || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '450px' }}>
                      {formatApplianceAccess(fields.ApplianceAccess)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const FileTypeTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('file-types', 5)

    // Format FileExtensionList
    const formatFileExtensionList = (fileExtensionList) => {
      if (!fileExtensionList) return <span className="text-gray-400 italic">No extensions</span>
      
      const extensions = []
      
      // Handle different structures
      if (Array.isArray(fileExtensionList)) {
        fileExtensionList.forEach(ext => {
          if (typeof ext === 'object' && ext !== null) {
            if (ext.FileExtension) {
              const extArray = Array.isArray(ext.FileExtension) ? ext.FileExtension : [ext.FileExtension]
              extensions.push(...extArray.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
            } else {
              Object.values(ext).forEach(val => {
                if (typeof val === 'string') extensions.push(val.trim())
                else if (Array.isArray(val)) extensions.push(...val.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
              })
            }
          } else if (typeof ext === 'string') {
            extensions.push(ext.trim())
          }
        })
      } else if (typeof fileExtensionList === 'object') {
        if (fileExtensionList.FileExtension) {
          const extArray = Array.isArray(fileExtensionList.FileExtension) 
            ? fileExtensionList.FileExtension 
            : [fileExtensionList.FileExtension]
          extensions.push(...extArray.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
        } else {
          Object.values(fileExtensionList).forEach(val => {
            if (typeof val === 'string') extensions.push(val.trim())
            else if (Array.isArray(val)) extensions.push(...val.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
          })
        }
      }
      
      if (extensions.length === 0) return <span className="text-gray-400 italic">No extensions</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {extensions.map((ext, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 font-mono">{ext}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format MIMEHeaderList
    const formatMIMEHeaderList = (mimeHeaderList) => {
      if (!mimeHeaderList) return <span className="text-gray-400 italic">No MIME headers</span>
      
      const headers = []
      
      // Handle different structures
      if (Array.isArray(mimeHeaderList)) {
        mimeHeaderList.forEach(header => {
          if (typeof header === 'object' && header !== null) {
            if (header.MIMEHeader) {
              const headerArray = Array.isArray(header.MIMEHeader) ? header.MIMEHeader : [header.MIMEHeader]
              headers.push(...headerArray.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
            } else {
              Object.values(header).forEach(val => {
                if (typeof val === 'string') headers.push(val.trim())
                else if (Array.isArray(val)) headers.push(...val.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
              })
            }
          } else if (typeof header === 'string') {
            headers.push(header.trim())
          }
        })
      } else if (typeof mimeHeaderList === 'object') {
        if (mimeHeaderList.MIMEHeader) {
          const headerArray = Array.isArray(mimeHeaderList.MIMEHeader) 
            ? mimeHeaderList.MIMEHeader 
            : [mimeHeaderList.MIMEHeader]
          headers.push(...headerArray.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
        } else {
          Object.values(mimeHeaderList).forEach(val => {
            if (typeof val === 'string') headers.push(val.trim())
            else if (Array.isArray(val)) headers.push(...val.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
          })
        }
      }
      
      if (headers.length === 0) return <span className="text-gray-400 italic">No MIME headers</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {headers.map((header, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{header}</span>
            </div>
          ))}
        </div>
      )
    }

    const getFileExtensionText = (fel) => {
      if (!fel) return ''
      const extensions = []
      if (Array.isArray(fel)) {
        fel.forEach(ext => {
          if (typeof ext === 'string') extensions.push(ext.trim())
          else if (ext?.FileExtension) {
            const extArray = Array.isArray(ext.FileExtension) ? ext.FileExtension : [ext.FileExtension]
            extensions.push(...extArray.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
          }
        })
      } else if (fel?.FileExtension) {
        const extArray = Array.isArray(fel.FileExtension) ? fel.FileExtension : [fel.FileExtension]
        extensions.push(...extArray.filter(Boolean).map(e => String(e).trim()).filter(Boolean))
      }
      return extensions.join(' ')
    }
    const getMIMEHeaderText = (mhl) => {
      if (!mhl) return ''
      const headers = []
      if (Array.isArray(mhl)) {
        mhl.forEach(header => {
          if (typeof header === 'string') headers.push(header.trim())
          else if (header?.MIMEHeader) {
            const headerArray = Array.isArray(header.MIMEHeader) ? header.MIMEHeader : [header.MIMEHeader]
            headers.push(...headerArray.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
          }
        })
      } else if (mhl?.MIMEHeader) {
        const headerArray = Array.isArray(mhl.MIMEHeader) ? mhl.MIMEHeader : [mhl.MIMEHeader]
        headers.push(...headerArray.filter(Boolean).map(h => String(h).trim()).filter(Boolean))
      }
      return headers.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, getFileExtensionText(fields.FileExtensionList), getMIMEHeaderText(fields.MIMEHeaderList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="description" className="text-gray-600 text-base" />
          <span>File Types</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search File Types"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  File Extensions
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  MIME Headers
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`filetype-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatFileExtensionList(fields.FileExtensionList)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatMIMEHeaderList(fields.MIMEHeaderList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ScheduleTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('schedules', 5)

    // Format ScheduleDetails
    const formatScheduleDetails = (scheduleDetails) => {
      if (!scheduleDetails) return <span className="text-gray-400 italic">No schedule details</span>
      
      const details = []
      
      // Handle different structures
      if (Array.isArray(scheduleDetails)) {
        scheduleDetails.forEach(detail => {
          if (typeof detail === 'object' && detail !== null) {
            if (detail.ScheduleDetail) {
              const detailArray = Array.isArray(detail.ScheduleDetail) 
                ? detail.ScheduleDetail 
                : [detail.ScheduleDetail]
              details.push(...detailArray.filter(Boolean))
            } else {
              details.push(detail)
            }
          }
        })
      } else if (typeof scheduleDetails === 'object') {
        if (scheduleDetails.ScheduleDetail) {
          const detailArray = Array.isArray(scheduleDetails.ScheduleDetail) 
            ? scheduleDetails.ScheduleDetail 
            : [scheduleDetails.ScheduleDetail]
          details.push(...detailArray.filter(Boolean))
        } else {
          // Try to extract from object
          Object.values(scheduleDetails).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null) {
                  if (v.ScheduleDetail) {
                    const detailArray = Array.isArray(v.ScheduleDetail) ? v.ScheduleDetail : [v.ScheduleDetail]
                    details.push(...detailArray.filter(Boolean))
                  } else {
                    details.push(v)
                  }
                }
              })
            } else if (typeof val === 'object' && val !== null) {
              if (val.ScheduleDetail) {
                const detailArray = Array.isArray(val.ScheduleDetail) ? val.ScheduleDetail : [val.ScheduleDetail]
                details.push(...detailArray.filter(Boolean))
              } else {
                details.push(val)
              }
            }
          })
        }
      }
      
      if (details.length === 0) return <span className="text-gray-400 italic">No schedule details</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {details.map((detail, idx) => {
            const days = detail.Days || detail.days || '-'
            const startTime = detail.StartTime || detail.startTime || '-'
            const stopTime = detail.StopTime || detail.stopTime || '-'
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Days:</span>
                      <span className="text-gray-900 font-medium">{days}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Time:</span>
                      <span className="text-gray-700">{startTime} - {stopTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    const getScheduleDetailsText = (sd) => {
      if (!sd) return ''
      const details = []
      if (Array.isArray(sd)) {
        sd.forEach(detail => {
          if (detail?.ScheduleDetail) {
            const detailArray = Array.isArray(detail.ScheduleDetail) ? detail.ScheduleDetail : [detail.ScheduleDetail]
            details.push(...detailArray.filter(Boolean))
          } else if (detail) details.push(detail)
        })
      } else if (sd?.ScheduleDetail) {
        const detailArray = Array.isArray(sd.ScheduleDetail) ? sd.ScheduleDetail : [sd.ScheduleDetail]
        details.push(...detailArray.filter(Boolean))
      }
      return details.map(d => [d.Days || d.days, d.StartTime || d.startTime, d.StopTime || d.stopTime].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, fields.Type, getScheduleDetailsText(fields.ScheduleDetails)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="schedule" className="text-gray-600 text-base" />
          <span>Schedules</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Schedules"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Type
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Schedule Details
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`schedule-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.Type || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatScheduleDetails(fields.ScheduleDetails)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const UserActivityTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('user-activities', 3)

    // Format CategoryList
    const formatCategoryList = (categoryList) => {
      if (!categoryList) return <span className="text-gray-400 italic">No categories</span>
      
      const categories = []
      
      // Handle different structures
      if (Array.isArray(categoryList)) {
        categoryList.forEach(cat => {
          if (typeof cat === 'object' && cat !== null) {
            if (cat.Category) {
              const catArray = Array.isArray(cat.Category) ? cat.Category : [cat.Category]
              categories.push(...catArray.filter(Boolean))
            } else {
              categories.push(cat)
            }
          }
        })
      } else if (typeof categoryList === 'object') {
        if (categoryList.Category) {
          const catArray = Array.isArray(categoryList.Category) 
            ? categoryList.Category 
            : [categoryList.Category]
          categories.push(...catArray.filter(Boolean))
        } else {
          // Try to extract categories from nested structure
          Object.values(categoryList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null) {
                  if (v.Category) {
                    const catArray = Array.isArray(v.Category) ? v.Category : [v.Category]
                    categories.push(...catArray.filter(Boolean))
                  } else {
                    categories.push(v)
                  }
                }
              })
            } else if (typeof val === 'object' && val !== null) {
              if (val.Category) {
                const catArray = Array.isArray(val.Category) ? val.Category : [val.Category]
                categories.push(...catArray.filter(Boolean))
              } else {
                categories.push(val)
              }
            }
          })
        }
      }
      
      if (categories.length === 0) return <span className="text-gray-400 italic">No categories</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {categories.map((category, idx) => {
            const categoryId = category.ID || category.id || '-'
            const categoryType = category.type || category.Type || '-'
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-gray-900 font-medium">{categoryId}</span>
                    <span className="text-gray-500 text-xs italic">{categoryType}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    const getCategoryListText = (cl) => {
      if (!cl) return ''
      const categories = []
      if (Array.isArray(cl)) {
        cl.forEach(cat => {
          if (cat?.Category) {
            const catArray = Array.isArray(cat.Category) ? cat.Category : [cat.Category]
            categories.push(...catArray.filter(Boolean))
          } else if (cat) categories.push(cat)
        })
      } else if (cl?.Category) {
        const catArray = Array.isArray(cl.Category) ? cl.Category : [cl.Category]
        categories.push(...catArray.filter(Boolean))
      }
      return categories.map(c => [c.ID || c.id, c.type || c.Type].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Desc || fields.Description, fields.NewName, getCategoryListText(fields.CategoryList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5" style={{ fontFamily: 'inherit' }}>
          <Icon name="person" className="text-gray-600 text-base" />
          <span style={{ fontFamily: 'inherit', fontWeight: 600 }}>User Activities</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search User Activities"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">New Name</th>
                <th className="sophos-table-header">Category List</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`useractivity-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Desc || fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.NewName || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatCategoryList(fields.CategoryList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ClientlessUserTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('clientless-users', 9)

    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.UserName, fields.IPAddress, fields.ClientLessGroup, fields.Name,
        fields.Email, fields.Description, fields.QuarantineDigest, fields.QoSPolicy, fields.Status
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="person" className="text-gray-600 text-base" />
          <span>Clientless Users</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Clientless Users"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table" ref={tableRef}>
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">User Name</th>
                <th className="sophos-table-header">IP Address</th>
                <th className="sophos-table-header">Clientless Group</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Email</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Quarantine Digest</th>
                <th className="sophos-table-header">QoS Policy</th>
                <th className="sophos-table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`clientless-user-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.UserName || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-900 font-mono">{fields.IPAddress || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.ClientLessGroup || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '250px'
                    }}>{fields.Email || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.QuarantineDigest === 'Enable' || fields.QuarantineDigest === 'ON' || fields.QuarantineDigest === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.QuarantineDigest || 'Disable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.QoSPolicy || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Status === 'Active' || fields.Status === 'ON' || fields.Status === 'Enabled'
                          ? 'bg-green-100 text-green-700' 
                          : fields.Status === 'Inactive' || fields.Status === 'OFF' || fields.Status === 'Disabled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Status || '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const MACHostTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('mac-hosts', 4)

    // Format MAC Address List
    const formatMACList = (macList, type, singleMAC) => {
      const macAddresses = []
      
      // Handle MACLIST type with MACList array
      if (type === 'MACLIST' && macList) {
        if (Array.isArray(macList)) {
          macList.forEach(mac => {
            if (typeof mac === 'object' && mac !== null) {
              if (mac.MACAddress) {
                const macArray = Array.isArray(mac.MACAddress) ? mac.MACAddress : [mac.MACAddress]
                macAddresses.push(...macArray.filter(Boolean))
              } else {
                macAddresses.push(mac)
              }
            } else if (mac) {
              macAddresses.push(mac)
            }
          })
        } else if (typeof macList === 'object') {
          if (macList.MACAddress) {
            const macArray = Array.isArray(macList.MACAddress) ? macList.MACAddress : [macList.MACAddress]
            macAddresses.push(...macArray.filter(Boolean))
          }
        }
      } else if (type === 'MACAddress' && singleMAC) {
        // Handle single MACAddress
        if (Array.isArray(singleMAC)) {
          macAddresses.push(...singleMAC.filter(Boolean))
        } else {
          macAddresses.push(singleMAC)
        }
      }
      
      if (macAddresses.length === 0) return <span className="text-gray-400 italic">No MAC addresses</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px', maxHeight: '200px', overflowY: 'auto' }}>
          {macAddresses.map((mac, idx) => {
            const macValue = typeof mac === 'string' ? mac : (mac.MACAddress || mac || '-')
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '200px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900 font-medium font-mono">{macValue}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Helper to extract text from MAC address list
    const getMACAddressText = (macList, type, singleMAC) => {
      const macAddresses = []
      
      if (type === 'MACLIST' && macList) {
        if (Array.isArray(macList)) {
          macList.forEach(mac => {
            if (typeof mac === 'object' && mac !== null) {
              if (mac.MACAddress) {
                const macArray = Array.isArray(mac.MACAddress) ? mac.MACAddress : [mac.MACAddress]
                macAddresses.push(...macArray.filter(Boolean))
              } else {
                macAddresses.push(mac)
              }
            } else if (mac) {
              macAddresses.push(mac)
            }
          })
        } else if (typeof macList === 'object') {
          if (macList.MACAddress) {
            const macArray = Array.isArray(macList.MACAddress) ? macList.MACAddress : [macList.MACAddress]
            macAddresses.push(...macArray.filter(Boolean))
          }
        }
      } else if (type === 'MACAddress' && singleMAC) {
        if (Array.isArray(singleMAC)) {
          macAddresses.push(...singleMAC.filter(Boolean))
        } else {
          macAddresses.push(singleMAC)
        }
      }
      
      return macAddresses.map(mac => {
        const macValue = typeof mac === 'string' ? mac : (mac.MACAddress || mac || '')
        return String(macValue)
      }).filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Description, fields.Type, getMACAddressText(fields.MACList, fields.Type, fields.MACAddress)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="devices" className="text-gray-600 text-base" />
          <span>MAC Hosts</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search MAC Hosts"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table" ref={tableRef}>
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Type</th>
                <th className="sophos-table-header">MAC Address(es)</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const type = fields.Type || '-'
                const macList = fields.MACList
                const singleMAC = fields.MACAddress
                return (
                  <tr key={`machost-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{type}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '250px' }}>
                      {formatMACList(macList, type, singleMAC)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const IPHostTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('ip-hosts', 5)

    // Format IP Address List (for IPList type)
    const formatIPList = (listOfIPAddresses) => {
      if (!listOfIPAddresses) return <span className="text-gray-400 italic">No IP addresses</span>
      
      const ipAddresses = []
      
      // Handle comma-separated string
      if (typeof listOfIPAddresses === 'string') {
        const ips = listOfIPAddresses.split(',').map(ip => ip.trim()).filter(Boolean)
        ipAddresses.push(...ips)
      } else if (Array.isArray(listOfIPAddresses)) {
        listOfIPAddresses.forEach(ip => {
          if (typeof ip === 'string' && ip.trim()) {
            ipAddresses.push(ip.trim())
          } else if (ip && typeof ip === 'object' && ip.IPAddress) {
            ipAddresses.push(ip.IPAddress)
          }
        })
      } else if (typeof listOfIPAddresses === 'object' && listOfIPAddresses.IPAddress) {
        const ipArray = Array.isArray(listOfIPAddresses.IPAddress) 
          ? listOfIPAddresses.IPAddress 
          : [listOfIPAddresses.IPAddress]
        ipAddresses.push(...ipArray.filter(Boolean))
      }
      
      if (ipAddresses.length === 0) return <span className="text-gray-400 italic">No IP addresses</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px', maxHeight: '200px', overflowY: 'auto' }}>
          {ipAddresses.map((ip, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '200px' }}>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                  {idx + 1}
                </span>
                <span className="text-gray-900 font-medium font-mono">{ip}</span>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Format IP Address/Network display
    const formatIPAddress = (fields) => {
      const hostType = fields.HostType || ''
      const ipAddress = fields.IPAddress || ''
      const subnet = fields.Subnet || ''
      
      if (hostType === 'Network' && ipAddress && subnet) {
        const cidr = netmaskToCIDR(subnet)
        return (
          <span className="font-mono text-sm">
            {ipAddress}
            {cidr && <span className="text-gray-500">/{cidr}</span>}
            <span className="text-gray-400 text-xs ml-2">({subnet})</span>
          </span>
        )
      } else if (hostType === 'IP' && ipAddress) {
        return <span className="font-mono text-sm">{ipAddress}</span>
      } else if (hostType === 'IPList') {
        return formatIPList(fields.ListOfIPAddresses)
      }
      return <span className="text-gray-400 italic">-</span>
    }
    
    // Helper to extract text from IP address/network display
    const getIPAddressText = (fields) => {
      const hostType = fields.HostType || ''
      const ipAddress = fields.IPAddress || ''
      const subnet = fields.Subnet || ''
      
      if (hostType === 'Network' && ipAddress && subnet) {
        const cidr = netmaskToCIDR(subnet)
        return `${ipAddress}${cidr ? `/${cidr}` : ''} (${subnet})`
      } else if (hostType === 'IP' && ipAddress) {
        return ipAddress
      } else if (hostType === 'IPList' && fields.ListOfIPAddresses) {
        const ipAddresses = []
        if (typeof fields.ListOfIPAddresses === 'string') {
          const ips = fields.ListOfIPAddresses.split(',').map(ip => ip.trim()).filter(Boolean)
          ipAddresses.push(...ips)
        } else if (Array.isArray(fields.ListOfIPAddresses)) {
          fields.ListOfIPAddresses.forEach(ip => {
            if (typeof ip === 'string' && ip.trim()) {
              ipAddresses.push(ip.trim())
            } else if (ip && typeof ip === 'object' && ip.IPAddress) {
              ipAddresses.push(ip.IPAddress)
            }
          })
        } else if (typeof fields.ListOfIPAddresses === 'object' && fields.ListOfIPAddresses.IPAddress) {
          const ipArray = Array.isArray(fields.ListOfIPAddresses.IPAddress) 
            ? fields.ListOfIPAddresses.IPAddress 
            : [fields.ListOfIPAddresses.IPAddress]
          ipAddresses.push(...ipArray.filter(Boolean))
        }
        return ipAddresses.join(' ')
      }
      return ''
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Description, fields.IPFamily, fields.HostType, getIPAddressText(fields)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="dns" className="text-gray-600 text-base" />
          <span>IP Hosts</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search IP Hosts"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table" ref={tableRef}>
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">IP Family</th>
                <th className="sophos-table-header">Host Type</th>
                <th className="sophos-table-header">IP Address/Network/IP List</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`iphost-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '200px' }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '300px' }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{fields.IPFamily || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{fields.HostType || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '250px' }}>
                      {formatIPAddress(fields)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Format Members list similar to CategoryList (handles Member array and CountryList.Country)
  const formatMembers = (members, countryList = null) => {
    const memberList = []
    
    // Handle CountryList for CountryGroup
    if (countryList) {
      if (Array.isArray(countryList)) {
        countryList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Country) {
              const countryArray = Array.isArray(item.Country) ? item.Country : [item.Country]
              memberList.push(...countryArray.filter(c => c != null && c !== ''))
            } else {
              Object.values(item).forEach(val => {
                if (Array.isArray(val)) {
                  memberList.push(...val.filter(c => c != null && c !== ''))
                } else if (val != null && val !== '') {
                  memberList.push(val)
                }
              })
            }
          }
        })
      } else if (typeof countryList === 'object' && countryList !== null) {
        if (countryList.Country) {
          const countryArray = Array.isArray(countryList.Country) ? countryList.Country : [countryList.Country]
          memberList.push(...countryArray.filter(c => c != null && c !== ''))
        } else {
          Object.values(countryList).forEach(val => {
            if (Array.isArray(val)) {
              memberList.push(...val.filter(c => c != null && c !== ''))
            } else if (val != null && val !== '') {
              memberList.push(val)
            }
          })
        }
      }
    }
    
    // Handle Member array for other groups
    if (members) {
      if (Array.isArray(members)) {
        memberList.push(...members.filter(m => m != null && m !== ''))
      } else if (typeof members === 'string') {
        memberList.push(members)
      } else if (typeof members === 'object') {
        if (members.Member) {
          const memberArray = Array.isArray(members.Member) ? members.Member : [members.Member]
          memberList.push(...memberArray.filter(m => m != null && m !== ''))
        } else {
          Object.values(members).forEach(val => {
            if (Array.isArray(val)) {
              memberList.push(...val.filter(m => m != null && m !== ''))
            } else if (val != null && val !== '') {
              memberList.push(val)
            }
          })
        }
      }
    }
    
    if (memberList.length === 0) return <span className="text-gray-400 italic">No members</span>
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
        {memberList.map((member, idx) => {
          const memberName = typeof member === 'string' ? member : (member.Name || member.name || String(member))
          return (
            <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                  {idx + 1}
                </span>
                <span className="text-gray-900 font-medium">{memberName}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const IPHostGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('ip-host-groups', 4)

    // Format Host List
    const formatHostList = (hostList) => {
      if (!hostList) return <span className="text-gray-400 italic">No hosts</span>
      
      const hosts = []
      
      // Handle HostList.Host structure
      if (Array.isArray(hostList)) {
        hostList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Host) {
              const hostArray = Array.isArray(item.Host) ? item.Host : [item.Host]
              hosts.push(...hostArray.filter(Boolean))
            } else {
              hosts.push(item)
            }
          } else if (item) {
            hosts.push(item)
          }
        })
      } else if (typeof hostList === 'object') {
        if (hostList.Host) {
          const hostArray = Array.isArray(hostList.Host) ? hostList.Host : [hostList.Host]
          hosts.push(...hostArray.filter(Boolean))
        } else {
          Object.values(hostList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.Host) {
                  const hostArray = Array.isArray(v.Host) ? v.Host : [v.Host]
                  hosts.push(...hostArray.filter(Boolean))
                } else if (v) {
                  hosts.push(v)
                }
              })
            } else if (val) {
              hosts.push(val)
            }
          })
        }
      }
      
      if (hosts.length === 0) return <span className="text-gray-400 italic">No hosts</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {hosts.map((host, idx) => {
            const hostValue = typeof host === 'string' ? host : (host.Host || host || '-')
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900 font-medium font-mono">{hostValue}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Helper to extract text from host list
    const getHostListText = (hostList) => {
      if (!hostList) return ''
      const hosts = []
      
      if (Array.isArray(hostList)) {
        hostList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Host) {
              const hostArray = Array.isArray(item.Host) ? item.Host : [item.Host]
              hosts.push(...hostArray.filter(Boolean))
            } else {
              hosts.push(item)
            }
          } else if (item) {
            hosts.push(item)
          }
        })
      } else if (typeof hostList === 'object') {
        if (hostList.Host) {
          const hostArray = Array.isArray(hostList.Host) ? hostList.Host : [hostList.Host]
          hosts.push(...hostArray.filter(Boolean))
        } else {
          Object.values(hostList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.Host) {
                  const hostArray = Array.isArray(v.Host) ? v.Host : [v.Host]
                  hosts.push(...hostArray.filter(Boolean))
                } else if (v) {
                  hosts.push(v)
                }
              })
            } else if (val) {
              hosts.push(val)
            }
          })
        }
      }
      
      return hosts.map(host => {
        const hostValue = typeof host === 'string' ? host : (host.Host || host || '')
        return String(hostValue)
      }).filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, fields.IPFamily, getHostListText(fields.HostList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="group_work" className="text-gray-600 text-base" />
          <span>IP Host Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search IP Host Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">IP Family</th>
                <th className="sophos-table-header">Hosts</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`ip-host-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium">{fields.IPFamily || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatHostList(fields.HostList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const FQDNGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('fqdn-host-groups', 3)

    // Format FQDN Host List
    const formatFQDNHostList = (fqdnHostList) => {
      if (!fqdnHostList) return <span className="text-gray-400 italic">No FQDN hosts</span>
      
      const fqdnHosts = []
      
      // Handle FQDNHostList.FQDNHost structure
      if (Array.isArray(fqdnHostList)) {
        fqdnHostList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.FQDNHost) {
              const fqdnArray = Array.isArray(item.FQDNHost) ? item.FQDNHost : [item.FQDNHost]
              fqdnHosts.push(...fqdnArray.filter(Boolean))
            } else {
              fqdnHosts.push(item)
            }
          } else if (item) {
            fqdnHosts.push(item)
          }
        })
      } else if (typeof fqdnHostList === 'object') {
        if (fqdnHostList.FQDNHost) {
          const fqdnArray = Array.isArray(fqdnHostList.FQDNHost) ? fqdnHostList.FQDNHost : [fqdnHostList.FQDNHost]
          fqdnHosts.push(...fqdnArray.filter(Boolean))
        } else {
          Object.values(fqdnHostList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.FQDNHost) {
                  const fqdnArray = Array.isArray(v.FQDNHost) ? v.FQDNHost : [v.FQDNHost]
                  fqdnHosts.push(...fqdnArray.filter(Boolean))
                } else if (v) {
                  fqdnHosts.push(v)
                }
              })
            } else if (val) {
              fqdnHosts.push(val)
            }
          })
        }
      }
      
      if (fqdnHosts.length === 0) return <span className="text-gray-400 italic">No FQDN hosts</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {fqdnHosts.map((fqdn, idx) => {
            const fqdnValue = typeof fqdn === 'string' ? fqdn : (fqdn.FQDNHost || fqdn || '-')
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900 font-medium font-mono">{fqdnValue}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Helper to extract text from FQDN host list
    const getFQDNHostListText = (fqdnHostList) => {
      if (!fqdnHostList) return ''
      const fqdnHosts = []
      
      if (Array.isArray(fqdnHostList)) {
        fqdnHostList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.FQDNHost) {
              const fqdnArray = Array.isArray(item.FQDNHost) ? item.FQDNHost : [item.FQDNHost]
              fqdnHosts.push(...fqdnArray.filter(Boolean))
            } else {
              fqdnHosts.push(item)
            }
          } else if (item) {
            fqdnHosts.push(item)
          }
        })
      } else if (typeof fqdnHostList === 'object') {
        if (fqdnHostList.FQDNHost) {
          const fqdnArray = Array.isArray(fqdnHostList.FQDNHost) ? fqdnHostList.FQDNHost : [fqdnHostList.FQDNHost]
          fqdnHosts.push(...fqdnArray.filter(Boolean))
        } else {
          Object.values(fqdnHostList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.FQDNHost) {
                  const fqdnArray = Array.isArray(v.FQDNHost) ? v.FQDNHost : [v.FQDNHost]
                  fqdnHosts.push(...fqdnArray.filter(Boolean))
                } else if (v) {
                  fqdnHosts.push(v)
                }
              })
            } else if (val) {
              fqdnHosts.push(val)
            }
          })
        }
      }
      
      return fqdnHosts.map(fqdn => {
        const fqdnValue = typeof fqdn === 'string' ? fqdn : (fqdn.FQDNHost || fqdn || '')
        return String(fqdnValue)
      }).filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, getFQDNHostListText(fields.FQDNHostList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="group_work" className="text-gray-600 text-base" />
          <span>FQDN Host Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search FQDN Host Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">FQDN Hosts</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`fqdn-host-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatFQDNHostList(fields.FQDNHostList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ServiceGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('service-groups', 3)

    // Format Service List
    const formatServiceList = (serviceList) => {
      if (!serviceList) return <span className="text-gray-400 italic">No services</span>
      
      const services = []
      
      // Handle ServiceList.Service structure
      if (Array.isArray(serviceList)) {
        serviceList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Service) {
              const serviceArray = Array.isArray(item.Service) ? item.Service : [item.Service]
              services.push(...serviceArray.filter(Boolean))
            } else {
              services.push(item)
            }
          } else if (item) {
            services.push(item)
          }
        })
      } else if (typeof serviceList === 'object') {
        if (serviceList.Service) {
          const serviceArray = Array.isArray(serviceList.Service) ? serviceList.Service : [serviceList.Service]
          services.push(...serviceArray.filter(Boolean))
        } else {
          Object.values(serviceList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.Service) {
                  const serviceArray = Array.isArray(v.Service) ? v.Service : [v.Service]
                  services.push(...serviceArray.filter(Boolean))
                } else if (v) {
                  services.push(v)
                }
              })
            } else if (val) {
              services.push(val)
            }
          })
        }
      }
      
      if (services.length === 0) return <span className="text-gray-400 italic">No services</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {services.map((service, idx) => {
            const serviceValue = typeof service === 'string' ? service : (service.Service || service || '-')
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900 font-medium">{serviceValue}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Helper to extract text from service list
    const getServiceListText = (serviceList) => {
      if (!serviceList) return ''
      const services = []
      if (Array.isArray(serviceList)) {
        serviceList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Service) {
              const serviceArray = Array.isArray(item.Service) ? item.Service : [item.Service]
              services.push(...serviceArray.filter(Boolean))
            }
          } else if (item) services.push(item)
        })
      } else if (typeof serviceList === 'object') {
        if (serviceList.Service) {
          const serviceArray = Array.isArray(serviceList.Service) ? serviceList.Service : [serviceList.Service]
          services.push(...serviceArray.filter(Boolean))
        }
      }
      return services.map(s => String(typeof s === 'string' ? s : (s.Service || s || ''))).filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, getServiceListText(fields.ServiceList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="group_work" className="text-gray-600 text-base" />
          <span>Service Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Service Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Services</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`service-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatServiceList(fields.ServiceList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const CountryGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('country-groups', 3)

    // Format Country List
    const formatCountryList = (countryList) => {
      if (!countryList) return <span className="text-gray-400 italic">No countries</span>
      
      const countries = []
      
      // Handle CountryList.Country structure
      if (Array.isArray(countryList)) {
        countryList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Country) {
              const countryArray = Array.isArray(item.Country) ? item.Country : [item.Country]
              countries.push(...countryArray.filter(Boolean))
            } else {
              countries.push(item)
            }
          } else if (item) {
            countries.push(item)
          }
        })
      } else if (typeof countryList === 'object') {
        if (countryList.Country) {
          const countryArray = Array.isArray(countryList.Country) ? countryList.Country : [countryList.Country]
          countries.push(...countryArray.filter(Boolean))
        } else {
          Object.values(countryList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null && v.Country) {
                  const countryArray = Array.isArray(v.Country) ? v.Country : [v.Country]
                  countries.push(...countryArray.filter(Boolean))
                } else if (v) {
                  countries.push(v)
                }
              })
            } else if (val) {
              countries.push(val)
            }
          })
        }
      }
      
      if (countries.length === 0) return <span className="text-gray-400 italic">No countries</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {countries.map((country, idx) => {
            const countryValue = typeof country === 'string' ? country : (country.Country || country || '-')
            return (
              <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900 font-medium">{countryValue}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    // Helper to extract text from country list
    const getCountryListText = (countryList) => {
      if (!countryList) return ''
      const countries = []
      if (Array.isArray(countryList)) {
        countryList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.Country) {
              const countryArray = Array.isArray(item.Country) ? item.Country : [item.Country]
              countries.push(...countryArray.filter(Boolean))
            }
          } else if (item) countries.push(item)
        })
      } else if (typeof countryList === 'object') {
        if (countryList.Country) {
          const countryArray = Array.isArray(countryList.Country) ? countryList.Country : [countryList.Country]
          countries.push(...countryArray.filter(Boolean))
        }
      }
      return countries.map(c => String(typeof c === 'string' ? c : (c.Country || c || ''))).filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, getCountryListText(fields.CountryList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="group_work" className="text-gray-600 text-base" />
          <span>Country Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Country Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">Countries</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`country-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatCountryList(fields.CountryList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AntiVirusHTTPScanningRuleTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('antivirus-http-scanning-rules', 3)

    // Format URLRegex array
    const formatURLRegex = (urlRegex) => {
      if (!urlRegex) return <span className="text-gray-400 italic">No URL regex patterns</span>
      
      const patterns = []
      
      // Handle different structures
      if (Array.isArray(urlRegex)) {
        // Direct array of patterns
        urlRegex.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            patterns.push(item.trim())
          } else if (typeof item === 'object' && item !== null) {
            // If it's an object, try to extract string values
            Object.values(item).forEach(val => {
              if (typeof val === 'string' && val.trim()) {
                patterns.push(val.trim())
              }
            })
          }
        })
      } else if (typeof urlRegex === 'string') {
        // Single string pattern
        if (urlRegex.trim()) {
          patterns.push(urlRegex.trim())
        }
      } else if (typeof urlRegex === 'object' && urlRegex !== null) {
        // Object structure - could be { URLRegex: [...] } or multiple URLRegex properties
        // First, check if there's a direct array property
        if (Array.isArray(urlRegex.URLRegex)) {
          urlRegex.URLRegex.forEach(item => {
            if (typeof item === 'string' && item.trim()) {
              patterns.push(item.trim())
            }
          })
        } else if (typeof urlRegex.URLRegex === 'string' && urlRegex.URLRegex.trim()) {
          patterns.push(urlRegex.URLRegex.trim())
        } else {
          // Try to extract all string values from the object
          Object.values(urlRegex).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'string' && v.trim()) {
                  patterns.push(v.trim())
                }
              })
            } else if (typeof val === 'string' && val.trim()) {
              patterns.push(val.trim())
            }
          })
        }
      }
      
      // Remove duplicates while preserving order
      const uniquePatterns = Array.from(new Set(patterns))
      
      if (uniquePatterns.length === 0) return <span className="text-gray-400 italic">No URL regex patterns</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {uniquePatterns.map((pattern, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-gray-900 font-mono break-all text-xs leading-relaxed">{pattern}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format After field
    const formatAfter = (after) => {
      if (!after) return <span className="text-gray-400 italic">-</span>
      if (typeof after === 'object') {
        if (after.Name) {
          return <span className="text-gray-900">{after.Name}</span>
        }
        // Try to find Name in nested structure
        const name = after.name || after.NAME || Object.values(after).find(v => typeof v === 'string' && v.trim())
        return name ? <span className="text-gray-900">{name}</span> : <span className="text-gray-400 italic">-</span>
      }
      return <span className="text-gray-900">{String(after)}</span>
    }
    
    const getURLRegexText = (urlRegex) => {
      if (!urlRegex) return ''
      const patterns = []
      if (Array.isArray(urlRegex)) {
        urlRegex.forEach(item => {
          if (typeof item === 'string' && item.trim()) patterns.push(item.trim())
          else if (typeof item === 'object' && item !== null) {
            Object.values(item).forEach(val => {
              if (typeof val === 'string' && val.trim()) patterns.push(val.trim())
            })
          }
        })
      } else if (typeof urlRegex === 'string' && urlRegex.trim()) {
        patterns.push(urlRegex.trim())
      } else if (typeof urlRegex === 'object' && urlRegex !== null) {
        if (Array.isArray(urlRegex.URLRegex)) {
          urlRegex.URLRegex.forEach(item => {
            if (typeof item === 'string' && item.trim()) patterns.push(item.trim())
          })
        } else if (typeof urlRegex.URLRegex === 'string' && urlRegex.URLRegex.trim()) {
          patterns.push(urlRegex.URLRegex.trim())
        }
      }
      return Array.from(new Set(patterns)).join(' ')
    }
    const getAfterText = (after) => {
      if (!after) return ''
      if (typeof after === 'object') {
        return after.Name || after.name || after.NAME || Object.values(after).find(v => typeof v === 'string' && v.trim()) || ''
      }
      return String(after)
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, getAfterText(fields.After), getURLRegexText(fields.URLRegex), fields.Action
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="scanner" className="text-gray-600 text-base" />
          <span>Anti-Virus HTTP Scanning Rules</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Anti-Virus HTTP Scanning Rules"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">After</th>
                <th className="sophos-table-header">URL Regex Patterns</th>
                <th className="sophos-table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`antivirus-http-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{formatAfter(fields.After)}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '400px' }}>
                      {formatURLRegex(fields.URLRegex)}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Action === 'ByPass' || fields.Action === 'Bypass' || fields.Action === 'Allow'
                          ? 'bg-green-100 text-green-700' 
                          : fields.Action === 'Block' || fields.Action === 'Deny'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Action || '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const WebFilterExceptionTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('web-filter-exceptions', 12)

    // Format DomainList - contains URLRegex and DstIp
    const formatDomainList = (domainList) => {
      if (!domainList) return <span className="text-gray-400 italic">No domain list</span>
      
      const urlRegexPatterns = []
      const dstIps = []
      
      // Handle different structures
      if (Array.isArray(domainList)) {
        domainList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.URLRegex) {
              const regexArray = Array.isArray(item.URLRegex) ? item.URLRegex : [item.URLRegex]
              urlRegexPatterns.push(...regexArray.filter(Boolean).map(r => typeof r === 'string' ? r.trim() : String(r).trim()).filter(Boolean))
            }
            if (item.DstIp || item.DstIP || item.dstIp) {
              const ipArray = Array.isArray(item.DstIp || item.DstIP || item.dstIp) 
                ? (item.DstIp || item.DstIP || item.dstIp) 
                : [item.DstIp || item.DstIP || item.dstIp]
              dstIps.push(...ipArray.filter(Boolean).map(ip => typeof ip === 'string' ? ip.trim() : String(ip).trim()).filter(Boolean))
            }
          }
        })
      } else if (typeof domainList === 'object') {
        // Extract URLRegex
        if (domainList.URLRegex) {
          const regexArray = Array.isArray(domainList.URLRegex) ? domainList.URLRegex : [domainList.URLRegex]
          urlRegexPatterns.push(...regexArray.filter(Boolean).map(r => typeof r === 'string' ? r.trim() : String(r).trim()).filter(Boolean))
        }
        // Extract DstIp
        if (domainList.DstIp || domainList.DstIP || domainList.dstIp) {
          const ipArray = Array.isArray(domainList.DstIp || domainList.DstIP || domainList.dstIp) 
            ? (domainList.DstIp || domainList.DstIP || domainList.dstIp) 
            : [domainList.DstIp || domainList.DstIP || domainList.dstIp]
          dstIps.push(...ipArray.filter(Boolean).map(ip => typeof ip === 'string' ? ip.trim() : String(ip).trim()).filter(Boolean))
        }
        // Also check nested structures
        Object.values(domainList).forEach(val => {
          if (Array.isArray(val)) {
            val.forEach(v => {
              if (typeof v === 'object' && v !== null) {
                if (v.URLRegex) {
                  const regexArray = Array.isArray(v.URLRegex) ? v.URLRegex : [v.URLRegex]
                  urlRegexPatterns.push(...regexArray.filter(Boolean).map(r => typeof r === 'string' ? r.trim() : String(r).trim()).filter(Boolean))
                }
                if (v.DstIp || v.DstIP || v.dstIp) {
                  const ipArray = Array.isArray(v.DstIp || v.DstIP || v.dstIp) 
                    ? (v.DstIp || v.DstIP || v.dstIp) 
                    : [v.DstIp || v.DstIP || v.dstIp]
                  dstIps.push(...ipArray.filter(Boolean).map(ip => typeof ip === 'string' ? ip.trim() : String(ip).trim()).filter(Boolean))
                }
              } else if (typeof v === 'string' && v.trim()) {
                // Could be a URLRegex pattern
                urlRegexPatterns.push(v.trim())
              }
            })
          } else if (typeof val === 'string' && val.trim()) {
            // Could be a URLRegex pattern
            urlRegexPatterns.push(val.trim())
          }
        })
      }
      
      // Remove duplicates
      const uniqueUrlRegex = Array.from(new Set(urlRegexPatterns))
      const uniqueDstIps = Array.from(new Set(dstIps))
      
      if (uniqueUrlRegex.length === 0 && uniqueDstIps.length === 0) {
        return <span className="text-gray-400 italic">No domain list</span>
      }
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '400px', maxHeight: '250px', overflowY: 'auto' }}>
          {uniqueUrlRegex.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">URL Regex:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {uniqueUrlRegex.map((pattern, idx) => (
                  <div key={`regex-${idx}`} className="flex items-start gap-2 text-xs">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold font-mono flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-gray-900 font-mono break-all text-xs leading-relaxed">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {uniqueDstIps.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">Destination IPs:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {uniqueDstIps.map((ip, idx) => (
                  <div key={`ip-${idx}`} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-gray-900 font-mono break-words">{ip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    const getDomainListText = (dl) => {
      if (!dl) return ''
      const urlRegexPatterns = []
      const dstIps = []
      if (Array.isArray(dl)) {
        dl.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.URLRegex) {
              const regexArray = Array.isArray(item.URLRegex) ? item.URLRegex : [item.URLRegex]
              urlRegexPatterns.push(...regexArray.filter(Boolean).map(r => typeof r === 'string' ? r.trim() : String(r).trim()).filter(Boolean))
            }
            if (item.DstIp || item.DstIP || item.dstIp) {
              const ipArray = Array.isArray(item.DstIp || item.DstIP || item.dstIp) 
                ? (item.DstIp || item.DstIP || item.dstIp) 
                : [item.DstIp || item.DstIP || item.dstIp]
              dstIps.push(...ipArray.filter(Boolean).map(ip => typeof ip === 'string' ? ip.trim() : String(ip).trim()).filter(Boolean))
            }
          }
        })
      } else if (typeof dl === 'object') {
        if (dl.URLRegex) {
          const regexArray = Array.isArray(dl.URLRegex) ? dl.URLRegex : [dl.URLRegex]
          urlRegexPatterns.push(...regexArray.filter(Boolean).map(r => typeof r === 'string' ? r.trim() : String(r).trim()).filter(Boolean))
        }
        if (dl.DstIp || dl.DstIP || dl.dstIp) {
          const ipArray = Array.isArray(dl.DstIp || dl.DstIP || dl.dstIp) 
            ? (dl.DstIp || dl.DstIP || dl.dstIp) 
            : [dl.DstIp || dl.DstIP || dl.dstIp]
          dstIps.push(...ipArray.filter(Boolean).map(ip => typeof ip === 'string' ? ip.trim() : String(ip).trim()).filter(Boolean))
        }
      }
      return [...Array.from(new Set(urlRegexPatterns)), ...Array.from(new Set(dstIps))].join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Desc || fields.Description, fields.NewName,
        fields.Enabled, fields.HttpsDecrypt, fields.CertValidation,
        fields.VirusScan, fields.ZeroDayProtection, fields.PolicyCheck,
        getDomainListText(fields.DomainList), fields.IsDefault
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="filter_alt" className="text-gray-600 text-base" />
          <span>Web Filter Exceptions</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Web Filter Exceptions"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  New Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Enabled
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  HTTPS Decrypt
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  Cert Validation
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Virus Scan
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
                <th className="sophos-table-header">
                  Zero Day Protection
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 8)} />
                </th>
                <th className="sophos-table-header">
                  Policy Check
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 9)} />
                </th>
                <th className="sophos-table-header">
                  Domain List
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 10)} />
                </th>
                <th className="sophos-table-header">
                  Is Default
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 11)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`webfilter-exception-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Desc || fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.NewName || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Enabled === 'on' || fields.Enabled === 'ON' || fields.Enabled === 'Yes' || fields.Enabled === 'Enable'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Enabled || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.HttpsDecrypt === 'on' || fields.HttpsDecrypt === 'ON' || fields.HttpsDecrypt === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.HttpsDecrypt || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.CertValidation === 'on' || fields.CertValidation === 'ON' || fields.CertValidation === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.CertValidation || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.VirusScan === 'on' || fields.VirusScan === 'ON' || fields.VirusScan === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.VirusScan || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.ZeroDayProtection === 'on' || fields.ZeroDayProtection === 'ON' || fields.ZeroDayProtection === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.ZeroDayProtection || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.PolicyCheck === 'on' || fields.PolicyCheck === 'ON' || fields.PolicyCheck === 'Yes'
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.PolicyCheck || 'off'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '450px' }}>
                      {formatDomainList(fields.DomainList)}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.IsDefault === 'yes' || fields.IsDefault === 'Yes' || fields.IsDefault === 'on' || fields.IsDefault === 'ON'
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.IsDefault || 'no'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const IPSPolicyTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('ips-policies', 3)

    // Format RuleList
    const formatRuleList = (ruleList) => {
      if (!ruleList) return <span className="text-gray-400 italic">No rules</span>
      
      const rules = []
      
      // Handle array of Rule entries
      let ruleArray = []
      if (ruleList.Rule) {
        ruleArray = Array.isArray(ruleList.Rule) ? ruleList.Rule : [ruleList.Rule]
      } else if (Array.isArray(ruleList)) {
        ruleArray = ruleList
      }
      
      ruleArray.forEach((rule, idx) => {
        if (rule && typeof rule === 'object') {
          // Extract categories
          const categories = []
          if (rule.CategoryList && rule.CategoryList.Category) {
            const catArray = Array.isArray(rule.CategoryList.Category) 
              ? rule.CategoryList.Category 
              : [rule.CategoryList.Category]
            categories.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
          }
          
          // Extract severity
          const severities = []
          if (rule.SeverityList && rule.SeverityList.Severity) {
            const sevArray = Array.isArray(rule.SeverityList.Severity) 
              ? rule.SeverityList.Severity 
              : [rule.SeverityList.Severity]
            severities.push(...sevArray.filter(Boolean).map(s => String(s).trim()).filter(Boolean))
          }
          
          // Extract targets
          const targets = []
          if (rule.TargetList && rule.TargetList.Target) {
            const targetArray = Array.isArray(rule.TargetList.Target) 
              ? rule.TargetList.Target 
              : [rule.TargetList.Target]
            targets.push(...targetArray.filter(Boolean).map(t => String(t).trim()).filter(Boolean))
          }
          
          // Extract platforms
          const platforms = []
          if (rule.PlatformList && rule.PlatformList.Platform) {
            const platformArray = Array.isArray(rule.PlatformList.Platform) 
              ? rule.PlatformList.Platform 
              : [rule.PlatformList.Platform]
            platforms.push(...platformArray.filter(Boolean).map(p => String(p).trim()).filter(Boolean))
          }
          
          rules.push({
            index: idx + 1,
            ruleName: rule.RuleName || '-',
            signatureSelectionType: rule.SignaturSelectionType || '-',
            categories,
            severities,
            targets,
            platforms,
            ruleType: rule.RuleType || '-',
            action: rule.Action || '-',
            smartFilter: rule.SmartFilter || '-'
          })
        }
      })
      
      if (rules.length === 0) return <span className="text-gray-400 italic">No rules</span>
      
      return (
        <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>#</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Rule Name</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Signature Selection</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Categories</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Severity</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Target</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Platform</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Rule Type</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Action</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Smart Filter</th>
            </tr>
          </thead>
          <tbody>
          {rules.map((rule, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#1f2937', fontFamily: 'monospace', borderRight: '1px solid #e5e7eb' }}>{rule.index}</td>
                <td style={{ padding: '0.5rem', color: '#111827', fontWeight: 500, borderRight: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{rule.ruleName}</td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb' }}>{rule.signatureSelectionType}</td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  {rule.categories.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {rule.categories.map((cat, catIdx) => (
                        <span key={catIdx} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.625rem', display: 'inline-block' }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  {rule.severities.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {rule.severities.map((sev, sevIdx) => (
                        <span key={sevIdx} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#f3e8ff', color: '#7c3aed', borderRadius: '0.25rem', fontSize: '0.625rem', display: 'inline-block' }}>
                          {sev}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  {rule.targets.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {rule.targets.map((target, targetIdx) => (
                        <span key={targetIdx} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.25rem', fontSize: '0.625rem', display: 'inline-block' }}>
                          {target}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  {rule.platforms.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {rule.platforms.map((platform, platformIdx) => (
                        <span key={platformIdx} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#fed7aa', color: '#9a3412', borderRadius: '0.25rem', fontSize: '0.625rem', display: 'inline-block' }}>
                          {platform}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb' }}>{rule.ruleType}</td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.action === 'Recommended' || rule.action === 'recommended'
                      ? '#dbeafe'
                      : rule.action === 'Block' || rule.action === 'block'
                      ? '#fee2e2'
                      : '#f3f4f6',
                    color: rule.action === 'Recommended' || rule.action === 'recommended'
                      ? '#1e40af'
                      : rule.action === 'Block' || rule.action === 'block'
                      ? '#991b1b'
                      : '#4b5563'
                  }}>
                    {rule.action}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', color: '#374151' }}>{rule.smartFilter && rule.smartFilter !== '-' ? rule.smartFilter : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const getRuleListText = (rl) => {
      if (!rl) return ''
      let ruleArray = []
      if (rl.Rule) {
        ruleArray = Array.isArray(rl.Rule) ? rl.Rule : [rl.Rule]
      } else if (Array.isArray(rl)) {
        ruleArray = rl
      }
      return ruleArray.filter(Boolean).map(rule => {
        if (typeof rule === 'object') {
          const parts = [
            rule.RuleName, rule.SignaturSelectionType, rule.RuleType, rule.Action, rule.SmartFilter
          ]
          if (rule.CategoryList?.Category) {
            const catArray = Array.isArray(rule.CategoryList.Category) ? rule.CategoryList.Category : [rule.CategoryList.Category]
            parts.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
          }
          if (rule.SeverityList?.Severity) {
            const sevArray = Array.isArray(rule.SeverityList.Severity) ? rule.SeverityList.Severity : [rule.SeverityList.Severity]
            parts.push(...sevArray.filter(Boolean).map(s => String(s).trim()).filter(Boolean))
          }
          if (rule.TargetList?.Target) {
            const targetArray = Array.isArray(rule.TargetList.Target) ? rule.TargetList.Target : [rule.TargetList.Target]
            parts.push(...targetArray.filter(Boolean).map(t => String(t).trim()).filter(Boolean))
          }
          if (rule.PlatformList?.Platform) {
            const platformArray = Array.isArray(rule.PlatformList.Platform) ? rule.PlatformList.Platform : [rule.PlatformList.Platform]
            parts.push(...platformArray.filter(Boolean).map(p => String(p).trim()).filter(Boolean))
          }
          return parts.filter(Boolean).join(' ')
        }
        return String(rule)
      }).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, getRuleListText(fields.RuleList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="security" className="text-gray-600 text-base" />
          <span>IPS Policies</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search IPS Policies"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <>
                  <tr key={`ipspolicy-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    </tr>
                    <tr key={`ipspolicy-rules-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                      {formatRuleList(fields.RuleList)}
                        </div>
                    </td>
                  </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const UserGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('user-groups', 1)

    // Format GroupDetail entries as a table
    const formatGroupDetails = (groupDetails) => {
      if (!groupDetails) return <span className="text-gray-400 italic">No group details</span>
      
      const details = []
      
      // Handle different structures
      if (Array.isArray(groupDetails)) {
        details.push(...groupDetails.filter(d => typeof d === 'object' && d !== null))
      } else if (typeof groupDetails === 'object' && groupDetails.GroupDetail) {
        const detailArray = Array.isArray(groupDetails.GroupDetail) ? groupDetails.GroupDetail : [groupDetails.GroupDetail]
        details.push(...detailArray.filter(d => typeof d === 'object' && d !== null))
      } else if (typeof groupDetails === 'object') {
        details.push(groupDetails)
      }
      
      if (details.length === 0) return <span className="text-gray-400 italic">No group details</span>
      
      return (
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table className="min-w-full divide-y divide-gray-200" style={{ fontSize: '0.75rem' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '50px' }}>#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Group Type</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>After</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>QoS Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>Quarantine Digest</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>SSL VPN Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>Clientless Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>Surfing Quota Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '130px' }}>Access Time Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '130px' }}>Data Transfer Policy</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>MAC Binding</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '80px' }}>L2TP</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '80px' }}>PPTP</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>Sophos Connect Client</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>Login Restriction</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {details.map((detail, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2 text-xs">
                    {detail.GroupType ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.GroupType === 'Normal' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {detail.GroupType}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.Name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-700 italic" style={{ wordBreak: 'break-word' }}>
                    {detail.After && typeof detail.After === 'object' && detail.After.Name ? detail.After.Name : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.QoSPolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs">
                    {detail.QuarantineDigest !== undefined ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.QuarantineDigest === 'Enable' || detail.QuarantineDigest === 'ON' || detail.QuarantineDigest === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.QuarantineDigest || 'Disable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.SSLVPNPolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.ClientlessPolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.SurfingQuotaPolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.AccessTimePolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.DataTransferPolicy || '-'}</td>
                  <td className="px-3 py-2 text-xs">
                    {detail.MACBinding !== undefined ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.MACBinding === 'Enable' || detail.MACBinding === 'ON' || detail.MACBinding === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.MACBinding || 'Disable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {detail.L2TP !== undefined ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.L2TP === 'Enable' || detail.L2TP === 'ON' || detail.L2TP === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.L2TP || 'Disable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {detail.PPTP !== undefined ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.PPTP === 'Enable' || detail.PPTP === 'ON' || detail.PPTP === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.PPTP || 'Disable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {detail.SophosConnectClient !== undefined ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        detail.SophosConnectClient === 'Enable' || detail.SophosConnectClient === 'ON' || detail.SophosConnectClient === 'Yes'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.SophosConnectClient || 'Disable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900" style={{ wordBreak: 'break-word' }}>{detail.LoginRestriction || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    const getGroupDetailsText = (gd) => {
      if (!gd) return ''
      const details = []
      if (Array.isArray(gd)) {
        details.push(...gd.filter(d => typeof d === 'object' && d !== null))
      } else if (gd?.GroupDetail) {
        const detailArray = Array.isArray(gd.GroupDetail) ? gd.GroupDetail : [gd.GroupDetail]
        details.push(...detailArray.filter(d => typeof d === 'object' && d !== null))
      } else if (typeof gd === 'object') {
        details.push(gd)
      }
      return details.map(d => [
        d.GroupType, d.Name, d.After?.Name, d.QoSPolicy, d.QuarantineDigest,
        d.SSLVPNPolicy, d.ClientlessPolicy, d.SurfingQuotaPolicy, d.AccessTimePolicy,
        d.DataTransferPolicy, d.MACBinding, d.L2TP, d.PPTP, d.SophosConnectClient, d.LoginRestriction
      ].filter(Boolean).join(' ')).join(' ')
    }
    
    // Calculate total GroupDetails count
    const getGroupDetailsCount = (groupDetails) => {
      if (!groupDetails) return 0
      const details = []
      if (Array.isArray(groupDetails)) {
        details.push(...groupDetails.filter(d => typeof d === 'object' && d !== null))
      } else if (typeof groupDetails === 'object' && groupDetails.GroupDetail) {
        const detailArray = Array.isArray(groupDetails.GroupDetail) ? groupDetails.GroupDetail : [groupDetails.GroupDetail]
        details.push(...detailArray.filter(d => typeof d === 'object' && d !== null))
      } else if (typeof groupDetails === 'object') {
        details.push(groupDetails)
      }
      return details.length
    }

    const totalGroupDetailsCount = items.reduce((acc, item) => {
      const fields = item.fields || {}
      return acc + getGroupDetailsCount(fields.GroupDetail)
    }, 0)
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = getGroupDetailsText(fields.GroupDetail)
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    const filteredGroupDetailsCount = filteredItems.reduce((acc, item) => {
      const fields = item.fields || {}
      return acc + getGroupDetailsCount(fields.GroupDetail)
    }, 0)

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="group" className="text-gray-600 text-base" />
          <span>User Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredGroupDetailsCount}{filteredGroupDetailsCount !== totalGroupDetailsCount ? `/${totalGroupDetailsCount}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search User Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header">
                  Group Details
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`user-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '1200px' }}>
                      {formatGroupDetails(fields.GroupDetail)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ApplicationClassificationBatchAssignmentTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('app-class-batch-assignment', 3)

    // Extract all ClassAssignment entries from ClassAssignmentList
    const getClassAssignments = (classAssignmentList) => {
      if (!classAssignmentList) return []
      const assignments = []
      if (Array.isArray(classAssignmentList)) {
        assignments.push(...classAssignmentList.filter(a => typeof a === 'object' && a !== null))
      } else if (typeof classAssignmentList === 'object' && classAssignmentList.ClassAssignment) {
        const assignmentArray = Array.isArray(classAssignmentList.ClassAssignment) 
          ? classAssignmentList.ClassAssignment 
          : [classAssignmentList.ClassAssignment]
        assignments.push(...assignmentArray.filter(a => typeof a === 'object' && a !== null))
      } else if (typeof classAssignmentList === 'object') {
        assignments.push(classAssignmentList)
      }
      return assignments
    }

    // Calculate total ClassAssignment count
    const totalClassAssignmentCount = items.reduce((acc, item) => {
      const fields = item.fields || {}
      return acc + getClassAssignments(fields.ClassAssignmentList).length
    }, 0)

    // Format ClassAssignmentList as a table
    const formatClassAssignments = (classAssignmentList) => {
      const assignments = getClassAssignments(classAssignmentList)
      
      if (assignments.length === 0) return <span className="text-gray-400 italic">No assignments</span>
      
      return (
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table className="min-w-full divide-y divide-gray-200" style={{ fontSize: '0.75rem' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '50px' }}>#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '250px' }}>Application</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>Class</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900" style={{ wordBreak: 'break-word' }}>
                    {assignment.app || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {assignment.class ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        assignment.class === 'Sanctioned' 
                          ? 'bg-green-100 text-green-700' 
                          : assignment.class === 'Tolerated'
                            ? 'bg-yellow-100 text-yellow-700'
                            : assignment.class === 'Unsanctioned'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.class}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    const getClassAssignmentsText = (cal) => {
      const assignments = getClassAssignments(cal)
      return assignments.map(a => [a.app, a.class].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, getClassAssignmentsText(fields.ClassAssignmentList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    const filteredClassAssignmentCount = filteredItems.reduce((acc, item) => {
      const fields = item.fields || {}
      return acc + getClassAssignments(fields.ClassAssignmentList).length
    }, 0)

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="apps" className="text-gray-600 text-base" />
          <span>Application Classification Assignments</span>
          <span className="text-gray-500 font-normal">
            ({filteredClassAssignmentCount}{filteredClassAssignmentCount !== totalClassAssignmentCount ? `/${totalClassAssignmentCount}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search applications or classes..."
            ariaLabel="Search Application Classification Assignments"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header" style={{ minWidth: '150px' }}>
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Class Assignments
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`app-class-batch-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-900 align-top" style={{ wordBreak: 'break-word' }}>
                      {fields.Name || '-'}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '500px' }}>
                      {formatClassAssignments(fields.ClassAssignmentList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const WebFilterPolicyTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('web-filter-policies', 10)

    // Format RuleList
    const formatRuleList = (ruleList) => {
      if (!ruleList) return <span className="text-gray-400 italic">No rules</span>
      
      const rules = []
      
      // Handle array of Rule entries
      let ruleArray = []
      if (ruleList.Rule) {
        ruleArray = Array.isArray(ruleList.Rule) ? ruleList.Rule : [ruleList.Rule]
      } else if (Array.isArray(ruleList)) {
        ruleArray = ruleList
      }
      
      ruleArray.forEach((rule, idx) => {
        if (rule && typeof rule === 'object') {
          // Extract categories from rule
          const categories = []
          if (rule.CategoryList) {
            if (rule.CategoryList.Category) {
              const catArray = Array.isArray(rule.CategoryList.Category) 
                ? rule.CategoryList.Category 
                : [rule.CategoryList.Category]
              catArray.forEach(c => {
                if (c && typeof c === 'object') {
                  const id = c.ID || c.Id || c.id || '-'
                  const type = c.type || c.Type || '-'
                  categories.push({ id, type })
                } else if (typeof c === 'string') {
                  categories.push({ id: c, type: '-' })
                }
              })
            }
          }
          
          // Extract exceptions
          const exceptions = []
          if (rule.ExceptionList && rule.ExceptionList.FileTypeCategory) {
            const fileTypes = Array.isArray(rule.ExceptionList.FileTypeCategory) 
              ? rule.ExceptionList.FileTypeCategory 
              : [rule.ExceptionList.FileTypeCategory]
            exceptions.push(...fileTypes.filter(Boolean).map(ft => String(ft).trim()).filter(Boolean))
          }
          
          rules.push({
            index: idx + 1,
            categories,
            exceptions,
            httpAction: rule.HTTPAction || '-',
            httpsAction: rule.HTTPSAction || '-',
            followHTTP: rule.FollowHTTPAction === '1' || rule.FollowHTTPAction === 1,
            schedule: rule.Schedule || '-',
            policyRuleEnabled: rule.PolicyRuleEnabled === '1' || rule.PolicyRuleEnabled === 1,
            cclRuleEnabled: rule.CCLRuleEnabled === '1' || rule.CCLRuleEnabled === 1
          })
        }
      })
      
      if (rules.length === 0) return <span className="text-gray-400 italic">No rules</span>
      
      return (
        <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>#</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Categories</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>HTTP Action</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>HTTPS Action</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Follow HTTP</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Exceptions</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Schedule</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Policy Rule</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>CCL Rule</th>
            </tr>
          </thead>
          <tbody>
          {rules.map((rule, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#1f2937', fontFamily: 'monospace', borderRight: '1px solid #e5e7eb' }}>{rule.index}</td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  {rule.categories.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {rule.categories.map((cat, catIdx) => (
                        <span key={catIdx} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.625rem', display: 'inline-block' }}>
                          {cat.id} ({cat.type})
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.httpAction === 'Deny' || rule.httpAction === 'deny' ? '#fee2e2' : '#d1fae5',
                    color: rule.httpAction === 'Deny' || rule.httpAction === 'deny' ? '#991b1b' : '#065f46'
                  }}>
                    {rule.httpAction}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.httpsAction === 'Deny' || rule.httpsAction === 'deny' ? '#fee2e2' : '#d1fae5',
                    color: rule.httpsAction === 'Deny' || rule.httpsAction === 'deny' ? '#991b1b' : '#065f46'
                  }}>
                    {rule.httpsAction}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.followHTTP ? '#d1fae5' : '#f3f4f6',
                    color: rule.followHTTP ? '#065f46' : '#4b5563'
                  }}>
                    {rule.followHTTP ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb', wordBreak: 'break-word' }}>
                  {rule.exceptions.length > 0 ? rule.exceptions.join(', ') : '-'}
                </td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb' }}>{rule.schedule}</td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.policyRuleEnabled ? '#d1fae5' : '#f3f4f6',
                    color: rule.policyRuleEnabled ? '#065f46' : '#4b5563'
                  }}>
                    {rule.policyRuleEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: rule.cclRuleEnabled ? '#d1fae5' : '#f3f4f6',
                    color: rule.cclRuleEnabled ? '#065f46' : '#4b5563'
                  }}>
                    {rule.cclRuleEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const getRuleListText = (rl) => {
      if (!rl) return ''
      let ruleArray = []
      if (rl.Rule) {
        ruleArray = Array.isArray(rl.Rule) ? rl.Rule : [rl.Rule]
      } else if (Array.isArray(rl)) {
        ruleArray = rl
      }
      return ruleArray.filter(Boolean).map(rule => {
        if (typeof rule === 'object') {
          const parts = [rule.HTTPAction, rule.HTTPSAction, rule.Schedule]
          if (rule.CategoryList?.Category) {
            const catArray = Array.isArray(rule.CategoryList.Category) ? rule.CategoryList.Category : [rule.CategoryList.Category]
            catArray.forEach(c => {
              if (c && typeof c === 'object') parts.push(c.ID || c.Id || c.id || '', c.type || c.Type || '')
              else if (typeof c === 'string') parts.push(c)
            })
          }
          if (rule.ExceptionList?.FileTypeCategory) {
            const excArray = Array.isArray(rule.ExceptionList.FileTypeCategory) ? rule.ExceptionList.FileTypeCategory : [rule.ExceptionList.FileTypeCategory]
            parts.push(...excArray.filter(Boolean).map(ft => String(ft).trim()).filter(Boolean))
          }
          return parts.filter(Boolean).join(' ')
        }
        return String(rule)
      }).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Description, fields.DefaultAction, fields.EnableReporting,
        fields.QuotaLimit, fields.YoutubeFilterEnabled, fields.EnforceSafeSearch,
        fields.Office365Enabled, fields.XFFEnabled, getRuleListText(fields.RuleList)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="filter_alt" className="text-gray-600 text-base" />
          <span>Web Filter Policies</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Web Filter Policies"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Default Action
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Enable Reporting
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  Quota Limit
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  Youtube Filter
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Enforce Safe Search
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
                <th className="sophos-table-header">
                  Office365 Enabled
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 8)} />
                </th>
                <th className="sophos-table-header">
                  XFF Enabled
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 9)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <>
                  <tr key={`webfilterpolicy-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.DefaultAction === 'Allow' || fields.DefaultAction === 'allow'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {fields.DefaultAction || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.EnableReporting === 'Enable' || fields.EnableReporting === '1' || fields.EnableReporting === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.EnableReporting || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.QuotaLimit || '-'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.YoutubeFilterEnabled === '1' || fields.YoutubeFilterEnabled === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.YoutubeFilterEnabled === '1' || fields.YoutubeFilterEnabled === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.EnforceSafeSearch === '1' || fields.EnforceSafeSearch === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.EnforceSafeSearch === '1' || fields.EnforceSafeSearch === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Office365Enabled === '1' || fields.Office365Enabled === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.Office365Enabled === '1' || fields.Office365Enabled === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.XFFEnabled === '1' || fields.XFFEnabled === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.XFFEnabled === '1' || fields.XFFEnabled === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    </tr>
                    <tr key={`webfilterpolicy-rules-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={10} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                      {formatRuleList(fields.RuleList)}
                        </div>
                    </td>
                  </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AntiSpamRuleTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('anti-spam-rules', 4)

    // Format rule details
    const formatRuleDetails = (fields) => {
      const details = []
      
      // RecipientList
      if (fields.RecipientList) {
        const recipientList = fields.RecipientList
        const recipientAction = recipientList.Action || '-'
        const recipientEmail = recipientList.RecipientEmail || '-'
        details.push({
          label: 'Recipient List',
          action: recipientAction,
          value: recipientEmail
        })
      }
      
      // SenderEmailList
      if (fields.SenderEmailList) {
        const senderList = fields.SenderEmailList
        const senderAction = senderList.Action || '-'
        const senderEmail = senderList.SenderEmail || '-'
        details.push({
          label: 'Sender Email List',
          action: senderAction,
          value: senderEmail
        })
      }
      
      // SMTPAction
      if (fields.SMTPAction) {
        const smtpAction = fields.SMTPAction
        const smtpActionType = smtpAction.Action || '-'
        const smtpParam = smtpAction.ActionParameter || '-'
        const quarantine = smtpAction.Quarantine || '-'
        details.push({
          label: 'SMTP Action',
          action: smtpActionType,
          value: smtpParam,
          quarantine: quarantine
        })
      }
      
      // POPIMAPAction
      if (fields.POPIMAPAction) {
        const popAction = fields.POPIMAPAction
        const popActionType = popAction.Action || '-'
        const popParam = popAction.ActionParameter || '-'
        details.push({
          label: 'POP/IMAP Action',
          action: popActionType,
          value: popParam
        })
      }
      
      if (details.length === 0) return <span className="text-gray-400 italic">No details</span>
      
      return (
        <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>#</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Type</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Action</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Value/Parameter</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Quarantine</th>
            </tr>
          </thead>
          <tbody>
            {details.map((detail, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#1f2937', fontFamily: 'monospace', borderRight: '1px solid #e5e7eb' }}>{idx + 1}</td>
                <td style={{ padding: '0.5rem', color: '#374151', fontWeight: 500, borderRight: '1px solid #e5e7eb' }}>{detail.label}</td>
                <td style={{ padding: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  }}>
                    {detail.action}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb', wordBreak: 'break-word' }}>
                  {detail.value !== '-' ? detail.value : '-'}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {detail.quarantine ? (
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      backgroundColor: detail.quarantine === 'Enable' || detail.quarantine === '1' ? '#d1fae5' : '#f3f4f6',
                      color: detail.quarantine === 'Enable' || detail.quarantine === '1' ? '#065f46' : '#4b5563'
                    }}>
                      {detail.quarantine}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const getRuleDetailsText = (fields) => {
      const parts = []
      if (fields.RecipientList) {
        parts.push('RecipientList', fields.RecipientList.Action || '', fields.RecipientList.RecipientEmail || '')
      }
      if (fields.SenderEmailList) {
        parts.push('SenderEmailList', fields.SenderEmailList.Action || '', fields.SenderEmailList.SenderEmail || '')
      }
      if (fields.SMTPAction) {
        parts.push('SMTPAction', fields.SMTPAction.Action || '', fields.SMTPAction.ActionParameter || '', fields.SMTPAction.Quarantine || '')
      }
      if (fields.POPIMAPAction) {
        parts.push('POPIMAPAction', fields.POPIMAPAction.Action || '', fields.POPIMAPAction.ActionParameter || '')
      }
      return parts.filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const afterName = fields.After?.Name || ''
      const markSpamCondition = fields.MarkSpamIf?.Condition || ''
      const markSpamMatch = fields.MarkSpamIf?.MatchIs || ''
      const allText = [
        fields.Name, afterName, markSpamCondition, markSpamMatch, getRuleDetailsText(fields)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="email" className="text-gray-600 text-base" />
          <span>Anti-Spam Rules</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Anti-Spam Rules"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  After
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Mark Spam If
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const afterName = fields.After?.Name || '-'
                const markSpamCondition = fields.MarkSpamIf?.Condition || '-'
                const markSpamMatch = fields.MarkSpamIf?.MatchIs || '-'
                const markSpamIf = markSpamCondition !== '-' && markSpamMatch !== '-'
                  ? `${markSpamCondition}: ${markSpamMatch}`
                  : markSpamCondition !== '-' ? markSpamCondition : '-'
                
                return (
                  <>
                    <tr key={`antispamrule-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '200px'
                      }}>{fields.Name || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '200px'
                      }}>{afterName}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '300px'
                      }}>{markSpamIf}</td>
                    </tr>
                    <tr key={`antispamrule-details-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                          {formatRuleDetails(fields)}
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const WebFilterURLGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('web-filter-url-groups', 4)

    // Format URL list
    const formatURLList = (urlList) => {
      if (!urlList) return <span className="text-gray-400 italic">No URLs</span>
      
      const urls = []
      
      // Handle different structures
      if (urlList.URL) {
        const urlArray = Array.isArray(urlList.URL) ? urlList.URL : [urlList.URL]
        urls.push(...urlArray.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
      } else if (Array.isArray(urlList)) {
        urls.push(...urlList.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
      }
      
      if (urls.length === 0) return <span className="text-gray-400 italic">No URLs</span>
      
      return (
        <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb', width: '60px' }}>#</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>URL</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((url, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: '#1f2937', fontFamily: 'monospace', borderRight: '1px solid #e5e7eb' }}>{idx + 1}</td>
                <td style={{ padding: '0.5rem', color: '#374151', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.7rem' }}>{url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const getURLListText = (ul) => {
      if (!ul) return ''
      const urls = []
      if (ul.URL) {
        const urlArray = Array.isArray(ul.URL) ? ul.URL : [ul.URL]
        urls.push(...urlArray.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
      } else if (Array.isArray(ul)) {
        urls.push(...ul.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
      }
      return urls.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.Description, fields.IsDefault, getURLListText(fields.URLlist)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="link" className="text-gray-600 text-base" />
          <span>Web Filter URL Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Web Filter URL Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Description
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Is Default
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <>
                    <tr key={`webfilterurlgroup-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '200px'
                      }}>{fields.Name || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '300px'
                      }}>{fields.Description || '-'}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          fields.IsDefault === 'Yes' || fields.IsDefault === '1' || fields.IsDefault === 1
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {fields.IsDefault === 'Yes' || fields.IsDefault === '1' || fields.IsDefault === 1 ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    <tr key={`webfilterurlgroup-urls-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                          {formatURLList(fields.URLlist)}
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const SyslogServerTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('syslog-servers', 8)

    // Format LogSettings
    const formatLogSettings = (logSettings) => {
      if (!logSettings || typeof logSettings !== 'object') return <span className="text-gray-400 italic">No log settings</span>
      
      const settings = []
      
      // Helper to process a settings group
      const processGroup = (groupName, groupData) => {
        if (!groupData || typeof groupData !== 'object') return
        
        const entries = Object.entries(groupData).filter(([key, value]) => 
          key && value !== undefined && value !== null
        )
        
        if (entries.length === 0) return
        
        entries.forEach(([key, value]) => {
          settings.push({
            category: groupName,
            setting: key.replace(/([A-Z])/g, ' $1').trim(),
            value: value === 'Enable' || value === '1' || value === 1 ? 'Enable' : 'Disable'
          })
        })
      }
      
      // Process all log setting groups
      if (logSettings.SecurityPolicy) processGroup('Security Policy', logSettings.SecurityPolicy)
      if (logSettings.IPS) processGroup('IPS', logSettings.IPS)
      if (logSettings.AntiVirus) processGroup('AntiVirus', logSettings.AntiVirus)
      if (logSettings.AntiSpam) processGroup('AntiSpam', logSettings.AntiSpam)
      if (logSettings.ContentFiltering) processGroup('Content Filtering', logSettings.ContentFiltering)
      if (logSettings.Events) processGroup('Events', logSettings.Events)
      if (logSettings.WebServerProtection) processGroup('Web Server Protection', logSettings.WebServerProtection)
      if (logSettings.ATP) processGroup('ATP', logSettings.ATP)
      if (logSettings.Heartbeat) processGroup('Heartbeat', logSettings.Heartbeat)
      if (logSettings.ZeroDayProtection) processGroup('Zero Day Protection', logSettings.ZeroDayProtection)
      if (logSettings.SDWAN) processGroup('SDWAN', logSettings.SDWAN)
      
      if (settings.length === 0) return <span className="text-gray-400 italic">No log settings</span>
      
      return (
        <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Category</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb' }}>Setting</th>
              <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '0.5rem', color: '#374151', fontWeight: 500, borderRight: '1px solid #e5e7eb' }}>{setting.category}</td>
                <td style={{ padding: '0.5rem', color: '#374151', borderRight: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{setting.setting}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    backgroundColor: setting.value === 'Enable' ? '#d1fae5' : '#f3f4f6',
                    color: setting.value === 'Enable' ? '#065f46' : '#4b5563'
                  }}>
                    {setting.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    const getLogSettingsText = (ls) => {
      if (!ls || typeof ls !== 'object') return ''
      const parts = []
      const processGroup = (groupName, groupData) => {
        if (!groupData || typeof groupData !== 'object') return
        Object.entries(groupData).forEach(([key, value]) => {
          if (key && value !== undefined && value !== null) {
            parts.push(groupName, key.replace(/([A-Z])/g, ' $1').trim(), value === 'Enable' || value === '1' || value === 1 ? 'Enable' : 'Disable')
          }
        })
      }
      if (ls.SecurityPolicy) processGroup('SecurityPolicy', ls.SecurityPolicy)
      if (ls.IPS) processGroup('IPS', ls.IPS)
      if (ls.AntiVirus) processGroup('AntiVirus', ls.AntiVirus)
      if (ls.AntiSpam) processGroup('AntiSpam', ls.AntiSpam)
      if (ls.ContentFiltering) processGroup('ContentFiltering', ls.ContentFiltering)
      if (ls.Events) processGroup('Events', ls.Events)
      if (ls.WebServerProtection) processGroup('WebServerProtection', ls.WebServerProtection)
      if (ls.ATP) processGroup('ATP', ls.ATP)
      if (ls.Heartbeat) processGroup('Heartbeat', ls.Heartbeat)
      if (ls.ZeroDayProtection) processGroup('ZeroDayProtection', ls.ZeroDayProtection)
      if (ls.SDWAN) processGroup('SDWAN', ls.SDWAN)
      return parts.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.ServerAddress, fields.Port, fields.EnableSecureConnection,
        fields.Facility, fields.SeverityLevel, fields.Format, getLogSettingsText(fields.LogSettings)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="dns" className="text-gray-600 text-base" />
          <span>Syslog Servers</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Syslog Servers"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Server Address
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Port
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
                <th className="sophos-table-header">
                  Secure Connection
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 4)} />
                </th>
                <th className="sophos-table-header">
                  Facility
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 5)} />
                </th>
                <th className="sophos-table-header">
                  Severity Level
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 6)} />
                </th>
                <th className="sophos-table-header">
                  Format
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 7)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <>
                    <tr key={`syslogserver-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '200px'
                      }}>{fields.Name || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 font-mono" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        maxWidth: '150px'
                      }}>{fields.ServerAddress || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 font-mono">{fields.Port || '-'}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          fields.EnableSecureConnection === 'Enable' || fields.EnableSecureConnection === '1' || fields.EnableSecureConnection === 1
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {fields.EnableSecureConnection === 'Enable' || fields.EnableSecureConnection === '1' || fields.EnableSecureConnection === 1 ? 'Enable' : 'Disable'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700">{fields.Facility || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700">{fields.SeverityLevel || '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 font-mono">{fields.Format || '-'}</td>
                    </tr>
                    {fields.LogSettings && (
                      <tr key={`syslogserver-settings-${it.transactionId}-${idx}`} className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-3" style={{ padding: '1rem' }}>
                          <div style={{ width: '100%', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                            {formatLogSettings(fields.LogSettings)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const MessagesTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('messages', 2)

    // Format message details
    const formatMessageDetails = (fields) => {
      const messageGroups = []
      
      // SMTP messages
      if (fields.SMTP && typeof fields.SMTP === 'object') {
        const smtpMessages = Object.entries(fields.SMTP).filter(([key, value]) => 
          key && value !== undefined && value !== null && value !== ''
        )
        if (smtpMessages.length > 0) {
          messageGroups.push({
            type: 'SMTP',
            messages: smtpMessages.map(([key, value]) => ({
              name: key.replace(/([A-Z])/g, ' $1').trim(),
              value: String(value).trim()
            }))
          })
        }
      }
      
      // Administration messages
      if (fields.Administration && typeof fields.Administration === 'object') {
        const adminMessages = Object.entries(fields.Administration).filter(([key, value]) => 
          key && value !== undefined && value !== null && value !== ''
        )
        if (adminMessages.length > 0) {
          messageGroups.push({
            type: 'Administration',
            messages: adminMessages.map(([key, value]) => ({
              name: key.replace(/([A-Z])/g, ' $1').trim(),
              value: String(value).trim()
            }))
          })
        }
      }
      
      // SMS Customization
      if (fields.SMSCustomization && typeof fields.SMSCustomization === 'object') {
        const smsMessages = Object.entries(fields.SMSCustomization).filter(([key, value]) => 
          key && value !== undefined && value !== null && value !== ''
        )
        if (smsMessages.length > 0) {
          messageGroups.push({
            type: 'SMS Customization',
            messages: smsMessages.map(([key, value]) => ({
              name: key.replace(/([A-Z])/g, ' $1').trim(),
              value: String(value).trim()
            }))
          })
        }
      }
      
      if (messageGroups.length === 0) return <span className="text-gray-400 italic">No messages</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messageGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={{ marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid #e5e7eb' }}>
                {group.type}
              </h4>
              <table className="w-full border-collapse" style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem', borderRight: '1px solid #e5e7eb', width: '200px' }}>Message Type</th>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.75rem' }}>Message Content</th>
                  </tr>
                </thead>
                <tbody>
                  {group.messages.map((msg, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: '0.5rem', color: '#374151', fontWeight: 500, borderRight: '1px solid #e5e7eb', verticalAlign: 'top' }}>{msg.name}</td>
                      <td style={{ padding: '0.5rem', color: '#374151', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )
    }

    // Get message type for main row
    const getMessageType = (fields) => {
      const types = []
      if (fields.SMTP) types.push('SMTP')
      if (fields.Administration) types.push('Administration')
      if (fields.SMSCustomization) types.push('SMS Customization')
      return types.length > 0 ? types.join(', ') : '-'
    }

    const getMessageDetailsText = (fields) => {
      const parts = []
      if (fields.SMTP && typeof fields.SMTP === 'object') {
        Object.entries(fields.SMTP).forEach(([key, value]) => {
          if (key && value !== undefined && value !== null && value !== '') {
            parts.push(key.replace(/([A-Z])/g, ' $1').trim(), String(value).trim())
          }
        })
      }
      if (fields.Administration && typeof fields.Administration === 'object') {
        Object.entries(fields.Administration).forEach(([key, value]) => {
          if (key && value !== undefined && value !== null && value !== '') {
            parts.push(key.replace(/([A-Z])/g, ' $1').trim(), String(value).trim())
          }
        })
      }
      if (fields.SMSCustomization && typeof fields.SMSCustomization === 'object') {
        Object.entries(fields.SMSCustomization).forEach(([key, value]) => {
          if (key && value !== undefined && value !== null && value !== '') {
            parts.push(key.replace(/([A-Z])/g, ' $1').trim(), String(value).trim())
          }
        })
      }
      return parts.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const messageType = getMessageType(fields)
      const allText = [messageType, getMessageDetailsText(fields)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="message" className="text-gray-600 text-base" />
          <span>Messages</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Messages"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Message Type
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const messageType = getMessageType(fields)
                return (
                  <>
                    <tr key={`messages-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere'
                      }}>{messageType}</td>
                    </tr>
                    <tr key={`messages-details-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={2} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                          {formatMessageDetails(fields)}
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AdminSettingsTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    
    // Helper to render setting badge
    const renderSettingBadge = (value) => {
      if (!value || value === 'Disable' || value === '0' || value === 0) {
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {value === 'Disable' || value === '0' || value === 0 ? 'Disable' : (value || 'No')}
          </span>
        )
      }
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          {value === 'Enable' || value === '1' || value === 1 ? 'Enable' : value}
        </span>
      )
    }

    // Helper to render setting group
    const renderSettingGroup = (groupName, groupData, isNested = false) => {
      if (!groupData || typeof groupData !== 'object') return null
      
      const entries = Object.entries(groupData).filter(([key, value]) => 
        key && value !== undefined && value !== null && value !== ''
      )
      
      if (entries.length === 0) return null

      return (
        <div className={isNested ? "ml-4 mt-2" : "mb-4"}>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
            {groupName}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {entries.map(([key, value]) => {
              // Handle nested objects
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                return (
                  <div key={key} className="col-span-full">
                    {renderSettingGroup(key.replace(/([A-Z])/g, ' $1').trim(), value, true)}
                  </div>
                )
              }
              
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
              const isBoolean = displayValue === 'Enable' || displayValue === 'Disable' || displayValue === '1' || displayValue === '0'
              
              return (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-700 font-medium flex-1 mr-2" style={{ 
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                    {label}
                  </span>
                  <div className="flex-shrink-0">
                    {isBoolean ? renderSettingBadge(displayValue) : (
                      <span className="text-xs text-gray-900 font-mono">{displayValue}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const getAdminSettingsText = (fields) => {
      const parts = []
      const extractSettings = (obj, prefix = '') => {
        if (!obj || typeof obj !== 'object') return
        Object.entries(obj).forEach(([key, value]) => {
          if (key && value !== undefined && value !== null && value !== '') {
            const fullKey = prefix ? `${prefix}.${key}` : key
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              extractSettings(value, fullKey)
            } else {
              parts.push(fullKey.replace(/([A-Z])/g, ' $1').trim(), Array.isArray(value) ? value.join(', ') : String(value))
            }
          }
        })
      }
      if (fields.HostnameSettings) extractSettings(fields.HostnameSettings, 'HostnameSettings')
      if (fields.WebAdminSettings) extractSettings(fields.WebAdminSettings, 'WebAdminSettings')
      if (fields.LoginSecurity) extractSettings(fields.LoginSecurity, 'LoginSecurity')
      if (fields.PasswordComplexitySettings) extractSettings(fields.PasswordComplexitySettings, 'PasswordComplexitySettings')
      if (fields.LoginDisclaimer) parts.push('LoginDisclaimer', fields.LoginDisclaimer)
      if (fields.DefaultConfigurationLanguage) parts.push('DefaultConfigurationLanguage', fields.DefaultConfigurationLanguage)
      return parts.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = getAdminSettingsText(fields)
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="settings" className="text-gray-600 text-base" />
          <span>Admin Settings</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all settings..."
            ariaLabel="Search Admin Settings"
          />
        </div>
        <div className="space-y-6">
          {filteredItems.map((it, idx) => {
            const fields = it.fields || {}
            
            return (
              <div key={`admin-settings-${it.transactionId}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Hostname Settings */}
                {fields.HostnameSettings && renderSettingGroup('Hostname Settings', fields.HostnameSettings)}
                
                {/* Web Admin Settings */}
                {fields.WebAdminSettings && renderSettingGroup('Web Admin Settings', fields.WebAdminSettings)}
                
                {/* Login Security */}
                {fields.LoginSecurity && renderSettingGroup('Login Security', fields.LoginSecurity)}
                
                {/* Password Complexity Settings */}
                {fields.PasswordComplexitySettings && renderSettingGroup('Password Complexity Settings', fields.PasswordComplexitySettings)}
                
                {/* Other top-level settings */}
                {fields.LoginDisclaimer && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                      Login Disclaimer
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-xs text-gray-700 font-medium flex-1 mr-2">Status</span>
                        <div className="flex-shrink-0">
                          {renderSettingBadge(fields.LoginDisclaimer)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {fields.DefaultConfigurationLanguage && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                      Default Configuration Language
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-xs text-gray-700 font-medium flex-1 mr-2">Language</span>
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-900 font-medium">{fields.DefaultConfigurationLanguage}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const BackupRestoreTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('backup-restore', 2)

    // Helper to render setting badge
    const renderSettingBadge = (value) => {
      if (!value || value === 'Disable' || value === '0' || value === 0) {
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {value === 'Disable' || value === '0' || value === 0 ? 'Disable' : (value || 'No')}
          </span>
        )
      }
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {value === 'Enable' || value === '1' || value === 1 ? 'Enable' : value}
        </span>
      )
    }

    // Helper to render setting group
    const formatSettingsGroup = (groupName, groupData) => {
      if (!groupData || typeof groupData !== 'object') return null
      
      const entries = Object.entries(groupData).filter(([key, value]) => 
        key && value !== undefined && value !== null && value !== ''
      )
      
      if (entries.length === 0) return null

      return (
        <div key={groupName} className="mb-4">
          <h4 className="text-xs font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
            {groupName}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-xs">
            {entries.map(([key, value], idx) => {
              // Skip password fields for security (show as encrypted)
              if (key.toLowerCase().includes('password') && typeof value === 'string' && value.length > 20) {
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-500 italic text-xs">(Encrypted)</span>
                  </div>
                )
              }
              
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
              const isBoolean = displayValue === 'Enable' || displayValue === 'Disable' || displayValue === '1' || displayValue === '0'
              const isMonospace = key === 'EmailAddress' || key === 'FTPServer' || key === 'FtpPath'
              
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">{label}:</span>
                  {isBoolean ? renderSettingBadge(displayValue) : (
                    <span className={`text-gray-900 break-words ${isMonospace ? 'font-mono' : ''}`}>{displayValue}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Get backup mode for display
    const getBackupMode = (fields) => {
      const scheduleBackup = fields.ScheduleBackup
      if (!scheduleBackup) return '-'
      return scheduleBackup.BackupMode || scheduleBackup.backupMode || '-'
    }

    const getBackupSettingsText = (fields) => {
      const scheduleBackup = fields.ScheduleBackup
      if (!scheduleBackup || typeof scheduleBackup !== 'object') return ''
      const parts = []
      Object.entries(scheduleBackup).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null && value !== '') {
          if (key.toLowerCase().includes('password') && typeof value === 'string' && value.length > 20) {
            parts.push(key.replace(/([A-Z])/g, ' $1').trim(), 'Encrypted')
          } else {
            parts.push(key.replace(/([A-Z])/g, ' $1').trim(), Array.isArray(value) ? value.join(', ') : String(value))
          }
        }
      })
      return parts.join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const backupMode = getBackupMode(fields)
      const allText = [backupMode, getBackupSettingsText(fields)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="backup" className="text-gray-600 text-base" />
          <span>Backup & Restore</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Backup & Restore"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Backup Mode
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const backupMode = getBackupMode(fields)

                return (
                  <>
                    <tr key={`backup-restore-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        maxWidth: '250px'
                      }}>
                        {backupMode}
                      </td>
                    </tr>
                    <tr key={`backup-restore-details-${it.transactionId}-${idx}`} className="bg-gray-50">
                      <td colSpan={2} className="px-4 py-3" style={{ padding: '1rem' }}>
                        <div style={{ width: '100%', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                          {formatSettingsGroup('Schedule Backup', fields.ScheduleBackup)}
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ApplicationFilterCategoryTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('application-filter-categories', 6)

    // Format ApplicationSettings
    const formatApplicationSettings = (applicationSettings) => {
      if (!applicationSettings) return <span className="text-gray-400 italic">No applications</span>
      
      const applications = []
      
      // Handle different structures
      if (Array.isArray(applicationSettings)) {
        applicationSettings.forEach(app => {
          if (typeof app === 'object' && app !== null) {
            if (app.Application) {
              const appArray = Array.isArray(app.Application) ? app.Application : [app.Application]
              appArray.forEach(a => {
                if (a && typeof a === 'object') {
                  applications.push({
                    name: a.Name || '-',
                    qosPolicy: a.QoSPolicy || '-'
                  })
                }
              })
            } else {
              applications.push({
                name: app.Name || '-',
                qosPolicy: app.QoSPolicy || '-'
              })
            }
          }
        })
      } else if (typeof applicationSettings === 'object') {
        if (applicationSettings.Application) {
          const appArray = Array.isArray(applicationSettings.Application) 
            ? applicationSettings.Application 
            : [applicationSettings.Application]
          appArray.forEach(a => {
            if (a && typeof a === 'object') {
              applications.push({
                name: a.Name || '-',
                qosPolicy: a.QoSPolicy || '-'
              })
            }
          })
        }
      }
      
      if (applications.length === 0) return <span className="text-gray-400 italic">No applications</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {applications.map((app, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-1.5 bg-gray-50" style={{ minWidth: '300px' }}>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-gray-900 font-medium">{app.name}</span>
                  <span className="text-gray-500 text-xs italic">QoS: {app.qosPolicy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    const getApplicationSettingsText = (as) => {
      if (!as) return ''
      const applications = []
      if (Array.isArray(as)) {
        as.forEach(app => {
          if (typeof app === 'object' && app !== null) {
            if (app.Application) {
              const appArray = Array.isArray(app.Application) ? app.Application : [app.Application]
              appArray.forEach(a => {
                if (a && typeof a === 'object') {
                  applications.push(a.Name || '', a.QoSPolicy || '')
                }
              })
            } else {
              applications.push(app.Name || '', app.QoSPolicy || '')
            }
          }
        })
      } else if (typeof as === 'object') {
        if (as.Application) {
          const appArray = Array.isArray(as.Application) ? as.Application : [as.Application]
          appArray.forEach(a => {
            if (a && typeof a === 'object') {
              applications.push(a.Name || '', a.QoSPolicy || '')
            }
          })
        }
      }
      return applications.filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [
        fields.Name, fields.Description, fields.QoSPolicy, fields.BandwidthUsageType,
        getApplicationSettingsText(fields.ApplicationSettings)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="apps" className="text-gray-600 text-base" />
          <span>Application Filter Categories</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Application Filter Categories"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">QoS Policy</th>
                <th className="sophos-table-header">Bandwidth Usage Type</th>
                <th className="sophos-table-header">Application Settings</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`appfiltercat-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.QoSPolicy || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{fields.BandwidthUsageType || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatApplicationSettings(fields.ApplicationSettings)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ApplicationFilterPolicyTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('application-filter-policies', 7)

    // Extract all Rule entries from all ApplicationFilterPolicy items
    const allRules = []
    items.forEach((item, itemIdx) => {
      const fields = item.fields || {}
      const policyName = fields.Name || 'Unnamed Policy'
      const policyDescription = fields.Description || ''
      const defaultAction = fields.DefaultAction || '-'
      const microAppSupport = fields.MicroAppSupport || '-'
      const ruleList = fields.RuleList
      
      if (!ruleList) return
      
      // Handle array of Rule entries
      let rules = []
      if (ruleList.Rule) {
        rules = Array.isArray(ruleList.Rule) ? ruleList.Rule : [ruleList.Rule]
      } else if (Array.isArray(ruleList)) {
        rules = ruleList
      }
      
      rules.forEach((rule, ruleIdx) => {
        if (rule && typeof rule === 'object') {
          allRules.push({
            ...rule,
            _policyName: policyName,
            _policyDescription: policyDescription,
            _defaultAction: defaultAction,
            _microAppSupport: microAppSupport,
            _parentTransactionId: item.transactionId,
            _parentIndex: itemIdx,
            _ruleIndex: ruleIdx
          })
        }
      })
    })

    // Format CategoryList
    const formatCategoryList = (categoryList) => {
      if (!categoryList) return <span className="text-gray-400 italic">-</span>
      
      const categories = []
      
      if (Array.isArray(categoryList)) {
        categoryList.forEach(cat => {
          if (typeof cat === 'string' && cat.trim()) {
            categories.push(cat.trim())
          } else if (typeof cat === 'object' && cat !== null) {
            if (cat.Category) {
              const catArray = Array.isArray(cat.Category) ? cat.Category : [cat.Category]
              categories.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
            } else {
              const catName = cat.Name || cat.name || String(cat).trim()
              if (catName) categories.push(catName)
            }
          }
        })
      } else if (typeof categoryList === 'object') {
        if (categoryList.Category) {
          const catArray = Array.isArray(categoryList.Category) ? categoryList.Category : [categoryList.Category]
          categories.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
        }
      }
      
      if (categories.length === 0) return <span className="text-gray-400 italic">-</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '150px', overflowY: 'auto', minWidth: '150px' }}>
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{cat}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format CharacteristicsList
    const formatCharacteristicsList = (characteristicsList) => {
      if (!characteristicsList) return <span className="text-gray-400 italic">-</span>
      
      const characteristics = []
      
      if (Array.isArray(characteristicsList)) {
        characteristicsList.forEach(char => {
          if (typeof char === 'string' && char.trim()) {
            characteristics.push(char.trim())
          } else if (typeof char === 'object' && char !== null) {
            if (char.Characteristics) {
              const charArray = Array.isArray(char.Characteristics) ? char.Characteristics : [char.Characteristics]
              characteristics.push(...charArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
            } else {
              const charName = char.Name || char.name || String(char).trim()
              if (charName) characteristics.push(charName)
            }
          }
        })
      } else if (typeof characteristicsList === 'object') {
        if (characteristicsList.Characteristics) {
          const charArray = Array.isArray(characteristicsList.Characteristics) ? characteristicsList.Characteristics : [characteristicsList.Characteristics]
          characteristics.push(...charArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
        }
      }
      
      if (characteristics.length === 0) return <span className="text-gray-400 italic">-</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '150px', overflowY: 'auto', minWidth: '200px' }}>
          {characteristics.map((char, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{char}</span>
            </div>
          ))}
        </div>
      )
    }

    // Format ApplicationList
    const formatApplicationList = (applicationList) => {
      if (!applicationList) return <span className="text-gray-400 italic">-</span>
      
      const applications = []
      
      if (Array.isArray(applicationList)) {
        applicationList.forEach(app => {
          if (typeof app === 'string' && app.trim()) {
            applications.push(app.trim())
          } else if (typeof app === 'object' && app !== null) {
            if (app.Application) {
              const appArray = Array.isArray(app.Application) ? app.Application : [app.Application]
              applications.push(...appArray.filter(Boolean).map(a => String(a).trim()).filter(Boolean))
            } else {
              const appName = app.Name || app.name || String(app).trim()
              if (appName) applications.push(appName)
            }
          }
        })
      } else if (typeof applicationList === 'object') {
        if (applicationList.Application) {
          const appArray = Array.isArray(applicationList.Application) ? applicationList.Application : [applicationList.Application]
          applications.push(...appArray.filter(Boolean).map(a => String(a).trim()).filter(Boolean))
        }
      }
      
      if (applications.length === 0) return <span className="text-gray-400 italic">-</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto', minWidth: '200px' }}>
          {applications.map((app, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 break-words">{app}</span>
            </div>
          ))}
        </div>
      )
    }

    const getCategoryListText = (cl) => {
      if (!cl) return ''
      const categories = []
      if (Array.isArray(cl)) {
        cl.forEach(cat => {
          if (typeof cat === 'string' && cat.trim()) categories.push(cat.trim())
          else if (cat?.Category) {
            const catArray = Array.isArray(cat.Category) ? cat.Category : [cat.Category]
            categories.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
          } else if (cat?.Name || cat?.name) categories.push(cat.Name || cat.name)
        })
      } else if (cl?.Category) {
        const catArray = Array.isArray(cl.Category) ? cl.Category : [cl.Category]
        categories.push(...catArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
      }
      return categories.join(' ')
    }
    const getCharacteristicsListText = (cl) => {
      if (!cl) return ''
      const characteristics = []
      if (Array.isArray(cl)) {
        cl.forEach(char => {
          if (typeof char === 'string' && char.trim()) characteristics.push(char.trim())
          else if (char?.Characteristics) {
            const charArray = Array.isArray(char.Characteristics) ? char.Characteristics : [char.Characteristics]
            characteristics.push(...charArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
          } else if (char?.Name || char?.name) characteristics.push(char.Name || char.name)
        })
      } else if (cl?.Characteristics) {
        const charArray = Array.isArray(cl.Characteristics) ? cl.Characteristics : [cl.Characteristics]
        characteristics.push(...charArray.filter(Boolean).map(c => String(c).trim()).filter(Boolean))
      }
      return characteristics.join(' ')
    }
    const getApplicationListText = (al) => {
      if (!al) return ''
      const applications = []
      if (Array.isArray(al)) {
        al.forEach(app => {
          if (typeof app === 'string' && app.trim()) applications.push(app.trim())
          else if (app?.Application) {
            const appArray = Array.isArray(app.Application) ? app.Application : [app.Application]
            applications.push(...appArray.filter(Boolean).map(a => String(a).trim()).filter(Boolean))
          } else if (app?.Name || app?.name) applications.push(app.Name || app.name)
        })
      } else if (al?.Application) {
        const appArray = Array.isArray(al.Application) ? al.Application : [al.Application]
        applications.push(...appArray.filter(Boolean).map(a => String(a).trim()).filter(Boolean))
      }
      return applications.join(' ')
    }
    
    const filteredRules = allRules.filter((rule) => {
      const fields = rule
      const allText = [
        rule._policyName, rule._policyDescription, rule._defaultAction, rule._microAppSupport,
        fields.SelectAllRule, getCategoryListText(fields.CategoryList),
        getCharacteristicsListText(fields.CharacteristicsList), getApplicationListText(fields.ApplicationList),
        fields.Action, fields.Schedule
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="filter_alt" className="text-gray-600 text-base" />
          <span>Application Filter Policies - Rules</span>
          <span className="text-gray-500 font-normal">
            ({filteredRules.length}{filteredRules.length !== allRules.length ? `/${allRules.length}` : ''} rules)
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Application Filter Policies"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table sophos-table-wide">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header sophos-cell-min-150">Policy Name</th>
                <th className="sophos-table-header sophos-cell-min-200">Description</th>
                <th className="sophos-table-header sophos-cell-min-120">Default Action</th>
                <th className="sophos-table-header sophos-cell-min-100">Micro App Support</th>
                <th className="sophos-table-header sophos-cell-min-100">Select All Rule</th>
                <th className="sophos-table-header sophos-cell-min-150">Category List</th>
                <th className="sophos-table-header sophos-cell-min-200">Characteristics List</th>
                <th className="sophos-table-header sophos-cell-min-200">Application List</th>
                <th className="sophos-table-header sophos-cell-min-100">Action</th>
                <th className="sophos-table-header sophos-cell-min-120">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule, idx) => {
                const fields = rule
                return (
                  <tr key={`${rule._parentTransactionId}-${rule._ruleIndex}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-900" style={{ 
                      whiteSpace: 'nowrap',
                      minWidth: '150px'
                    }}>
                      {rule._policyName}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      maxWidth: '300px', 
                      wordBreak: 'break-word',
                      minWidth: '200px'
                    }}>
                      {rule._policyDescription || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '120px' }}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        rule._defaultAction === 'Allow' || rule._defaultAction === 'allow'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {rule._defaultAction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '100px' }}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        rule._microAppSupport === 'True' || rule._microAppSupport === true || rule._microAppSupport === '1'
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rule._microAppSupport === 'True' || rule._microAppSupport === true || rule._microAppSupport === '1' ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '100px' }}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.SelectAllRule === 'Enable' || fields.SelectAllRule === '1' || fields.SelectAllRule === 1
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {fields.SelectAllRule === 'Enable' || fields.SelectAllRule === '1' || fields.SelectAllRule === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '150px' }}>
                      {formatCategoryList(fields.CategoryList)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '200px' }}>
                      {formatCharacteristicsList(fields.CharacteristicsList)}
                    </td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '200px' }}>
                      {formatApplicationList(fields.ApplicationList)}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ minWidth: '100px' }}>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        fields.Action === 'Deny' || fields.Action === 'deny'
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {fields.Action || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>
                      {fields.Schedule || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AVASAddressGroupTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('avas-address-groups', 5)

    // Format RBLList
    const formatRBLList = (rblList) => {
      if (!rblList) return <span className="text-gray-400 italic">No RBL services</span>
      
      const rblNames = []
      
      // Handle different structures
      if (Array.isArray(rblList)) {
        rblList.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.RBLName) {
              const nameArray = Array.isArray(item.RBLName) ? item.RBLName : [item.RBLName]
              rblNames.push(...nameArray.filter(Boolean).map(n => typeof n === 'string' ? n.trim() : String(n).trim()).filter(Boolean))
            } else {
              // Try to extract RBLName from object
              Object.values(item).forEach(val => {
                if (typeof val === 'string' && val.trim()) {
                  rblNames.push(val.trim())
                } else if (Array.isArray(val)) {
                  val.forEach(v => {
                    if (typeof v === 'string' && v.trim()) {
                      rblNames.push(v.trim())
                    }
                  })
                }
              })
            }
          } else if (typeof item === 'string' && item.trim()) {
            rblNames.push(item.trim())
          }
        })
      } else if (typeof rblList === 'object') {
        if (rblList.RBLName) {
          const nameArray = Array.isArray(rblList.RBLName) ? rblList.RBLName : [rblList.RBLName]
          rblNames.push(...nameArray.filter(Boolean).map(n => typeof n === 'string' ? n.trim() : String(n).trim()).filter(Boolean))
        } else {
          // Try to extract RBLName from nested structure
          Object.values(rblList).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null) {
                  if (v.RBLName) {
                    const nameArray = Array.isArray(v.RBLName) ? v.RBLName : [v.RBLName]
                    rblNames.push(...nameArray.filter(Boolean).map(n => typeof n === 'string' ? n.trim() : String(n).trim()).filter(Boolean))
                  }
                } else if (typeof v === 'string' && v.trim()) {
                  rblNames.push(v.trim())
                }
              })
            } else if (typeof val === 'string' && val.trim()) {
              rblNames.push(val.trim())
            }
          })
        }
      } else if (typeof rblList === 'string' && rblList.trim()) {
        rblNames.push(rblList.trim())
      }
      
      // Remove duplicates while preserving order
      const uniqueRBLNames = Array.from(new Set(rblNames))
      
      if (uniqueRBLNames.length === 0) return <span className="text-gray-400 italic">No RBL services</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {uniqueRBLNames.map((rblName, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold font-mono">
                {idx + 1}
              </span>
              <span className="text-gray-900 font-mono break-words">{rblName}</span>
            </div>
          ))}
        </div>
      )
    }

    const getRBLListText = (rbl) => {
      if (!rbl) return ''
      const rblNames = []
      if (Array.isArray(rbl)) {
        rbl.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.RBLName) {
              const nameArray = Array.isArray(item.RBLName) ? item.RBLName : [item.RBLName]
              rblNames.push(...nameArray.filter(Boolean).map(n => typeof n === 'string' ? n.trim() : String(n).trim()).filter(Boolean))
            }
          } else if (typeof item === 'string' && item.trim()) {
            rblNames.push(item.trim())
          }
        })
      } else if (rbl?.RBLName) {
        const nameArray = Array.isArray(rbl.RBLName) ? rbl.RBLName : [rbl.RBLName]
        rblNames.push(...nameArray.filter(Boolean).map(n => typeof n === 'string' ? n.trim() : String(n).trim()).filter(Boolean))
      }
      return Array.from(new Set(rblNames)).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = [fields.Name, fields.GroupType, fields.Description, getRBLListText(fields.RBLList)].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="security" className="text-gray-600 text-base" />
          <span>AVAS Address Groups</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search AVAS Address Groups"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Name</th>
                <th className="sophos-table-header">Group Type</th>
                <th className="sophos-table-header">Description</th>
                <th className="sophos-table-header">RBL List</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                return (
                  <tr key={`avas-address-group-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '200px'
                    }}>{fields.Name || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '150px'
                    }}>{fields.GroupType || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere',
                      maxWidth: '300px'
                    }}>{fields.Description || '-'}</td>
                    <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                      {formatRBLList(fields.RBLList)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const GatewayConfigurationTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('gateway-configurations', 4)

    // Extract all Gateway entries from all GatewayConfiguration items
    const allGateways = []
    items.forEach((item, itemIdx) => {
      const fields = item.fields || {}
      const gateways = fields.Gateway
      const gatewayFailoverTimeout = fields.GatewayFailoverTimeout
      
      if (!gateways) return
      
      // Handle array of Gateway entries
      if (Array.isArray(gateways)) {
        gateways.forEach((gw, gwIdx) => {
          allGateways.push({
            ...gw,
            GatewayFailoverTimeout: gatewayFailoverTimeout,
            _parentTransactionId: item.transactionId,
            _parentIndex: itemIdx,
            _gwIndex: gwIdx
          })
        })
      } else if (typeof gateways === 'object') {
        // Single Gateway object
        allGateways.push({
          ...gateways,
          GatewayFailoverTimeout: gatewayFailoverTimeout,
          _parentTransactionId: item.transactionId,
          _parentIndex: itemIdx,
          _gwIndex: 0
        })
      }
    })

    // Format FailOverRules
    const formatFailOverRules = (failOverRules) => {
      if (!failOverRules) return <span className="text-gray-400 italic">No failover rules</span>
      
      const rules = []
      
      // Handle different structures
      if (Array.isArray(failOverRules)) {
        failOverRules.forEach(rule => {
          if (typeof rule === 'object' && rule !== null) {
            if (rule.Rule) {
              const ruleArray = Array.isArray(rule.Rule) ? rule.Rule : [rule.Rule]
              rules.push(...ruleArray.filter(Boolean))
            } else {
              rules.push(rule)
            }
          }
        })
      } else if (typeof failOverRules === 'object') {
        if (failOverRules.Rule) {
          const ruleArray = Array.isArray(failOverRules.Rule) ? failOverRules.Rule : [failOverRules.Rule]
          rules.push(...ruleArray.filter(Boolean))
        } else {
          // Try to extract rules from nested structure
          Object.values(failOverRules).forEach(val => {
            if (Array.isArray(val)) {
              val.forEach(v => {
                if (typeof v === 'object' && v !== null) {
                  if (v.Rule) {
                    const ruleArray = Array.isArray(v.Rule) ? v.Rule : [v.Rule]
                    rules.push(...ruleArray.filter(Boolean))
                  } else {
                    rules.push(v)
                  }
                }
              })
            } else if (typeof val === 'object' && val !== null) {
              if (val.Rule) {
                const ruleArray = Array.isArray(val.Rule) ? val.Rule : [val.Rule]
                rules.push(...ruleArray.filter(Boolean))
              } else {
                rules.push(val)
              }
            }
          })
        }
      }
      
      if (rules.length === 0) return <span className="text-gray-400 italic">No failover rules</span>
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
          {rules.map((rule, idx) => {
            const protocol = rule.Protocol || '-'
            const ipAddress = rule.IPAddress || '-'
            const port = rule.Port || '-'
            const condition = rule.Condition || '-'
            
            return (
              <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50" style={{ minWidth: '300px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 bg-gray-100 text-gray-800 rounded text-xs font-semibold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">Rule {idx + 1}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs ml-7">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Protocol:</span>
                    <span className="text-gray-900">{protocol}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">IP:</span>
                    <span className="text-gray-900 font-mono">{ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Port:</span>
                    <span className="text-gray-900">{port}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Condition:</span>
                    <span className="text-gray-900">{condition}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    const getFailOverRulesText = (for_) => {
      if (!for_) return ''
      const rules = []
      if (Array.isArray(for_)) {
        for_.forEach(rule => {
          if (typeof rule === 'object' && rule !== null) {
            if (rule.Rule) {
              const ruleArray = Array.isArray(rule.Rule) ? rule.Rule : [rule.Rule]
              rules.push(...ruleArray.filter(Boolean))
            } else {
              rules.push(rule)
            }
          }
        })
      } else if (for_?.Rule) {
        const ruleArray = Array.isArray(for_.Rule) ? for_.Rule : [for_.Rule]
        rules.push(...ruleArray.filter(Boolean))
      }
      return rules.map(r => [r.Protocol, r.IPAddress, r.Port, r.Condition].filter(Boolean).join(' ')).join(' ')
    }
    
    const filteredGateways = allGateways.filter((gw) => {
      const allText = [
        gw.Name, gw.IPFamily, gw.IPAddress, gw.Type, gw.Weight,
        gw.GatewayFailoverTimeout, getFailOverRulesText(gw.FailOverRules)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="router" className="text-gray-600 text-base" />
          <span>Gateway Configurations</span>
          <span className="text-gray-500 font-normal">
            ({filteredGateways.length}{filteredGateways.length !== allGateways.length ? `/${allGateways.length}` : ''} gateways from {items.length} configuration{items.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Gateway Configurations"
          />
        </div>
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1400px' }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>IP Family</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '150px' }}>IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '80px' }}>Weight</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px' }}>Gateway Failover Timeout</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '350px' }}>Failover Rules</th>
              </tr>
            </thead>
            <tbody>
              {filteredGateways.map((gw, idx) => (
                <tr key={`gateway-config-${gw._parentTransactionId}-${gw._gwIndex}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    minWidth: '150px'
                  }}>{gw.Name || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '100px' }}>{gw.IPFamily || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700 font-mono" style={{ minWidth: '150px' }}>{gw.IPAddress || '-'}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ minWidth: '100px' }}>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      gw.Type === 'Active' || gw.Type === 'active' || gw.Type === 'ON' || gw.Type === 'Yes'
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {gw.Type || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '80px' }}>{gw.Weight || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ minWidth: '120px' }}>{gw.GatewayFailoverTimeout ? `${gw.GatewayFailoverTimeout}s` : '-'}</td>
                  <td className="px-4 py-2.5 align-top" style={{ minWidth: '350px' }}>
                    {formatFailOverRules(gw.FailOverRules)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const DHCPTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('dhcp', 4)

    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const dhcpOption = fields.DHCPOption || {}
      const optionCode = dhcpOption.OptionCode || fields.OptionCode || ''
      const optionName = dhcpOption.OptionName || fields.OptionName || ''
      const optionType = dhcpOption.OptionType || fields.OptionType || ''
      const allText = [optionCode, optionName, optionType].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="dns" className="text-gray-600 text-base" />
          <span>DHCP Options</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search DHCP Options"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Option Code
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Option Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Option Type
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                // Handle both nested (fields.DHCPOption) and direct (fields.OptionCode) structures
                const dhcpOption = fields.DHCPOption || {}
                const optionCode = dhcpOption.OptionCode || fields.OptionCode || '-'
                const optionName = dhcpOption.OptionName || fields.OptionName || '-'
                const optionType = dhcpOption.OptionType || fields.OptionType || '-'
                return (
                  <tr key={`dhcp-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      fontFamily: 'monospace'
                    }}>{optionCode}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere'
                    }}>{optionName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere'
                    }}>{optionType}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const DHCPv6Table = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef, handleMouseDown } = useTableColumnResize('dhcpv6', 4)

    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const dhcpv6Option = fields.DHCPOption || fields.DHCPv6Option || fields.DHCPV6Option || {}
      const optionCode = dhcpv6Option.OptionCode || fields.OptionCode || ''
      const optionName = dhcpv6Option.OptionName || fields.OptionName || ''
      const optionType = dhcpv6Option.OptionType || fields.OptionType || ''
      const allText = [optionCode, optionName, optionType].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="dns" className="text-gray-600 text-base" />
          <span>DHCPv6 Options</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search DHCPv6 Options"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">
                  #
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 0)} />
                </th>
                <th className="sophos-table-header">
                  Option Code
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 1)} />
                </th>
                <th className="sophos-table-header">
                  Option Name
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 2)} />
                </th>
                <th className="sophos-table-header">
                  Option Type
                  <span className="sophos-resize-handle" onMouseDown={(e) => handleMouseDown(e, 3)} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                // Handle both nested (fields.DHCPOption) and direct (fields.OptionCode) structures
                // Note: DHCPV6 uses DHCPOption as the child tag name, not DHCPV6Option
                const dhcpv6Option = fields.DHCPOption || fields.DHCPv6Option || fields.DHCPV6Option || {}
                const optionCode = dhcpv6Option.OptionCode || fields.OptionCode || '-'
                const optionName = dhcpv6Option.OptionName || fields.OptionName || '-'
                const optionType = dhcpv6Option.OptionType || fields.OptionType || '-'
                return (
                  <tr key={`dhcpv6-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      fontFamily: 'monospace'
                    }}>{optionCode}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere'
                    }}>{optionName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'anywhere'
                    }}>{optionType}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AuthenticationServerTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    const { tableRef } = useTableColumnResize('authentication-servers', 7)

    // Extract all ActiveDirectory entries from all AuthenticationServer items
    const allActiveDirectoryEntries = []
    items.forEach((item, itemIdx) => {
      const fields = item.fields || {}
      const activeDirectory = fields.ActiveDirectory
      
      if (!activeDirectory) return
      
      // Handle array of ActiveDirectory entries
      if (Array.isArray(activeDirectory)) {
        activeDirectory.forEach((ad, adIdx) => {
          allActiveDirectoryEntries.push({
            ...ad,
            _parentTransactionId: item.transactionId,
            _parentIndex: itemIdx,
            _adIndex: adIdx
          })
        })
      } else if (typeof activeDirectory === 'object') {
        // Single ActiveDirectory object
        allActiveDirectoryEntries.push({
          ...activeDirectory,
          _parentTransactionId: item.transactionId,
          _parentIndex: itemIdx,
          _adIndex: 0
        })
      }
    })

    if (allActiveDirectoryEntries.length === 0) return null

    // Format SearchQueries
    const formatSearchQueries = (searchQueries) => {
      if (!searchQueries) return '-'
      if (typeof searchQueries === 'string') return searchQueries
      if (Array.isArray(searchQueries)) {
        return searchQueries.map(q => {
          if (typeof q === 'string') return q
          if (q && typeof q === 'object' && q.Query) {
            return Array.isArray(q.Query) ? q.Query.join(', ') : q.Query
          }
          return String(q)
        }).join(' | ')
      }
      if (typeof searchQueries === 'object' && searchQueries.Query) {
        if (Array.isArray(searchQueries.Query)) {
          return searchQueries.Query.join(' | ')
        }
        return searchQueries.Query
      }
      return '-'
    }
    
    const getSearchQueriesText = (sq) => {
      if (!sq) return ''
      if (typeof sq === 'string') return sq
      if (Array.isArray(sq)) {
        return sq.map(q => {
          if (typeof q === 'string') return q
          if (q?.Query) return Array.isArray(q.Query) ? q.Query.join(', ') : q.Query
          return String(q)
        }).join(' ')
      }
      if (sq?.Query) {
        return Array.isArray(sq.Query) ? sq.Query.join(' ') : sq.Query
      }
      return ''
    }
    
    const filteredEntries = allActiveDirectoryEntries.filter((ad) => {
      const allText = [
        ad.ServerName, ad.ServerAddress, ad.Port, ad.NetBIOSDomain, ad.DomainName,
        ad.ConnectionSecurity, ad.ValidCertReq, ad.DisplayNameAttribute, ad.EmailAddressAttribute,
        getSearchQueriesText(ad.SearchQueries)
      ].filter(Boolean).join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="fingerprint" className="text-gray-600 text-base" />
          <span>Authentication Servers (Active Directory)</span>
          <span className="text-gray-500 font-normal">
            ({filteredEntries.length}{filteredEntries.length !== allActiveDirectoryEntries.length ? `/${allActiveDirectoryEntries.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel="Search Authentication Servers"
          />
        </div>
        <div className="sophos-table-wrapper">
          <table className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                <th className="sophos-table-header">Server Name</th>
                <th className="sophos-table-header">Server Address</th>
                <th className="sophos-table-header">Port</th>
                <th className="sophos-table-header">NetBIOS Domain</th>
                <th className="sophos-table-header">Domain Name</th>
                <th className="sophos-table-header">Connection Security</th>
                <th className="sophos-table-header">Valid Cert Req</th>
                <th className="sophos-table-header">Display Name Attribute</th>
                <th className="sophos-table-header">Email Attribute</th>
                <th className="sophos-table-header">Search Queries</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((ad, idx) => (
                <tr key={`auth-${ad._parentTransactionId}-${ad._parentIndex}-${ad._adIndex}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '150px'
                  }}>{ad.ServerName || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-800 font-mono" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '150px'
                  }}>{ad.ServerAddress || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '80px' }}>{ad.Port || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '150px'
                  }}>{ad.NetBIOSDomain || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '200px'
                  }}>{ad.DomainName || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ maxWidth: '120px' }}>{ad.ConnectionSecurity || '-'}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      ad.ValidCertReq === 'Enable' || ad.ValidCertReq === 'ON' || ad.ValidCertReq === 'Yes'
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ad.ValidCertReq || 'Disable'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '150px'
                  }}>{ad.DisplayNameAttribute || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '150px'
                  }}>{ad.EmailAddressAttribute || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700" style={{ 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    maxWidth: '300px',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem'
                  }}>{formatSearchQueries(ad.SearchQueries)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const AdministrationProfileTable = ({ items }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)
    
    // Helper to render permission badge
    const renderPermissionBadge = (permission) => {
      if (!permission || permission === 'None') {
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            None
          </span>
        )
      }
      if (permission === 'Read-Write' || permission === 'ReadWrite') {
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            Read-Write
          </span>
        )
      }
      if (permission === 'Read-Only' || permission === 'ReadOnly') {
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            Read-Only
          </span>
        )
      }
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          {permission}
        </span>
      )
    }

    // Helper to render nested permission group
    const renderPermissionGroup = (groupName, permissions) => {
      if (!permissions || typeof permissions !== 'object') return null
      
      const permissionEntries = Object.entries(permissions).filter(([key, value]) => 
        key && value !== undefined && value !== null
      )
      
      if (permissionEntries.length === 0) return null

      return (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
            {groupName}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {permissionEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-700 font-medium flex-1 mr-2" style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex-shrink-0">
                  {renderPermissionBadge(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Top-level permissions (non-nested)
    const topLevelPermissions = [
      'Dashboard', 'Wizard', 'Objects', 'Network', 'Firewall', 'IPS', 'WebFilter',
      'CloudApplicationDashboard', 'ZeroDayProtection', 'ApplicationFilter', 'IM',
      'QoS', 'EmailProtection', 'TrafficDiscovery'
    ]

    // Nested permission groups
    const nestedGroups = [
      { key: 'System', label: 'System' },
      { key: 'WirelessProtection', label: 'Wireless Protection' },
      { key: 'Identity', label: 'Identity' },
      { key: 'VPN', label: 'VPN' },
      { key: 'WAF', label: 'WAF' },
      { key: 'LogsReports', label: 'Logs & Reports' }
    ]

    const getAdminProfileText = (fields) => {
      const parts = [fields.Name]
      topLevelPermissions.forEach(permKey => {
        const value = fields[permKey]
        if (value !== undefined && value !== null) {
          parts.push(permKey.replace(/([A-Z])/g, ' $1').trim(), value)
        }
      })
      nestedGroups.forEach(group => {
        const groupPermissions = fields[group.key]
        if (groupPermissions && typeof groupPermissions === 'object') {
          Object.entries(groupPermissions).forEach(([key, value]) => {
            if (key && value !== undefined && value !== null) {
              parts.push(group.label, key.replace(/([A-Z])/g, ' $1').trim(), value)
            }
          })
        }
      })
      return parts.filter(Boolean).join(' ')
    }
    
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      const allText = getAdminProfileText(fields)
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="admin_panel_settings" className="text-gray-600 text-base" />
          <span>Administration Profiles</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all permissions..."
            ariaLabel="Search Administration Profiles"
          />
        </div>
        <div className="space-y-6">
          {filteredItems.map((it, idx) => {
            const fields = it.fields || {}
            const profileName = fields.Name || `Profile ${idx + 1}`
            
            return (
              <div key={`admin-profile-${it.transactionId}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900">{profileName}</h4>
                </div>
                
                {/* Top-level permissions */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                    General Permissions
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {topLevelPermissions.map(permKey => {
                      const value = fields[permKey]
                      if (value === undefined || value === null) return null
                      return (
                        <div key={permKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xs text-gray-700 font-medium flex-1 mr-2" style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}>
                            {permKey.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex-shrink-0">
                            {renderPermissionBadge(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Nested permission groups */}
                {nestedGroups.map(group => {
                  const groupPermissions = fields[group.key]
                  if (!groupPermissions || typeof groupPermissions !== 'object') return null
                  return (
                    <div key={group.key}>
                      {renderPermissionGroup(group.label, groupPermissions)}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Helper to format array/object fields
  const formatArrayField = (field, separator = ', ') => {
    if (!field) return '-'
    if (Array.isArray(field)) {
      return field.filter(Boolean).join(separator) || '-'
    }
    if (typeof field === 'object' && field !== null) {
      // Handle objects like { Network: ['a', 'b'] } or { Member: 'x' }
      const values = []
      Object.entries(field).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          values.push(...val.filter(Boolean))
        } else if (val) {
          values.push(String(val))
        }
      })
      return values.length > 0 ? values.join(separator) : '-'
    }
    return String(field)
  }

  // Helper to format array/object fields with line breaks (one per line)
  const formatArrayFieldLines = (field) => {
    if (!field) return '-'
    const values = []
    
    if (Array.isArray(field)) {
      values.push(...field.filter(Boolean))
    } else if (typeof field === 'object' && field !== null) {
      // Handle objects like { Network: ['a', 'b'] } or { Member: 'x' }
      Object.entries(field).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          values.push(...val.filter(Boolean))
        } else if (val && typeof val === 'object') {
          // Handle nested objects like { Network: { Network: ['a', 'b'] } }
          if (val.Network) {
            const networks = Array.isArray(val.Network) ? val.Network : [val.Network]
            values.push(...networks.filter(Boolean))
          } else if (val.Service) {
            const services = Array.isArray(val.Service) ? val.Service : [val.Service]
            values.push(...services.filter(Boolean))
          } else if (val.User) {
            const users = Array.isArray(val.User) ? val.User : [val.User]
            values.push(...users.filter(Boolean))
          } else {
            // Try to extract any array values
            Object.values(val).forEach(v => {
              if (Array.isArray(v)) {
                values.push(...v.filter(Boolean))
              } else if (v) {
                values.push(String(v))
              }
            })
          }
        } else if (val) {
          values.push(String(val))
        }
      })
    } else {
      return String(field)
    }
    
    if (values.length === 0) return '-'
    
    // Return as React fragments with line breaks and numbered badges
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {values.map((val, idx) => (
          <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minWidth: '1.5rem',
              height: '1.25rem',
              padding: '0 0.375rem',
              backgroundColor: '#EEEEEE',
              color: '#111827',
              borderRadius: '9999px',
              fontSize: '0.625rem',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              {idx + 1}
            </span>
            <span style={{ display: 'block', flex: 1 }}>{String(val)}</span>
          </span>
        ))}
      </div>
    )
  }

  // Helper to convert netmask to CIDR notation
  const netmaskToCIDR = (netmask) => {
    if (!netmask) return null
    const parts = netmask.split('.')
    if (parts.length !== 4) return null
    let cidr = 0
    for (let i = 0; i < 4; i++) {
      const octet = parseInt(parts[i], 10)
      if (isNaN(octet) || octet < 0 || octet > 255) return null
      const binary = octet.toString(2).padStart(8, '0')
      for (let bit = 0; bit < 8; bit++) {
        if (binary[bit] === '1') {
          cidr++
        } else {
          for (let check = bit + 1; check < 8; check++) {
            if (binary[check] === '1') return null
          }
          break
        }
      }
    }
    return cidr
  }

  // Helper to render status badge
  const renderStatusBadge = (status) => {
    const statusStr = String(status || '').toLowerCase()
    const statusNum = typeof status === 'number' ? status : (statusStr === '1' ? 1 : statusStr === '0' ? 0 : null)
    const isActive = statusNum === 1 || statusStr === 'on' || statusStr === 'enable' || statusStr === 'enabled' || statusStr === 'active'
    const displayText = statusNum === 1 ? 'Enable' : statusNum === 0 ? 'Disable' : (status || 'N/A')
    return (
      <span className={`px-2 py-0.5 rounded-full font-medium ${
        isActive
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {displayText}
      </span>
    )
  }

  // Generic configurable table component for various entity types
  const ConfigurableEntityTable = ({ items, title, icon, columns, getRowKey }) => {
    if (!items || items.length === 0) return null

    const { columnFilters, setColumnFilters, getSearchableText } = useTableFilters(items)

    // Helper function to determine if a column is filterable
    const isFilterableColumn = (col) => {
      // Explicit filterable property
      if (col.filterable === false) return false
      if (col.filterable === true) return true
      
      // Auto-detect: column must have field property or getValue function
      // and header suggests text content
      const hasFieldOrGetter = col.field || col.getValue
      if (!hasFieldOrGetter) return false
      
      // Filterable by default for text-based columns
      return true
    }

    // Helper function to get text value from a cell for filtering
    const getCellTextValue = (col, fields, item) => {
      let value = 'N/A'
      let rawValue = null
      
      // First, get the raw field value if available (for filtering arrays/objects)
      if (col.field) {
        rawValue = fields[col.field] || 
                   (Object.keys(fields).find(k => k.toLowerCase() === col.field.toLowerCase()) 
                     ? fields[Object.keys(fields).find(k => k.toLowerCase() === col.field.toLowerCase())]
                     : null)
      }
      
      // Get the display value (might be a React element)
      if (col.getValue) {
        value = col.getValue(fields, item)
      } else if (rawValue !== null) {
        value = rawValue
      }
      
      // If getValue returned a React element, use the raw field value for filtering instead
      if (value && typeof value === 'object' && value.$$typeof && rawValue !== null) {
        value = rawValue
      }
      
      // Convert to string and handle various types
      if (value === null || value === undefined) return ''
      
      // Check if value is a React element (has $$typeof property)
      if (value && typeof value === 'object' && value.$$typeof) {
        // For React elements, try to extract text content or return empty string
        // React elements can't be stringified due to circular references
        return ''
      }
      
      // Handle arrays - join them for filtering
      if (Array.isArray(value)) {
        return value.filter(Boolean).map(v => String(v)).join(' ')
      }
      
      if (typeof value === 'object') {
        // For objects, extract all string values for filtering (similar to formatArrayFieldLines)
        // This handles nested structures like { Network: ['a', 'b'] } or { Network: { Network: ['a'] } }
        const extractStringValues = (obj, visited = new WeakSet()) => {
          if (!obj || typeof obj !== 'object') return []
          if (visited.has(obj)) return []
          visited.add(obj)
          
          const values = []
          
          if (Array.isArray(obj)) {
            values.push(...obj.filter(Boolean).map(v => String(v)))
          } else {
            Object.entries(obj).forEach(([key, val]) => {
              if (Array.isArray(val)) {
                values.push(...val.filter(Boolean).map(v => String(v)))
              } else if (val && typeof val === 'object') {
                // Handle nested objects
                if (val.Network) {
                  const networks = Array.isArray(val.Network) ? val.Network : [val.Network]
                  values.push(...networks.filter(Boolean).map(v => String(v)))
                } else if (val.Service) {
                  const services = Array.isArray(val.Service) ? val.Service : [val.Service]
                  values.push(...services.filter(Boolean).map(v => String(v)))
                } else if (val.User) {
                  const users = Array.isArray(val.User) ? val.User : [val.User]
                  values.push(...users.filter(Boolean).map(v => String(v)))
                } else {
                  // Recursively extract from nested objects
                  values.push(...extractStringValues(val, visited))
                }
              } else if (val) {
                values.push(String(val))
              }
            })
          }
          
          return values
        }
        
        try {
          // Check for common object types that might have circular refs
          if (value instanceof HTMLElement || value instanceof Element) {
            return value.textContent || value.innerText || ''
          }
          
          // Extract all string values from the object structure
          const extractedValues = extractStringValues(value)
          if (extractedValues.length > 0) {
            return extractedValues.join(' ')
          }
          
          // Fallback to JSON.stringify if extraction didn't work
          return JSON.stringify(value)
        } catch (e) {
          // If stringify fails (circular reference), try to get a meaningful string
          if (e.message && e.message.includes('circular')) {
            // For objects with circular refs, try to get a string representation
            if (value.toString && typeof value.toString === 'function') {
              try {
                return value.toString()
              } catch {
                return '[Object]'
              }
            }
            return '[Object]'
          }
          throw e
        }
      }
      return String(value)
    }

    // Filter items based on unified search
    const filteredItems = items.filter((item) => {
      const fields = item.fields || {}
      
      // Collect all searchable text from all columns
      const allTexts = columns
        .filter(col => isFilterableColumn(col))
        .map(col => getCellTextValue(col, fields, item))
        .filter(Boolean)
      
      const allText = allTexts.join(' ')
      const searchText = getSearchableText(allText).toLowerCase()
      const filterValue = columnFilters.search
      if (!filterValue || !filterValue.trim()) return true
      return searchText.includes(filterValue.toLowerCase().trim())
    })

    const columnCount = columns.length + 1 // +1 for the # column
    const tableId = `configurable-${title.toLowerCase().replace(/\s+/g, '-')}`
    const { tableRef } = useTableColumnResize(tableId, columnCount)

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name={icon} className="text-gray-600 text-base" />
          <span>{title}</span>
          <span className="text-gray-500 font-normal">
            ({filteredItems.length}{filteredItems.length !== items.length ? `/${items.length}` : ''})
          </span>
        </h3>
        <div className="mb-2">
          <FilterInput
            value={columnFilters.search}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search all columns..."
            ariaLabel={`Search ${title}`}
          />
        </div>
        <div className="sophos-table-wrapper">
          <table ref={tableRef} className="sophos-table">
            <thead>
              <tr>
                <th className="sophos-table-header sophos-col-checkbox">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={col.headerStyle || {}}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const fields = it.fields || {}
                const rowKey = getRowKey ? getRowKey(it, idx) : `${title}-${it.transactionId}-${idx}`

                return (
                  <tr key={rowKey} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium" style={{ whiteSpace: 'nowrap' }}>{idx + 1}</td>
                    {columns.map((col, colIdx) => {
                      // Try to get value - check both exact field name and case-insensitive
                      let value = 'N/A'
                      if (col.getValue) {
                        value = col.getValue(fields, it)
                      } else if (col.field) {
                        value = fields[col.field] || 
                               Object.keys(fields).find(k => k.toLowerCase() === col.field.toLowerCase()) 
                                 ? fields[Object.keys(fields).find(k => k.toLowerCase() === col.field.toLowerCase())]
                                 : 'N/A'
                      }
                      const cellContent = col.render ? col.render(value, fields, it) : value
                      const cellStyle = {
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        ...(col.cellStyle || {})
                      }

                      return (
                        <td key={colIdx} className="px-4 py-2.5 text-xs text-gray-700" style={cellStyle}>
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Table configurations for different entity types
  const getTableConfig = (tag) => {
    const configs = {
      HealthCheckProfile: {
        title: 'Health Check Profiles',
        icon: 'monitor_heart',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'IP Family', field: 'IPFamily', cellStyle: { maxWidth: '100px' } },
          { header: 'Probe Interval', field: 'ProbeInterval', getValue: (f) => f.ProbeInterval ? `${f.ProbeInterval}s` : '-' },
          { header: 'Response Timeout', field: 'ResponseTimeout', getValue: (f) => f.ResponseTimeout ? `${f.ResponseTimeout}s` : '-' },
          { header: 'Failure Threshold', field: 'ProbesResponseFailure' },
          { header: 'Success Threshold', field: 'ProbeResponseSuccess' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Probe Targets', field: 'ProbeTargets', getValue: (f) => {
            if (!f.ProbeTargets) return '-'
            const targets = []
            if (Array.isArray(f.ProbeTargets)) {
              f.ProbeTargets.forEach(target => {
                if (target && typeof target === 'object') {
                  const ip = target.monitorip || target.MonitorIP || ''
                  const method = target.monitormethod || target.MonitorMethod || ''
                  const operator = target.operator || target.Operator || ''
                  if (ip || method) {
                    targets.push(`${method} ${ip}${operator ? ` (${operator})` : ''}`)
                  }
                }
              })
            } else if (f.ProbeTargets.ProbeTarget) {
              const probeTargets = Array.isArray(f.ProbeTargets.ProbeTarget) 
                ? f.ProbeTargets.ProbeTarget 
                : [f.ProbeTargets.ProbeTarget]
              probeTargets.forEach(target => {
                if (target && typeof target === 'object') {
                  const ip = target.monitorip || target.MonitorIP || ''
                  const method = target.monitormethod || target.MonitorMethod || ''
                  const operator = target.operator || target.Operator || ''
                  if (ip || method) {
                    targets.push(`${method} ${ip}${operator ? ` (${operator})` : ''}`)
                  }
                }
              })
            }
            if (targets.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.7rem' }}>
                {targets.map((target, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '1.5rem',
                      height: '1.25rem',
                      padding: '0 0.375rem',
                      backgroundColor: '#f3f4f6',
                      color: '#111827',
                      borderRadius: '0.375rem',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ display: 'block', flex: 1 }}>{target}</span>
                  </span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '300px', fontSize: '0.7rem' } }
        ]
      },
      SDWANProfile: {
        title: 'SD-WAN Profiles',
        icon: 'hub',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'IP Family', field: 'IPFamily', cellStyle: { maxWidth: '100px' } },
          { header: 'Routing Strategy', field: 'RoutingStrategy' },
          { header: 'SLA Strategy', field: 'SLAStrategy' },
          { header: 'Enable SLA', field: 'EnableSLA', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'LB Method', field: 'LBMethod' },
          { header: 'Gateway Preferences', field: 'GatewayPreferences', getValue: (f) => {
            if (!f.GatewayPreferences) return '-'
            const gateways = []
            if (Array.isArray(f.GatewayPreferences)) {
              f.GatewayPreferences.forEach(gw => {
                if (gw && typeof gw === 'object') {
                  const name = gw.gatewayname || gw.GatewayName || gw.gateway?.gatewayname || gw.Gateway?.gatewayname || ''
                  const order = gw.orderid || gw.OrderID || gw.gateway?.orderid || gw.Gateway?.orderid || ''
                  const weight = gw.weight || gw.Weight || gw.gateway?.weight || gw.Gateway?.weight || ''
                  if (name) {
                    gateways.push(`${name}${order ? ` (#${order})` : ''}${weight ? ` (${weight}%)` : ''}`)
                  }
                }
              })
            } else if (f.GatewayPreferences.Gateway) {
              const gatewayList = Array.isArray(f.GatewayPreferences.Gateway) 
                ? f.GatewayPreferences.Gateway 
                : [f.GatewayPreferences.Gateway]
              gatewayList.forEach(gw => {
                if (gw && typeof gw === 'object') {
                  const name = gw.gatewayname || gw.GatewayName || ''
                  const order = gw.orderid || gw.OrderID || ''
                  const weight = gw.weight || gw.Weight || ''
                  if (name) {
                    gateways.push(`${name}${order ? ` (#${order})` : ''}${weight ? ` (${weight}%)` : ''}`)
                  }
                }
              })
            }
            if (gateways.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.7rem' }}>
                {gateways.map((gw, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '1.5rem',
                      height: '1.25rem',
                      padding: '0 0.375rem',
                      backgroundColor: '#f3f4f6',
                      color: '#111827',
                      borderRadius: '0.375rem',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ display: 'block', flex: 1 }}>{gw}</span>
                  </span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '300px', fontSize: '0.7rem' } },
          { header: 'SLA Metrics', field: 'SLAMetrics', getValue: (f) => {
            const metrics = []
            if (f.IsLatency === 'ON' || f.IsLatency === '1') metrics.push(`Latency: ${f.LatencyValue || 0}ms`)
            if (f.IsJitter === 'ON' || f.IsJitter === '1') metrics.push(`Jitter: ${f.JitterValue || 0}ms`)
            if (f.IsPacketloss === 'ON' || f.IsPacketloss === '1') metrics.push(`Packet Loss: ${f.PacketlossValue || 0}%`)
            return metrics.length > 0 ? metrics.join(', ') : 'None'
          }, cellStyle: { maxWidth: '200px', fontSize: '0.7rem' } },
          { header: 'Probe Count', field: 'ProbeCount' },
          { header: 'Health Check Profile', field: 'HealthCheckProfileName' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      SDWANPolicyRoute: {
        title: 'SD-WAN Policy Routes',
        icon: 'route',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'IP Family', field: 'IPFamily', cellStyle: { maxWidth: '100px' } },
          { header: 'Interface', field: 'Interface' },
          { header: 'Link Selection', field: 'LinkSelection' },
          { header: 'Gateway', field: 'Gateway', getValue: (f) => f.Gateway || '-' },
          { header: 'Backup Gateway', field: 'BackupGateway', getValue: (f) => f.BackupGateway || '-' },
          { header: 'SD-WAN Profile', field: 'SDWANProfileName' },
          { header: 'DSCP Marking', field: 'DSCPMarking' },
          { header: 'Source Networks', field: 'SourceNetworks', getValue: (f) => formatArrayFieldLines(f.SourceNetworks), cellStyle: { maxWidth: '200px' } },
          { header: 'Destination Networks', field: 'DestinationNetworks', getValue: (f) => formatArrayFieldLines(f.DestinationNetworks), cellStyle: { maxWidth: '200px' } },
          { header: 'Services', field: 'Services', getValue: (f) => formatArrayFieldLines(f.Services), cellStyle: { maxWidth: '150px' } },
          { header: 'Users', field: 'Users', getValue: (f) => formatArrayFieldLines(f.Users), cellStyle: { maxWidth: '150px' } },
          { header: 'Healthcheck', field: 'Healthcheck', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      DHCPServer: {
        title: 'DHCP Servers',
        icon: 'dns',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Interface', field: 'Interface' },
          { header: 'IP Lease Range', field: 'IPLease', getValue: (f) => f.IPLease?.IP || '-', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Subnet Mask', field: 'SubnetMask', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Gateway', field: 'Gateway', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Primary DNS', field: 'PrimaryDNSServer', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Secondary DNS', field: 'SecondaryDNSServer', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Default Lease Time', field: 'DefaultLeaseTime', getValue: (f) => f.DefaultLeaseTime ? `${f.DefaultLeaseTime} min` : '-' },
          { header: 'Max Lease Time', field: 'MaxLeaseTime', getValue: (f) => f.MaxLeaseTime ? `${f.MaxLeaseTime} min` : '-' },
          { header: 'Conflict Detection', field: 'ConflictDetection' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } }
        ]
      },
      DHCPBinding: {
        title: 'DHCP Bindings',
        icon: 'link',
        columns: [
          { header: 'DHCP Name', field: 'DhcpName', getValue: (f) => f.DhcpName || '-' },
          { header: 'Option Name', field: 'OptionName', getValue: (f) => f.OptionName || '-', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem' } },
          { header: 'Option Value', field: 'OptionValue', getValue: (f) => f.OptionValue || '-', cellStyle: { fontFamily: 'monospace' } }
        ]
      },
      VPNConfiguration: {
        title: 'VPN Configurations',
        icon: 'vpn_key',
        columns: [
          { header: 'Type', field: 'Type', getValue: (f) => f.Type || '-' },
          { header: 'Authentication', field: 'Authentication', getValue: (f) => f.Authentication || '-' },
          { header: 'Encryption', field: 'Encryption', getValue: (f) => f.Encryption || '-' }
        ]
      },
      VpnConfiguration: {
        title: 'VPN Configurations',
        icon: 'vpn_key',
        columns: [
          { header: 'Type', field: 'Type', getValue: (f) => f.Type || '-' },
          { header: 'Authentication', field: 'Authentication', getValue: (f) => f.Authentication || '-' },
          { header: 'Encryption', field: 'Encryption', getValue: (f) => f.Encryption || '-' }
        ]
      },
      ThirdPartyFeed: {
        title: 'Third Party Feeds',
        icon: 'rss_feed',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Action', field: 'Action' },
          { header: 'Indicator Type', field: 'IndicatorType' },
          { header: 'URL', field: 'ExternalURL', cellStyle: { maxWidth: '300px', fontFamily: 'monospace', fontSize: '0.7rem' } },
          { header: 'Polling Interval', field: 'PollingInterval', getValue: (f) => f.PollingInterval || f.UpdateInterval || '-' },
          { header: 'Enabled', field: 'Enabled', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      RealServers: {
        title: 'Real Servers',
        icon: 'dns',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Host', field: 'Host', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Type', field: 'Type' },
          { header: 'Port', field: 'Port' },
          { header: 'Keep Alive', field: 'KeepAlive' },
          { header: 'Disable Reuse', field: 'DisableReuse' },
          { header: 'Timeout', field: 'TimeOut', getValue: (f) => f.TimeOut ? `${f.TimeOut}s` : '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      ProtocolSecurity: {
        title: 'Protocol Security',
        icon: 'security',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Mode', field: 'Mode' },
          { header: 'AntiVirus', field: 'AntiVirus' },
          { header: 'Threats Filter', field: 'ThreatsFilter' },
          { header: 'Paranoia Level', field: 'ParanoiaLevel' },
          { header: 'Request Size Limit', field: 'RequestSizeLimit', getValue: (f) => f.RequestSizeLimit ? `${Math.round(f.RequestSizeLimit / 1024)}KB` : '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      ReverseAuthentication: {
        title: 'Reverse Authentication',
        icon: 'fingerprint',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Virtual Mode', field: 'VirtualWebserverMode' },
          { header: 'Real Mode', field: 'RealWebserverMode' },
          { header: 'Session Timeout', field: 'SessionTimeout' },
          { header: 'Session Lifetime', field: 'SessionLifetime' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      OTPTokens: {
        title: 'OTP Tokens',
        icon: 'key',
        columns: [
          { header: 'User', field: 'user' },
          { header: 'Token ID', field: 'tokenid', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '200px' } },
          { header: 'Algorithm', field: 'algorithm' },
          { header: 'Time Step', field: 'timeStep', getValue: (f) => f.timeStep ? `${f.timeStep}s` : '-' },
          { header: 'Active', field: 'active', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Comment', field: 'comment', getValue: (f) => f.comment || '-' }
        ]
      },
      POPIMAPScanningPolicy: {
        title: 'POP/IMAP Scanning Policies',
        icon: 'mail',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Filter Criteria', field: 'FilterCriteria' },
          { header: 'Action', field: 'Action' },
          { header: 'Match Is', field: 'MatchIs' },
          { header: 'To', field: 'To', getValue: (f) => f.To || '-' }
        ]
      },
      MTAAddressGroup: {
        title: 'MTA Address Groups',
        icon: 'group',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Group Type', field: 'GroupType' },
          { header: 'RBL List', field: 'RBLList', getValue: (f) => {
            if (!f.RBLList) return '-'
            const rblValues = []
            if (Array.isArray(f.RBLList)) {
              rblValues.push(...f.RBLList.map(rbl => rbl.RBLName || rbl).filter(Boolean))
            } else if (typeof f.RBLList === 'object' && f.RBLList.RBLName) {
              const rblNames = Array.isArray(f.RBLList.RBLName) 
                ? f.RBLList.RBLName 
                : [f.RBLList.RBLName]
              rblValues.push(...rblNames.filter(Boolean))
            } else {
              // Fallback to formatArrayFieldLines
              const formatted = formatArrayFieldLines(f.RBLList)
              return formatted
            }
            if (rblValues.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {rblValues.map((val, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '1.5rem',
                      height: '1.25rem',
                      padding: '0 0.375rem',
                      backgroundColor: '#f3f4f6',
                      color: '#111827',
                      borderRadius: '0.375rem',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ display: 'block', flex: 1 }}>{String(val)}</span>
                  </span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '300px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      SMTPPolicy: {
        title: 'SMTP Policies',
        icon: 'mail',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Action', field: 'Action' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      DNSRequestRoute: {
        title: 'DNS Request Routes',
        icon: 'dns',
        columns: [
          { header: 'Domain Name', field: 'DomainName', getValue: (f) => f.DomainName || '-' },
          { header: 'Target Servers', field: 'TargetServers', getValue: (f) => {
            if (!f.TargetServers) return '-'
            const hosts = []
            if (Array.isArray(f.TargetServers)) {
              f.TargetServers.forEach(server => {
                if (server && typeof server === 'object') {
                  const host = server.Host || server.host || ''
                  if (host) hosts.push(host)
                } else if (server) {
                  hosts.push(String(server))
                }
              })
            } else if (f.TargetServers.Host) {
              const hostList = Array.isArray(f.TargetServers.Host) 
                ? f.TargetServers.Host 
                : [f.TargetServers.Host]
              hosts.push(...hostList.filter(Boolean))
            }
            if (hosts.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {hosts.map((host, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '1.5rem',
                      height: '1.25rem',
                      padding: '0 0.375rem',
                      backgroundColor: '#EEEEEE',
                      color: '#111827',
                      borderRadius: '9999px',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ display: 'block', flex: 1 }}>{String(host)}</span>
                  </span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '300px' } }
        ]
      },
      SiteToSiteServer: {
        title: 'Site-to-Site Servers',
        icon: 'vpn_key',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Static IP', field: 'StaticIP' },
          { header: 'Local Networks', field: 'LocalNetworks', getValue: (f) => formatArrayFieldLines(f.LocalNetworks), cellStyle: { maxWidth: '200px' } },
          { header: 'Remote Networks', field: 'RemoteNetworks', getValue: (f) => formatArrayFieldLines(f.RemoteNetworks), cellStyle: { maxWidth: '200px' } },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      VoucherDefinition: {
        title: 'Voucher Definitions',
        icon: 'card_giftcard',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Validity Period', field: 'ValidityPeriod', getValue: (f) => f.ValidityPeriod ? `${f.ValidityPeriod} ${f.ValidityUnit || ''}` : '-' },
          { header: 'Time Quota', field: 'TimeQuota', getValue: (f) => f.TimeQuota ? `${f.TimeQuota} ${f.QuotaUnit || ''}` : '-' },
          { header: 'Data Volume', field: 'DataVolume', getValue: (f) => f.DataVolume ? `${f.DataVolume} ${f.DataUnit || ''}` : '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      WebFilterPolicy: {
        title: 'Web Filter Policies',
        icon: 'filter_list',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Action', field: 'Action' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      CertificateAuthority: {
        title: 'Certificate Authorities',
        icon: 'verified',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Type', field: 'Type' },
          { header: 'Format', field: 'Format' },
          { header: 'CA Cert File', field: 'CACertFile' },
          { header: 'CA Private Key File', field: 'CAPrivateKeyFile', getValue: (f) => f.CAPrivateKeyFile || '-' }
        ]
      },
      SelfSignedCertificate: {
        title: 'Self-Signed Certificates',
        icon: 'verified_user',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Format', field: 'Format' },
          { header: 'Certificate File', field: 'CertificateFile' },
          { header: 'Private Key File', field: 'PrivateKeyFile' }
        ]
      },
      SelfSignedCertificateAuthority: {
        title: 'Self-Signed Certificate Authorities',
        icon: 'verified_user',
        columns: [
          { header: 'Common Name', field: 'CommonName', getValue: (f) => f.CommonName || f.Name || '-' },
          { header: 'Organization', field: 'OrganizationName', getValue: (f) => f.OrganizationName || '-' },
          { header: 'Organization Unit', field: 'OrganizationUnitName', getValue: (f) => f.OrganizationUnitName || '-' },
          { header: 'Locality', field: 'LocalityName', getValue: (f) => f.LocalityName || '-' },
          { header: 'State/Province', field: 'StateProvinceName', getValue: (f) => f.StateProvinceName || '-' },
          { header: 'Country', field: 'CountryName', getValue: (f) => f.CountryName || '-' },
          { header: 'Email', field: 'EmailAddress', getValue: (f) => f.EmailAddress || '-', cellStyle: { maxWidth: '250px' } },
          { header: 'Key Type', field: 'KeyType', getValue: (f) => f.KeyType || '-', cellStyle: { maxWidth: '100px' } },
          { header: 'Key Length', field: 'KeyLength', getValue: (f) => f.KeyLength ? `${f.KeyLength} bits` : '-', cellStyle: { maxWidth: '120px' } },
          { header: 'Curve Name', field: 'CurveName', getValue: (f) => f.CurveName || '-' },
          { header: 'Secure Hash', field: 'SecureHash', getValue: (f) => f.SecureHash || '-' },
          { header: 'CA Cert File', field: 'CACertFile', getValue: (f) => f.CACertFile || '-', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem' } },
          { header: 'CA Private Key File', field: 'CAPrivateKeyFile', getValue: (f) => f.CAPrivateKeyFile || '-', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem' } }
        ]
      },
      Certificate: {
        title: 'Certificates',
        icon: 'verified_user',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Action', field: 'Action' },
          { header: 'Format', field: 'CertificateFormat' },
          { header: 'Certificate File', field: 'CertificateFile' },
          { header: 'Private Key File', field: 'PrivateKeyFile' }
        ]
      },
      FileType: {
        title: 'File Types',
        icon: 'description',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'File Extensions', field: 'FileExtensionList', getValue: (f) => {
            if (!f.FileExtensionList) return '-'
            const extensions = []
            if (Array.isArray(f.FileExtensionList)) {
              f.FileExtensionList.forEach(ext => {
                if (ext && typeof ext === 'object' && ext.FileExtension) {
                  const extList = Array.isArray(ext.FileExtension) ? ext.FileExtension : [ext.FileExtension]
                  extensions.push(...extList.filter(Boolean))
                }
              })
            } else if (f.FileExtensionList.FileExtension) {
              const extList = Array.isArray(f.FileExtensionList.FileExtension) 
                ? f.FileExtensionList.FileExtension 
                : [f.FileExtensionList.FileExtension]
              extensions.push(...extList.filter(Boolean))
            }
            if (extensions.length === 0) return '-'
            return formatArrayFieldLines(extensions)
          }, cellStyle: { maxWidth: '200px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      WirelessAccessPoint: {
        title: 'Wireless Access Points',
        icon: 'wifi',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'SSID', field: 'SSID' },
          { header: 'Security Mode', field: 'SecurityMode' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      DHCPRelay: {
        title: 'DHCP Relays',
        icon: 'router',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Interface', field: 'Interface', cellStyle: { fontFamily: 'monospace', maxWidth: '120px' } },
          { header: 'DHCP Server IP', field: 'DHCPServerIP', getValue: (f) => f.DHCPServerIP || '-', cellStyle: { fontFamily: 'monospace', maxWidth: '200px' } },
          { header: 'IP Family', field: 'IPFamily', cellStyle: { maxWidth: '100px' } },
          { header: 'Relay through IPSec', field: 'RelaythroughIPSec', getValue: (f) => f.RelaythroughIPSec || '-', cellStyle: { maxWidth: '150px' } }
        ]
      },
      AccessTimePolicy: {
        title: 'Access Time Policies',
        icon: 'schedule',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Strategy', field: 'Strategy' },
          { header: 'Schedule', field: 'Schedule' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      DataTransferPolicy: {
        title: 'Data Transfer Policies',
        icon: 'swap_horiz',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Restriction Based On', field: 'RestrictionBasedOn' },
          { header: 'Cycle Type', field: 'CycleType' },
          { header: 'Maximum Data Transfer', field: 'MaximumDataTransferInMB', getValue: (f) => {
            if (f.MaximumDataTransferInMB) return `${f.MaximumDataTransferInMB} MB`
            if (f.MaximumDataTransfer === 'Unlimited') return 'Unlimited'
            return f.MaximumDataTransfer || '-'
          } },
          { header: 'Cycle Data Transfer', field: 'CycleDataTransferInMB', getValue: (f) => {
            if (f.CycleDataTransferInMB) return `${f.CycleDataTransferInMB} MB`
            return f.CycleDataTransfer || '-'
          } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      SurfingQuotaPolicy: {
        title: 'Surfing Quota Policies',
        icon: 'timer',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Cycle Type', field: 'CycleType' },
          { header: 'Validity', field: 'Validity', getValue: (f) => f.Validity === 'Unlimited' ? 'Unlimited' : `${f.Validity} days` },
          { header: 'Maximum Hours', field: 'MaximumHours', getValue: (f) => f.MaximumHours === 'Unlimited' ? 'Unlimited' : `${f.MaximumHours} hours` },
          { header: 'Cycle Hours', field: 'CycleHours', getValue: (f) => f.CycleHours ? `${f.CycleHours} hours` : '-' },
          { header: 'Per Day', field: 'PerDay' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      QoSPolicy: {
        title: 'QoS Policies',
        icon: 'speed',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Policy Based On', field: 'PolicyBasedOn' },
          { header: 'Policy Type', field: 'PolicyType' },
          { header: 'Priority', field: 'Priority' },
          { header: 'Upload Bandwidth', field: 'UploadBandwidth', getValue: (f) => f.UploadBandwidth ? `${f.UploadBandwidth} Kbps` : (f.GuaranteedUploadBandwidth ? `${f.GuaranteedUploadBandwidth} Kbps` : '-') },
          { header: 'Download Bandwidth', field: 'DownloadBandwidth', getValue: (f) => f.DownloadBandwidth ? `${f.DownloadBandwidth} Kbps` : (f.GuaranteedDownloadBandwidth ? `${f.GuaranteedDownloadBandwidth} Kbps` : '-') },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      WirelessNetworks: {
        title: 'Wireless Networks',
        icon: 'wifi',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Hardware Name', field: 'HardwareName', getValue: (f) => f.HardwareName || '-' },
          { header: 'SSID', field: 'SSID', getValue: (f) => f.SSID || '-' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Security Mode', field: 'SecurityMode', getValue: (f) => f.SecurityMode || '-' },
          { header: 'Frequency Band', field: 'FrequencyBand', getValue: (f) => f.FrequencyBand || '-' },
          { header: 'Client Traffic', field: 'ClientTraffic', getValue: (f) => f.ClientTraffic || '-' },
          { header: 'Zone', field: 'Zone', getValue: (f) => f.Zone || '-' },
          { header: 'IP Address', field: 'IPAddress', getValue: (f) => {
            if (!f || !f.IPAddress) return '-'
            const ip = f.IPAddress
            const netmask = f.Netmask
            if (netmask) {
              const cidr = netmaskToCIDR(netmask)
              return cidr ? `${ip}/${cidr}` : ip
            }
            return ip
          }, cellStyle: { fontFamily: 'monospace' } },
          { header: 'Interface Status', field: 'InterfaceStatus', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Client Isolation', field: 'ClientIsolation', getValue: (f) => f.ClientIsolation || '-' },
          { header: 'Hide SSID', field: 'HideSSID', getValue: (f) => f.HideSSID || '-' },
          { header: 'MAC Filtering', field: 'MACFiltering', getValue: (f) => f.MACFiltering || '-' },
          { header: 'Encryption', field: 'Encryption', getValue: (f) => f.Encryption || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      SSLBookMark: {
        title: 'SSL Bookmarks',
        icon: 'bookmark',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'URL', field: 'URL', cellStyle: { maxWidth: '300px', fontFamily: 'monospace', fontSize: '0.7rem' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      RouterAdvertisement: {
        title: 'Router Advertisements',
        icon: 'router',
        columns: [
          { header: 'Interface', field: 'Interface', getValue: (f) => f.Interface || '-', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Min Advertisement Interval', field: 'MinAdvertisementInterval', getValue: (f) => f.MinAdvertisementInterval || '-' },
          { header: 'Max Advertisement Interval', field: 'MaxAdvertisementInterval', getValue: (f) => f.MaxAdvertisementInterval || '-' },
          { header: 'Default Gateway', field: 'DefaultGateway', render: renderStatusBadge, cellStyle: { maxWidth: '150px' } },
          { header: 'Prefix Configuration', field: 'PrefixAdvertisementConfiguration', getValue: (f) => {
            if (!f || !f.PrefixAdvertisementConfiguration) return '-'
            const prefixConfig = f.PrefixAdvertisementConfiguration
            if (prefixConfig.PrefixAdvertisementConfigurationDetail) {
              const details = Array.isArray(prefixConfig.PrefixAdvertisementConfigurationDetail)
                ? prefixConfig.PrefixAdvertisementConfigurationDetail
                : [prefixConfig.PrefixAdvertisementConfigurationDetail]
              const prefixes = details.filter(Boolean).map(d => d.Prefix64 || d.Prefix).filter(Boolean)
              return prefixes.length > 0 ? prefixes.join(', ') : '-'
            }
            return '-'
          }, cellStyle: { maxWidth: '200px' } },
          { header: 'Hop Limit', field: 'HopLimit', getValue: (f) => f.HopLimit || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      SystemModules: {
        title: 'System Modules',
        icon: 'extension',
        columns: [
          { header: 'Module Name', field: 'ModuleName', getValue: (f) => f.ModuleName || '-' },
          { header: 'Action', field: 'Action', render: renderStatusBadge, cellStyle: { maxWidth: '120px' } },
          { header: 'Port', field: 'Port', getValue: (f) => f.Port || '-', cellStyle: { fontFamily: 'monospace' } }
        ]
      },
      AntiVirusHTTPSScanningExceptions: {
        title: 'Anti-Virus HTTPS Scanning Exceptions',
        icon: 'security',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' }
        ]
      },
      CountryGroup: {
        title: 'Country Groups',
        icon: 'group_work',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' },
          { header: 'Countries', field: 'CountryList', getValue: (f) => {
            if (!f.CountryList) return '-'
            const countries = []
            if (Array.isArray(f.CountryList)) {
              f.CountryList.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                  if (item.Country) {
                    const countryArray = Array.isArray(item.Country) ? item.Country : [item.Country]
                    countries.push(...countryArray.filter(Boolean))
                  } else {
                    countries.push(item)
                  }
                } else if (item) {
                  countries.push(item)
                }
              })
            } else if (typeof f.CountryList === 'object') {
              if (f.CountryList.Country) {
                const countryArray = Array.isArray(f.CountryList.Country) ? f.CountryList.Country : [f.CountryList.Country]
                countries.push(...countryArray.filter(Boolean))
              }
            }
            if (countries.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', maxHeight: '150px', overflowY: 'auto', fontSize: '0.7rem' }}>
                {countries.map((country, idx) => {
                  const countryValue = typeof country === 'string' ? country : (country.Country || country || '-')
                  return (
                    <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minWidth: '1.5rem',
                        height: '1.25rem',
                        padding: '0 0.375rem',
                        backgroundColor: '#f3f4f6',
                        color: '#111827',
                        borderRadius: '0.375rem',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ display: 'block', flex: 1 }}>{countryValue}</span>
                    </span>
                  )
                })}
              </div>
            )
          }, cellStyle: { maxWidth: '300px' } }
        ]
      },
      Application: {
        title: 'Applications',
        icon: 'apps',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'App ID', field: 'ApplicationID', getValue: (f) => f.ApplicationID || f.AppID || f.ID || '-', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Category', field: 'Category', getValue: (f) => f.Category || f.CategoryName || '-' },
          { header: 'Technology', field: 'Technology', getValue: (f) => f.Technology || '-' },
          { header: 'Risk', field: 'Risk', getValue: (f) => f.Risk || f.RiskLevel || '-' },
          { header: 'Characteristics', field: 'Characteristics', getValue: (f) => {
            if (!f.Characteristics) return '-'
            if (Array.isArray(f.Characteristics)) return f.Characteristics.join(', ')
            if (typeof f.Characteristics === 'object' && f.Characteristics.Characteristic) {
              const chars = Array.isArray(f.Characteristics.Characteristic) ? f.Characteristics.Characteristic : [f.Characteristics.Characteristic]
              return chars.filter(Boolean).join(', ')
            }
            return String(f.Characteristics)
          }, cellStyle: { maxWidth: '200px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      VPNProfile: {
        title: 'VPN Profiles',
        icon: 'vpn_key',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '250px' } },
          { header: 'Key Exchange', field: 'keyexchange', getValue: (f) => (f.keyexchange || f.KeyExchange || '-').toUpperCase() },
          { header: 'Auth Mode', field: 'AuthenticationMode', getValue: (f) => f.AuthenticationMode || '-' },
          { header: 'Phase 1 Encryption', field: 'Phase1', getValue: (f) => {
            if (!f.Phase1) return '-'
            const algos = []
            for (let i = 1; i <= 5; i++) {
              const enc = f.Phase1[`EncryptionAlgorithm${i}`]
              if (enc) algos.push(enc)
            }
            return algos.length > 0 ? algos.join(', ') : '-'
          }, cellStyle: { maxWidth: '150px' } },
          { header: 'Phase 1 Auth', field: 'Phase1Auth', getValue: (f) => {
            if (!f.Phase1) return '-'
            const algos = []
            for (let i = 1; i <= 5; i++) {
              const auth = f.Phase1[`AuthenticationAlgorithm${i}`]
              if (auth) algos.push(auth)
            }
            return algos.length > 0 ? algos.join(', ') : '-'
          }, cellStyle: { maxWidth: '150px' } },
          { header: 'Phase 1 DH Groups', field: 'Phase1DH', getValue: (f) => {
            if (!f.Phase1?.SupportedDHGroups) return '-'
            const dhGroups = f.Phase1.SupportedDHGroups.DHGroup
            if (!dhGroups) return '-'
            const groups = Array.isArray(dhGroups) ? dhGroups : [dhGroups]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.7rem', maxHeight: '100px', overflowY: 'auto' }}>
                {groups.filter(Boolean).map((g, idx) => (
                  <span key={idx} style={{ fontFamily: 'monospace' }}>{g}</span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '150px' } },
          { header: 'Phase 1 Key Life', field: 'Phase1KeyLife', getValue: (f) => f.Phase1?.KeyLife ? `${f.Phase1.KeyLife}s` : '-' },
          { header: 'Phase 2 Encryption', field: 'Phase2', getValue: (f) => {
            if (!f.Phase2) return '-'
            const algos = []
            for (let i = 1; i <= 5; i++) {
              const enc = f.Phase2[`EncryptionAlgorithm${i}`]
              if (enc) algos.push(enc)
            }
            return algos.length > 0 ? algos.join(', ') : '-'
          }, cellStyle: { maxWidth: '150px' } },
          { header: 'Phase 2 Auth', field: 'Phase2Auth', getValue: (f) => {
            if (!f.Phase2) return '-'
            const algos = []
            for (let i = 1; i <= 5; i++) {
              const auth = f.Phase2[`AuthenticationAlgorithm${i}`]
              if (auth) algos.push(auth)
            }
            return algos.length > 0 ? algos.join(', ') : '-'
          }, cellStyle: { maxWidth: '150px' } },
          { header: 'Phase 2 PFS', field: 'Phase2PFS', getValue: (f) => f.Phase2?.PFSGroup || '-' },
          { header: 'Phase 2 Key Life', field: 'Phase2KeyLife', getValue: (f) => f.Phase2?.KeyLife ? `${f.Phase2.KeyLife}s` : '-' },
          { header: 'DPD', field: 'DPD', getValue: (f) => f.Phase1?.DeadPeerDetection || '-' },
          { header: 'Re-Keying', field: 'AllowReKeying', getValue: (f) => f.AllowReKeying || '-' }
        ]
      },
      WirelessNetworkStatus: {
        title: 'Wireless Network Status',
        icon: 'signal_wifi_4_bar',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } }
        ]
      },
      DecryptionProfile: {
        title: 'Decryption Profiles',
        icon: 'lock_open',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '250px' } },
          { header: 'Default', field: 'IsDefault', getValue: (f) => f.IsDefault || '-' },
          { header: 'Min TLS', field: 'MinTLSVersion', getValue: (f) => f.MinTLSVersion || '-' },
          { header: 'Max TLS', field: 'MaxTLSVersion', getValue: (f) => f.MaxTLSVersion || '-' },
          { header: 'Block Action', field: 'BlockAction', getValue: (f) => f.BlockAction || '-' },
          { header: 'Min RSA Key', field: 'MinRSAKeySize', getValue: (f) => f.MinRSAKeySize || '-' },
          { header: 'Invalid Date', field: 'BlockInvalidDate', getValue: (f) => f.BlockInvalidDate || '-' },
          { header: 'Untrusted Issuer', field: 'BlockUntrustedIssuer', getValue: (f) => f.BlockUntrustedIssuer || '-' },
          { header: 'Self-Signed', field: 'BlockSelfSigned', getValue: (f) => f.BlockSelfSigned || '-' },
          { header: 'Revoked', field: 'BlockRevoked', getValue: (f) => f.BlockRevoked || '-' },
          { header: 'Name Mismatch', field: 'BlockNameMismatch', getValue: (f) => f.BlockNameMismatch || '-' },
          { header: 'SSLv2/v3', field: 'SSLv2SSLv3', getValue: (f) => f.SSLv2SSLv3 || '-' },
          { header: 'SSL Compression', field: 'SSLCompression', getValue: (f) => f.SSLCompression || '-' },
          { header: 'Blocked Algorithms', field: 'BlockedAlgorithmList', getValue: (f) => {
            if (!f.BlockedAlgorithmList) return '-'
            const items = []
            const bal = f.BlockedAlgorithmList
            if (bal.KeyExchangeAlgorithm) {
              const kea = Array.isArray(bal.KeyExchangeAlgorithm) ? bal.KeyExchangeAlgorithm : [bal.KeyExchangeAlgorithm]
              kea.forEach(k => items.push(`KE: ${k}`))
            }
            if (bal.AuthenticationAlgorithm) {
              const aa = Array.isArray(bal.AuthenticationAlgorithm) ? bal.AuthenticationAlgorithm : [bal.AuthenticationAlgorithm]
              aa.forEach(a => items.push(`Auth: ${a}`))
            }
            if (bal.BlockAndStreamCipher) {
              const bsc = Array.isArray(bal.BlockAndStreamCipher) ? bal.BlockAndStreamCipher : [bal.BlockAndStreamCipher]
              bsc.forEach(b => items.push(`Cipher: ${b}`))
            }
            if (bal.HashAlgorithm) {
              const ha = Array.isArray(bal.HashAlgorithm) ? bal.HashAlgorithm : [bal.HashAlgorithm]
              ha.forEach(h => items.push(`Hash: ${h}`))
            }
            if (items.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.7rem', maxHeight: '100px', overflowY: 'auto' }}>
                {items.map((item, idx) => (
                  <span key={idx} style={{ fontFamily: 'monospace' }}>{item}</span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '180px' } }
        ]
      },
      AnitSpamTrustedDomain: {
        title: 'Anti-Spam Trusted Domains',
        icon: 'mark_email_read',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Domain', field: 'Domain', getValue: (f) => f.Domain || f.TrustedDomain || '-', cellStyle: { fontFamily: 'monospace' } },
          { header: 'Type', field: 'Type', getValue: (f) => f.Type || f.DomainType || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      },
      ContentConditionList: {
        title: 'Content Condition Lists',
        icon: 'checklist',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' },
          { header: 'Key', field: 'Key', getValue: (f) => f.Key || '-', cellStyle: { fontFamily: 'monospace' } }
        ]
      },
      MTADataControlList: {
        title: 'MTA Data Control Lists',
        icon: 'mail_lock',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Signatures', field: 'Signatures', getValue: (f) => {
            if (!f.Signatures) return '-'
            const sigList = []
            if (f.Signatures.Signature) {
              const sigArray = Array.isArray(f.Signatures.Signature) ? f.Signatures.Signature : [f.Signatures.Signature]
              sigList.push(...sigArray.filter(Boolean).map(sig => String(sig).trim()).filter(Boolean))
            } else if (Array.isArray(f.Signatures)) {
              sigList.push(...f.Signatures.filter(Boolean).map(sig => String(sig).trim()).filter(Boolean))
            }
            if (sigList.length === 0) return '-'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', maxHeight: '150px', overflowY: 'auto', fontSize: '0.7rem' }}>
                {sigList.map((sig, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '1.5rem',
                      height: '1.25rem',
                      padding: '0 0.375rem',
                      backgroundColor: '#f3f4f6',
                      color: '#111827',
                      borderRadius: '0.375rem',
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ display: 'block', flex: 1 }}>{sig}</span>
                  </span>
                ))}
              </div>
            )
          }, cellStyle: { maxWidth: '400px' } }
        ]
      },
      ClientlessPolicy: {
        title: 'Clientless Policies',
        icon: 'policy',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '250px' } },
          { header: 'Bookmarks', field: 'Bookmarks', getValue: (f) => {
            // Try WebAccessibleResources.Bookmarks first
            if (f.WebAccessibleResources?.Bookmarks) {
              const bookmarks = f.WebAccessibleResources.Bookmarks
              const items = Array.isArray(bookmarks) ? bookmarks : [bookmarks]
              return items.filter(Boolean).join(', ') || '-'
            }
            // Fallback to direct Bookmarks field
            if (f.Bookmarks) {
              const items = Array.isArray(f.Bookmarks) ? f.Bookmarks : [f.Bookmarks]
              return items.filter(Boolean).join(', ') || '-'
            }
            return '-'
          }, cellStyle: { maxWidth: '300px' } }
        ]
      },
      SMSGateway: {
        title: 'SMS Gateways',
        icon: 'sms',
        columns: [
          { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
          { header: 'Gateway URL', field: 'GatewayURL', getValue: (f) => f.GatewayURL || f.URL || '-', cellStyle: { fontFamily: 'monospace', maxWidth: '300px' } },
          { header: 'Provider', field: 'Provider', getValue: (f) => f.Provider || f.SMSProvider || '-' },
          { header: 'Username', field: 'Username', getValue: (f) => f.Username || f.User || '-' },
          { header: 'Request Method', field: 'RequestMethod', getValue: (f) => f.RequestMethod || f.Method || 'POST' },
          { header: 'Status', field: 'Status', render: renderStatusBadge, cellStyle: { maxWidth: '100px' } },
          { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
        ]
      }
    }

    return configs[tag] || null
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Build comprehensive entity counts and table of contents
  const entityCounts = {
    firewallRules: filteredRules.length,
    enabledRules: filteredRules.filter(r => r.status === 'Enable').length,
    disabledRules: filteredRules.filter(r => r.status !== 'Enable').length,
    userPolicies: filteredRules.filter(r => r.policyType === 'User').length,
    networkPolicies: filteredRules.filter(r => r.policyType === 'Network').length,
    ipHosts: data.ipHosts?.length || 0,
    fqdnHosts: data.fqdnHosts?.length || 0,
    macHosts: data.macHosts?.length || 0,
    services: data.services?.length || 0,
    groups: data.groups?.length || 0,
    fqdnHostGroups: data.fqdnHostGroups?.length || 0,
    ipHostGroups: data.ipHostGroups?.length || 0,
    serviceGroups: data.serviceGroups?.length || 0,
  }

  // Add dynamic entity counts (exclude After and GroupDetail as they're nested within other entities)
  const dynamicEntities = {}
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && !['After', 'GroupDetail'].includes(tag)) {
        // For SSLVPNPolicy, count TunnelPolicy entries instead of SSLVPNPolicy items
        if (tag === 'SSLVPNPolicy') {
          let tunnelPolicyCount = 0
          items.forEach(item => {
            const fields = item.fields || {}
            const tunnelPolicies = fields.TunnelPolicy
            if (Array.isArray(tunnelPolicies)) {
              tunnelPolicyCount += tunnelPolicies.length
            } else if (tunnelPolicies && typeof tunnelPolicies === 'object') {
              tunnelPolicyCount += 1
            }
          })
          dynamicEntities[tag] = tunnelPolicyCount
        } else if (tag === 'UserGroup') {
          // For UserGroup, count GroupDetail entries instead of UserGroup items
          let groupDetailCount = 0
          items.forEach(item => {
            const fields = item.fields || {}
            const groupDetails = fields.GroupDetail
            if (Array.isArray(groupDetails)) {
              groupDetailCount += groupDetails.filter(d => typeof d === 'object' && d !== null).length
            } else if (typeof groupDetails === 'object' && groupDetails !== null && groupDetails.GroupDetail) {
              const detailArray = Array.isArray(groupDetails.GroupDetail) ? groupDetails.GroupDetail : [groupDetails.GroupDetail]
              groupDetailCount += detailArray.filter(d => typeof d === 'object' && d !== null).length
            } else if (typeof groupDetails === 'object' && groupDetails !== null) {
              groupDetailCount += 1
            }
          })
          dynamicEntities[tag] = groupDetailCount
        } else if (tag === 'ApplicationClassificationBatchAssignment') {
          // For ApplicationClassificationBatchAssignment, count ClassAssignment entries
          let classAssignmentCount = 0
          items.forEach(item => {
            const fields = item.fields || {}
            const classAssignmentList = fields.ClassAssignmentList
            if (Array.isArray(classAssignmentList)) {
              classAssignmentCount += classAssignmentList.filter(a => typeof a === 'object' && a !== null).length
            } else if (typeof classAssignmentList === 'object' && classAssignmentList !== null && classAssignmentList.ClassAssignment) {
              const assignmentArray = Array.isArray(classAssignmentList.ClassAssignment) ? classAssignmentList.ClassAssignment : [classAssignmentList.ClassAssignment]
              classAssignmentCount += assignmentArray.filter(a => typeof a === 'object' && a !== null).length
            } else if (typeof classAssignmentList === 'object' && classAssignmentList !== null) {
              classAssignmentCount += 1
            }
          })
          dynamicEntities[tag] = classAssignmentCount
        } else {
        dynamicEntities[tag] = items.length
        }
      }
    })
  }

  const totalEntities = Object.values(entityCounts).reduce((a, b) => a + b, 0) + 
                        Object.values(dynamicEntities).reduce((a, b) => a + b, 0)

  // Icon mapping for entity types - comprehensive with unique icons for all entities
  const getEntityIcon = (tagName) => {
    const iconMap = {
      // Host Objects
      IPHost: 'dns', FQDNHost: 'language', MACHost: 'devices',
      // Groups
      Group: 'groups', FQDNHostGroup: 'group_work', IPHostGroup: 'group_work', ServiceGroup: 'group_work',
      // Services
      Service: 'construction', Services: 'build',
      // Interfaces & Network
      Interface: 'settings_ethernet', VLAN: 'network_check', Alias: 'label', Port: 'portable_wifi_off', LAG: 'hub',
      WirelessNetworks: 'wifi', WirelessAccessPoint: 'router', WirelessNetworkStatus: 'signal_wifi_statusbar_4_bar',
      // Firewall Rules
      FirewallRule: 'shield', UserPolicy: 'person', NetworkPolicy: 'account_tree',
      // Security & Policies
      Country: 'flag', WebFilterPolicy: 'filter_alt', Schedule: 'schedule',
      Zone: 'location_city', Network: 'router', ApplicationClassificationBatchAssignment: 'apps',
      WebFilter: 'web', IntrusionPrevention: 'security', VirusScanning: 'scanner',
      IPSPolicy: 'security',
      // Advanced Threat Protection & Threat Intelligence
      ATP: 'bug_report', AdvancedThreatProtection: 'bug_report',
      ThirdPartyFeed: 'rss_feed', ThirdPartyThreatFeed: 'rss_feed', ThreatFeed: 'rss_feed',
      ThreatIntelligence: 'psychology', ThreatIntelligenceFeed: 'psychology',
      // Notifications & Alerts
      Notification: 'notifications', Notifications: 'notifications', NotificationSettings: 'notifications_active',
      Alert: 'notifications_active', AlertSettings: 'notifications_active',
      // QoS & Traffic Management
      QoS: 'speed', QoSPolicy: 'speed', QualityOfService: 'speed',
      TrafficShaping: 'tune', BandwidthManagement: 'tune', TrafficPolicy: 'tune',
      // Certificates
      CertificateAuthority: 'verified', SelfSignedCertificate: 'verified_user', Certificate: 'verified_user',
      // Network & System
      DefaultCaptivePortal: 'web', PopImapScanning: 'mail', PatternDownload: 'download',
      REDDevice: 'devices', ZoneType: 'dns', RoutingTable: 'route',
      // VPN & Remote Access
      VPN: 'vpn_key', VPNPolicy: 'vpn_key', VPNConfiguration: 'vpn_key',
      RemoteAccess: 'remote_desktop', RemoteAccessPolicy: 'remote_desktop',
      // Authentication & Identity
      Authentication: 'fingerprint', AuthenticationPolicy: 'fingerprint',
      IdentityProvider: 'account_circle', LDAP: 'account_tree', ActiveDirectory: 'account_tree',
      // Application Control
      ApplicationControl: 'apps', ApplicationPolicy: 'apps', ApplicationClassification: 'apps',
      // Content Filtering
      ContentFilter: 'filter_list', ContentFilterPolicy: 'filter_list',
      // Logging & Reporting
      Logging: 'description', LoggingPolicy: 'description', LogSettings: 'description',
      Reporting: 'assessment', ReportSettings: 'assessment', AuditLog: 'description',
      // System Settings
      SystemSettings: 'settings', SystemConfiguration: 'settings',
      SNMP: 'monitor', SNMPSettings: 'monitor',
      NTP: 'schedule', NTPSettings: 'schedule',
      // Backup & Maintenance
      Backup: 'backup', BackupSettings: 'backup', Maintenance: 'build',
      // High Availability & Clustering
      HighAvailability: 'sync', Cluster: 'hub', ClusterNode: 'hub',
      // DHCP & DNS
      DHCP: 'dns', DHCPSettings: 'dns', DHCPServer: 'dns',
      DNSSettings: 'dns', DNSServer: 'dns',
      // Email & Messaging
      Email: 'mail', EmailPolicy: 'mail', SMTP: 'mail', POP3: 'mail', IMAP: 'mail',
      // File Transfer
      FTP: 'folder', FTPSettings: 'folder', SFTP: 'folder',
      // Web Proxy
      Proxy: 'http', ProxySettings: 'http', ProxyPolicy: 'http',
      // Firewall Settings
      FirewallSettings: 'security', FirewallConfiguration: 'security',
      // NAT & Routing
      NAT: 'swap_horiz', NATPolicy: 'swap_horiz', NATRule: 'swap_horiz',
      StaticRoute: 'route', DynamicRoute: 'route',
      // User Management
      User: 'person', UserGroup: 'group',
      // Time & Scheduling
      Time: 'access_time', TimePolicy: 'schedule_send', TimeSettings: 'access_time',
      DateTime: 'calendar_today', DateTimeSettings: 'calendar_today',
      // Form Templates
      FormTemplate: 'description', Template: 'description',
      // Other common entities
      Policy: 'policy', Configuration: 'settings', Settings: 'settings',
      Rule: 'rule', RuleGroup: 'folder',
    }
    // If not found in map, try to derive icon from tag name
    if (!iconMap[tagName]) {
      const lowerTag = tagName.toLowerCase()
      // Pattern matching for common suffixes/prefixes
      if (lowerTag.includes('policy')) return 'policy'
      if (lowerTag.includes('settings') || lowerTag.includes('configuration')) return 'settings'
      if (lowerTag.includes('feed')) return 'rss_feed'
      if (lowerTag.includes('notification') || lowerTag.includes('alert')) return 'notifications'
      if (lowerTag.includes('qos') || lowerTag.includes('traffic')) return 'speed'
      if (lowerTag.includes('threat') || lowerTag.includes('atp')) return 'bug_report'
      if (lowerTag.includes('certificate') || lowerTag.includes('cert')) return 'verified'
      if (lowerTag.includes('user') || lowerTag.includes('identity')) return 'person'
      if (lowerTag.includes('group')) return 'group_work'
      if (lowerTag.includes('network') || lowerTag.includes('interface')) return 'router'
      if (lowerTag.includes('security') || lowerTag.includes('firewall')) return 'shield'
      if (lowerTag.includes('vpn') || lowerTag.includes('remote')) return 'vpn_key'
      if (lowerTag.includes('backup') || lowerTag.includes('maintenance')) return 'backup'
      if (lowerTag.includes('log') || lowerTag.includes('audit')) return 'description'
      if (lowerTag.includes('email') || lowerTag.includes('mail') || lowerTag.includes('smtp')) return 'mail'
      if (lowerTag.includes('dns') || lowerTag.includes('dhcp')) return 'dns'
      if (lowerTag.includes('nat') || lowerTag.includes('route')) return 'route'
      if (lowerTag.includes('template') || lowerTag.includes('form')) return 'description'
      if (lowerTag.includes('time') || lowerTag.includes('schedule') || lowerTag.includes('ntp')) return 'access_time'
      // Default fallback
      return 'table_rows'
    }
    return iconMap[tagName]
  }

  // Comprehensive color mapping for entity types using Material Design colors
  const getEntityColor = (tagName) => {
    const colorMap = {
      // Host Objects
      IPHost: 'text-blue-600', ipHosts: 'text-blue-600',
      FQDNHost: 'text-emerald-600', fqdnHosts: 'text-emerald-600',
      MACHost: 'text-purple-600', macHosts: 'text-purple-600',
      // Groups
      Group: 'text-indigo-600', groups: 'text-indigo-600',
      FQDNHostGroup: 'text-indigo-600', fqdnHostGroups: 'text-indigo-600',
      IPHostGroup: 'text-indigo-600', ipHostGroups: 'text-indigo-600',
      ServiceGroup: 'text-indigo-600', serviceGroups: 'text-indigo-600',
      // Services
      Service: 'text-amber-600', Services: 'text-amber-600', services: 'text-amber-600',
      // Interfaces & Network
      Interface: 'text-blue-500', interfaces: 'text-blue-500',
      VLAN: 'text-purple-500', vlan: 'text-purple-500',
      Alias: 'text-green-500', alias: 'text-green-500',
      Port: 'text-cyan-500', port: 'text-cyan-500',
      LAG: 'text-orange-500', lag: 'text-orange-500',
      WirelessNetworks: 'text-cyan-600', wirelessNetworks: 'text-cyan-600',
      WirelessAccessPoint: 'text-cyan-600', wirelessAccessPoint: 'text-cyan-600',
      portsWithVlans: 'text-blue-500',
      // Firewall Rules
      FirewallRule: 'text-blue-700', firewallRules: 'text-blue-700',
      UserPolicy: 'text-indigo-600', userPolicy: 'text-indigo-600',
      NetworkPolicy: 'text-blue-600', networkPolicy: 'text-blue-600',
      // Security & Policies
      Country: 'text-red-600', country: 'text-red-600',
      WebFilterPolicy: 'text-emerald-600', webFilterPolicy: 'text-emerald-600',
      Schedule: 'text-blue-500', schedule: 'text-blue-500',
      Zone: 'text-purple-600', zone: 'text-purple-600',
      Network: 'text-blue-600', network: 'text-blue-600',
      ApplicationClassificationBatchAssignment: 'text-orange-600',
      WebFilter: 'text-teal-600', webFilter: 'text-teal-600',
      IntrusionPrevention: 'text-rose-600', intrusionPrevention: 'text-rose-600',
      VirusScanning: 'text-amber-600', virusScanning: 'text-amber-600',
      IPSPolicy: 'text-red-600', ipsPolicy: 'text-red-600',
      securityPolicies: 'text-red-600',
      // Advanced Threat Protection & Threat Intelligence
      ATP: 'text-red-700', atp: 'text-red-700',
      AdvancedThreatProtection: 'text-red-700',
      ThirdPartyFeed: 'text-purple-500', thirdPartyFeed: 'text-purple-500',
      ThirdPartyThreatFeed: 'text-purple-600', thirdPartyThreatFeed: 'text-purple-600',
      ThreatFeed: 'text-purple-600', threatFeed: 'text-purple-600',
      ThreatIntelligence: 'text-purple-700', threatIntelligence: 'text-purple-700',
      // Notifications & Alerts
      Notification: 'text-amber-500', Notifications: 'text-amber-500', notification: 'text-amber-500',
      NotificationSettings: 'text-amber-600',
      Alert: 'text-red-500', alert: 'text-red-500',
      AlertSettings: 'text-red-600',
      // QoS & Traffic Management
      QoS: 'text-cyan-600', qos: 'text-cyan-600',
      QoSPolicy: 'text-cyan-600', qosPolicy: 'text-cyan-600',
      QualityOfService: 'text-cyan-600',
      TrafficShaping: 'text-purple-500', trafficShaping: 'text-purple-500',
      BandwidthManagement: 'text-purple-500',
      TrafficPolicy: 'text-purple-500',
      // Certificates
      CertificateAuthority: 'text-green-600', certificateAuthority: 'text-green-600',
      SelfSignedCertificate: 'text-green-500', selfSignedCertificate: 'text-green-500',
      Certificate: 'text-green-600', certificate: 'text-green-600',
      certificates: 'text-green-600',
      // Network & System
      DefaultCaptivePortal: 'text-teal-600',
      PopImapScanning: 'text-blue-500',
      PatternDownload: 'text-cyan-500',
      REDDevice: 'text-purple-600', redDevice: 'text-purple-600',
      ZoneType: 'text-blue-500',
      RoutingTable: 'text-blue-600',
      networkConfig: 'text-blue-600',
      // VPN & Remote Access
      VPN: 'text-indigo-600', vpn: 'text-indigo-600',
      VPNPolicy: 'text-indigo-600',
      VPNConfiguration: 'text-indigo-600',
      RemoteAccess: 'text-purple-500', remoteAccess: 'text-purple-500',
      RemoteAccessPolicy: 'text-purple-500',
      // Authentication & Identity
      Authentication: 'text-green-600', authentication: 'text-green-600',
      AuthenticationPolicy: 'text-green-600',
      IdentityProvider: 'text-indigo-500',
      LDAP: 'text-indigo-500', ldap: 'text-indigo-500',
      ActiveDirectory: 'text-indigo-500',
      // Application Control
      ApplicationControl: 'text-orange-600', applicationControl: 'text-orange-600',
      ApplicationPolicy: 'text-orange-600',
      ApplicationClassification: 'text-orange-600',
      // Content Filtering
      ContentFilter: 'text-teal-500', contentFilter: 'text-teal-500',
      ContentFilterPolicy: 'text-teal-500',
      // Logging & Reporting
      Logging: 'text-gray-600', logging: 'text-gray-600',
      LoggingPolicy: 'text-gray-600',
      LogSettings: 'text-gray-600',
      Reporting: 'text-purple-500', reporting: 'text-purple-500',
      ReportSettings: 'text-purple-500',
      AuditLog: 'text-gray-600',
      // System Settings
      SystemSettings: 'text-gray-700', systemSettings: 'text-gray-700',
      SystemConfiguration: 'text-gray-700',
      SNMP: 'text-blue-500', snmp: 'text-blue-500',
      SNMPSettings: 'text-blue-500',
      NTP: 'text-blue-500', ntp: 'text-blue-500',
      NTPSettings: 'text-blue-500',
      // Backup & Maintenance
      Backup: 'text-green-600', backup: 'text-green-600',
      BackupSettings: 'text-green-600',
      Maintenance: 'text-gray-600', maintenance: 'text-gray-600',
      // High Availability & Clustering
      HighAvailability: 'text-cyan-600', highAvailability: 'text-cyan-600',
      Cluster: 'text-indigo-500', cluster: 'text-indigo-500',
      ClusterNode: 'text-indigo-500',
      // DHCP & DNS
      DHCP: 'text-blue-500', dhcp: 'text-blue-500',
      DHCPSettings: 'text-blue-500',
      DHCPServer: 'text-blue-500',
      DNSSettings: 'text-blue-500',
      DNSServer: 'text-blue-500',
      // Email & Messaging
      Email: 'text-blue-500', email: 'text-blue-500',
      EmailPolicy: 'text-blue-500',
      SMTP: 'text-blue-500', smtp: 'text-blue-500',
      POP3: 'text-blue-500', pop3: 'text-blue-500',
      IMAP: 'text-blue-500', imap: 'text-blue-500',
      // File Transfer
      FTP: 'text-green-500', ftp: 'text-green-500',
      FTPSettings: 'text-green-500',
      SFTP: 'text-green-600', sftp: 'text-green-600',
      // Web Proxy
      Proxy: 'text-teal-500', proxy: 'text-teal-500',
      ProxySettings: 'text-teal-500',
      ProxyPolicy: 'text-teal-500',
      // Firewall Settings
      FirewallSettings: 'text-blue-700', firewallSettings: 'text-blue-700',
      FirewallConfiguration: 'text-blue-700',
      // NAT & Routing
      NAT: 'text-purple-500', nat: 'text-purple-500',
      NATPolicy: 'text-purple-500',
      NATRule: 'text-purple-500',
      StaticRoute: 'text-blue-600',
      DynamicRoute: 'text-blue-500',
      // User Management
      User: 'text-indigo-500', user: 'text-indigo-500',
      UserGroup: 'text-indigo-500', userGroup: 'text-indigo-500',
      // Time & Scheduling
      Time: 'text-blue-500', time: 'text-blue-500',
      TimePolicy: 'text-blue-600', timePolicy: 'text-blue-600',
      TimeSettings: 'text-blue-500',
      DateTime: 'text-blue-500', dateTime: 'text-blue-500',
      DateTimeSettings: 'text-blue-500',
      // Form Templates
      FormTemplate: 'text-gray-600', formTemplate: 'text-gray-600',
      Template: 'text-gray-600', template: 'text-gray-600',
      // Other common entities
      Policy: 'text-indigo-600', policy: 'text-indigo-600',
      Configuration: 'text-gray-700', configuration: 'text-gray-700',
      Settings: 'text-gray-700', settings: 'text-gray-700',
      Rule: 'text-blue-700', rule: 'text-blue-700',
      RuleGroup: 'text-indigo-500',
    }
    // Pattern matching for colors
    if (!colorMap[tagName]) {
      const lowerTag = tagName.toLowerCase()
      if (lowerTag.includes('time') || lowerTag.includes('schedule') || lowerTag.includes('ntp')) return 'text-blue-500'
      if (lowerTag.includes('threat') || lowerTag.includes('atp')) return 'text-red-700'
      if (lowerTag.includes('notification') || lowerTag.includes('alert')) return 'text-amber-500'
      if (lowerTag.includes('qos') || lowerTag.includes('traffic')) return 'text-cyan-600'
      if (lowerTag.includes('certificate') || lowerTag.includes('cert')) return 'text-green-600'
      if (lowerTag.includes('user') || lowerTag.includes('identity')) return 'text-indigo-500'
      if (lowerTag.includes('group')) return 'text-indigo-600'
      if (lowerTag.includes('network') || lowerTag.includes('interface')) return 'text-blue-500'
      if (lowerTag.includes('security') || lowerTag.includes('firewall')) return 'text-blue-700'
      if (lowerTag.includes('vpn') || lowerTag.includes('remote')) return 'text-indigo-600'
      if (lowerTag.includes('backup')) return 'text-green-600'
      if (lowerTag.includes('log') || lowerTag.includes('audit')) return 'text-gray-600'
      if (lowerTag.includes('email') || lowerTag.includes('mail')) return 'text-blue-500'
      if (lowerTag.includes('dns') || lowerTag.includes('dhcp')) return 'text-blue-500'
      if (lowerTag.includes('nat') || lowerTag.includes('route')) return 'text-blue-600'
      if (lowerTag.includes('feed')) return 'text-purple-500'
      if (lowerTag.includes('template') || lowerTag.includes('form')) return 'text-gray-600'
      // Default fallback - use a nice color instead of gray
      const defaultColors = ['text-blue-600', 'text-indigo-600', 'text-purple-600', 'text-pink-600', 'text-rose-600', 'text-orange-600', 'text-amber-600', 'text-yellow-600', 'text-lime-600', 'text-green-600', 'text-emerald-600', 'text-teal-600', 'text-cyan-600']
      const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return defaultColors[hash % defaultColors.length]
    }
    return colorMap[tagName]
  }

  // Build list of all available sections for sidebar - Organized by Administrator workflow
  const allSections = []
  
  // === SECTION 1: HOST OBJECTS (First - as admins configure these first) ===
  // Individual host types (flat structure - no grouping)
  if (entityCounts.ipHosts > 0) allSections.push({ key: 'ipHosts', name: 'IP Hosts', icon: 'dns', count: entityCounts.ipHosts })
  if (entityCounts.fqdnHosts > 0) allSections.push({ key: 'fqdnHosts', name: 'FQDN Hosts', icon: 'language', count: entityCounts.fqdnHosts })
  if (entityCounts.macHosts > 0) allSections.push({ key: 'macHosts', name: 'MAC Hosts', icon: 'devices', count: entityCounts.macHosts })
  
  // === SECTION 2: INTERFACES & NETWORK (Second - network configuration) ===
  if ((data.entitiesByTag?.Interface?.length > 0) || 
      (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
      (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
      (data.entitiesByTag?.WirelessNetwork?.length > 0)) {
    const interfaceCount = Math.max(
      data.entitiesByTag?.Interface?.length || 0,
      Object.keys(data.portsWithEntities || {}).length || 0,
      Object.keys(data.lagsWithMembers || {}).length || 0,
      data.entitiesByTag?.WirelessNetwork?.length || 0
    )
    allSections.push({ 
      key: 'portsWithVlans', 
      name: 'Interfaces & Network', 
      icon: 'settings_ethernet', 
      count: interfaceCount
    })
  }
  
  // === SECTION 3: FIREWALL RULES (Third - rules after objects and interfaces) ===
  if (filteredRules.length > 0) {
    allSections.push({ key: 'firewallRules', name: 'Firewall Rules', icon: 'summarize', count: filteredRules.length })
  }
  
  // === SECTION 3.5: SSL/TLS INSPECTION RULES ===
  if (data.sslTlsInspectionRules && data.sslTlsInspectionRules.length > 0) {
    allSections.push({ key: 'sslTlsInspectionRules', name: 'SSL/TLS Inspection Rules', icon: 'lock', count: data.sslTlsInspectionRules.length })
  }
  
  // === SECTION 3.6: NAT RULES ===
  if (data.entitiesByTag?.NATRule?.length > 0) {
    allSections.push({ key: 'NATRule', name: 'NAT Rules', icon: 'swap_horiz', count: data.entitiesByTag.NATRule.length })
  }
  
  // === SECTION 4: GROUPS (Fourth - groups after individual objects) ===
  // Show individual group types directly (no wrapper)
  if (entityCounts.fqdnHostGroups > 0) allSections.push({ key: 'fqdnHostGroups', name: 'FQDN Host Groups', icon: 'group_work', count: entityCounts.fqdnHostGroups })
  if (entityCounts.ipHostGroups > 0) allSections.push({ key: 'ipHostGroups', name: 'IP Host Groups', icon: 'group_work', count: entityCounts.ipHostGroups })
  if (entityCounts.serviceGroups > 0) allSections.push({ key: 'serviceGroups', name: 'Service Groups', icon: 'group_work', count: entityCounts.serviceGroups })
  if (entityCounts.groups > 0) allSections.push({ key: 'groups', name: 'Other Groups', icon: 'groups', count: entityCounts.groups })
  
  // === SECTION 5: SERVICES (Fifth - services after groups) ===
  if (entityCounts.services > 0) {
    allSections.push({ key: 'services', name: 'Services', icon: 'construction', count: entityCounts.services })
  }
  
  // === SECTION 7: SECURITY POLICIES ===
  // Individual security policy types (flat structure - no grouping)
  if (dynamicEntities.WebFilterPolicy) allSections.push({ key: 'WebFilterPolicy', name: 'Web Filter Policies', icon: 'filter_alt', count: dynamicEntities.WebFilterPolicy })
  if (dynamicEntities.Schedule) allSections.push({ key: 'Schedule', name: 'Schedules', icon: 'schedule', count: dynamicEntities.Schedule })
  if (dynamicEntities.Country) allSections.push({ key: 'Country', name: 'Countries', icon: 'flag', count: dynamicEntities.Country })
  if (dynamicEntities.IPSPolicy) allSections.push({ key: 'IPSPolicy', name: 'IPS Policies', icon: 'security', count: dynamicEntities.IPSPolicy })
  if (dynamicEntities.IntrusionPrevention) allSections.push({ key: 'IntrusionPrevention', name: 'Intrusion Prevention', icon: 'security', count: dynamicEntities.IntrusionPrevention })
  if (dynamicEntities.VirusScanning) allSections.push({ key: 'VirusScanning', name: 'Virus Scanning', icon: 'scanner', count: dynamicEntities.VirusScanning })
  if (dynamicEntities.WebFilter) allSections.push({ key: 'WebFilter', name: 'Web Filters', icon: 'web', count: dynamicEntities.WebFilter })
  
  // === SECTION 7: CERTIFICATES (Removed - certificate types are shown individually in Additional Entities) ===
  
  // === SECTION 8: NETWORK & SYSTEM CONFIGURATION ===
  if (dynamicEntities.Zone) allSections.push({ key: 'Zone', name: 'Zones', icon: 'location_city', count: dynamicEntities.Zone })
  if (dynamicEntities.Network) allSections.push({ key: 'Network', name: 'Networks', icon: 'router', count: dynamicEntities.Network })
  if (dynamicEntities.REDDevice) allSections.push({ key: 'REDDevice', name: 'RED Devices', icon: 'devices', count: dynamicEntities.REDDevice })
  if (dynamicEntities.WirelessAccessPoint) allSections.push({ key: 'WirelessAccessPoint', name: 'Wireless Access Points', icon: 'wifi', count: dynamicEntities.WirelessAccessPoint })
  
  // === SECTION 10: ADDITIONAL ENTITIES (Remaining entities) ===
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && ![
        'IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
        'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork',
        'SelfSignedCertificate','Zone','Network','REDDevice','WirelessAccessPoint',
        'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter','NATRule','After','GroupDetail',
        'Gateway','XFRMInterface' // Exclude Gateway and XFRMInterface as they're shown in other configurations
      ].includes(tag)) {
        // Use dynamicEntities count (which has special handling for SSLVPNPolicy TunnelPolicy count)
        const count = dynamicEntities[tag] || items.length
        allSections.push({ key: tag, name: tag, icon: getEntityIcon(tag), count: count })
      }
    })
  }
  
  // Filter sections by search
  let filteredSections = allSections.filter(section => 
    section.name.toLowerCase().includes(sectionSearch.toLowerCase())
  )
  
  // Apply sorting
  if (sortOption !== 'default') {
    filteredSections = [...filteredSections].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'count-desc':
          return (b.count || 0) - (a.count || 0)
        case 'count-asc':
          return (a.count || 0) - (b.count || 0)
        default:
          return 0
      }
    })
  }

  // Table of Contents sections - Updated to match new organization
  const tocSections = []
  if (entityCounts.ipHosts > 0) {
    tocSections.push({ name: 'IP Hosts', icon: 'dns', id: 'ip-hosts' })
  }
  if (entityCounts.fqdnHosts > 0) {
    tocSections.push({ name: 'FQDN Hosts', icon: 'language', id: 'fqdn-hosts' })
  }
  if (entityCounts.macHosts > 0) {
    tocSections.push({ name: 'MAC Hosts', icon: 'devices', id: 'mac-hosts' })
  }
  if ((data.entitiesByTag?.Interface?.length > 0) || 
      (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
      (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
      (data.entitiesByTag?.WirelessNetwork && data.entitiesByTag.WirelessNetwork.length > 0)) {
    tocSections.push({ name: 'Interfaces & Network', icon: 'settings_ethernet', id: 'ports-vlans-aliases' })
  }
  if (filteredRules.length > 0) tocSections.push({ name: 'Firewall Rules', icon: 'shield', id: 'firewall-rules' })
  if (entityCounts.fqdnHostGroups > 0) tocSections.push({ name: 'FQDN Host Groups', icon: 'group_work', id: 'fqdn-host-groups' })
  if (entityCounts.ipHostGroups > 0) tocSections.push({ name: 'IP Host Groups', icon: 'group_work', id: 'ip-host-groups' })
  if (entityCounts.serviceGroups > 0) tocSections.push({ name: 'Service Groups', icon: 'group_work', id: 'service-groups' })
  if (entityCounts.groups > 0) tocSections.push({ name: 'Other Groups', icon: 'groups', id: 'groups' })
  if (entityCounts.services > 0) {
    tocSections.push({ name: 'Services', icon: 'construction', id: 'services-section' })
  }
  if (dynamicEntities.WebFilterPolicy) {
    tocSections.push({ name: 'Web Filter Policies', icon: 'filter_alt', id: 'webfilter-policies' })
  }
  if (dynamicEntities.Schedule) {
    tocSections.push({ name: 'Schedules', icon: 'schedule', id: 'schedules' })
  }
  if (dynamicEntities.Country) {
    tocSections.push({ name: 'Countries', icon: 'flag', id: 'countries' })
  }
  if (dynamicEntities.IPSPolicy) {
    tocSections.push({ name: 'IPS Policies', icon: 'security', id: 'ips-policies' })
  }
  if (dynamicEntities.IntrusionPrevention) {
    tocSections.push({ name: 'Intrusion Prevention', icon: 'security', id: 'intrusion-prevention' })
  }
  if (dynamicEntities.VirusScanning) {
    tocSections.push({ name: 'Virus Scanning', icon: 'scanner', id: 'virus-scanning' })
  }
  if (dynamicEntities.WebFilter) {
    tocSections.push({ name: 'Web Filters', icon: 'web', id: 'web-filters' })
  }
  if (dynamicEntities.Zone) {
    tocSections.push({ name: 'Zones', icon: 'location_city', id: 'zones' })
  }
  if (dynamicEntities.Network) {
    tocSections.push({ name: 'Networks', icon: 'router', id: 'networks' })
  }
  if (dynamicEntities.REDDevice) {
    tocSections.push({ name: 'RED Devices', icon: 'devices', id: 'red-devices' })
  }
  if (dynamicEntities.WirelessAccessPoint) {
    tocSections.push({ name: 'Wireless Access Points', icon: 'wifi', id: 'wireless-access-points' })
  }
  if (data.entitiesByTag && Object.keys(data.entitiesByTag).some(tag => 
    !['IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
      'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork',
      'CertificateAuthority','SelfSignedCertificate','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
      'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter'].includes(tag) &&
      data.entitiesByTag[tag]?.length > 0
  )) {
    tocSections.push({ name: 'Additional Objects', icon: 'view_list', id: 'additional-objects' })
  }

  return (
    <div className="report-container bg-white" id="report-view" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Sidebar - Select Sections to Display */}
      <div className="w-56 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col" style={{ maxHeight: '100vh' }}>
        <div className="p-2 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Select Sections to Display</h3>
          <input
            type="text"
            placeholder="Search sections..."
            value={sectionSearch}
            onChange={(e) => setSectionSearch(e.target.value)}
            className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none mb-1.5"
            style={{ 
              '--tw-ring-color': '#005BC8'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 1px #005BC8'}
            onBlur={(e) => e.target.style.boxShadow = ''}
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none mb-1.5"
            style={{ 
              '--tw-ring-color': '#005BC8',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 1px #005BC8'}
            onBlur={(e) => e.target.style.boxShadow = ''}
          >
            <option value="default">Sort: Default</option>
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="count-desc">Sort: Count (High to Low)</option>
            <option value="count-asc">Sort: Count (Low to High)</option>
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={handleSelectAll}
              disabled={isSelectionLoading}
              className="flex-1 px-1.5 py-1 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              style={{ 
                backgroundColor: '#005BC8',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
              onMouseEnter={(e) => !isSelectionLoading && (e.target.style.backgroundColor = '#004A9F')}
              onMouseLeave={(e) => !isSelectionLoading && (e.target.style.backgroundColor = '#005BC8')}
            >
              {isSelectionLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                'Select All'
              )}
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={isSelectionLoading}
              className="flex-1 px-1.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              {isSelectionLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                'Deselect All'
              )}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSections.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 text-center">No sections found</div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filteredSections.map((section) => {
                // Handle certificates group visibility
                let isVisible = false
                if (section.key === 'certificates') {
                  // For certificates group, show if any certificate type is visible (not explicitly false)
                  const certAuthVisible = sectionVisibility.CertificateAuthority !== false
                  const selfSignedVisible = sectionVisibility.SelfSignedCertificate !== false
                  const selfSignedAuthVisible = sectionVisibility.SelfSignedCertificateAuthority !== false
                  const certVisible = sectionVisibility.Certificate !== false
                  isVisible = certAuthVisible || selfSignedVisible || selfSignedAuthVisible || certVisible
                } else {
                  // Use !== false so undefined (default) means visible, only false means hidden
                  isVisible = sectionVisibility[section.key] !== false
                }
                
                return (
                  <label
                    key={section.key}
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={isSelectionLoading}
                      onChange={(e) => {
                        e.stopPropagation()
                        // For certificates group, toggle all certificate types
                        if (section.key === 'certificates') {
                          if (dynamicEntities.CertificateAuthority) {
                            handleToggleSection('CertificateAuthority')
                          }
                          if (dynamicEntities.SelfSignedCertificate) {
                            handleToggleSection('SelfSignedCertificate')
                          }
                          if (dynamicEntities.SelfSignedCertificateAuthority) {
                            handleToggleSection('SelfSignedCertificateAuthority')
                          }
                          if (dynamicEntities.Certificate) {
                            handleToggleSection('Certificate')
                          }
                        } else {
                          handleToggleSection(section.key)
                        }
                      }}
                      className="w-4 h-4 border-gray-300 rounded cursor-pointer flex-shrink-0"
                      style={{ 
                        accentColor: '#005BC8'
                      }}
                      onFocus={(e) => e.target.style.outline = '2px solid #005BC8'}
                      onBlur={(e) => e.target.style.outline = ''}
                    />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Icon name={section.icon} className="text-gray-600 text-sm flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">{section.name}</span>
                      {section.count !== undefined && section.count !== null && (
                        <span className="text-xs text-gray-500 font-medium ml-auto flex-shrink-0">({section.count})</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* Report Header */}
        <div className="pb-4 mb-6 px-6 pt-6" style={{ borderBottom: '2px solid #005BC8' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg shadow-sm flex items-center justify-center" style={{ backgroundColor: '#005BC8', minWidth: '48px', minHeight: '48px' }}>
              <img 
                src={`${import.meta.env.BASE_URL}sophos-icon-white.svg`}
                alt="Sophos" 
                className="h-7 w-auto"
                style={{ maxHeight: '28px', maxWidth: '28px', display: logoLoaded && !logoError ? 'block' : 'none' }}
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoError(true)}
              />
              <Zap className="w-7 h-7 text-white" style={{ display: logoLoaded && !logoError ? 'none' : 'block' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Firewall configuration report</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanding && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-white" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Loading...</span>
              </div>
            )}
            <button
              onClick={expandAll}
              disabled={isExpanding}
              className="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#005BC8',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
              onMouseEnter={(e) => !isExpanding && (e.target.style.backgroundColor = '#004A9F')}
              onMouseLeave={(e) => !isExpanding && (e.target.style.backgroundColor = '#005BC8')}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              disabled={isExpanding}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              Collapse All
            </button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <p className="text-gray-500 mb-0.5 text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Report Generated</p>
            <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{formatDate(new Date())}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <p className="text-gray-500 mb-0.5 text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>XML API Version</p>
            <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{data.metadata.apiVersion || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <p className="text-gray-500 mb-0.5 text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Total Entities</p>
            <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{totalEntities.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <p className="text-gray-500 mb-0.5 text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Entity Types</p>
            <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{Object.keys(dynamicEntities).length + 8}</p>
          </div>
        </div>
      </div>

      {/* Detailed Rules */}
      {(sectionVisibility.firewallRules !== false) && (
        <div id="firewall-rules" className="mb-4 scroll-mt-4 px-6">
          <CollapsibleSection
            title={
              <div className="flex items-center gap-2">
                <Icon name="summarize" className="text-gray-600" />
                <span>Firewall Rules</span>
                {(() => {
                  const count = filteredFirewallRules.length
                  const total = filteredRules.length
                  return count > 0 && (
                    <span className="text-gray-500 font-normal">
                      ({count}{activeFirewallRulesSearch ? ` of ${total}` : ''})
                    </span>
                  )
                })()}
              </div>
            }
            isExpanded={expandedMainSections.firewallRules}
            onToggle={() => toggleMainSection('firewallRules')}
            className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
          >
            {/* Search Bar for Firewall Rules */}
            <div key="firewall-search-container" className="p-4 bg-gray-50 border-b-2 border-gray-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  ref={firewallRulesSearchRef}
                  key="firewall-rules-search-input"
                  type="text"
                  placeholder="Search firewall rules (Press Enter to search)..."
                  value={firewallRulesSearch}
                  onChange={handleFirewallRulesSearchChange}
                  onKeyDown={handleFirewallRulesSearchKeyDown}
                  className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-400 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
                {firewallRulesSearch && (
                  <button
                    type="button"
                    onClick={handleClearFirewallRulesSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 transition-colors"
                    title="Clear search"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                {activeFirewallRulesSearch && activeFirewallRulesSearch !== firewallRulesSearch && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 pointer-events-none font-medium">
                    Press Enter
                  </div>
                )}
              </div>
            </div>
            {/* Table-based Firewall Rules View */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-8">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[140px]">Rule Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-20">Status</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-20">Action</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Source</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Destination</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[80px]">Services</th>
                  </tr>
                </thead>
                <tbody>
        {filteredFirewallRules.map((rule, index) => {
          const flat = flattenFirewallRule(rule)
          const policy = rule.networkPolicy || rule.userPolicy || {}

          // Robust exclusions extraction directly from raw XML to ensure all items are captured
          const extractExclusionsFromXml = (rawXml) => {
            const result = {
              sourceZones: [],
              destZones: [],
              sourceNetworks: [],
              destNetworks: [],
              services: [],
            }
            if (!rawXml) return result
            try {
              const parser = new DOMParser()
              const doc = parser.parseFromString(rawXml, 'text/xml')
              const ex = doc.querySelector('Exclusions')
              if (!ex) return result

              result.sourceZones = Array.from(ex.querySelectorAll('SourceZones > Zone')).map(n => n.textContent.trim())
              result.destZones = Array.from(ex.querySelectorAll('DestinationZones > Zone')).map(n => n.textContent.trim())
              result.sourceNetworks = Array.from(ex.querySelectorAll('SourceNetworks > Network')).map(n => n.textContent.trim())
              result.destNetworks = Array.from(ex.querySelectorAll('DestinationNetworks > Network')).map(n => n.textContent.trim())
              result.services = Array.from(ex.querySelectorAll('Services > Service')).map(n => n.textContent.trim())
            } catch (e) {
              // Ignore parsing errors, fallback to object-based extraction below
            }
            return result
          }

          const xmlEx = extractExclusionsFromXml(rule.rawXml)
          const isRuleExpanded = expandedRules.has(rule.id)
          
          // Truncate helper for table cells
          const truncateText = (text, maxLen = 30) => {
            if (!text) return 'Any'
            if (text.length <= maxLen) return text
            return text.substring(0, maxLen) + '...'
          }
          
          // Get source summary
          const sourceSummary = flat.sourceZones || flat.sourceNetworks || 'Any'
          // Get destination summary
          const destSummary = flat.destinationZones || flat.destinationNetworks || 'Any'
          // Get services summary
          const servicesSummary = flat.services || 'Any'
          
          return (
            <React.Fragment key={rule.id}>
              {/* Table Row - Clickable */}
              <tr 
                onClick={() => toggleRule(rule.id)}
                className={`border-b border-gray-200 cursor-pointer transition-colors ${isRuleExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-2 py-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    {isRuleExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                    {index + 1}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="font-medium text-gray-900" title={flat.name || 'Unnamed Rule'}>
                    {truncateText(flat.name || 'Unnamed Rule', 35)}
                  </div>
                  {flat.description && (
                    <div className="text-gray-500 text-[10px]" title={flat.description}>
                      {truncateText(flat.description, 40)}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    flat.status === 'Enable' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {flat.status === 'Enable' ? <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> : <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                    {flat.status === 'Enable' ? 'On' : 'Off'}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    flat.action === 'Accept' ? 'bg-green-100 text-green-800' : flat.action === 'Deny' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {flat.action || 'N/A'}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-700" title={sourceSummary}>
                  {truncateText(sourceSummary, 25)}
                </td>
                <td className="px-2 py-2 text-gray-700" title={destSummary}>
                  {truncateText(destSummary, 25)}
                </td>
                <td className="px-2 py-2 text-gray-700" title={servicesSummary}>
                  {truncateText(servicesSummary, 20)}
                </td>
              </tr>

              {/* Expanded Rule Details Row */}
              {isRuleExpanded && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-0">
                    <div className="p-4 border-b-2 border-blue-200">
                      {/* Rule Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Basic Information */}
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                            <Icon name="info" className="text-gray-600 text-base" />
                            Basic Information
                          </h4>
                          <div className="space-y-1">
                            <ReportField label="Transaction ID" value={rule.transactionId || 'N/A'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Policy Type" value={flat.policyType} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="IP Family" value={flat.ipFamily} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Position" value={flat.position} searchQuery={activeFirewallRulesSearch} />
                            {flat.after && <ReportField label="Positioned After" value={flat.after} searchQuery={activeFirewallRulesSearch} />}
                          </div>
                        </div>

                        {/* Action & Traffic Control */}
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                            <Icon name="bolt" className="text-gray-600 text-base" />
                            Action & Traffic Control
                          </h4>
                          <div className="space-y-1">
                            <ReportField 
                              label="Action" 
                              value={flat.action || 'N/A'}
                              highlight={flat.action === 'Accept' ? 'green' : flat.action === 'Deny' ? 'red' : null}
                              searchQuery={activeFirewallRulesSearch}
                            />
                            <ReportField label="Log Traffic" value={flat.logTraffic || 'Disable'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Schedule" value={flat.schedule || 'All The Time'} searchQuery={activeFirewallRulesSearch} />
                          </div>
                        </div>

                        {/* Source Configuration */}
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                            <Icon name="login" className="text-gray-600 text-base" />
                            Source Configuration
                          </h4>
                          <div className="space-y-1">
                            {flat.sourceZones && (
                              <ReportField label="Source Zones" value={flat.sourceZones} searchQuery={activeFirewallRulesSearch} />
                            )}
                            {flat.sourceNetworks && (
                              <ReportField label="Source Networks" value={flat.sourceNetworks} searchQuery={activeFirewallRulesSearch} />
                            )}
                            {!flat.sourceZones && !flat.sourceNetworks && (
                              <ReportField label="Source" value="Any" searchQuery={activeFirewallRulesSearch} />
                            )}
                          </div>
                        </div>

                        {/* Destination Configuration */}
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                            <Icon name="logout" className="text-gray-600 text-base" />
                            Destination Configuration
                          </h4>
                          <div className="space-y-1">
                            {flat.destinationZones && (
                              <ReportField label="Destination Zones" value={flat.destinationZones} searchQuery={activeFirewallRulesSearch} />
                            )}
                            {flat.destinationNetworks && (
                              <ReportField label="Destination Networks" value={flat.destinationNetworks} searchQuery={activeFirewallRulesSearch} />
                            )}
                            {!flat.destinationZones && !flat.destinationNetworks && (
                              <ReportField label="Destination" value="Any" searchQuery={activeFirewallRulesSearch} />
                            )}
                            {flat.services && (
                              <ReportField label="Services/Ports" value={flat.services} searchQuery={activeFirewallRulesSearch} />
                            )}
                          </div>
                        </div>

                        {/* Security Features */}
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                            <Icon name="shield_lock" className="text-gray-600 text-base" />
                            Security Features
                          </h4>
                          <div className="space-y-1">
                            <ReportField label="Web Filter" value={flat.webFilter || 'None'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Application Control" value={flat.applicationControl || 'None'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Intrusion Prevention" value={flat.intrusionPrevention || 'None'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Virus Scanning" value={flat.scanVirus || 'Disable'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Zero Day Protection" value={flat.zeroDayProtection || 'Disable'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="Proxy Mode" value={flat.proxyMode || 'Disable'} searchQuery={activeFirewallRulesSearch} />
                            <ReportField label="HTTPS Decryption" value={flat.decryptHTTPS || 'Disable'} searchQuery={activeFirewallRulesSearch} />
                          </div>
                        </div>

                        {/* User Policy Specific (if applicable) */}
                        {rule.userPolicy && (
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                              <Icon name="groups" className="text-gray-600 text-base" />
                              User Policy Details
                            </h4>
                            <div className="space-y-1">
                              {(() => {
                                let identityValue = flat.identity;
                                if (!identityValue && policy.Identity) {
                                  const identity = policy.Identity;
                                  if (Array.isArray(identity)) {
                                    identityValue = identity.join(', ');
                                  } else if (identity.Member) {
                                    identityValue = Array.isArray(identity.Member) 
                                      ? identity.Member.join(', ') 
                                      : identity.Member;
                                  } else if (typeof identity === 'string') {
                                    identityValue = identity;
                                  }
                                }
                                return identityValue ? (
                                  <ReportField label="Identity/Groups" value={identityValue} searchQuery={activeFirewallRulesSearch} />
                                ) : null;
                              })()}
                              {policy.MatchIdentity && (
                                <ReportField label="Match Identity" value={policy.MatchIdentity} searchQuery={activeFirewallRulesSearch} />
                              )}
                              {policy.ShowCaptivePortal && (
                                <ReportField label="Show Captive Portal" value={policy.ShowCaptivePortal} searchQuery={activeFirewallRulesSearch} />
                              )}
                              {policy.DataAccounting && (
                                <ReportField label="Data Accounting" value={policy.DataAccounting} searchQuery={activeFirewallRulesSearch} />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Exclusions (if any) */}
                      {(() => {
                        const exclusions = policy.Exclusions || {}
                        const sourceZones = xmlEx.sourceZones.length > 0
                          ? xmlEx.sourceZones
                          : getExclusionArray(exclusions.SourceZones, 'Zone')
                        const destZones = xmlEx.destZones.length > 0
                          ? xmlEx.destZones
                          : getExclusionArray(exclusions.DestinationZones, 'Zone')
                        const sourceNetworks = xmlEx.sourceNetworks.length > 0
                          ? xmlEx.sourceNetworks
                          : getExclusionArray(exclusions.SourceNetworks, 'Network')
                        const destNetworks = xmlEx.destNetworks.length > 0
                          ? xmlEx.destNetworks
                          : getExclusionArray(exclusions.DestinationNetworks, 'Network')
                        const services = xmlEx.services.length > 0
                          ? xmlEx.services
                          : getExclusionArray(exclusions.Services, 'Service')
                        
                        const hasExclusions = sourceZones.length > 0 || destZones.length > 0 ||
                                             sourceNetworks.length > 0 || destNetworks.length > 0 || 
                                             services.length > 0

                        if (!hasExclusions) return null

                        return (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                            <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider mb-2 flex items-center gap-1">
                              <Icon name="block" className="text-gray-600 text-base" />
                              Exclusions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              {sourceZones.length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 mb-0.5">Source Zones:</p>
                                  <p className="text-gray-600" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{sourceZones.join(', ')}</p>
                                </div>
                              )}
                              {destZones.length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 mb-0.5">Destination Zones:</p>
                                  <p className="text-gray-600" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{destZones.join(', ')}</p>
                                </div>
                              )}
                              {sourceNetworks.length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 mb-0.5">Source Networks:</p>
                                  <p className="text-gray-600" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{sourceNetworks.join(', ')}</p>
                                </div>
                              )}
                              {destNetworks.length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 mb-0.5">Destination Networks:</p>
                                  <p className="text-gray-600" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{destNetworks.join(', ')}</p>
                                </div>
                              )}
                              {services.length > 0 && (
                                <div>
                                  <p className="font-medium text-gray-700 mb-0.5">Services:</p>
                                  <p className="text-gray-600" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{services.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
      </div>
      )}

      {/* SSL/TLS Inspection Rules */}
      {(sectionVisibility.sslTlsInspectionRules !== false && data.sslTlsInspectionRules?.length > 0) && (
        <div id="ssl-tls-inspection-rules" className="mb-4 scroll-mt-4 px-6">
          <CollapsibleSection
            title={
              <div className="flex items-center gap-2">
                <Icon name="lock" className="text-gray-600" />
                <span>SSL/TLS Inspection Rules</span>
                <span className="text-gray-500 font-normal">
                  ({filteredSslTlsRules.length}{activeSslTlsRulesSearch ? ` of ${data.sslTlsInspectionRules?.length || 0}` : ''})
                </span>
              </div>
            }
            isExpanded={expandedMainSections.sslTlsInspectionRules}
            onToggle={() => toggleMainSection('sslTlsInspectionRules')}
            className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
          >
            {/* Search Bar for SSL/TLS Rules */}
            <div className="p-4 bg-gray-50 border-b-2 border-gray-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  ref={sslTlsRulesSearchRef}
                  key="ssl-tls-rules-search-input"
                  type="text"
                  placeholder="Search SSL/TLS rules (Press Enter to search)..."
                  value={sslTlsRulesSearch}
                  onChange={handleSslTlsRulesSearchChange}
                  onKeyDown={handleSslTlsRulesSearchKeyDown}
                  className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-400 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
                {sslTlsRulesSearch && (
                  <button
                    type="button"
                    onClick={handleClearSslTlsRulesSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 transition-colors"
                    title="Clear search"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                {activeSslTlsRulesSearch && activeSslTlsRulesSearch !== sslTlsRulesSearch && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 pointer-events-none font-medium">
                    Press Enter
                  </div>
                )}
              </div>
            </div>
            {/* Table-based SSL/TLS Inspection Rules View */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-8">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[140px]">Rule Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-20">Status</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-28">Decrypt Action</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Source</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Destination</th>
                  </tr>
                </thead>
                <tbody>
              {filteredSslTlsRules.map((rule, index) => {
                const flat = flattenSSLTLSInspectionRule(rule)
                const isRuleExpanded = expandedRules.has(`ssl-${rule.id}`)
                
                // Truncate helper for table cells
                const truncateText = (text, maxLen = 30) => {
                  if (!text) return 'Any'
                  if (text.length <= maxLen) return text
                  return text.substring(0, maxLen) + '...'
                }
                
                // Get source summary
                const sourceSummary = flat.sourceZones || flat.sourceNetworks || flat.identity || 'Any'
                // Get destination summary
                const destSummary = flat.destinationZones || flat.destinationNetworks || flat.services || flat.websites || 'Any'
                
                return (
                  <React.Fragment key={rule.id}>
                    {/* Table Row - Clickable */}
                    <tr 
                      onClick={() => toggleRule(`ssl-${rule.id}`)}
                      className={`border-b border-gray-200 cursor-pointer transition-colors ${isRuleExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-2 py-2 text-gray-600">
                        <div className="flex items-center gap-1">
                          {isRuleExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          )}
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-900" title={flat.name || 'Unnamed Rule'}>
                          {truncateText(flat.name || 'Unnamed Rule', 35)}
                        </div>
                        {flat.description && (
                          <div className="text-gray-500 text-[10px]" title={flat.description}>
                            {truncateText(flat.description, 40)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          flat.enable === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {flat.enable === 'Yes' ? <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> : <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                          {flat.enable === 'Yes' ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          flat.decryptAction === 'Decrypt' ? 'bg-green-100 text-green-800' : flat.decryptAction === 'DoNotDecrypt' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {flat.decryptAction || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-700" title={sourceSummary}>
                        {truncateText(sourceSummary, 25)}
                      </td>
                      <td className="px-2 py-2 text-gray-700" title={destSummary}>
                        {truncateText(destSummary, 25)}
                      </td>
                    </tr>

                    {/* Expanded Rule Details Row */}
                    {isRuleExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 border-b-2 border-blue-200">
                            {/* Rule Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Basic Information */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="info" className="text-gray-600 text-base" />
                                  Basic Information
                                </h4>
                                <div className="space-y-1">
                                  <ReportField label="Transaction ID" value={rule.transactionId || 'N/A'} searchQuery={activeSslTlsRulesSearch} />
                                  <ReportField label="Name" value={flat.name} searchQuery={activeSslTlsRulesSearch} />
                                  <ReportField label="Description" value={flat.description || 'N/A'} searchQuery={activeSslTlsRulesSearch} />
                                  <ReportField label="Is Default" value={flat.isDefault || 'No'} searchQuery={activeSslTlsRulesSearch} />
                                  <ReportField label="Enable" value={flat.enable || 'No'} searchQuery={activeSslTlsRulesSearch} />
                                  <ReportField label="Log Connections" value={flat.logConnections || 'Disable'} searchQuery={activeSslTlsRulesSearch} />
                                </div>
                              </div>

                              {/* Decryption Configuration */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="lock" className="text-gray-600 text-base" />
                                  Decryption Configuration
                                </h4>
                                <div className="space-y-1">
                                  <ReportField 
                                    label="Decrypt Action" 
                                    value={flat.decryptAction || 'N/A'}
                                    highlight={flat.decryptAction === 'Decrypt' ? 'green' : null}
                                    searchQuery={activeSslTlsRulesSearch}
                                  />
                                  <ReportField label="Decryption Profile" value={flat.decryptionProfile || 'N/A'} searchQuery={activeSslTlsRulesSearch} />
                                  {flat.moveToName && (
                                    <ReportField label="Move To" value={`${flat.moveToName} (${flat.moveToOrderBy})`} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                </div>
                              </div>

                              {/* Source Configuration */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="login" className="text-gray-600 text-base" />
                                  Source Configuration
                                </h4>
                                <div className="space-y-1">
                                  {flat.sourceZones && (
                                    <ReportField label="Source Zones" value={flat.sourceZones} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {flat.sourceNetworks && (
                                    <ReportField label="Source Networks" value={flat.sourceNetworks} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {flat.identity && (
                                    <ReportField label="Identity" value={flat.identity} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {!flat.sourceZones && !flat.sourceNetworks && !flat.identity && (
                                    <ReportField label="Source" value="Any" searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                </div>
                              </div>

                              {/* Destination Configuration */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="logout" className="text-gray-600 text-base" />
                                  Destination Configuration
                                </h4>
                                <div className="space-y-1">
                                  {flat.destinationZones && (
                                    <ReportField label="Destination Zones" value={flat.destinationZones} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {flat.destinationNetworks && (
                                    <ReportField label="Destination Networks" value={flat.destinationNetworks} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {flat.services && (
                                    <ReportField label="Services" value={flat.services} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {flat.websites && (
                                    <ReportField label="Websites/Categories" value={flat.websites} searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                  {!flat.destinationZones && !flat.destinationNetworks && !flat.services && !flat.websites && (
                                    <ReportField label="Destination" value="Any" searchQuery={activeSslTlsRulesSearch} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* NAT Rules */}
      {(sectionVisibility.NATRule !== false && data.entitiesByTag?.NATRule?.length > 0) && (
        <div id="nat-rules" className="mb-4 scroll-mt-4 px-6">
          <CollapsibleSection
            title={
              <div className="flex items-center gap-2">
                <Icon name="swap_horiz" className="text-gray-600" />
                <span>NAT Rules</span>
                <span className="text-gray-500 font-normal">
                  ({filteredNatRules.length}{activeNatRulesSearch ? ` of ${data.entitiesByTag?.NATRule?.length || 0}` : ''})
                </span>
              </div>
            }
            isExpanded={expandedMainSections.natRules}
            onToggle={() => toggleMainSection('natRules')}
            className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
          >
            {/* Search Bar for NAT Rules */}
            <div className="p-4 bg-gray-50 border-b-2 border-gray-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  ref={natRulesSearchRef}
                  key="nat-rules-search-input"
                  type="text"
                  placeholder="Search NAT rules (Press Enter to search)..."
                  value={natRulesSearch}
                  onChange={handleNatRulesSearchChange}
                  onKeyDown={handleNatRulesSearchKeyDown}
                  className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-400 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
                {natRulesSearch && (
                  <button
                    type="button"
                    onClick={handleClearNatRulesSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 transition-colors"
                    title="Clear search"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                {activeNatRulesSearch && activeNatRulesSearch !== natRulesSearch && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 pointer-events-none font-medium">
                    Press Enter
                  </div>
                )}
              </div>
            </div>
            {/* Table-based NAT Rules View */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-8">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[130px]">Rule Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 w-20">Status</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[90px]">Source</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[90px]">Destination</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[90px]">Translation</th>
                  </tr>
                </thead>
                <tbody>
              {filteredNatRules.map((rule, index) => {
                const flat = flattenNATRule(rule)
                const ruleId = `nat-${rule.transactionId || rule.id || index}`
                const isRuleExpanded = expandedRules.has(ruleId)
                
                // Truncate helper for table cells
                const truncateText = (text, maxLen = 30) => {
                  if (!text) return 'Any'
                  if (text.length <= maxLen) return text
                  return text.substring(0, maxLen) + '...'
                }
                
                // Get source summary
                const sourceSummary = flat.sourceZones || flat.sourceNetworks || 'Any'
                // Get destination summary  
                const destSummary = flat.destinationZones || flat.destinationNetworks || 'Any'
                // Get translation summary
                const isEnabled = flat.status === 'Enable' || flat.status === 'Yes' || flat.status === 'ON'
                const translationSummary = flat.translatedSource || flat.translatedDestination || 'N/A'
                
                return (
                  <React.Fragment key={ruleId}>
                    {/* Table Row - Clickable */}
                    <tr 
                      onClick={() => toggleRule(ruleId)}
                      className={`border-b border-gray-200 cursor-pointer transition-colors ${isRuleExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-2 py-2 text-gray-600">
                        <div className="flex items-center gap-1">
                          {isRuleExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          )}
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-900" title={flat.name || 'Unnamed NAT Rule'}>
                          {truncateText(flat.name || 'Unnamed NAT Rule', 30)}
                        </div>
                        {flat.description && (
                          <div className="text-gray-500 text-[10px]" title={flat.description}>
                            {truncateText(flat.description, 35)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isEnabled ? <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> : <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                          {isEnabled ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-700" title={sourceSummary}>
                        {truncateText(sourceSummary, 22)}
                      </td>
                      <td className="px-2 py-2 text-gray-700" title={destSummary}>
                        {truncateText(destSummary, 22)}
                      </td>
                      <td className="px-2 py-2 text-gray-700" title={translationSummary}>
                        {truncateText(translationSummary, 22)}
                      </td>
                    </tr>

                    {/* Expanded Rule Details Row */}
                    {isRuleExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 border-b-2 border-blue-200">
                            {/* Rule Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Basic Information */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="info" className="text-gray-600 text-base" />
                                  Basic Information
                                </h4>
                                <div className="space-y-1">
                                  <ReportField label="Transaction ID" value={rule.transactionId || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="NAT Type" value={flat.natType || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="IP Family" value={flat.ipFamily || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="Position" value={flat.position || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  {flat.after && <ReportField label="Positioned After" value={flat.after} searchQuery={activeNatRulesSearch} />}
                                </div>
                              </div>

                              {/* Action & Traffic Control */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="bolt" className="text-gray-600 text-base" />
                                  Action & Traffic Control
                                </h4>
                                <div className="space-y-1">
                                  <ReportField 
                                    label="Action" 
                                    value={flat.action || 'N/A'}
                                    highlight={flat.action === 'Accept' ? 'green' : null}
                                    searchQuery={activeNatRulesSearch}
                                  />
                                  <ReportField label="Log Traffic" value={flat.logTraffic || 'Disable'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="Schedule" value={flat.schedule || 'All The Time'} searchQuery={activeNatRulesSearch} />
                                </div>
                              </div>

                              {/* Source Configuration */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="login" className="text-gray-600 text-base" />
                                  Source Configuration
                                </h4>
                                <div className="space-y-1">
                                  {flat.sourceZones && (
                                    <ReportField label="Source Zones" value={flat.sourceZones} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {flat.sourceNetworks && (
                                    <ReportField label="Source Networks" value={flat.sourceNetworks} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {!flat.sourceZones && !flat.sourceNetworks && (
                                    <ReportField label="Source" value="Any" searchQuery={activeNatRulesSearch} />
                                  )}
                                </div>
                              </div>

                              {/* Destination Configuration */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="logout" className="text-gray-600 text-base" />
                                  Destination Configuration
                                </h4>
                                <div className="space-y-1">
                                  {flat.destinationZones && (
                                    <ReportField label="Destination Zones" value={flat.destinationZones} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {flat.destinationNetworks && (
                                    <ReportField label="Destination Networks" value={flat.destinationNetworks} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {flat.services && (
                                    <ReportField label="Services/Ports" value={flat.services} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {!flat.destinationZones && !flat.destinationNetworks && (
                                    <ReportField label="Destination" value="Any" searchQuery={activeNatRulesSearch} />
                                  )}
                                </div>
                              </div>

                              {/* NAT Translation - Source */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="swap_horiz" className="text-gray-600 text-base" />
                                  Source NAT Translation
                                </h4>
                                <div className="space-y-1">
                                  <ReportField label="Original Source" value={flat.originalSource || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="Translated Source" value={flat.translatedSource || 'N/A'} searchQuery={activeNatRulesSearch} />
                                </div>
                              </div>

                              {/* NAT Translation - Destination */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                                  <Icon name="swap_horiz" className="text-gray-600 text-base" />
                                  Destination NAT Translation
                                </h4>
                                <div className="space-y-1">
                                  <ReportField label="Original Destination" value={flat.originalDestination || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  <ReportField label="Translated Destination" value={flat.translatedDestination || 'N/A'} searchQuery={activeNatRulesSearch} />
                                  {flat.originalService && (
                                    <ReportField label="Original Service" value={flat.originalService} searchQuery={activeNatRulesSearch} />
                                  )}
                                  {flat.translatedService && (
                                    <ReportField label="Translated Service" value={flat.translatedService} searchQuery={activeNatRulesSearch} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}

        {/* IP Hosts - Individual Section */}
        {sectionVisibility.ipHosts !== false && data.ipHosts?.length > 0 && (
          <div id="ip-hosts" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="dns" className="text-gray-600" />
                  <span>IP Hosts</span>
                  <span className="text-gray-500 font-normal">({data.ipHosts.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.ipHosts}
              onToggle={() => toggleMainSection('ipHosts')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
            <IPHostTable items={data.ipHosts} />
            </CollapsibleSection>
          </div>
        )}

        {/* FQDN Hosts - Individual Section */}
        {sectionVisibility.fqdnHosts !== false && data.fqdnHosts?.length > 0 && (
          <div id="fqdn-hosts" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="language" className="text-gray-600" />
                  <span>FQDN Hosts</span>
                  <span className="text-gray-500 font-normal">({data.fqdnHosts.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.fqdnHosts}
              onToggle={() => toggleMainSection('fqdnHosts')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
            <FqdnHostsTable items={data.fqdnHosts} />
            </CollapsibleSection>
          </div>
        )}

        {/* MAC Hosts - Individual Section */}
        {sectionVisibility.macHosts !== false && data.macHosts?.length > 0 && (
          <div id="mac-hosts" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="devices" className="text-gray-600" />
                  <span>MAC Hosts</span>
                  <span className="text-gray-500 font-normal">({data.macHosts.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.macHosts}
              onToggle={() => toggleMainSection('macHosts')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
            <MACHostTable items={data.macHosts} />
            </CollapsibleSection>
          </div>
        )}

        {/* Groups - Section 5 - Show individual group types directly */}
        {sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups?.length > 0 && (
          <div id="fqdn-host-groups" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="group_work" className="text-gray-600" />
                  <span>FQDN Host Groups</span>
                  <span className="text-gray-500 font-normal">({data.fqdnHostGroups.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.fqdnHostGroups}
              onToggle={() => toggleMainSection('fqdnHostGroups')}
              className="bg-white"
              style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
            >
              <FQDNGroupTable items={data.fqdnHostGroups} />
            </CollapsibleSection>
          </div>
        )}
        {sectionVisibility.ipHostGroups !== false && data.ipHostGroups?.length > 0 && (
          <div id="ip-host-groups" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="group_work" className="text-gray-600" />
                  <span>IP Host Groups</span>
                  <span className="text-gray-500 font-normal">({data.ipHostGroups.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.ipHostGroups}
              onToggle={() => toggleMainSection('ipHostGroups')}
              className="bg-white"
              style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
            >
              <IPHostGroupTable items={data.ipHostGroups} />
            </CollapsibleSection>
          </div>
        )}
        {sectionVisibility.serviceGroups !== false && data.serviceGroups?.length > 0 && (
          <div id="service-groups" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="group_work" className="text-gray-600" />
                  <span>Service Groups</span>
                  <span className="text-gray-500 font-normal">({data.serviceGroups.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.serviceGroups}
              onToggle={() => toggleMainSection('serviceGroups')}
              className="bg-white"
              style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
            >
              <ServiceGroupTable items={data.serviceGroups} />
            </CollapsibleSection>
          </div>
        )}
        {sectionVisibility.countryGroups !== false && data.entitiesByTag?.CountryGroup?.length > 0 && (
          <div id="country-groups" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="group_work" className="text-gray-600" />
                  <span>Country Groups</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.CountryGroup.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.countryGroups}
              onToggle={() => toggleMainSection('countryGroups')}
              className="bg-white"
              style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}
            >
              <CountryGroupTable items={data.entitiesByTag.CountryGroup} />
            </CollapsibleSection>
          </div>
        )}
        {sectionVisibility.groups !== false && data.groups?.length > 0 && (
          <div id="groups" className="mb-4 scroll-mt-4 px-6">
            <EntityTable
              title="Other Groups"
              icon="groups"
              items={data.groups}
              primaryKeyLabel={null}
            />
          </div>
        )}

        {/* Services - Section 6 */}
        {sectionVisibility.services !== false && data.services?.length > 0 && (
          <div id="services-section" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="construction" className="text-gray-600" />
                  <span>Services</span>
                  {data.services?.length > 0 && (
                    <span className="text-gray-500 font-normal">({data.services.length})</span>
                  )}
                </div>
              }
              isExpanded={expandedMainSections.servicesSection}
              onToggle={() => toggleMainSection('servicesSection')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <ServicesTable items={data.services} />
            </CollapsibleSection>
          </div>
        )}

        {/* Web Filter Policies - Individual Section */}
        {sectionVisibility.WebFilterPolicy !== false && data.entitiesByTag?.WebFilterPolicy?.length > 0 && (
          <div id="webfilter-policies" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="filter_alt" className="text-gray-600" />
                  <span>Web Filter Policies</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.WebFilterPolicy.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.WebFilterPolicy}
              onToggle={() => toggleMainSection('WebFilterPolicy')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <WebFilterPolicyTable items={data.entitiesByTag.WebFilterPolicy} />
            </CollapsibleSection>
          </div>
        )}

        {/* Schedules - Individual Section */}
        {sectionVisibility.Schedule !== false && data.entitiesByTag?.Schedule?.length > 0 && (
          <div id="schedules" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="schedule" className="text-gray-600" />
                  <span>Schedules</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.Schedule.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.Schedule}
              onToggle={() => toggleMainSection('Schedule')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <ScheduleTable items={data.entitiesByTag.Schedule} />
            </CollapsibleSection>
          </div>
        )}

        {/* Countries - Individual Section */}
              {sectionVisibility.Country !== false && data.entitiesByTag?.Country?.length > 0 && (
          <div id="countries" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="flag" className="text-gray-600" />
                  <span>Countries</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.Country.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.Country}
              onToggle={() => toggleMainSection('Country')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <EntityTable
                  title="Countries"
                  icon="flag"
                  items={data.entitiesByTag.Country}
                  primaryKeyLabel={null}
                />
            </CollapsibleSection>
          </div>
        )}

        {/* IPS Policies - Individual Section */}
              {sectionVisibility.IPSPolicy !== false && data.entitiesByTag?.IPSPolicy?.length > 0 && (
          <div id="ips-policies" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="security" className="text-gray-600" />
                  <span>IPS Policies</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.IPSPolicy.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.IPSPolicy}
              onToggle={() => toggleMainSection('IPSPolicy')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <IPSPolicyTable items={data.entitiesByTag.IPSPolicy} />
            </CollapsibleSection>
          </div>
              )}

        {/* Intrusion Prevention - Individual Section */}
              {sectionVisibility.IntrusionPrevention !== false && data.entitiesByTag?.IntrusionPrevention?.length > 0 && (
          <div id="intrusion-prevention" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="security" className="text-gray-600" />
                  <span>Intrusion Prevention</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.IntrusionPrevention.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.IntrusionPrevention}
              onToggle={() => toggleMainSection('IntrusionPrevention')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <EntityTable
                  title="Intrusion Prevention"
                  icon="security"
                  items={data.entitiesByTag.IntrusionPrevention}
                  primaryKeyLabel={null}
                />
            </CollapsibleSection>
          </div>
              )}

        {/* Virus Scanning - Individual Section */}
              {sectionVisibility.VirusScanning !== false && data.entitiesByTag?.VirusScanning?.length > 0 && (
          <div id="virus-scanning" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="scanner" className="text-gray-600" />
                  <span>Virus Scanning</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.VirusScanning.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.VirusScanning}
              onToggle={() => toggleMainSection('VirusScanning')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <EntityTable
                  title="Virus Scanning"
                  icon="scanner"
                  items={data.entitiesByTag.VirusScanning}
                  primaryKeyLabel={null}
                />
            </CollapsibleSection>
          </div>
              )}

        {/* Web Filters - Individual Section */}
              {sectionVisibility.WebFilter !== false && data.entitiesByTag?.WebFilter?.length > 0 && (
          <div id="web-filters" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="web" className="text-gray-600" />
                  <span>Web Filters</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.WebFilter.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.WebFilter}
              onToggle={() => toggleMainSection('WebFilter')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <EntityTable
                  title="Web Filters"
                  icon="web"
                  items={data.entitiesByTag.WebFilter}
                  primaryKeyLabel={null}
                />
            </CollapsibleSection>
          </div>
        )}

        {/* Zones - Individual Section */}
        {sectionVisibility.Zone !== false && data.entitiesByTag?.Zone?.length > 0 && (
          <div id="zones" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="location_city" className="text-gray-600" />
                  <span>Zones</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.Zone.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.Zone}
              onToggle={() => toggleMainSection('Zone')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <ZoneTable items={data.entitiesByTag.Zone} />
            </CollapsibleSection>
          </div>
        )}

        {/* Networks - Individual Section */}
        {sectionVisibility.Network !== false && data.entitiesByTag?.Network?.length > 0 && (
          <div id="networks" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="router" className="text-gray-600" />
                  <span>Networks</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.Network.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.Network}
              onToggle={() => toggleMainSection('Network')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
                <EntityTable
                  title="Networks"
                  icon="router"
                  items={data.entitiesByTag.Network}
                  primaryKeyLabel={null}
                />
            </CollapsibleSection>
          </div>
              )}

        {/* RED Devices - Individual Section */}
              {sectionVisibility.REDDevice !== false && data.entitiesByTag?.REDDevice?.length > 0 && (
          <div id="red-devices" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="devices" className="text-gray-600" />
                  <span>RED Devices</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.REDDevice.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.REDDevice}
              onToggle={() => toggleMainSection('REDDevice')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <REDDeviceTable items={data.entitiesByTag.REDDevice} />
            </CollapsibleSection>
          </div>
        )}

        {/* Wireless Access Points - Individual Section */}
              {sectionVisibility.WirelessAccessPoint !== false && data.entitiesByTag?.WirelessAccessPoint?.length > 0 && (
          <div id="wireless-access-points" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="wifi" className="text-gray-600" />
                  <span>Wireless Access Points</span>
                  <span className="text-gray-500 font-normal">({data.entitiesByTag.WirelessAccessPoint.length})</span>
                </div>
              }
              isExpanded={expandedMainSections.WirelessAccessPoint}
              onToggle={() => toggleMainSection('WirelessAccessPoint')}
              className="bg-white"
              style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              <WirelessAccessPointTable items={data.entitiesByTag.WirelessAccessPoint} />
            </CollapsibleSection>
          </div>
        )}

        {/* Wireless Networks - Separate table section */}
        {sectionVisibility.WirelessNetwork !== false && data.entitiesByTag?.WirelessNetwork?.length > 0 && (() => {
          const tableConfig = getTableConfig('WirelessNetworks')
          if (tableConfig) {
            return (
              <div id="wireless-networks" className="mb-4 scroll-mt-4 px-6">
                <CollapsibleSection
                  title={
                    <div className="flex items-center gap-2">
                      <Icon name={tableConfig.icon} className="text-gray-600" />
                      <span>{tableConfig.title}</span>
                      <span className="text-gray-500 font-normal">({data.entitiesByTag.WirelessNetwork.length})</span>
                    </div>
                  }
                  isExpanded={expandedMainSections.wirelessNetworks || false}
                  onToggle={() => toggleMainSection('wirelessNetworks')}
                  className="bg-white"
                  style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
                >
                  <ConfigurableEntityTable
                    items={data.entitiesByTag.WirelessNetwork}
                    title={tableConfig.title}
                    icon={tableConfig.icon}
                    columns={tableConfig.columns}
                  />
                </CollapsibleSection>
              </div>
            )
          }
          return null
        })()}

        {/* Combined Interface and Ports/Interfaces with VLAN and Alias */}
        {sectionVisibility.portsWithVlans !== false && (
          (data.entitiesByTag?.Interface?.length > 0 || 
           (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
           (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
           (data.entitiesByTag?.WirelessNetwork && data.entitiesByTag.WirelessNetwork.length > 0)) && (
            <div id="ports-vlans-aliases" className="mb-4 scroll-mt-4 px-6">
              <CollapsibleSection
                title={
                  <div className="flex items-center gap-2">
                    <Icon name="settings_ethernet" className="text-gray-600" />
                    <span>Interfaces & Network</span>
                    <span className="text-gray-500 font-normal">
                      ({Math.max(
                        data.entitiesByTag?.Interface?.length || 0,
                        Object.keys(data.portsWithEntities || {}).length
                      ) + (data.lagsWithMembers ? Object.keys(data.lagsWithMembers).length : 0) + (data.entitiesByTag?.WirelessNetwork?.length || 0)})
                    </span>
                  </div>
                }
                isExpanded={expandedMainSections.portsWithVlans || false}
                onToggle={() => toggleMainSection('portsWithVlans')}
                className="bg-white"
                style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
              >
                {/* Search input - outside IIFE to maintain focus */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                      ref={interfacesSearchRef}
                      key="interfaces-search-input"
                      type="text"
                      placeholder="Search interfaces, VLANs, aliases, IPs, zones... (Press Enter)"
                      value={interfacesSearch}
                      onChange={handleInterfacesSearchChange}
                      onKeyDown={handleInterfacesSearchKeyDown}
                      className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-400 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {interfacesSearch && (
                      <button
                        type="button"
                        onClick={handleClearInterfacesSearch}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10 transition-colors"
                        title="Clear search"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {activeInterfacesSearch && (
                    <div className="mt-2 text-xs text-gray-600">
                      Filtering by: <span className="font-medium text-blue-600">"{activeInterfacesSearch}"</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {(() => {
                    // Get all Interface entities
                    const interfaceEntities = data.entitiesByTag?.Interface || []
                    const portsWithEntities = data.portsWithEntities || {}
                    const lagsWithMembers = data.lagsWithMembers || {}
                    
                    // Build set of interface names that are LAG members (should be excluded from regular interface display)
                    const lagMemberInterfaces = new Set()
                    Object.values(lagsWithMembers).forEach(({ lag, members }) => {
                      members.forEach(member => {
                        const memberName = member.name || member.fields?.Name || ''
                        if (memberName) {
                          lagMemberInterfaces.add(memberName)
                        }
                      })
                    })
                    
                    // Create a map of interface names to their entities
                    const interfaceMap = new Map()
                    interfaceEntities.forEach(intf => {
                      const name = intf.name || intf.fields?.Name || ''
                      if (name && !lagMemberInterfaces.has(name)) {
                        // Only add interfaces that are NOT LAG members
                        interfaceMap.set(name, intf)
                      }
                    })
                    
                    // Collect all unique interface names (from both sources), excluding LAG members
                    const allInterfaceNames = new Set([
                      ...interfaceEntities
                        .map(intf => intf.name || intf.fields?.Name)
                        .filter(Boolean)
                        .filter(name => !lagMemberInterfaces.has(name)),
                      ...Object.keys(portsWithEntities).filter(name => !lagMemberInterfaces.has(name))
                    ])
                    
                    // Collect LAG names
                    const allLAGNames = Object.keys(lagsWithMembers)
                    
                    // Collect Wireless Network entities
                    const wirelessNetworks = data.entitiesByTag?.WirelessNetwork || []
                    const wirelessNetworkMap = new Map()
                    wirelessNetworks.forEach(wn => {
                      const name = wn.name || wn.fields?.Name || ''
                      if (name) {
                        wirelessNetworkMap.set(name, wn)
                      }
                    })
                    const allWirelessNetworkNames = Array.from(wirelessNetworkMap.keys())
                    
                    // Sort interface names, LAG names, and Wireless Network names
                    const sortedInterfaces = Array.from(allInterfaceNames).sort((a, b) => a.localeCompare(b))
                    const sortedLAGs = allLAGNames.sort((a, b) => a.localeCompare(b))
                    const sortedWirelessNetworks = allWirelessNetworkNames.sort((a, b) => a.localeCompare(b))
                    
                    // Combine interfaces, LAGs, and Wireless Networks for display
                    const allItems = [
                      ...sortedInterfaces.map(name => ({ type: 'interface', name })),
                      ...sortedLAGs.map(name => ({ type: 'lag', name })),
                      ...sortedWirelessNetworks.map(name => ({ type: 'wireless', name }))
                    ].sort((a, b) => a.name.localeCompare(b.name))
                    
                    // Helper function to get searchable text for an interface item
                    const getInterfaceSearchText = (type, itemName) => {
                      const textParts = [itemName, type]
                      
                      if (type === 'lag') {
                        const { lag, members } = lagsWithMembers[itemName] || { lag: {}, members: [] }
                        if (lag?.fields) {
                          textParts.push(
                            lag.fields.IPv4Address || '',
                            lag.fields.NetworkZone || '',
                            lag.fields.Mode || '',
                            lag.fields.Hardware || '',
                            lag.fields.InterfaceStatus || ''
                          )
                        }
                        members?.forEach(m => textParts.push(m.name || m.fields?.Name || ''))
                      } else if (type === 'wireless') {
                        const wn = wirelessNetworkMap.get(itemName)
                        if (wn?.fields) {
                          textParts.push(
                            wn.fields.IPAddress || '',
                            wn.fields.NetworkZone || '',
                            wn.fields.SSID || '',
                            wn.fields.InterfaceStatus || ''
                          )
                        }
                      } else {
                        const intf = interfaceMap.get(itemName)
                        const portData = portsWithEntities[itemName] || {}
                        if (intf?.fields) {
                          textParts.push(
                            intf.fields.IPAddress || '',
                            intf.fields.NetworkZone || '',
                            intf.fields.Hardware || '',
                            intf.fields.InterfaceStatus || ''
                          )
                        }
                        portData.vlans?.forEach(v => {
                          textParts.push(v.name || '', v.fields?.VLANID || '', v.fields?.IPAddress || '', v.fields?.Zone || '')
                        })
                        portData.aliases?.forEach(a => {
                          textParts.push(a.name || '', a.fields?.IPAddress || '', a.fields?.IPv6 || '')
                        })
                        portData.xfrmInterfaces?.forEach(x => {
                          textParts.push(x.name || x.fields?.Name || '', x.fields?.IPv4Address || '', x.fields?.Connectionname || '')
                        })
                      }
                      
                      return textParts.filter(Boolean).join(' ').toLowerCase()
                    }
                    
                    // Filter items based on active search (only updates on Enter key)
                    const searchTerm = activeInterfacesSearch.toLowerCase().trim()
                    const filteredItems = searchTerm
                      ? allItems.filter(({ type, name }) => getInterfaceSearchText(type, name).includes(searchTerm))
                      : allItems
                    
                    // Show filter count
                    if (filteredItems.length === 0 && searchTerm) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Icon name="search_off" className="text-4xl mb-2" />
                          <p>No interfaces found matching "{activeInterfacesSearch}"</p>
                        </div>
                      )
                    }
                    
                    return filteredItems.map(({ type, name: itemName }) => {
                      if (type === 'lag') {
                        const { lag, members } = lagsWithMembers[itemName]
                        const hasMembers = members && members.length > 0
                        
                        return (
                          <div key={`lag-${itemName}`} className="border border-gray-300 rounded-lg overflow-hidden bg-white hover:border-gray-400 transition-colors">
                            {/* Parent LAG - Compact Header */}
                            <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-orange-400">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="hub" className="text-gray-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{itemName}</h4>
                                  {lag.fields?.InterfaceStatus && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      lag.fields.InterfaceStatus === 'ON' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {lag.fields.InterfaceStatus}
                                    </span>
                                  )}
                                </div>
                                {hasMembers && (
                                  <span className="text-xs text-gray-600 font-medium">
                                    {members.length} Member{members.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {/* Key LAG Fields - Compact Display */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                                {lag.fields?.IPv4Address && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">IP:</span>
                                    <span className="text-gray-900 font-mono">{lag.fields.IPv4Address}</span>
                                    {lag.fields?.Netmask && netmaskToCIDR(lag.fields.Netmask) && (
                                      <span className="text-gray-500">/{netmaskToCIDR(lag.fields.Netmask)}</span>
                                    )}
                                  </div>
                                )}
                                {lag.fields?.NetworkZone && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Zone:</span>
                                    <span className="text-gray-900">{lag.fields.NetworkZone}</span>
                                  </div>
                                )}
                                {lag.fields?.Mode && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Mode:</span>
                                    <span className="text-gray-900">{lag.fields.Mode}</span>
                                  </div>
                                )}
                                {lag.fields?.Hardware && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Hardware:</span>
                                    <span className="text-gray-900">{lag.fields.Hardware}</span>
                                  </div>
                                )}
                                {lag.fields?.IPAssignment && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Assignment:</span>
                                    <span className="text-gray-900">{lag.fields.IPAssignment}</span>
                                  </div>
                                )}
                                {lag.fields?.InterfaceSpeed && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Speed:</span>
                                    <span className="text-gray-900">{lag.fields.InterfaceSpeed}</span>
                                  </div>
                                )}
                                {lag.fields?.XmitHashPolicy && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Hash Policy:</span>
                                    <span className="text-gray-900">{lag.fields.XmitHashPolicy}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Member Interfaces Container */}
                            {hasMembers && (
                              <div className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                                  <Icon name="settings_ethernet" className="text-gray-600 text-sm" />
                                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                    Member Interfaces ({members.length})
                                  </h5>
                                </div>
                                <div className="space-y-2 ml-6">
                                  {members.map((member, idx) => (
                                    <div key={`${itemName}-member-${idx}`} className="border border-gray-200 border-l-[3px] border-l-blue-400 rounded p-2.5 hover:border-gray-300 transition-colors">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="font-semibold text-sm text-gray-900">{member.name || member.fields?.Name || `Member ${idx + 1}`}</span>
                                        {member.fields?.InterfaceStatus && (
                                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            member.fields.InterfaceStatus === 'ON' 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {member.fields.InterfaceStatus}
                                          </span>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                        {member.fields?.Hardware && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-gray-500 font-medium">Hardware:</span>
                                            <span className="text-gray-900 font-mono text-xs">{member.fields.Hardware}</span>
                                          </div>
                                        )}
                                        {member.fields?.NetworkZone && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-gray-500 font-medium">Zone:</span>
                                            <span className="text-gray-900">{member.fields.NetworkZone}</span>
                                          </div>
                                        )}
                                        {member.fields?.Status && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-gray-500 font-medium">Status:</span>
                                            <span className={`${member.fields.Status === 'Plugged' || member.fields.Status?.includes('Connected') ? 'text-green-600' : 'text-orange-600'}`}>
                                              {member.fields.Status}
                                            </span>
                                          </div>
                                        )}
                                        {member.fields?.IPv4Configuration && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-gray-500 font-medium">IPv4:</span>
                                            <span className="text-gray-900">{member.fields.IPv4Configuration}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      if (type === 'wireless') {
                        const wirelessNetwork = wirelessNetworkMap.get(itemName)
                        if (!wirelessNetwork) return null
                        
                        return (
                          <div key={`wireless-${itemName}`} className="border border-gray-300 rounded-lg overflow-hidden bg-white hover:border-gray-400 transition-colors">
                            {/* Parent Wireless Network - Compact Header */}
                            <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-teal-400">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="wifi" className="text-gray-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{itemName}</h4>
                                  {wirelessNetwork.fields?.Status && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      wirelessNetwork.fields.Status === 'Enable' || wirelessNetwork.fields.Status === 'ON'
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {wirelessNetwork.fields.Status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Key Wireless Network Fields - Compact Display */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                                {wirelessNetwork.fields?.SSID && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">SSID:</span>
                                    <span className="text-gray-900 font-mono">{wirelessNetwork.fields.SSID}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.NetworkZone && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Zone:</span>
                                    <span className="text-gray-900">{wirelessNetwork.fields.NetworkZone}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.SecurityMode && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Security:</span>
                                    <span className="text-gray-900">{wirelessNetwork.fields.SecurityMode}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.RadioBand && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Band:</span>
                                    <span className="text-gray-900">{wirelessNetwork.fields.RadioBand}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.Channel && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Channel:</span>
                                    <span className="text-gray-900">{wirelessNetwork.fields.Channel}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.IPAssignment && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">IP Assignment:</span>
                                    <span className="text-gray-900">{wirelessNetwork.fields.IPAssignment}</span>
                                  </div>
                                )}
                                {wirelessNetwork.fields?.IPAddress && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">IP:</span>
                                    <span className="text-gray-900 font-mono">{wirelessNetwork.fields.IPAddress}</span>
                                    {wirelessNetwork.fields?.Netmask && netmaskToCIDR(wirelessNetwork.fields.Netmask) && (
                                      <span className="text-gray-500">/{netmaskToCIDR(wirelessNetwork.fields.Netmask)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      
                      // Regular Interface rendering
                      const interfaceName = itemName
                      const interfaceEntity = interfaceMap.get(interfaceName)
                      const portData = portsWithEntities[interfaceName] || { vlans: [], aliases: [], xfrmInterfaces: [] }
                      const hasVlans = portData.vlans && portData.vlans.length > 0
                      const hasAliases = portData.aliases && portData.aliases.length > 0
                      const hasXfrmInterfaces = portData.xfrmInterfaces && portData.xfrmInterfaces.length > 0
                      
                      // Only show if there's an interface entity OR there are VLANs/Aliases/XFRMInterfaces
                      if (!interfaceEntity && !hasVlans && !hasAliases && !hasXfrmInterfaces) {
                        return null
                      }
                      
                      return (
                        <div key={interfaceName} className="border border-gray-300 rounded-lg overflow-hidden bg-white hover:border-gray-400 transition-colors">
                          {/* Parent Interface - Compact Header */}
                          {interfaceEntity && (
                            <div className="px-3 py-2 border-b border-gray-200 border-l-4 border-l-blue-400">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <Icon name="settings_ethernet" className="text-gray-600 text-base" />
                                  <h4 className="font-semibold text-sm text-gray-900">{interfaceName}</h4>
                                  {interfaceEntity.fields?.InterfaceStatus && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      interfaceEntity.fields.InterfaceStatus === 'ON' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {interfaceEntity.fields.InterfaceStatus}
                                    </span>
                                  )}
                                </div>
                                {(hasVlans || hasAliases || hasXfrmInterfaces) && (
                                  <span className="text-xs text-gray-600 font-medium">
                                    {portData.vlans?.length || 0} VLAN{portData.vlans?.length !== 1 ? 's' : ''}, {portData.aliases?.length || 0} Alias{portData.aliases?.length !== 1 ? 'es' : ''}{hasXfrmInterfaces ? `, ${portData.xfrmInterfaces?.length || 0} XFRM` : ''}
                                  </span>
                                )}
                              </div>
                              {/* Key Interface Fields - Compact Display */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-0.5 text-xs">
                                {interfaceEntity.fields?.IPAddress && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">IP:</span>
                                    <span className="text-gray-900 font-mono">{interfaceEntity.fields.IPAddress}</span>
                                    {interfaceEntity.fields?.Netmask && netmaskToCIDR(interfaceEntity.fields.Netmask) && (
                                      <span className="text-gray-500">/{netmaskToCIDR(interfaceEntity.fields.Netmask)}</span>
                                    )}
                                  </div>
                                )}
                                {interfaceEntity.fields?.NetworkZone && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Zone:</span>
                                    <span className="text-gray-900">{interfaceEntity.fields.NetworkZone}</span>
                                  </div>
                                )}
                                {interfaceEntity.fields?.Hardware && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Hardware:</span>
                                    <span className="text-gray-900">{interfaceEntity.fields.Hardware}</span>
                                  </div>
                                )}
                                {interfaceEntity.fields?.InterfaceSpeed && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Speed:</span>
                                    <span className="text-gray-900">{interfaceEntity.fields.InterfaceSpeed}</span>
                                  </div>
                                )}
                                {interfaceEntity.fields?.Status && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">Status:</span>
                                    <span className={`${interfaceEntity.fields.Status === 'Plugged' ? 'text-green-600' : 'text-orange-600'}`}>
                                      {interfaceEntity.fields.Status}
                                    </span>
                                  </div>
                                )}
                                {interfaceEntity.fields?.IPv4Configuration && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500 font-medium">IPv4:</span>
                                    <span className="text-gray-900">{interfaceEntity.fields.IPv4Configuration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Show interface name even if no interface entity exists but has VLANs/Aliases/XFRMInterfaces */}
                          {!interfaceEntity && (hasVlans || hasAliases || hasXfrmInterfaces) && (
                            <div className="px-3 py-2 border-b border-gray-200 border-l-4 border-l-blue-400">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Icon name="settings_ethernet" className="text-gray-600 text-base" />
                                  <h4 className="font-semibold text-sm text-gray-900">{interfaceName}</h4>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                  {portData.vlans?.length || 0} VLAN{portData.vlans?.length !== 1 ? 's' : ''}, {portData.aliases?.length || 0} Alias{portData.aliases?.length !== 1 ? 'es' : ''}{hasXfrmInterfaces ? `, ${portData.xfrmInterfaces?.length || 0} XFRM` : ''}
                              </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Child Interfaces Container */}
                          {(hasVlans || hasAliases || hasXfrmInterfaces) && (
                            <div className="px-3 py-2 space-y-2">
                          {/* VLANs nested below Interface */}
                          {hasVlans && (
                                <div>
                                  <div className="flex items-center gap-1 mb-1 ml-1">
                                    <Icon name="router" className="text-gray-600 text-xs" />
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                VLANs ({portData.vlans.length})
                              </h5>
                                  </div>
                                  <div className="space-y-1.5 ml-4">
                                {portData.vlans.map((vlan, idx) => (
                                      <div key={`${interfaceName}-vlan-${idx}`} className="border border-gray-200 border-l-[3px] border-l-purple-400 rounded p-1.5 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="font-semibold text-xs text-gray-900">{vlan.name || `VLAN ${idx + 1}`}</span>
                                          {vlan.fields?.VLANID && (
                                            <span className="text-xs px-1 py-0.5 bg-purple-200 text-purple-800 rounded font-mono">
                                              ID: {vlan.fields.VLANID}
                                            </span>
                                          )}
                                          {vlan.fields?.InterfaceStatus && (
                                            <span className={`text-xs px-1 py-0.5 rounded ${
                                              vlan.fields.InterfaceStatus === 'ON' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {vlan.fields.InterfaceStatus}
                                            </span>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
                                          {vlan.fields?.IPAddress && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IP:</span>
                                              <span className="text-gray-900 font-mono">{vlan.fields.IPAddress}</span>
                                              {vlan.fields?.Netmask && netmaskToCIDR(vlan.fields.Netmask) && (
                                                <span className="text-gray-500">/{netmaskToCIDR(vlan.fields.Netmask)}</span>
                                              )}
                                            </div>
                                          )}
                                          {vlan.fields?.Zone && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">Zone:</span>
                                              <span className="text-gray-900">{vlan.fields.Zone}</span>
                                            </div>
                                          )}
                                          {vlan.fields?.Hardware && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">Hardware:</span>
                                              <span className="text-gray-900 font-mono text-xs">{vlan.fields.Hardware}</span>
                                            </div>
                                          )}
                                        </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Aliases nested below Interface */}
                          {hasAliases && (
                                <div>
                                  <div className="flex items-center gap-1 mb-1 ml-1">
                                    <Icon name="label" className="text-gray-600 text-xs" />
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Aliases ({portData.aliases.length})
                              </h5>
                                  </div>
                                  <div className="space-y-1.5 ml-4">
                                {portData.aliases.map((alias, idx) => (
                                      <div key={`${interfaceName}-alias-${idx}`} className="border border-gray-200 border-l-[3px] border-l-green-400 rounded p-1.5 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="font-semibold text-xs text-gray-900">{alias.name || `Alias ${idx + 1}`}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
                                          {/* IPv4 Address */}
                                          {(alias.fields?.IPFamily === 'IPv4' || (!alias.fields?.IPFamily && alias.fields?.IPAddress)) && alias.fields?.IPAddress && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IPv4:</span>
                                              <span className="text-gray-900 font-mono">{alias.fields.IPAddress}</span>
                                              {alias.fields?.Netmask && netmaskToCIDR(alias.fields.Netmask) && (
                                                <span className="text-gray-500">/{netmaskToCIDR(alias.fields.Netmask)}</span>
                                              )}
                                            </div>
                                          )}
                                          {/* IPv6 Address */}
                                          {(alias.fields?.IPFamily === 'IPv6' || alias.fields?.IPv6) && alias.fields?.IPv6 && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IPv6:</span>
                                              <span className="text-gray-900 font-mono">{alias.fields.IPv6}</span>
                                              {alias.fields?.Prefix && (
                                                <span className="text-gray-500">/{alias.fields.Prefix}</span>
                                              )}
                                            </div>
                                          )}
                                          {/* IP Family (if specified) */}
                                          {alias.fields?.IPFamily && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">Family:</span>
                                              <span className="text-gray-900">{alias.fields.IPFamily}</span>
                                            </div>
                                          )}
                                        </div>
                                  </div>
                                ))}
                              </div>
                                </div>
                              )}
                          
                          {/* XFRM Interfaces nested below Interface */}
                          {hasXfrmInterfaces && (
                                <div>
                                  <div className="flex items-center gap-1 mb-1 ml-1">
                                    <Icon name="vpn_key" className="text-gray-600 text-xs" />
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                XFRM Interfaces ({portData.xfrmInterfaces.length})
                              </h5>
                                  </div>
                                  <div className="space-y-1.5 ml-4">
                                {portData.xfrmInterfaces.map((xfrm, idx) => (
                                      <div key={`${interfaceName}-xfrm-${idx}`} className="border border-gray-200 border-l-[3px] border-l-amber-400 rounded p-1.5 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="font-semibold text-xs text-gray-900">{xfrm.name || xfrm.fields?.Name || `XFRM ${idx + 1}`}</span>
                                          {xfrm.fields?.InterfaceStatus && (
                                            <span className={`text-xs px-1 py-0.5 rounded ${
                                              xfrm.fields.InterfaceStatus === 'ON' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {xfrm.fields.InterfaceStatus}
                                            </span>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
                                          {xfrm.fields?.IPv4Address && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IPv4:</span>
                                              <span className="text-gray-900 font-mono">{xfrm.fields.IPv4Address}</span>
                                              {xfrm.fields?.Netmask && netmaskToCIDR(xfrm.fields.Netmask) && (
                                                <span className="text-gray-500">/{netmaskToCIDR(xfrm.fields.Netmask)}</span>
                                              )}
                                            </div>
                                          )}
                                          {xfrm.fields?.Connectionname && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">Connection:</span>
                                              <span className="text-gray-900">{xfrm.fields.Connectionname}</span>
                                            </div>
                                          )}
                                          {xfrm.fields?.Hardware && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">Hardware:</span>
                                              <span className="text-gray-900 font-mono text-xs">{xfrm.fields.Hardware}</span>
                                            </div>
                                          )}
                                          {xfrm.fields?.IPv4Configuration && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IPv4 Config:</span>
                                              <span className="text-gray-900">{xfrm.fields.IPv4Configuration}</span>
                                            </div>
                                          )}
                                          {xfrm.fields?.IPv6Configuration && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">IPv6 Config:</span>
                                              <span className="text-gray-900">{xfrm.fields.IPv6Configuration}</span>
                                            </div>
                                          )}
                                          {xfrm.fields?.MTU && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">MTU:</span>
                                              <span className="text-gray-900">{xfrm.fields.MTU}</span>
                                            </div>
                                          )}
                                          {xfrm.fields?.MSS && typeof xfrm.fields.MSS === 'object' && xfrm.fields.MSS?.MSSValue && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-gray-500 font-medium">MSS:</span>
                                              <span className="text-gray-900">{xfrm.fields.MSS.MSSValue}</span>
                                            </div>
                                          )}
                                        </div>
                                  </div>
                                ))}
                              </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </CollapsibleSection>
            </div>
          )
        )}

        {/* Dynamic Additional Entities - Each as separate collapsible section */}
        {data.entitiesByTag && Object.keys(data.entitiesByTag).length > 0 && 
          Object.entries(data.entitiesByTag)
            .filter(([tag]) => ![
              'IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
              'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork','XFRMInterface','NATRule', // Exclude VLAN/Alias/Interface/LAG/WirelessNetwork/XFRMInterface/NATRule as they're shown in combined structure
              'SelfSignedCertificate','Zone','Network','REDDevice','WirelessAccessPoint', // Exclude Zone, Network, REDDevice, WirelessAccessPoint as they're shown as individual sections
              'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter','After','GroupDetail' // Exclude already shown entities, After (part of AntiVirusHTTPScanningRule), and GroupDetail (part of UserGroup)
            ].includes(tag))
            .filter(([tag]) => sectionVisibility[tag] !== false && data.entitiesByTag[tag]?.length > 0)
            .map(([tag, items]) => (
              <div key={`additional-${tag}`} id={`additional-${tag}`} className="mb-4 scroll-mt-4 px-6">
                <CollapsibleSection
                  title={
                    <div className="flex items-center gap-2">
                      <Icon name={getEntityIcon(tag)} className="text-gray-600" />
                      <span>{tag}</span>
                      <span className="text-gray-500 font-normal">({items.length})</span>
                    </div>
                  }
                  isExpanded={expandedAdditionalSections[tag] || false}
                  onToggle={() => toggleAdditionalSection(tag)}
                  className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
                >
                  {tag === 'VPNIPSecConnection' ? (
                    <VPNIPSecConnectionTable items={items} />
                  ) : tag === 'UniCastRoute' || tag === 'UnicastRoute' ? (
                    <UniCastRouteTable items={items} />
                  ) : tag === 'AuthenticationServer' || tag === 'Authentication' ? (
                    <AuthenticationServerTable items={items} />
                  ) : tag === 'WirelessAccessPoint' ? (
                    <WirelessAccessPointTable items={items} />
                  ) : tag === 'REDDevice' ? (
                    <REDDeviceTable items={items} />
                  ) : tag === 'DNSHostEntry' ? (
                    <DNSHostEntryTable items={items} />
                  ) : tag === 'GatewayHost' ? (
                    <GatewayHostTable items={items} />
                  ) : tag === 'RouterAdvertisement' ? (
                    <RouterAdvertisementTable items={items} />
                  ) : tag === 'SSLVPNPolicy' ? (
                    <SSLVPNPolicyTable items={items} />
                  ) : tag === 'WebFilterCategory' ? (
                    <WebFilterCategoryTable items={items} />
                  ) : tag === 'ClientlessUser' ? (
                    <ClientlessUserTable items={items} />
                  ) : tag === 'UserActivity' ? (
                    <UserActivityTable items={items} />
                  ) : tag === 'MACHost' ? (
                    <MACHostTable items={items} />
                  ) : tag === 'AntiVirusHTTPScanningRule' ? (
                    <AntiVirusHTTPScanningRuleTable items={items} />
                  ) : tag === 'WebFilterException' ? (
                    <WebFilterExceptionTable items={items} />
                  ) : tag === 'AVASAddressGroup' ? (
                    <AVASAddressGroupTable items={items} />
                  ) : tag === 'GatewayConfiguration' ? (
                    <GatewayConfigurationTable items={items} />
                  ) : tag === 'IPSPolicy' ? (
                    <IPSPolicyTable items={items} />
                  ) : tag === 'WebFilterPolicy' ? (
                    <WebFilterPolicyTable items={items} />
                  ) : tag === 'ApplicationFilterCategory' ? (
                    <ApplicationFilterCategoryTable items={items} />
                  ) : tag === 'ApplicationFilterPolicy' ? (
                    <ApplicationFilterPolicyTable items={items} />
                  ) : tag === 'FileType' ? (
                    <FileTypeTable items={items} />
                  ) : tag === 'UserGroup' ? (
                    <UserGroupTable items={items} />
                  ) : tag === 'ApplicationClassificationBatchAssignment' ? (
                    <ApplicationClassificationBatchAssignmentTable items={items} />
                  ) : tag === 'DHCP' ? (
                    <DHCPTable items={items} />
                  ) : tag === 'DHCPv6' || tag === 'DHCPV6' ? (
                    <DHCPv6Table items={items} />
                  ) : tag === 'AdministrationProfile' ? (
                    <AdministrationProfileTable items={items} />
                  ) : tag === 'AntiSpamRule' || tag === 'AntiSpamRules' ? (
                    <AntiSpamRuleTable items={items} />
                  ) : tag === 'WebFilterURLGroup' ? (
                    <WebFilterURLGroupTable items={items} />
                  ) : tag === 'SyslogServer' || tag === 'SyslogServers' ? (
                    <SyslogServerTable items={items} />
                  ) : tag === 'Messages' ? (
                    <MessagesTable items={items} />
                  ) : tag === 'AdminSettings' || tag === 'AdminSetting' ? (
                    <AdminSettingsTable items={items} />
                  ) : tag === 'BackupRestore' ? (
                    <BackupRestoreTable items={items} />
                  ) : (() => {
                    // Check if this is a singleton entity (only one instance)
                    // Use card view for entities that appear only once
                    const isSingleton = items.length === 1
                    
                    if (isSingleton) {
                      return (
                        <SingletonEntityCard
                          item={items[0]}
                          icon={getEntityIcon(tag)}
                          title={tag}
                        />
                      )
                    }
                    
                    // Try exact match first, then case-insensitive match
                    let tableConfig = getTableConfig(tag)
                    if (!tableConfig) {
                      // Try case-insensitive match
                      const tagLower = tag.toLowerCase()
                      const configKeys = ['HealthCheckProfile', 'SDWANProfile', 'SDWANPolicyRoute', 'DHCPServer', 'DHCPBinding', 
                                        'VPNConfiguration', 'VpnConfiguration', 'ThirdPartyFeed', 'RealServers', 'ProtocolSecurity', 
                                        'ReverseAuthentication', 'OTPTokens', 'POPIMAPScanningPolicy', 'MTAAddressGroup', 'SMTPPolicy',
                                        'DNSRequestRoute', 'SiteToSiteServer', 'VoucherDefinition', 'WebFilterPolicy', 
                                        'CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate', 'FileType', 
                                        'WirelessAccessPoint', 'DHCPRelay', 'AccessTimePolicy', 'DataTransferPolicy', 
                                        'SurfingQuotaPolicy', 'QoSPolicy', 'SSLBookMark', 'RouterAdvertisement', 'SystemModules',
                                        'AntiVirusHTTPSScanningExceptions', 'Application', 'VPNProfile', 'CountryGroup', 'WirelessNetworkStatus',
                                        'DecryptionProfile', 'AnitSpamTrustedDomain', 'ContentConditionList', 'MTADataControlList',
                                        'ClientlessPolicy', 'SMSGateway']
                      const matchedKey = configKeys.find(key => key.toLowerCase() === tagLower)
                      if (matchedKey) {
                        tableConfig = getTableConfig(matchedKey)
                      }
                    }
                    
                    if (tableConfig) {
                      return (
                        <ConfigurableEntityTable
                          items={items}
                          title={tableConfig.title}
                          icon={tableConfig.icon}
                          columns={tableConfig.columns}
                          getRowKey={(it, idx) => `${tag}-${it.transactionId}-${it.configIndex || idx}-${idx}`}
                        />
                      )
                    }
                    return (
                      <EntityTable
                        title={`${tag}`}
                        icon={getEntityIcon(tag)}
                        items={items}
                        primaryKeyLabel={null}
                      />
                    )
                  })()}
                </CollapsibleSection>
              </div>
            ))
        }

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500 px-6 pb-6">
          <p>This report was automatically generated from firewall configuration XML</p>
          <p className="mt-0.5">Generated on {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to highlight search matches in text
function highlightSearchMatches(text, searchQuery) {
  // Early return if no search query or text
  if (!searchQuery || !text) {
    return text
  }

  const query = String(searchQuery).trim()
  if (query === '') {
    return text
  }

  const str = String(text)
  if (str === '') {
    return str
  }

  const queryLower = query.toLowerCase()
  const strLower = str.toLowerCase()
  
  // Find all matches (case-insensitive)
  const matches = []
  let startIndex = 0
  while ((startIndex = strLower.indexOf(queryLower, startIndex)) !== -1) {
    matches.push({ start: startIndex, end: startIndex + query.length })
    startIndex += query.length
  }

  if (matches.length === 0) {
    return str
  }

  // Build highlighted text with React elements
  const parts = []
  let lastIndex = 0

  matches.forEach((match, idx) => {
    // Add text before match
    if (match.start > lastIndex) {
      const beforeText = str.substring(lastIndex, match.start)
      if (beforeText) {
        parts.push(beforeText)
      }
    }
    // Add highlighted match with yellow background
    const matchText = str.substring(match.start, match.end)
    parts.push(
      <mark 
        key={`match-${idx}`}
        style={{ 
          backgroundColor: '#fef08a', 
          color: '#000000', 
          padding: '2px 4px', 
          borderRadius: '3px',
          fontWeight: '600',
          display: 'inline'
        }}
      >
        {matchText}
      </mark>
    )
    lastIndex = match.end
  })

  // Add remaining text
  if (lastIndex < str.length) {
    const afterText = str.substring(lastIndex)
    if (afterText) {
      parts.push(afterText)
    }
  }

  // Return fragment with all parts - always return fragment if we have matches
  return parts.length > 0 ? <>{parts}</> : str
}

function ReportField({ label, value, highlight = null, searchQuery = null }) {
  if (!value || value === 'N/A' || value === '') return null

  const highlightClass = highlight === 'green' ? 'text-green-700 font-semibold' : 
                         highlight === 'red' ? 'text-red-700 font-semibold' : 
                         'text-gray-900'

  // Handle long comma-separated values by breaking them into lines
  const formatLongValue = (val) => {
    if (!val) return ''
    const str = String(val)
    
    // Check if we should highlight
    const shouldHighlight = searchQuery && String(searchQuery).trim() !== ''
    
    // If it's a long comma-separated list (more than 100 chars), format it with line breaks
    if (str.length > 100 && str.includes(',')) {
      const items = str.split(',').map(item => item.trim())
      return items.map((item, idx) => {
        const highlightedItem = shouldHighlight ? highlightSearchMatches(item, searchQuery) : item
        return (
          <span key={idx}>
            {highlightedItem}
            {idx < items.length - 1 && ', '}
            {(idx + 1) % 5 === 0 && idx < items.length - 1 && <br />}
          </span>
        )
      })
    }
    
    // Return highlighted string for simple values
    return shouldHighlight ? highlightSearchMatches(str, searchQuery) : str
  }

  return (
    <div className="flex items-start justify-between py-1 border-b border-gray-100 last:border-b-0">
      <div className="text-xs font-medium text-gray-600 pr-3 flex-shrink-0" style={{ minWidth: '140px' }}>{label}:</div>
      <div className={`text-xs ${highlightClass} flex-1 text-left`} style={{ 
        wordBreak: 'break-word', 
        overflowWrap: 'anywhere',
        hyphens: 'auto',
        minWidth: 0
      }}>
        {formatLongValue(value)}
      </div>
    </div>
  )
}