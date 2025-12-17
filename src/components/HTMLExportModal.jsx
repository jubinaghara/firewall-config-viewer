import { useState, useMemo } from 'react'
import { X, Download } from 'lucide-react'
import { generateHTMLReport } from '../utils/htmlGenerator'

// Icon component matching ReportView
const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined align-middle ${className}`}>{name}</span>
)

// Icon mapping function matching ReportView - comprehensive with unique icons for all entities
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

export default function HTMLExportModal({ data, sectionVisibility, onToggleSection, onClose }) {
  // Initialize local visibility from sectionVisibility, defaulting all to true if not set
  const [localVisibility, setLocalVisibility] = useState(() => {
    const initial = { ...sectionVisibility }
    // If sectionVisibility is empty or undefined, we'll default sections to visible
    // when checking, so no need to pre-populate here
    return initial
  })
  const [sectionSearch, setSectionSearch] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Get all available sections (exact same logic as ReportView)
  const allSections = useMemo(() => {
    if (!data) return []

    const filteredRules = data.firewallRules || []
    const entityCounts = {
      firewallRules: filteredRules.length,
      ipHosts: data.ipHosts?.length || 0,
      fqdnHosts: data.fqdnHosts?.length || 0,
      macHosts: data.macHosts?.length || 0,
      services: data.services?.length || 0,
      groups: data.groups?.length || 0,
      fqdnHostGroups: data.fqdnHostGroups?.length || 0,
      ipHostGroups: data.ipHostGroups?.length || 0,
      serviceGroups: data.serviceGroups?.length || 0,
    }

    const dynamicEntities = {}
    if (data.entitiesByTag) {
      Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
        if (items && items.length > 0) {
          dynamicEntities[tag] = items.length
        }
      })
    }

    const sections = []
    
    // === SECTION 1: EXECUTIVE SUMMARY ===
    if (filteredRules.length > 0) {
      sections.push({ key: 'executiveSummary', name: 'Executive Summary', icon: 'dashboard', count: null })
    }
    
    // === SECTION 2: HOST OBJECTS (First - as admins configure these first) ===
    if (entityCounts.ipHosts > 0) sections.push({ key: 'ipHosts', name: 'IP Hosts', icon: 'dns', count: entityCounts.ipHosts })
    if (entityCounts.fqdnHosts > 0) sections.push({ key: 'fqdnHosts', name: 'FQDN Hosts', icon: 'language', count: entityCounts.fqdnHosts })
    if (entityCounts.macHosts > 0) sections.push({ key: 'macHosts', name: 'MAC Hosts', icon: 'devices', count: entityCounts.macHosts })
    
    // === SECTION 3: INTERFACES & NETWORK (Second - network configuration) ===
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
      sections.push({ 
        key: 'portsWithVlans', 
        name: 'Interfaces & Network', 
        icon: 'settings_ethernet', 
        count: interfaceCount
      })
    }
    
    // === SECTION 4: FIREWALL RULES (Third - rules after objects and interfaces) ===
    if (filteredRules.length > 0) {
      sections.push({ key: 'firewallRules', name: 'Firewall Rules', icon: 'shield', count: filteredRules.length })
    }
    
    // === SECTION 4.5: SSL/TLS INSPECTION RULES ===
    if (data.sslTlsInspectionRules && data.sslTlsInspectionRules.length > 0) {
      sections.push({ key: 'sslTlsInspectionRules', name: 'SSL/TLS Inspection Rules', icon: 'lock', count: data.sslTlsInspectionRules.length })
    }
    
    // === SECTION 5: GROUPS (Fourth - groups after individual objects) ===
    if (entityCounts.fqdnHostGroups > 0) sections.push({ key: 'fqdnHostGroups', name: 'FQDN Host Groups', icon: 'group_work', count: entityCounts.fqdnHostGroups })
    if (entityCounts.ipHostGroups > 0) sections.push({ key: 'ipHostGroups', name: 'IP Host Groups', icon: 'group_work', count: entityCounts.ipHostGroups })
    if (entityCounts.serviceGroups > 0) sections.push({ key: 'serviceGroups', name: 'Service Groups', icon: 'group_work', count: entityCounts.serviceGroups })
    if (data.entitiesByTag?.CountryGroup?.length > 0) sections.push({ key: 'countryGroups', name: 'Country Groups', icon: 'group_work', count: data.entitiesByTag.CountryGroup.length })
    if (entityCounts.groups > 0) sections.push({ key: 'groups', name: 'Other Groups', icon: 'groups', count: entityCounts.groups })
    
    // === SECTION 6: SERVICES (Fifth - services after groups) ===
    if (entityCounts.services > 0) {
      sections.push({ key: 'services', name: 'Services', icon: 'construction', count: entityCounts.services })
    }
    
    // === SECTION 7: SECURITY POLICIES ===
    if (dynamicEntities.WebFilterPolicy) sections.push({ key: 'WebFilterPolicy', name: 'Web Filter Policies', icon: 'filter_alt', count: dynamicEntities.WebFilterPolicy })
    if (dynamicEntities.Schedule) sections.push({ key: 'Schedule', name: 'Schedules', icon: 'schedule', count: dynamicEntities.Schedule })
    if (dynamicEntities.Country) sections.push({ key: 'Country', name: 'Countries', icon: 'flag', count: dynamicEntities.Country })
    if (dynamicEntities.IPSPolicy) sections.push({ key: 'IPSPolicy', name: 'IPS Policies', icon: 'security', count: dynamicEntities.IPSPolicy })
    if (dynamicEntities.IntrusionPrevention) sections.push({ key: 'IntrusionPrevention', name: 'Intrusion Prevention', icon: 'security', count: dynamicEntities.IntrusionPrevention })
    if (dynamicEntities.VirusScanning) sections.push({ key: 'VirusScanning', name: 'Virus Scanning', icon: 'scanner', count: dynamicEntities.VirusScanning })
    if (dynamicEntities.WebFilter) sections.push({ key: 'WebFilter', name: 'Web Filters', icon: 'web', count: dynamicEntities.WebFilter })
    
    // === SECTION 8: CERTIFICATES (Combined - show as one entry but handle individually) ===
    const certificateCount = (dynamicEntities.CertificateAuthority || 0) + 
                           (dynamicEntities.SelfSignedCertificate || 0) + 
                           (dynamicEntities.SelfSignedCertificateAuthority || 0) +
                           (dynamicEntities.Certificate || 0)
    if (certificateCount > 0) {
      sections.push({ 
        key: 'certificates', 
        name: 'Certificates', 
        icon: 'verified', 
        count: certificateCount,
        isGroup: true // Mark as grouped section
      })
    }
    
    // === SECTION 9: NETWORK & SYSTEM CONFIGURATION ===
    if (dynamicEntities.Zone) sections.push({ key: 'Zone', name: 'Zones', icon: 'location_city', count: dynamicEntities.Zone })
    if (dynamicEntities.Network) sections.push({ key: 'Network', name: 'Networks', icon: 'router', count: dynamicEntities.Network })
    if (dynamicEntities.REDDevice) sections.push({ key: 'REDDevice', name: 'RED Devices', icon: 'devices', count: dynamicEntities.REDDevice })
    if (dynamicEntities.WirelessAccessPoint) sections.push({ key: 'WirelessAccessPoint', name: 'Wireless Access Points', icon: 'wifi', count: dynamicEntities.WirelessAccessPoint })
    
    // === SECTION 10: ADDITIONAL ENTITIES (Remaining entities) ===
    if (data.entitiesByTag) {
      Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
        if (items && items.length > 0 && ![
          'IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
          'Country','CountryGroup','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork',
          'CertificateAuthority','SelfSignedCertificate','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
          'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter','After','GroupDetail'
        ].includes(tag)) {
          sections.push({ key: tag, name: tag, icon: getEntityIcon(tag), count: items.length })
        }
      })
    }

    return sections
  }, [data])

  // Filter sections by search
  const filteredSections = useMemo(() => {
    return allSections.filter(section => 
      section.name.toLowerCase().includes(sectionSearch.toLowerCase())
    )
  }, [allSections, sectionSearch])

  const handleToggle = (sectionKey) => {
    setLocalVisibility(prev => {
      // If current value is false or undefined, set to true; otherwise set to false
      const newValue = (prev[sectionKey] === false || prev[sectionKey] === undefined) ? true : false
      return {
        ...prev,
        [sectionKey]: newValue
      }
    })
  }

  const handleSelectAll = () => {
    const allSelected = {}
    allSections.forEach(section => {
      if (section.key === 'certificates') {
        // Certificates are grouped - toggle all certificate types
        if (data.entitiesByTag?.CertificateAuthority) {
          allSelected.CertificateAuthority = true
        }
        if (data.entitiesByTag?.SelfSignedCertificate) {
          allSelected.SelfSignedCertificate = true
        }
        if (data.entitiesByTag?.Certificate) {
          allSelected.Certificate = true
        }
      } else {
        allSelected[section.key] = true
      }
    })
    // Also include all dynamic entities
    if (data.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => {
        if (data.entitiesByTag[tag]?.length > 0) {
          allSelected[tag] = true
        }
      })
    }
    setLocalVisibility(allSelected)
  }

  const handleDeselectAll = () => {
    const allDeselected = {}
    allSections.forEach(section => {
      if (section.key === 'certificates') {
        allDeselected.CertificateAuthority = false
        allDeselected.SelfSignedCertificate = false
        allDeselected.Certificate = false
      } else {
        allDeselected[section.key] = false
      }
    })
    // CRITICAL: Always set SSL/TLS Inspection Rules and Country Groups to false explicitly
    allDeselected.sslTlsInspectionRules = false
    allDeselected.countryGroups = false
    // Also deselect all dynamic entities
    if (data.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => {
        allDeselected[tag] = false
      })
    }
    setLocalVisibility(allDeselected)
  }

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      // Build comprehensive visibility state with all sections and entities
      const exportVisibility = { ...localVisibility }
      
      // Ensure all sections from allSections are included
      allSections.forEach(section => {
        if (!(section.key in exportVisibility)) {
          // Default to true if not explicitly set to false
          exportVisibility[section.key] = localVisibility[section.key] !== false
        }
        // Handle certificates group
        if (section.key === 'certificates') {
          if (!('CertificateAuthority' in exportVisibility)) {
            exportVisibility.CertificateAuthority = localVisibility.CertificateAuthority !== false
          }
          if (!('SelfSignedCertificate' in exportVisibility)) {
            exportVisibility.SelfSignedCertificate = localVisibility.SelfSignedCertificate !== false
          }
          if (!('Certificate' in exportVisibility)) {
            exportVisibility.Certificate = localVisibility.Certificate !== false
          }
        }
      })
      
      // Include all dynamic entities that exist in data
      if (data.entitiesByTag) {
        Object.keys(data.entitiesByTag).forEach(tag => {
          if (!(tag in exportVisibility)) {
            // Default to true if not explicitly set to false
            exportVisibility[tag] = localVisibility[tag] !== false
          }
        })
      }

      const htmlContent = await generateHTMLReport(data, exportVisibility)
      
      // Create and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `firewall-config-report-${new Date().toISOString().split('T')[0]}.html`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      onClose()
    } catch (error) {
      console.error('Error generating HTML:', error)
      alert('Error generating HTML report. Please check the console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const dynamicEntities = useMemo(() => {
    const entities = {}
    if (data?.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => {
        if (data.entitiesByTag[tag]?.length > 0) {
          entities[tag] = data.entitiesByTag[tag].length
        }
      })
    }
    return entities
  }, [data])

  const getSectionVisibility = (section) => {
    // Handle certificates group visibility (same as ReportView)
    if (section.key === 'certificates') {
      const certAuthVisible = localVisibility.CertificateAuthority !== false
      const selfSignedVisible = localVisibility.SelfSignedCertificate !== false
      const certVisible = localVisibility.Certificate !== false
      return certAuthVisible || selfSignedVisible || certVisible
    }
    return localVisibility[section.key] !== false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              Download as HTML
            </h2>
            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              Select which entities to include in the HTML report
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Sidebar matching ReportView */}
        <div className="flex-1 overflow-hidden flex">
          <div className="w-56 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col">
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
                  onClick={handleSelectAll}
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
                  onClick={handleDeselectAll}
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
                    // Handle certificates group visibility (same as ReportView)
                    let isVisible = false
                    if (section.key === 'certificates') {
                      const certAuthVisible = localVisibility.CertificateAuthority !== false
                      const selfSignedVisible = localVisibility.SelfSignedCertificate !== false
                      const certVisible = localVisibility.Certificate !== false
                      isVisible = certAuthVisible || selfSignedVisible || certVisible
                    } else {
                      isVisible = localVisibility[section.key] !== false
                    }
                    
                    return (
                      <label
                        key={section.key}
                        className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 p-1.5 rounded"
                        onClick={() => {
                          // For certificates group, toggle all certificate types
                          if (section.key === 'certificates') {
                            if (dynamicEntities.CertificateAuthority) {
                              handleToggle('CertificateAuthority')
                            }
                            if (dynamicEntities.SelfSignedCertificate) {
                              handleToggle('SelfSignedCertificate')
                            }
                            if (dynamicEntities.Certificate) {
                              handleToggle('Certificate')
                            }
                          } else {
                            handleToggle(section.key)
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            // For certificates group, toggle all certificate types
                            if (section.key === 'certificates') {
                              if (dynamicEntities.CertificateAuthority) {
                                handleToggle('CertificateAuthority')
                              }
                              if (dynamicEntities.SelfSignedCertificate) {
                                handleToggle('SelfSignedCertificate')
                              }
                              if (dynamicEntities.Certificate) {
                                handleToggle('Certificate')
                              }
                            } else {
                              handleToggle(section.key)
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
                          <Icon name={section.icon} className="text-gray-600 text-sm flex-shrink-0" />
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#005BC8',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
            onMouseEnter={(e) => !isGenerating && (e.target.style.backgroundColor = '#004A9F')}
            onMouseLeave={(e) => !isGenerating && (e.target.style.backgroundColor = '#005BC8')}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
