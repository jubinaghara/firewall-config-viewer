import { useState, useEffect, useCallback } from 'react'
import { flattenFirewallRule, formatTagName } from '../utils/xmlParser'
import { Shield, CheckCircle2, XCircle, ChevronRight, ChevronDown } from 'lucide-react'

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

export default function ReportView({ data, filteredRules, sectionVisibility = {}, onToggleSection, onSelectAll, onDeselectAll }) {
  // State for search in sidebar
  const [sectionSearch, setSectionSearch] = useState('')

  // State for main content sections (all collapsed by default)
  const [expandedMainSections, setExpandedMainSections] = useState({})
  // State for individual additional entity sections (all collapsed by default)
  const [expandedAdditionalSections, setExpandedAdditionalSections] = useState({})

  // State for expanded individual rules/items
  const [expandedRules, setExpandedRules] = useState(new Set())
  
  // Loading state for expand/collapse operations
  const [isExpanding, setIsExpanding] = useState(false)
  
  // State for logo loading
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Expand all sections function
  const expandAll = useCallback(() => {
    setIsExpanding(true)
    
    // Use setTimeout to allow UI to update and show loading
    setTimeout(() => {
    // Get all main section keys
    const mainSectionKeys = [
      'firewallRules',
      'referencedObjects',
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

  const toggleMainSection = (section) => {
    setIsExpanding(true)
    setExpandedMainSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    // Hide loading after render
    setTimeout(() => setIsExpanding(false), 100)
  }

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

  const Icon = ({ name, className = '' }) => (
    <span className={`material-symbols-outlined align-middle ${className}`}>{name}</span>
  )

  // Collapsible Section Component
  const CollapsibleSection = ({ title, isExpanded, onToggle, children, className = '' }) => (
    <div className={`${className}`}>
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
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name={icon} className={`${getEntityColor(title)} text-base`} />
          <span>{title}</span>
          <span className="text-gray-500 font-normal">({items.length})</span>
        </h3>
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                {primaryKeyLabel && (
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{primaryKeyLabel}</th>
                )}
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((it, idx) => {
                const name = it.name || it.fields?.Name || primaryValueGetter?.(it) || formatTagName(it.tag || '') || ''
                const primary = primaryValueGetter ? primaryValueGetter(it) : ''
                const details = flattenFields(it.fields)
                return (
                  <tr key={`${title}-${it.transactionId}-${it.name}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
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
                      {details.length === 0 ? (
                        <span className="text-gray-400 italic">No details</span>
                      ) : (
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%', minWidth: '100%' }}>
                          <colgroup>
                            <col style={{ width: '250px' }} />
                            <col style={{ width: 'auto' }} />
                          </colgroup>
                          <tbody>
                            {details.map(([k, v]) => {
                              const val = String(v)
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
                                <tr key={`${title}-${idx}-${k}`} className="border-b border-gray-100 last:border-b-0">
                                  <td className="py-1 pr-4 text-gray-500 font-medium align-top" style={{ 
                                    width: '250px',
                                    verticalAlign: 'top',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    paddingRight: '1rem'
                                  }}>
                                    {k}
                                  </td>
                                  <td className="py-1 pl-2 text-gray-800 align-top" style={{ 
                                    wordBreak: 'break-word', 
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    hyphens: 'auto',
                                    verticalAlign: 'top',
                                    paddingLeft: '0.5rem'
                                  }}>
                                    {formatValue()}
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
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="language" className="text-teal-600 text-base" />
          <span>FQDNHostList</span>
          <span className="text-gray-500 font-normal">({items.length})</span>
        </h3>
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Values</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((it, idx) => (
                <tr key={`fqdn-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
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

    const formatServiceDetails = (fields) => {
      const details = fields?.ServiceDetails?.ServiceDetail
      if (!details) return ''
      const arr = Array.isArray(details) ? details : [details]
      return arr.map(d => {
        const src = d?.SourcePort || d?.SourcePorts || ''
        const dst = d?.DestinationPort || d?.DestinationPorts || ''
        const proto = d?.Protocol || fields?.Protocol || ''
        return [proto && `Protocol ${proto}`, src && `Src ${src}`, dst && `Dst ${dst}`].filter(Boolean).join(', ')
      }).join(' | ')
    }

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-1.5">
          <Icon name="construction" className="text-amber-600 text-base" />
          <span>Services</span>
          <span className="text-gray-500 font-normal">({items.length})</span>
        </h3>
        <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((it, idx) => (
                <tr key={`svc-${it.transactionId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-600 font-medium">{idx + 1}</td>
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
                  }}>{formatServiceDetails(it.fields)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
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

  // Add dynamic entity counts
  const dynamicEntities = {}
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0) {
        dynamicEntities[tag] = items.length
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
    allSections.push({ key: 'firewallRules', name: 'Firewall Rules', icon: 'shield', count: filteredRules.length })
  }
  
  // === SECTION 4: GROUPS (Fourth - groups after individual objects) ===
  if (entityCounts.fqdnHostGroups > 0) allSections.push({ key: 'fqdnHostGroups', name: 'FQDN Host Groups', icon: 'group_work', count: entityCounts.fqdnHostGroups })
  if (entityCounts.ipHostGroups > 0) allSections.push({ key: 'ipHostGroups', name: 'IP Host Groups', icon: 'group_work', count: entityCounts.ipHostGroups })
  if (entityCounts.serviceGroups > 0) allSections.push({ key: 'serviceGroups', name: 'Service Groups', icon: 'group_work', count: entityCounts.serviceGroups })
  if (entityCounts.groups > 0) allSections.push({ key: 'groups', name: 'Other Groups', icon: 'groups', count: entityCounts.groups })
  
  // === SECTION 5: SERVICES (Fifth - services after groups) ===
  if (entityCounts.services > 0) {
    allSections.push({ key: 'services', name: 'Services', icon: 'construction', count: entityCounts.services })
  }
  
  // === SECTION 7: SECURITY POLICIES ===
  if (dynamicEntities.WebFilterPolicy) allSections.push({ key: 'WebFilterPolicy', name: 'Web Filter Policies', icon: 'filter_alt', count: dynamicEntities.WebFilterPolicy })
  if (dynamicEntities.Schedule) allSections.push({ key: 'Schedule', name: 'Schedules', icon: 'schedule', count: dynamicEntities.Schedule })
  if (dynamicEntities.Country) allSections.push({ key: 'Country', name: 'Countries', icon: 'flag', count: dynamicEntities.Country })
  if (dynamicEntities.IPSPolicy) allSections.push({ key: 'IPSPolicy', name: 'IPS Policies', icon: 'security', count: dynamicEntities.IPSPolicy })
  if (dynamicEntities.IntrusionPrevention) allSections.push({ key: 'IntrusionPrevention', name: 'Intrusion Prevention', icon: 'security', count: dynamicEntities.IntrusionPrevention })
  if (dynamicEntities.VirusScanning) allSections.push({ key: 'VirusScanning', name: 'Virus Scanning', icon: 'scanner', count: dynamicEntities.VirusScanning })
  if (dynamicEntities.WebFilter) allSections.push({ key: 'WebFilter', name: 'Web Filters', icon: 'web', count: dynamicEntities.WebFilter })
  
  // === SECTION 7: CERTIFICATES (Combined - show as one entry but handle individually) ===
  const certificateCount = (dynamicEntities.CertificateAuthority || 0) + 
                           (dynamicEntities.SelfSignedCertificate || 0) + 
                           (dynamicEntities.Certificate || 0)
  if (certificateCount > 0) {
    allSections.push({ 
      key: 'certificates', 
      name: 'Certificates', 
      icon: 'verified', 
      count: certificateCount,
      isGroup: true // Mark as grouped section
    })
  }
  
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
        'CertificateAuthority','SelfSignedCertificate','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
        'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter' // Exclude already shown entities
      ].includes(tag)) {
        allSections.push({ key: tag, name: tag, icon: getEntityIcon(tag), count: items.length })
      }
    })
  }
  
  // Filter sections by search
  const filteredSections = allSections.filter(section => 
    section.name.toLowerCase().includes(sectionSearch.toLowerCase())
  )

  // Table of Contents sections - Updated to match new organization
  const tocSections = []
  if (entityCounts.ipHosts + entityCounts.fqdnHosts + entityCounts.macHosts > 0) {
    tocSections.push({ name: 'Host Objects', icon: 'dns', id: 'referenced-objects' })
  }
  if ((data.entitiesByTag?.Interface?.length > 0) || 
      (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
      (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
      (data.entitiesByTag?.WirelessNetwork && data.entitiesByTag.WirelessNetwork.length > 0)) {
    tocSections.push({ name: 'Interfaces & Network', icon: 'settings_ethernet', id: 'ports-vlans-aliases' })
  }
  if (filteredRules.length > 0) tocSections.push({ name: 'Firewall Rules', icon: 'shield', id: 'firewall-rules' })
  if (entityCounts.groups + entityCounts.fqdnHostGroups + entityCounts.ipHostGroups + entityCounts.serviceGroups > 0) {
    tocSections.push({ name: 'Groups', icon: 'group_work', id: 'groups-section' })
  }
  if (entityCounts.services > 0) {
    tocSections.push({ name: 'Services', icon: 'construction', id: 'services-section' })
  }
  if (dynamicEntities.WebFilterPolicy || dynamicEntities.Schedule || dynamicEntities.Country || 
      dynamicEntities.IPSPolicy || dynamicEntities.IntrusionPrevention || dynamicEntities.VirusScanning || dynamicEntities.WebFilter) {
    tocSections.push({ name: 'Security Policies', icon: 'security', id: 'security-policies' })
  }
  if (certificateCount > 0) {
    tocSections.push({ name: 'Certificates', icon: 'verified', id: 'certificates' })
  }
  if (dynamicEntities.Zone || dynamicEntities.Network || dynamicEntities.REDDevice || dynamicEntities.WirelessAccessPoint) {
    tocSections.push({ name: 'Network Configuration', icon: 'router', id: 'network-config' })
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
          <div className="flex gap-1.5">
            <button
              onClick={() => onSelectAll && onSelectAll()}
              className="flex-1 px-1.5 py-1 text-xs font-medium text-white rounded transition-colors"
              style={{ 
                backgroundColor: '#005BC8',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#004A9F'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#005BC8'}
            >
              Select All
            </button>
            <button
              onClick={() => onDeselectAll && onDeselectAll()}
              className="flex-1 px-1.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              Deselect All
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
                  const certAuthVisible = sectionVisibility.CertificateAuthority !== false
                  const selfSignedVisible = sectionVisibility.SelfSignedCertificate !== false
                  const certVisible = sectionVisibility.Certificate !== false
                  isVisible = certAuthVisible || selfSignedVisible || certVisible
                } else {
                  isVisible = sectionVisibility[section.key] !== false
                }
                
                return (
                  <label
                    key={section.key}
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 p-1.5 rounded"
                    onClick={() => {
                      // For certificates group, toggle all certificate types
                      if (section.key === 'certificates') {
                        if (dynamicEntities.CertificateAuthority && onToggleSection) {
                          onToggleSection('CertificateAuthority')
                        }
                        if (dynamicEntities.SelfSignedCertificate && onToggleSection) {
                          onToggleSection('SelfSignedCertificate')
                        }
                        if (dynamicEntities.Certificate && onToggleSection) {
                          onToggleSection('Certificate')
                        }
                      } else {
                        onToggleSection && onToggleSection(section.key)
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => {
                        // For certificates group, toggle all certificate types
                        if (section.key === 'certificates') {
                          if (dynamicEntities.CertificateAuthority && onToggleSection) {
                            onToggleSection('CertificateAuthority')
                          }
                          if (dynamicEntities.SelfSignedCertificate && onToggleSection) {
                            onToggleSection('SelfSignedCertificate')
                          }
                          if (dynamicEntities.Certificate && onToggleSection) {
                            onToggleSection('Certificate')
                          }
                        } else {
                          onToggleSection && onToggleSection(section.key)
                        }
                      }}
                      className="w-4 h-4 border-gray-300 rounded cursor-pointer flex-shrink-0"
                      style={{ 
                        accentColor: '#005BC8'
                      }}
                      onFocus={(e) => e.target.style.outline = '2px solid #005BC8'}
                      onBlur={(e) => e.target.style.outline = ''}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Icon name={section.icon} className={`${getEntityColor(section.key)} text-sm flex-shrink-0`} />
                      <span className="text-xs text-gray-700 truncate">{section.name}</span>
                      {section.count !== null && (
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
              <Shield className="w-7 h-7 text-white" style={{ display: logoLoaded && !logoError ? 'none' : 'block' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Firewall Configuration Report</h1>
              <p className="text-base text-gray-600 mt-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Statement of Work Documentation</p>
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
            <p className="text-gray-500 mb-0.5 text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>API Version</p>
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
          <Icon name="summarize" className={getEntityColor('firewallRules')} />
                <span>Detailed Firewall Rules Analysis</span>
              </div>
            }
            isExpanded={expandedMainSections.firewallRules}
            onToggle={() => toggleMainSection('firewallRules')}
            className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
          >
            <div className="space-y-4">
        {filteredRules.map((rule, index) => {
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
          
          return (
            <div 
              key={rule.id} 
              className="mb-4 border border-gray-200 rounded-lg overflow-hidden rule-section"
            >
              {/* Rule Header - Collapsible */}
              <button
                onClick={() => toggleRule(rule.id)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 flex-1">
                  {isRuleExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                      Rule #{index + 1}: {flat.name || 'Unnamed Rule'}
                    </h3>
                    {flat.description && (
                      <p className="text-xs text-gray-600">{flat.description}</p>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
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

              {/* Rule Details - Expandable */}
              {isRuleExpanded && (
                <div className="p-3 pt-0">

              {/* Rule Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                    <Icon name="info" className="text-gray-700 text-base" />
                    Basic Information
                  </h4>
                  <div className="space-y-1">
                    <ReportField label="Transaction ID" value={rule.transactionId || 'N/A'} />
                    <ReportField label="Policy Type" value={flat.policyType} />
                    <ReportField label="IP Family" value={flat.ipFamily} />
                    <ReportField label="Position" value={flat.position} />
                    {flat.after && <ReportField label="Positioned After" value={flat.after} />}
                  </div>
                </div>

                {/* Action & Traffic Control */}
                <div>
                  <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                    <Icon name="bolt" className="text-yellow-600 text-base" />
                    Action & Traffic Control
                  </h4>
                  <div className="space-y-1">
                    <ReportField 
                      label="Action" 
                      value={flat.action || 'N/A'}
                      highlight={flat.action === 'Accept' ? 'green' : flat.action === 'Deny' ? 'red' : null}
                    />
                    <ReportField label="Log Traffic" value={flat.logTraffic || 'Disable'} />
                    <ReportField label="Schedule" value={flat.schedule || 'All The Time'} />
                  </div>
                </div>

                {/* Network Configuration */}
                <div>
                  <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                    <Icon name="login" className="text-base" style={{ color: '#005BC8' }} />
                    Source Configuration
                  </h4>
                  <div className="space-y-1">
                    {flat.sourceZones && (
                      <ReportField label="Source Zones" value={flat.sourceZones} />
                    )}
                    {flat.sourceNetworks && (
                      <ReportField label="Source Networks" value={flat.sourceNetworks} />
                    )}
                    {!flat.sourceZones && !flat.sourceNetworks && (
                      <ReportField label="Source" value="Any" />
                    )}
                  </div>
                </div>

                {/* Destination Configuration */}
                <div>
                  <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                    <Icon name="logout" className="text-green-600 text-base" />
                    Destination Configuration
                  </h4>
                  <div className="space-y-1">
                    {flat.destinationZones && (
                      <ReportField label="Destination Zones" value={flat.destinationZones} />
                    )}
                    {flat.destinationNetworks && (
                      <ReportField label="Destination Networks" value={flat.destinationNetworks} />
                    )}
                    {!flat.destinationZones && !flat.destinationNetworks && (
                      <ReportField label="Destination" value="Any" />
                    )}
                    {flat.services && (
                      <ReportField label="Services/Ports" value={flat.services} />
                    )}
                  </div>
                </div>

                {/* Security Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                    <Icon name="shield_lock" className="text-purple-600 text-base" />
                    Security Features
                  </h4>
                  <div className="space-y-1">
                    <ReportField label="Web Filter" value={flat.webFilter || 'None'} />
                    <ReportField label="Application Control" value={flat.applicationControl || 'None'} />
                    <ReportField label="Intrusion Prevention" value={flat.intrusionPrevention || 'None'} />
                    <ReportField label="Virus Scanning" value={flat.scanVirus || 'Disable'} />
                    <ReportField label="Zero Day Protection" value={flat.zeroDayProtection || 'Disable'} />
                    <ReportField label="Proxy Mode" value={flat.proxyMode || 'Disable'} />
                    <ReportField label="HTTPS Decryption" value={flat.decryptHTTPS || 'Disable'} />
                  </div>
                </div>

                {/* User Policy Specific (if applicable) */}
                {rule.userPolicy && (
                  <div>
                    <h4 className="font-semibold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
                      <Icon name="groups" className="text-indigo-600 text-base" />
                      User Policy Details
                    </h4>
                    <div className="space-y-1">
                      {flat.identity && (
                        <ReportField label="Identity/Groups" value={flat.identity} />
                      )}
                      {policy.MatchIdentity && (
                        <ReportField label="Match Identity" value={policy.MatchIdentity} />
                      )}
                      {policy.ShowCaptivePortal && (
                        <ReportField label="Show Captive Portal" value={policy.ShowCaptivePortal} />
                      )}
                      {policy.DataAccounting && (
                        <ReportField label="Data Accounting" value={policy.DataAccounting} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Exclusions (if any) */}
              {(() => {
                const exclusions = policy.Exclusions || {}
                // Prefer XML-derived arrays; fall back to object-derived if XML yields empty
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
                      <Icon name="block" className="text-orange-600 text-base" />
                      Exclusions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {sourceZones.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Source Zones:</p>
                          <p className="text-gray-600" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere'
                          }}>{sourceZones.join(', ')}</p>
                        </div>
                      )}
                      {destZones.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Destination Zones:</p>
                          <p className="text-gray-600" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere'
                          }}>{destZones.join(', ')}</p>
                        </div>
                      )}
                      {sourceNetworks.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Source Networks:</p>
                          <p className="text-gray-600" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere'
                          }}>{sourceNetworks.join(', ')}</p>
                        </div>
                      )}
                      {destNetworks.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Destination Networks:</p>
                          <p className="text-gray-600" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere'
                          }}>{destNetworks.join(', ')}</p>
                        </div>
                      )}
                      {services.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-0.5">Services:</p>
                          <p className="text-gray-600" style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'anywhere'
                          }}>{services.join(', ')}</p>
                        </div>
                      )}
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
      </div>
      )}

        {/* Host Objects - Section 2 */}
        {((sectionVisibility.ipHosts !== false && data.ipHosts?.length) || 
          (sectionVisibility.fqdnHosts !== false && data.fqdnHosts?.length) || 
          (sectionVisibility.macHosts !== false && data.macHosts?.length)) ? (
          <div id="referenced-objects" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="dns" className={getEntityColor('ipHosts')} />
                  <span>Host Objects</span>
                </div>
              }
              isExpanded={expandedMainSections.referencedObjects}
              onToggle={() => toggleMainSection('referencedObjects')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
          {sectionVisibility.ipHosts !== false && (
            <EntityTable
              title="IP Hosts"
              icon="dns"
              items={data.ipHosts}
              primaryKeyLabel="IP Address"
              primaryValueGetter={(h) => h.fields?.IPAddress || ''}
            />
          )}
          {sectionVisibility.fqdnHosts !== false && (
            <FqdnHostsTable items={data.fqdnHosts} />
          )}
          {sectionVisibility.macHosts !== false && (
            <EntityTable
              title="MAC Hosts"
              icon="devices"
              items={data.macHosts}
              primaryKeyLabel="MAC Address"
              primaryValueGetter={(h) => h.fields?.MACAddress || ''}
            />
          )}
            </CollapsibleSection>
          </div>
        ) : null}

        {/* Groups - Section 5 */}
        {((sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups?.length) || 
          (sectionVisibility.ipHostGroups !== false && data.ipHostGroups?.length) || 
          (sectionVisibility.serviceGroups !== false && data.serviceGroups?.length) ||
          (sectionVisibility.groups !== false && data.groups?.length)) ? (
          <div id="groups-section" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="group_work" className={getEntityColor('groupsSection')} />
                  <span>Groups</span>
                </div>
              }
              isExpanded={expandedMainSections.groupsSection}
              onToggle={() => toggleMainSection('groupsSection')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
          {sectionVisibility.fqdnHostGroups !== false && (
            <EntityTable
              title="FQDN Host Groups"
              icon="group_work"
              items={data.fqdnHostGroups}
              primaryKeyLabel="Members"
              primaryValueGetter={(g) => Array.isArray(g.fields?.Member) ? g.fields.Member.join(', ') : ''}
            />
          )}
          {sectionVisibility.ipHostGroups !== false && (
            <EntityTable
              title="IP Host Groups"
              icon="group_work"
              items={data.ipHostGroups}
              primaryKeyLabel="Members"
              primaryValueGetter={(g) => Array.isArray(g.fields?.Member) ? g.fields.Member.join(', ') : ''}
            />
          )}
          {sectionVisibility.serviceGroups !== false && (
            <EntityTable
              title="Service Groups"
              icon="group_work"
              items={data.serviceGroups}
              primaryKeyLabel="Members"
              primaryValueGetter={(g) => Array.isArray(g.fields?.Member) ? g.fields.Member.join(', ') : ''}
            />
          )}
          {sectionVisibility.groups !== false && (
            <EntityTable
              title="Other Groups"
              icon="groups"
              items={data.groups}
              primaryKeyLabel={null}
            />
          )}
            </CollapsibleSection>
          </div>
        ) : null}

        {/* Services - Section 6 */}
        {sectionVisibility.services !== false && data.services?.length > 0 && (
          <div id="services-section" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="construction" className={getEntityColor('services')} />
                  <span>Services</span>
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

        {/* Security Policies - Section 7 */}
        {((sectionVisibility.WebFilterPolicy !== false && data.entitiesByTag?.WebFilterPolicy?.length > 0) ||
          (sectionVisibility.Schedule !== false && data.entitiesByTag?.Schedule?.length > 0) ||
          (sectionVisibility.Country !== false && data.entitiesByTag?.Country?.length > 0) ||
          (sectionVisibility.IPSPolicy !== false && data.entitiesByTag?.IPSPolicy?.length > 0) ||
          (sectionVisibility.IntrusionPrevention !== false && data.entitiesByTag?.IntrusionPrevention?.length > 0) ||
          (sectionVisibility.VirusScanning !== false && data.entitiesByTag?.VirusScanning?.length > 0) ||
          (sectionVisibility.WebFilter !== false && data.entitiesByTag?.WebFilter?.length > 0)) && (
          <div id="security-policies" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="security" className={getEntityColor('securityPolicies')} />
                  <span>Security Policies</span>
                </div>
              }
              isExpanded={expandedMainSections.securityPolicies}
              onToggle={() => toggleMainSection('securityPolicies')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              {sectionVisibility.Country !== false && data.entitiesByTag?.Country?.length > 0 && (
                <EntityTable
                  title="Countries"
                  icon="flag"
                  items={data.entitiesByTag.Country}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.WebFilterPolicy !== false && data.entitiesByTag?.WebFilterPolicy?.length > 0 && (
                <EntityTable
                  title="Web Filter Policies"
                  icon="filter_alt"
                  items={data.entitiesByTag.WebFilterPolicy}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.Schedule !== false && data.entitiesByTag?.Schedule?.length > 0 && (
                <EntityTable
                  title="Schedules"
                  icon="schedule"
                  items={data.entitiesByTag.Schedule}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.IPSPolicy !== false && data.entitiesByTag?.IPSPolicy?.length > 0 && (
                <EntityTable
                  title="IPS Policies"
                  icon="security"
                  items={data.entitiesByTag.IPSPolicy}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.IntrusionPrevention !== false && data.entitiesByTag?.IntrusionPrevention?.length > 0 && (
                <EntityTable
                  title="Intrusion Prevention"
                  icon="security"
                  items={data.entitiesByTag.IntrusionPrevention}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.VirusScanning !== false && data.entitiesByTag?.VirusScanning?.length > 0 && (
                <EntityTable
                  title="Virus Scanning"
                  icon="scanner"
                  items={data.entitiesByTag.VirusScanning}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.WebFilter !== false && data.entitiesByTag?.WebFilter?.length > 0 && (
                <EntityTable
                  title="Web Filters"
                  icon="web"
                  items={data.entitiesByTag.WebFilter}
                  primaryKeyLabel={null}
                />
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* Certificates - Section 8 */}
        {((sectionVisibility.CertificateAuthority !== false && data.entitiesByTag?.CertificateAuthority?.length > 0) ||
          (sectionVisibility.SelfSignedCertificate !== false && data.entitiesByTag?.SelfSignedCertificate?.length > 0) ||
          (sectionVisibility.Certificate !== false && data.entitiesByTag?.Certificate?.length > 0)) && (
          <div id="certificates" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="verified" style={{ color: '#005BC8' }} />
                  <span>Certificates</span>
                </div>
              }
              isExpanded={expandedMainSections.certificates}
              onToggle={() => toggleMainSection('certificates')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              {sectionVisibility.CertificateAuthority !== false && data.entitiesByTag?.CertificateAuthority?.length > 0 && (
                <EntityTable
                  title="Certificate Authorities"
                  icon="verified"
                  items={data.entitiesByTag.CertificateAuthority}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.SelfSignedCertificate !== false && data.entitiesByTag?.SelfSignedCertificate?.length > 0 && (
                <EntityTable
                  title="Self-Signed Certificates"
                  icon="verified_user"
                  items={data.entitiesByTag.SelfSignedCertificate}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.Certificate !== false && data.entitiesByTag?.Certificate?.length > 0 && (
                <EntityTable
                  title="Certificates"
                  icon="verified_user"
                  items={data.entitiesByTag.Certificate}
                  primaryKeyLabel={null}
                />
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* Network Configuration - Section 9 */}
        {((sectionVisibility.Zone !== false && data.entitiesByTag?.Zone?.length > 0) ||
          (sectionVisibility.Network !== false && data.entitiesByTag?.Network?.length > 0) ||
          (sectionVisibility.REDDevice !== false && data.entitiesByTag?.REDDevice?.length > 0) ||
          (sectionVisibility.WirelessAccessPoint !== false && data.entitiesByTag?.WirelessAccessPoint?.length > 0)) && (
          <div id="network-config" className="mb-4 scroll-mt-4 px-6">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <Icon name="router" style={{ color: '#005BC8' }} />
                  <span>Network Configuration</span>
                </div>
              }
              isExpanded={expandedMainSections.networkConfig}
              onToggle={() => toggleMainSection('networkConfig')}
              className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
            >
              {sectionVisibility.Zone !== false && data.entitiesByTag?.Zone?.length > 0 && (
                <EntityTable
                  title="Zones"
                  icon="location_city"
                  items={data.entitiesByTag.Zone}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.Network !== false && data.entitiesByTag?.Network?.length > 0 && (
                <EntityTable
                  title="Networks"
                  icon="router"
                  items={data.entitiesByTag.Network}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.REDDevice !== false && data.entitiesByTag?.REDDevice?.length > 0 && (
                <EntityTable
                  title="RED Devices"
                  icon="devices"
                  items={data.entitiesByTag.REDDevice}
                  primaryKeyLabel={null}
                />
              )}
              {sectionVisibility.WirelessAccessPoint !== false && data.entitiesByTag?.WirelessAccessPoint?.length > 0 && (
                <EntityTable
                  title="Wireless Access Points"
                  icon="wifi"
                  items={data.entitiesByTag.WirelessAccessPoint}
                  primaryKeyLabel={null}
                />
              )}
            </CollapsibleSection>
          </div>
        )}

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
                    <Icon name="settings_ethernet" className={getEntityColor('portsWithVlans')} />
                    <span>Interfaces & Network</span>
                    <span className="text-gray-500 font-normal">
                      ({Math.max(
                        data.entitiesByTag?.Interface?.length || 0,
                        Object.keys(data.portsWithEntities || {}).length
                      ) + (data.lagsWithMembers ? Object.keys(data.lagsWithMembers).length : 0) + (data.entitiesByTag?.WirelessNetwork?.length || 0)} interfaces/LAGs/Wireless)
                    </span>
                  </div>
                }
                isExpanded={expandedMainSections.portsWithVlans || false}
                onToggle={() => toggleMainSection('portsWithVlans')}
                className="bg-white"
                style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
              >
                <div className="space-y-4">
                  {(() => {
                    // Helper function to convert netmask to CIDR notation
                    const netmaskToCIDR = (netmask) => {
                      if (!netmask) return null
                      const parts = netmask.split('.')
                      if (parts.length !== 4) return null
                      let cidr = 0
                      for (let i = 0; i < 4; i++) {
                        const octet = parseInt(parts[i], 10)
                        if (isNaN(octet) || octet < 0 || octet > 255) return null
                        // Count leading 1s in binary representation
                        const binary = octet.toString(2).padStart(8, '0')
                        for (let bit = 0; bit < 8; bit++) {
                          if (binary[bit] === '1') {
                            cidr++
                          } else {
                            // If we hit a 0, all remaining bits must be 0 (valid netmask)
                            for (let check = bit + 1; check < 8; check++) {
                              if (binary[check] === '1') return null // Invalid netmask
                            }
                            break
                          }
                        }
                      }
                      return cidr
                    }
                    
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
                    
                    return allItems.map(({ type, name: itemName }) => {
                      if (type === 'lag') {
                        const { lag, members } = lagsWithMembers[itemName]
                        const hasMembers = members && members.length > 0
                        
                        return (
                          <div key={`lag-${itemName}`} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            {/* Parent LAG - Compact Header */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="hub" className="text-orange-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{itemName}</h4>
                                  {lag.fields?.InterfaceStatus && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      lag.fields.InterfaceStatus === 'ON' 
                                        ? 'bg-green-100 text-green-700' 
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
                                  <Icon name="settings_ethernet" className="text-blue-600 text-sm" />
                                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                    Member Interfaces ({members.length})
                                  </h5>
                                </div>
                                <div className="space-y-2 ml-6">
                                  {members.map((member, idx) => (
                                    <div key={`${itemName}-member-${idx}`} className="bg-blue-50 border-l-[3px] border-blue-400 rounded-r p-2.5 hover:bg-blue-100 transition-colors">
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
                          <div key={`wireless-${itemName}`} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            {/* Parent Wireless Network - Compact Header */}
                            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="wifi" className="text-teal-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{itemName}</h4>
                                  {wirelessNetwork.fields?.Status && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      wirelessNetwork.fields.Status === 'Enable' || wirelessNetwork.fields.Status === 'ON'
                                        ? 'bg-green-100 text-green-700' 
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
                      const portData = portsWithEntities[interfaceName] || { vlans: [], aliases: [] }
                      const hasVlans = portData.vlans && portData.vlans.length > 0
                      const hasAliases = portData.aliases && portData.aliases.length > 0
                      
                      // Only show if there's an interface entity OR there are VLANs/Aliases
                      if (!interfaceEntity && !hasVlans && !hasAliases) {
                        return null
                      }
                      
                      return (
                        <div key={interfaceName} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                          {/* Parent Interface - Compact Header */}
                          {interfaceEntity && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon name="settings_ethernet" className="text-blue-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{interfaceName}</h4>
                                  {interfaceEntity.fields?.InterfaceStatus && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      interfaceEntity.fields.InterfaceStatus === 'ON' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {interfaceEntity.fields.InterfaceStatus}
                                    </span>
                                  )}
                                </div>
                                {(hasVlans || hasAliases) && (
                                  <span className="text-xs text-gray-600 font-medium">
                                    {portData.vlans?.length || 0} VLAN{portData.vlans?.length !== 1 ? 's' : ''}, {portData.aliases?.length || 0} Alias{portData.aliases?.length !== 1 ? 'es' : ''}
                                  </span>
                                )}
                              </div>
                              {/* Key Interface Fields - Compact Display */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
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
                          
                          {/* Show interface name even if no interface entity exists but has VLANs/Aliases */}
                          {!interfaceEntity && (hasVlans || hasAliases) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon name="settings_ethernet" className="text-blue-600 text-lg" />
                                  <h4 className="font-semibold text-base text-gray-900">{interfaceName}</h4>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                  {portData.vlans?.length || 0} VLAN{portData.vlans?.length !== 1 ? 's' : ''}, {portData.aliases?.length || 0} Alias{portData.aliases?.length !== 1 ? 'es' : ''}
                              </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Child Interfaces Container */}
                          {(hasVlans || hasAliases) && (
                            <div className="px-4 py-3 space-y-3">
                          {/* VLANs nested below Interface */}
                          {hasVlans && (
                                <div>
                                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                                    <Icon name="router" className="text-purple-600 text-sm" />
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                VLANs ({portData.vlans.length})
                              </h5>
                                  </div>
                                  <div className="space-y-2 ml-6">
                                {portData.vlans.map((vlan, idx) => (
                                      <div key={`${interfaceName}-vlan-${idx}`} className="bg-purple-50 border-l-[3px] border-purple-400 rounded-r p-2.5 hover:bg-purple-100 transition-colors">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="font-semibold text-sm text-gray-900">{vlan.name || `VLAN ${idx + 1}`}</span>
                                          {vlan.fields?.VLANID && (
                                            <span className="text-xs px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded font-mono">
                                              ID: {vlan.fields.VLANID}
                                            </span>
                                          )}
                                          {vlan.fields?.InterfaceStatus && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                              vlan.fields.InterfaceStatus === 'ON' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              {vlan.fields.InterfaceStatus}
                                            </span>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
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
                                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                                    <Icon name="label" className="text-green-600 text-sm" />
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Aliases ({portData.aliases.length})
                              </h5>
                                  </div>
                                  <div className="space-y-2 ml-6">
                                {portData.aliases.map((alias, idx) => (
                                      <div key={`${interfaceName}-alias-${idx}`} className="bg-green-50 border-l-[3px] border-green-400 rounded-r p-2.5 hover:bg-green-100 transition-colors">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="font-semibold text-sm text-gray-900">{alias.name || `Alias ${idx + 1}`}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
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
              'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork' // Exclude VLAN/Alias/Interface/LAG/WirelessNetwork as they're shown in combined structure
            ].includes(tag))
            .filter(([tag]) => sectionVisibility[tag] !== false && data.entitiesByTag[tag]?.length > 0)
            .map(([tag, items]) => (
              <div key={`additional-${tag}`} id={`additional-${tag}`} className="mb-4 scroll-mt-4 px-6">
                <CollapsibleSection
                  title={
                    <div className="flex items-center gap-2">
                      <Icon name={getEntityIcon(tag)} className={getEntityColor(tag)} />
                      <span>{tag}</span>
                      <span className="text-gray-500 font-normal">({items.length})</span>
                    </div>
                  }
                  isExpanded={expandedAdditionalSections[tag] || false}
                  onToggle={() => toggleAdditionalSection(tag)}
                  className="bg-white"
            style={{ boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}
                >
                  <EntityTable
                    title={`${tag}`}
                    icon={getEntityIcon(tag)}
                    items={items}
                    primaryKeyLabel={null}
                  />
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
  )
}

function ReportField({ label, value, highlight = null }) {
  if (!value || value === 'N/A' || value === '') return null

  const highlightClass = highlight === 'green' ? 'text-green-700 font-semibold' : 
                         highlight === 'red' ? 'text-red-700 font-semibold' : 
                         'text-gray-900'

  // Handle long comma-separated values by breaking them into lines
  const formatLongValue = (val) => {
    const str = String(val)
    // If it's a long comma-separated list (more than 100 chars), format it with line breaks
    if (str.length > 100 && str.includes(',')) {
      const items = str.split(',').map(item => item.trim())
      return items.map((item, idx) => (
        <span key={idx}>
          {item}
          {idx < items.length - 1 && ', '}
          {(idx + 1) % 5 === 0 && idx < items.length - 1 && <br />}
        </span>
      ))
    }
    return str
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