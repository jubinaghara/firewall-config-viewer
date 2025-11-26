import { flattenFirewallRule, flattenSSLTLSInspectionRule, flattenNATRule, formatTagName } from './xmlParser'

// Icon mapping function - comprehensive with unique icons for all entities
function getEntityIcon(tagName) {
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
    NTP: 'access_time', NTPSettings: 'access_time',
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

// Icon color mapping function - returns color for icons
function getEntityIconColor(tagName) {
  const colorMap = {
    // Host Objects
    IPHost: '#2563eb', FQDNHost: '#059669', MACHost: '#7c3aed',
    // Groups
    Group: '#6366f1', FQDNHostGroup: '#6366f1', IPHostGroup: '#6366f1', ServiceGroup: '#6366f1',
    // Services
    Service: '#f59e0b', Services: '#f59e0b',
    // Interfaces & Network
    Interface: '#3b82f6', VLAN: '#8b5cf6', Alias: '#10b981', Port: '#06b6d4', LAG: '#f97316',
    WirelessNetworks: '#06b6d4', WirelessAccessPoint: '#06b6d4', WirelessNetworkStatus: '#06b6d4',
    // Firewall Rules
    FirewallRule: '#005BC8', UserPolicy: '#6366f1', NetworkPolicy: '#3b82f6',
    // Security & Policies
    Country: '#ef4444', WebFilterPolicy: '#10b981', Schedule: '#2563eb',
    Zone: '#9333ea', Network: '#3b82f6', ApplicationClassificationBatchAssignment: '#f59e0b',
    WebFilter: '#14b8a6', IntrusionPrevention: '#f43f5e', VirusScanning: '#f59e0b',
    IPSPolicy: '#dc2626',
    // Advanced Threat Protection & Threat Intelligence
    ATP: '#dc2626', AdvancedThreatProtection: '#dc2626',
    ThirdPartyFeed: '#8b5cf6', ThirdPartyThreatFeed: '#8b5cf6', ThreatFeed: '#8b5cf6',
    ThreatIntelligence: '#a855f7', ThreatIntelligenceFeed: '#a855f7',
    // Notifications & Alerts
    Notification: '#f59e0b', Notifications: '#f59e0b', NotificationSettings: '#f59e0b',
    Alert: '#ef4444', AlertSettings: '#ef4444',
    // QoS & Traffic Management
    QoS: '#06b6d4', QoSPolicy: '#06b6d4', QualityOfService: '#06b6d4',
    TrafficShaping: '#8b5cf6', BandwidthManagement: '#8b5cf6', TrafficPolicy: '#8b5cf6',
    // Certificates
    CertificateAuthority: '#10b981', SelfSignedCertificate: '#10b981', Certificate: '#10b981',
    // Network & System
    DefaultCaptivePortal: '#14b8a6', PopImapScanning: '#3b82f6', PatternDownload: '#06b6d4',
    REDDevice: '#7c3aed', ZoneType: '#2563eb', RoutingTable: '#3b82f6',
    // VPN & Remote Access
    VPN: '#6366f1', VPNPolicy: '#6366f1', VPNConfiguration: '#6366f1',
    RemoteAccess: '#8b5cf6', RemoteAccessPolicy: '#8b5cf6',
    // Authentication & Identity
    Authentication: '#10b981', AuthenticationPolicy: '#10b981',
    IdentityProvider: '#6366f1', LDAP: '#6366f1', ActiveDirectory: '#6366f1',
    // Application Control
    ApplicationControl: '#f59e0b', ApplicationPolicy: '#f59e0b', ApplicationClassification: '#f59e0b',
    // Content Filtering
    ContentFilter: '#14b8a6', ContentFilterPolicy: '#14b8a6',
    // Logging & Reporting
    Logging: '#6b7280', LoggingPolicy: '#6b7280', LogSettings: '#6b7280',
    Reporting: '#8b5cf6', ReportSettings: '#8b5cf6', AuditLog: '#6b7280',
    // System Settings
    SystemSettings: '#6b7280', SystemConfiguration: '#6b7280',
    SNMP: '#3b82f6', SNMPSettings: '#3b82f6',
    NTP: '#2563eb', NTPSettings: '#2563eb',
    // Backup & Maintenance
    Backup: '#10b981', BackupSettings: '#10b981', Maintenance: '#6b7280',
    // High Availability & Clustering
    HighAvailability: '#06b6d4', Cluster: '#6366f1', ClusterNode: '#6366f1',
    // DHCP & DNS
    DHCP: '#2563eb', DHCPSettings: '#2563eb', DHCPServer: '#2563eb',
    DNSSettings: '#2563eb', DNSServer: '#2563eb',
    // Email & Messaging
    Email: '#3b82f6', EmailPolicy: '#3b82f6', SMTP: '#3b82f6', POP3: '#3b82f6', IMAP: '#3b82f6',
    // File Transfer
    FTP: '#10b981', FTPSettings: '#10b981', SFTP: '#10b981',
    // Web Proxy
    Proxy: '#14b8a6', ProxySettings: '#14b8a6', ProxyPolicy: '#14b8a6',
    // Firewall Settings
    FirewallSettings: '#005BC8', FirewallConfiguration: '#005BC8',
    // NAT & Routing
    NAT: '#8b5cf6', NATPolicy: '#8b5cf6', NATRule: '#8b5cf6',
    StaticRoute: '#3b82f6', DynamicRoute: '#3b82f6',
    // User Management
    User: '#6366f1', UserGroup: '#6366f1', UserPolicy: '#6366f1',
    // Time & Scheduling
    Time: '#2563eb', TimePolicy: '#2563eb', TimeSettings: '#2563eb',
    DateTime: '#2563eb', DateTimeSettings: '#2563eb',
    // Form Templates
    FormTemplate: '#6b7280', Template: '#6b7280',
    // Other common entities
    Policy: '#6366f1', Configuration: '#6b7280', Settings: '#6b7280',
    Rule: '#005BC8', RuleGroup: '#6366f1',
  }
  // Pattern matching for colors
  if (!colorMap[tagName]) {
    const lowerTag = tagName.toLowerCase()
    if (lowerTag.includes('time') || lowerTag.includes('schedule') || lowerTag.includes('ntp')) return '#2563eb'
    if (lowerTag.includes('threat') || lowerTag.includes('atp')) return '#dc2626'
    if (lowerTag.includes('notification') || lowerTag.includes('alert')) return '#f59e0b'
    if (lowerTag.includes('qos') || lowerTag.includes('traffic')) return '#06b6d4'
    if (lowerTag.includes('certificate') || lowerTag.includes('cert')) return '#10b981'
    if (lowerTag.includes('user') || lowerTag.includes('identity')) return '#6366f1'
    if (lowerTag.includes('group')) return '#6366f1'
    if (lowerTag.includes('network') || lowerTag.includes('interface')) return '#3b82f6'
    if (lowerTag.includes('security') || lowerTag.includes('firewall')) return '#005BC8'
    if (lowerTag.includes('vpn') || lowerTag.includes('remote')) return '#6366f1'
    if (lowerTag.includes('backup')) return '#10b981'
    if (lowerTag.includes('log') || lowerTag.includes('audit')) return '#6b7280'
    if (lowerTag.includes('email') || lowerTag.includes('mail')) return '#3b82f6'
    if (lowerTag.includes('dns') || lowerTag.includes('dhcp')) return '#2563eb'
    if (lowerTag.includes('feed')) return '#8b5cf6'
    return '#6b7280' // Default gray
  }
  return colorMap[tagName]
}

// Helper to escape HTML
export function escapeHtml(text) {
  if (text == null) return ''
  const str = String(text)
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return str.replace(/[&<>"']/g, m => map[m])
}

// Helper to format dates
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper to format ServiceDetails for Services as HTML table
function formatServiceDetails(fields) {
  if (!fields) return ''
  
  const serviceDetails = fields?.ServiceDetails
  if (!serviceDetails || typeof serviceDetails !== 'object') return ''
  
  // Handle ServiceDetails.ServiceDetail array
  // ServiceDetail can be an array or a single object
  let details = serviceDetails.ServiceDetail
  if (!details) {
    // Try alternative structure - maybe ServiceDetail is directly an array at ServiceDetails level
    if (Array.isArray(serviceDetails) && serviceDetails.length > 0) {
      details = serviceDetails
    } else {
      return ''
    }
  }
  
  const arr = Array.isArray(details) ? details : [details]
  if (arr.length === 0) return ''
  
  const serviceType = (fields?.Type || '').trim().toUpperCase()
  
  // Build table rows
  let tableRows = ''
  
  if (serviceType === 'IP') {
    // IP type services - single column for Protocol
    tableRows = arr.map((d, idx) => {
      if (!d || typeof d !== 'object' || !d.ProtocolName) return ''
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(d.ProtocolName)}</td>
        </tr>
      `
    }).filter(Boolean).join('')
    
    if (!tableRows) return ''
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Protocol</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  } else if (serviceType === 'ICMPV6') {
    // ICMPv6 type services - two columns for ICMPv6Type and ICMPv6Code
    tableRows = arr.map((d, idx) => {
      if (!d || typeof d !== 'object') return ''
      const icmpv6Type = d.ICMPv6Type || d.ICMPV6Type || '-'
      const icmpv6Code = d.ICMPv6Code || d.ICMPV6Code || '-'
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(icmpv6Type)}</td>
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(icmpv6Code)}</td>
        </tr>
      `
    }).filter(Boolean).join('')
    
    if (!tableRows) return ''
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">ICMPv6 Type</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">ICMPv6 Code</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  } else if (serviceType === 'ICMP') {
    // ICMP type services - two columns for ICMPType and ICMPCode
    tableRows = arr.map((d, idx) => {
      if (!d || typeof d !== 'object') return ''
      const icmpType = d.ICMPType || d.ICMPTYPE || '-'
      const icmpCode = d.ICMPCode || d.ICMPCODE || '-'
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(icmpType)}</td>
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(icmpCode)}</td>
        </tr>
      `
    }).filter(Boolean).join('')
    
    if (!tableRows) return ''
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">ICMP Type</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">ICMP Code</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  } else {
    // TCPorUDP type services - three columns
    tableRows = arr.map((d, idx) => {
      if (!d || typeof d !== 'object') return ''
      const src = d.SourcePort || d.SourcePorts || '-'
      const dst = d.DestinationPort || d.DestinationPorts || '-'
      const proto = d.Protocol || fields?.Protocol || '-'
      
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(proto)}</td>
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(src)}</td>
          <td style="padding: 0.25rem 0.5rem; color: #1f2937;">${escapeHtml(dst)}</td>
        </tr>
      `
    }).filter(Boolean).join('')
    
    if (!tableRows) return ''
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Protocol</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Source Port</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Destination Port</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  }
}

// Helper to flatten entity fields
function flattenFields(obj, prefix = '', isService = false, parentContext = null) {
  const rows = []
  if (!obj || typeof obj !== 'object') return rows

  // For Services, use the root fields object as context (to access Type, etc.)
  const rootContext = parentContext || (isService && prefix === '' ? obj : null)

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
    const preferred = preferredKeys.map(pk => {
      const found = leafEntries.find(([k]) => k.toLowerCase() === pk.toLowerCase())
      return found ? found : null
    }).filter(Boolean)
    const rest = leafEntries.filter(([k]) => !preferred.some(([pk]) => pk === k))
    const top = [...preferred, ...rest].slice(0, 3)
    return top.map(([k, v]) => `${k}: ${v}`).join(', ')
  }

  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    // Special handling for ServiceDetails in Services - use root context to get Type
    if (isService && key === 'ServiceDetails' && value && typeof value === 'object') {
      // Use rootContext if available, otherwise use current obj
      const context = rootContext || obj
      const formatted = formatServiceDetails({ ...context, ServiceDetails: value })
      if (formatted) {
        rows.push([fullKey, formatted])
      } else if (value.ServiceDetail) {
        // Fallback: if formatting fails but ServiceDetail exists, show a summary
        const detailCount = Array.isArray(value.ServiceDetail) ? value.ServiceDetail.length : 1
        rows.push([fullKey, `${detailCount} service detail${detailCount !== 1 ? 's' : ''} configured`])
      }
      return
    }
    
    if (value == null) return
    if (Array.isArray(value)) {
      if (value.length === 0) return
      const allPrimitive = value.every(item => (item == null) || (typeof item !== 'object'))
      if (allPrimitive) {
        const summarized = value.map(item => summarizeObject(item)).join(' | ')
        rows.push([fullKey, summarized])
      } else {
        value.forEach((item, idx) => {
          const subRows = flattenFields(item, `${fullKey}[${idx}]`, isService, rootContext)
          rows.push(...subRows)
        })
      }
    } else if (typeof value === 'object') {
      // Special handling: if we encounter ServiceDetails nested, and we're in a service context,
      // try to format it using root context
      if (isService && key === 'ServiceDetails' && value && typeof value === 'object' && value.ServiceDetail) {
        const context = rootContext || obj
        const formatted = formatServiceDetails({ ...context, ServiceDetails: value })
        if (formatted) {
          rows.push([fullKey, formatted])
          return
        } else {
          // Fallback: if formatting fails but ServiceDetail exists, show a summary
          const detailCount = Array.isArray(value.ServiceDetail) ? value.ServiceDetail.length : 1
          rows.push([fullKey, `${detailCount} service detail${detailCount !== 1 ? 's' : ''} configured`])
          return
        }
      }
      
      const subRows = flattenFields(value, fullKey, isService, rootContext)
      if (subRows.length === 0) {
        rows.push([fullKey, summarizeObject(value)])
      } else {
        rows.push(...subRows)
      }
    } else {
      rows.push([fullKey, String(value)])
    }
  })
  return rows
}

// Generate Services table HTML - matches ReportView.jsx format exactly
function generateServicesTable(items) {
  if (!items || items.length === 0) return ''
  
  let rows = ''
  items.forEach((it, idx) => {
    const name = escapeHtml(it.name || it.fields?.Name || '')
    const serviceType = escapeHtml(it.fields?.Type || '-')
    const description = escapeHtml(it.fields?.Description || '')
    
    // Format ServiceDetails - get formatted table or fallback
    const formatted = formatServiceDetails(it.fields)
    let serviceDetailsHtml = ''
    if (formatted) {
      serviceDetailsHtml = formatted
    } else {
      // Fallback: if ServiceDetails exists but formatting failed, show a summary
      const serviceDetails = it.fields?.ServiceDetails
      if (serviceDetails && typeof serviceDetails === 'object') {
        const details = serviceDetails.ServiceDetail
        if (details) {
          const count = Array.isArray(details) ? details.length : 1
          serviceDetailsHtml = `<span style="font-size: 0.75rem; color: #4b5563;">${count} service detail${count !== 1 ? 's' : ''} configured</span>`
        } else {
          serviceDetailsHtml = '<span style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">No service details</span>'
        }
      } else {
        serviceDetailsHtml = '<span style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">No service details</span>'
      }
    }
    
    rows += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500;">${idx + 1}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 120px;">${serviceType}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td style="padding: 0.625rem 1rem; max-width: 400px;">${serviceDetailsHtml}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">construction</span>
        <span>Services</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div style="overflow-x: auto; border: 1px solid #d1d5db; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 3rem;">#</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Name</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Type</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Description</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Service Details</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Generate entity table HTML
function generateEntityTable(title, icon, items, primaryKeyLabel = null, primaryValueGetter = null) {
  if (!items || items.length === 0) return ''
  
  // Detect if this is a Services table - check multiple conditions
  const isService = title.toLowerCase().includes('service') || 
                    (items.length > 0 && (
                      items[0].fields?.ServiceDetails !== undefined ||
                      items[0].tag === 'Service' || 
                      items[0].tag === 'Services' ||
                      items.some(item => item.fields?.ServiceDetails !== undefined)
                    ))
  
  let rows = ''
  items.forEach((it, idx) => {
    const name = escapeHtml(it.name || it.fields?.Name || primaryValueGetter?.(it) || formatTagName(it.tag || '') || '')
    const primary = primaryKeyLabel && primaryValueGetter ? escapeHtml(primaryValueGetter(it)) : ''
    const details = flattenFields(it.fields, '', isService)
    
    let detailsHtml = ''
    if (details.length === 0) {
      detailsHtml = '<span style="color: #9ca3af; font-style: italic;">No details</span>'
    } else {
      detailsHtml = `
        <table style="width: 100%; min-width: 100%; border-collapse: collapse; table-layout: fixed;">
          <colgroup>
            <col style="width: 250px;" />
            <col style="width: auto;" />
          </colgroup>
          <tbody>
            ${details.map(([k, v]) => {
              // If this is ServiceDetails and it's already formatted as HTML table, don't escape it
              const isServiceDetailsTable = k === 'ServiceDetails' && typeof v === 'string' && v.includes('<table')
              const val = isServiceDetailsTable ? v : escapeHtml(String(v))
              return `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 0.25rem 1rem 0.25rem 0; color: #6b7280; font-weight: 500; width: 250px; word-break: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top;">${escapeHtml(k)}</td>
                  <td style="padding: 0.25rem 0 0.25rem 0.5rem; color: #1f2937; word-break: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top;">${val}</td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      `
    }
    
    // For Services, add Type column
    const serviceType = isService ? (it.fields?.Type || '-') : null
    
    rows += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500;">${idx + 1}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        ${isService ? `<td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 120px;">${escapeHtml(serviceType)}</td>` : ''}
        ${primaryKeyLabel ? `<td style="padding: 0.625rem 1rem; font-size: 0.875rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">${primary}</td>` : ''}
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 500px;">
          <div style="display: grid; grid-template-columns: 1fr; gap: 0.375rem;">
            ${detailsHtml}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem;">${icon}</span>
        <span>${escapeHtml(title)}</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div style="overflow-x: auto; border: 1px solid #d1d5db; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 3rem;">#</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Name</th>
              ${isService ? `<th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Type</th>` : ''}
              ${primaryKeyLabel ? `<th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(primaryKeyLabel)}</th>` : ''}
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Details</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Generate VPN IPSec Connection table HTML with Local/Remote columns
function generateVPNIPSecConnectionTable(items) {
  if (!items || items.length === 0) return ''
  
  const formatRemoteNetwork = (fields) => {
    const remoteNetwork = fields?.RemoteNetwork
    if (!remoteNetwork) return 'N/A'
    if (typeof remoteNetwork === 'string') return remoteNetwork
    if (typeof remoteNetwork === 'object' && remoteNetwork.Network) {
      if (Array.isArray(remoteNetwork.Network)) {
        return remoteNetwork.Network.join(', ')
      }
      return remoteNetwork.Network
    }
    return 'N/A'
  }
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(it.name || fields.Name || '')
    const connectionType = escapeHtml(fields.ConnectionType || 'N/A')
    const status = fields.Status || 'N/A'
    const policy = escapeHtml(fields.Policy || 'N/A')
    
    const localID = fields.LocalID || ''
    const localIDType = fields.LocalIDType || ''
    const localSubnet = fields.LocalSubnet || ''
    const localWANPort = fields.LocalWANPort || fields.AliasLocalWANPort || ''
    const remoteID = fields.RemoteID || ''
    const remoteIDType = fields.RemoteIDType || ''
    const remoteHost = fields.RemoteHost || ''
    const remoteNetwork = formatRemoteNetwork(fields)
    
    const localInfo = [
      localID && `${localIDType}: ${localID}`,
      localSubnet && localSubnet !== 'Any' && `Subnet: ${localSubnet}`,
      localWANPort && `Port: ${localWANPort}`
    ].filter(Boolean).join(' | ') || 'N/A'
    
    const remoteInfo = [
      remoteID && `${remoteIDType}: ${remoteID}`,
      remoteHost && remoteHost !== '*' && `Host: ${remoteHost}`,
      remoteNetwork && remoteNetwork !== 'Any' && `Network: ${remoteNetwork}`
    ].filter(Boolean).join(' | ') || 'N/A'
    
    const statusBadge = status === 'Active' 
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Active</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(status) + '</span>'
    
    rows += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500;">${idx + 1}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${connectionType}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem;">${statusBadge}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">${escapeHtml(localInfo)}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">${escapeHtml(remoteInfo)}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${policy}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">vpn_key</span>
        <span>VPN IPSec Connections</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div style="overflow-x: auto; border: 1px solid #d1d5db; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 3rem;">#</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Name</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Connection Type</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Local</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Remote</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Policy</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Helper function to convert netmask to CIDR notation
function netmaskToCIDR(netmask) {
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

// Generate interfaces section HTML with VLANs, Aliases, and XFRMInterfaces
function generateInterfacesSection(data) {
  const interfaceEntities = data.entitiesByTag?.Interface || []
  const portsWithEntities = data.portsWithEntities || {}
  const lagsWithMembers = data.lagsWithMembers || {}
  
  // Build set of interface names that are LAG members
  const lagMemberInterfaces = new Set()
  Object.values(lagsWithMembers).forEach(({ members }) => {
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
      interfaceMap.set(name, intf)
    }
  })
  
  // Collect all unique interface names
  const allInterfaceNames = new Set([
    ...interfaceEntities
      .map(intf => intf.name || intf.fields?.Name)
      .filter(Boolean)
      .filter(name => !lagMemberInterfaces.has(name)),
    ...Object.keys(portsWithEntities).filter(name => !lagMemberInterfaces.has(name))
  ])
  
  if (allInterfaceNames.size === 0) {
    return '<p style="padding: 1rem; color: #6b7280;">No interfaces found</p>'
  }
  
  let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">'
  
  Array.from(allInterfaceNames).sort().forEach(interfaceName => {
    const interfaceEntity = interfaceMap.get(interfaceName)
    const portData = portsWithEntities[interfaceName] || { vlans: [], aliases: [], xfrmInterfaces: [] }
    const hasVlans = portData.vlans && portData.vlans.length > 0
    const hasAliases = portData.aliases && portData.aliases.length > 0
    const hasXfrmInterfaces = portData.xfrmInterfaces && portData.xfrmInterfaces.length > 0
    
    if (!interfaceEntity && !hasVlans && !hasAliases && !hasXfrmInterfaces) {
      return
    }
    
    html += '<div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background-color: #ffffff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">'
    
    // Interface header
    if (interfaceEntity) {
      html += `<div style="background: linear-gradient(to right, #eff6ff, #e0e7ff); padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">`
      html += `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">`
      html += `<div style="display: flex; align-items: center; gap: 0.375rem;">`
      html += `<span class="material-symbols-outlined" style="color: #4b5563; font-size: 1rem;">settings_ethernet</span>`
      html += `<h4 style="font-weight: 600; font-size: 0.875rem; color: #111827; margin: 0;">${escapeHtml(interfaceName)}</h4>`
      if (interfaceEntity.fields?.InterfaceStatus) {
        const statusColor = interfaceEntity.fields.InterfaceStatus === 'ON' ? '#10b981' : '#6b7280'
        html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.375rem; border-radius: 9999px; background-color: ${statusColor === '#10b981' ? '#d1fae5' : '#f3f4f6'}; color: ${statusColor}; font-weight: 500;">${escapeHtml(interfaceEntity.fields.InterfaceStatus)}</span>`
      }
      html += `</div>`
      if (hasVlans || hasAliases || hasXfrmInterfaces) {
        html += `<span style="font-size: 0.625rem; color: #6b7280; font-weight: 500;">`
        html += `${portData.vlans?.length || 0} VLAN${portData.vlans?.length !== 1 ? 's' : ''}, ${portData.aliases?.length || 0} Alias${portData.aliases?.length !== 1 ? 'es' : ''}`
        if (hasXfrmInterfaces) {
          html += `, ${portData.xfrmInterfaces?.length || 0} XFRM`
        }
        html += `</span>`
      }
      html += `</div>`
      
      // Interface fields
      const fields = []
      if (interfaceEntity.fields?.IPAddress) {
        const cidr = interfaceEntity.fields.Netmask ? netmaskToCIDR(interfaceEntity.fields.Netmask) : null
        fields.push(`<div><span style="color: #6b7280; font-weight: 500;">IP:</span> <span style="font-family: monospace; color: #111827;">${escapeHtml(interfaceEntity.fields.IPAddress)}${cidr ? `/${cidr}` : ''}</span></div>`)
      }
      if (interfaceEntity.fields?.NetworkZone) {
        fields.push(`<div><span style="color: #6b7280; font-weight: 500;">Zone:</span> <span style="color: #111827;">${escapeHtml(interfaceEntity.fields.NetworkZone)}</span></div>`)
      }
      if (interfaceEntity.fields?.Hardware) {
        fields.push(`<div><span style="color: #6b7280; font-weight: 500;">Hardware:</span> <span style="color: #111827;">${escapeHtml(interfaceEntity.fields.Hardware)}</span></div>`)
      }
      if (interfaceEntity.fields?.InterfaceSpeed) {
        fields.push(`<div><span style="color: #6b7280; font-weight: 500;">Speed:</span> <span style="color: #111827;">${escapeHtml(interfaceEntity.fields.InterfaceSpeed)}</span></div>`)
      }
      if (fields.length > 0) {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.25rem 0.75rem; font-size: 0.625rem; padding-top: 0.25rem;">${fields.join('')}</div>`
      }
      html += `</div>`
    } else if (hasVlans || hasAliases || hasXfrmInterfaces) {
      html += `<div style="background: linear-gradient(to right, #eff6ff, #e0e7ff); padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">`
      html += `<div style="display: flex; align-items: center; justify-content: space-between;">`
      html += `<div style="display: flex; align-items: center; gap: 0.375rem;">`
      html += `<span class="material-symbols-outlined" style="color: #4b5563; font-size: 1rem;">settings_ethernet</span>`
      html += `<h4 style="font-weight: 600; font-size: 0.875rem; color: #111827; margin: 0;">${escapeHtml(interfaceName)}</h4>`
      html += `</div>`
      html += `<span style="font-size: 0.625rem; color: #6b7280; font-weight: 500;">`
      html += `${portData.vlans?.length || 0} VLAN${portData.vlans?.length !== 1 ? 's' : ''}, ${portData.aliases?.length || 0} Alias${portData.aliases?.length !== 1 ? 'es' : ''}`
      if (hasXfrmInterfaces) {
        html += `, ${portData.xfrmInterfaces?.length || 0} XFRM`
      }
      html += `</span>`
      html += `</div>`
      html += `</div>`
    }
    
    // Child interfaces container
    if (hasVlans || hasAliases || hasXfrmInterfaces) {
      html += '<div style="padding: 0.5rem 0.75rem;">'
      
      // VLANs
      if (hasVlans) {
        html += `<div style="margin-bottom: 0.5rem;">`
        html += `<div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.375rem; margin-left: 0.25rem;">`
        html += `<span class="material-symbols-outlined" style="color: #4b5563; font-size: 0.75rem;">router</span>`
        html += `<h5 style="font-size: 0.625rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">VLANs (${portData.vlans.length})</h5>`
        html += `</div>`
        html += `<div style="display: flex; flex-direction: column; gap: 0.375rem; margin-left: 1rem;">`
        portData.vlans.forEach((vlan, idx) => {
          html += `<div style="background-color: #faf5ff; border-left: 3px solid #a855f7; border-radius: 0 4px 4px 0; padding: 0.375rem;">`
          html += `<div style="display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.25rem;">`
          html += `<span style="font-weight: 600; font-size: 0.75rem; color: #111827;">${escapeHtml(vlan.name || `VLAN ${idx + 1}`)}</span>`
          if (vlan.fields?.VLANID) {
            html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.25rem; background-color: #e9d5ff; color: #6b21a8; border-radius: 4px; font-family: monospace;">ID: ${escapeHtml(vlan.fields.VLANID)}</span>`
          }
          if (vlan.fields?.InterfaceStatus) {
            const statusColor = vlan.fields.InterfaceStatus === 'ON' ? '#10b981' : '#6b7280'
            html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.25rem; border-radius: 4px; background-color: ${statusColor === '#10b981' ? '#d1fae5' : '#f3f4f6'}; color: ${statusColor};">${escapeHtml(vlan.fields.InterfaceStatus)}</span>`
          }
          html += `</div>`
          const vlanFields = []
          if (vlan.fields?.IPAddress) {
            const cidr = vlan.fields.Netmask ? netmaskToCIDR(vlan.fields.Netmask) : null
            vlanFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IP:</span> <span style="font-family: monospace; color: #111827;">${escapeHtml(vlan.fields.IPAddress)}${cidr ? `/${cidr}` : ''}</span></div>`)
          }
          if (vlan.fields?.Zone) {
            vlanFields.push(`<div><span style="color: #6b7280; font-weight: 500;">Zone:</span> <span style="color: #111827;">${escapeHtml(vlan.fields.Zone)}</span></div>`)
          }
          if (vlanFields.length > 0) {
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.125rem 0.75rem; font-size: 0.625rem;">${vlanFields.join('')}</div>`
          }
          html += `</div>`
        })
        html += `</div></div>`
      }
      
      // Aliases
      if (hasAliases) {
        html += `<div style="margin-bottom: 0.5rem;">`
        html += `<div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.375rem; margin-left: 0.25rem;">`
        html += `<span class="material-symbols-outlined" style="color: #4b5563; font-size: 0.75rem;">label</span>`
        html += `<h5 style="font-size: 0.625rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Aliases (${portData.aliases.length})</h5>`
        html += `</div>`
        html += `<div style="display: flex; flex-direction: column; gap: 0.375rem; margin-left: 1rem;">`
        portData.aliases.forEach((alias, idx) => {
          html += `<div style="background-color: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 0 4px 4px 0; padding: 0.375rem;">`
          html += `<div style="font-weight: 600; font-size: 0.75rem; color: #111827; margin-bottom: 0.25rem;">${escapeHtml(alias.name || `Alias ${idx + 1}`)}</div>`
          const aliasFields = []
          if (alias.fields?.IPAddress && (alias.fields?.IPFamily === 'IPv4' || !alias.fields?.IPFamily)) {
            const cidr = alias.fields.Netmask ? netmaskToCIDR(alias.fields.Netmask) : null
            aliasFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IPv4:</span> <span style="font-family: monospace; color: #111827;">${escapeHtml(alias.fields.IPAddress)}${cidr ? `/${cidr}` : ''}</span></div>`)
          }
          if (alias.fields?.IPv6 || alias.fields?.IPFamily === 'IPv6') {
            aliasFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IPv6:</span> <span style="font-family: monospace; color: #111827;">${escapeHtml(alias.fields.IPv6 || '')}${alias.fields?.Prefix ? `/${escapeHtml(alias.fields.Prefix)}` : ''}</span></div>`)
          }
          if (aliasFields.length > 0) {
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.125rem 0.75rem; font-size: 0.625rem;">${aliasFields.join('')}</div>`
          }
          html += `</div>`
        })
        html += `</div></div>`
      }
      
      // XFRM Interfaces
      if (hasXfrmInterfaces) {
        html += `<div>`
        html += `<div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.375rem; margin-left: 0.25rem;">`
        html += `<span class="material-symbols-outlined" style="color: #4b5563; font-size: 0.75rem;">vpn_key</span>`
        html += `<h5 style="font-size: 0.625rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">XFRM Interfaces (${portData.xfrmInterfaces.length})</h5>`
        html += `</div>`
        html += `<div style="display: flex; flex-direction: column; gap: 0.375rem; margin-left: 1rem;">`
        portData.xfrmInterfaces.forEach((xfrm, idx) => {
          html += `<div style="background-color: #fff7ed; border-left: 3px solid #fb923c; border-radius: 0 4px 4px 0; padding: 0.375rem;">`
          html += `<div style="display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.25rem;">`
          html += `<span style="font-weight: 600; font-size: 0.75rem; color: #111827;">${escapeHtml(xfrm.name || xfrm.fields?.Name || `XFRM ${idx + 1}`)}</span>`
          if (xfrm.fields?.InterfaceStatus) {
            const statusColor = xfrm.fields.InterfaceStatus === 'ON' ? '#10b981' : '#6b7280'
            html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.25rem; border-radius: 4px; background-color: ${statusColor === '#10b981' ? '#d1fae5' : '#f3f4f6'}; color: ${statusColor};">${escapeHtml(xfrm.fields.InterfaceStatus)}</span>`
          }
          html += `</div>`
          const xfrmFields = []
          if (xfrm.fields?.IPv4Address) {
            const cidr = xfrm.fields.Netmask ? netmaskToCIDR(xfrm.fields.Netmask) : null
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IPv4:</span> <span style="font-family: monospace; color: #111827;">${escapeHtml(xfrm.fields.IPv4Address)}${cidr ? `/${cidr}` : ''}</span></div>`)
          }
          if (xfrm.fields?.Connectionname) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">Connection:</span> <span style="color: #111827;">${escapeHtml(xfrm.fields.Connectionname)}</span></div>`)
          }
          if (xfrm.fields?.Hardware) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">Hardware:</span> <span style="font-family: monospace; font-size: 0.625rem; color: #111827;">${escapeHtml(xfrm.fields.Hardware)}</span></div>`)
          }
          if (xfrm.fields?.IPv4Configuration) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IPv4 Config:</span> <span style="color: #111827;">${escapeHtml(xfrm.fields.IPv4Configuration)}</span></div>`)
          }
          if (xfrm.fields?.IPv6Configuration) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">IPv6 Config:</span> <span style="color: #111827;">${escapeHtml(xfrm.fields.IPv6Configuration)}</span></div>`)
          }
          if (xfrm.fields?.MTU) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">MTU:</span> <span style="color: #111827;">${escapeHtml(xfrm.fields.MTU)}</span></div>`)
          }
          if (xfrm.fields?.MSS && typeof xfrm.fields.MSS === 'object' && xfrm.fields.MSS?.MSSValue) {
            xfrmFields.push(`<div><span style="color: #6b7280; font-weight: 500;">MSS:</span> <span style="color: #111827;">${escapeHtml(xfrm.fields.MSS.MSSValue)}</span></div>`)
          }
          if (xfrmFields.length > 0) {
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.125rem 0.75rem; font-size: 0.625rem;">${xfrmFields.join('')}</div>`
          }
          html += `</div>`
        })
        html += `</div></div>`
      }
      
      html += '</div>'
    }
    
    html += '</div>'
  })
  
  html += '</div>'
  return html
}

// Generate collapsible section HTML
function generateCollapsibleSection(sectionId, title, content, isExpanded = true) {
  return `
    <div style="background-color: #ffffff; border-radius: 4px; box-shadow: 0px 0px 6px 0px rgba(0, 0, 0, 0.1); margin-bottom: 1rem;">
      <button 
        onclick="toggleSection('${sectionId}')" 
        id="section-btn-${sectionId}"
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: none; border: none; border-bottom: 1px solid #e5e7eb; cursor: pointer; text-align: left;"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="font-weight: 600; font-size: 0.75rem; color: #111827; flex: 1; text-align: left;">${title}</div>
        <svg id="chevron-${sectionId}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="${isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'}" />
        </svg>
      </button>
      <div 
        id="section-content-${sectionId}" 
        style="display: ${isExpanded ? 'block' : 'none'}; padding: 0.75rem;"
      >
        ${content}
      </div>
    </div>
  `
}

// Generate firewall rule HTML
function generateFirewallRule(rule, index, isExpanded = false) {
  const flat = flattenFirewallRule(rule)
  const ruleId = `rule-${index}`
  
  // Extract exclusions from XML
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
      // Ignore parsing errors
    }
    return result
  }

  const xmlEx = extractExclusionsFromXml(rule.rawXml)
  const policy = rule.networkPolicy || rule.userPolicy || {}
  
  const statusBadge = flat.status === 'Enable' 
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">✓ Enabled</span>'
    : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">✗ Disabled</span>'

  // Helper function to normalize exclusions into an array of strings (matches ReportView.jsx)
  const getExclusionArray = (value, key) => {
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
        if (input[key] !== undefined) {
          collect(input[key])
          return
        }
        Object.values(input).forEach(collect)
      }
    }
    collect(value)
    return Array.from(new Set(out))
  }

  // Helper function to render a field
  const renderField = (label, value, highlight = null) => {
    if (value === null || value === undefined) return ''
    const color = highlight === 'green' ? '#15803d' : highlight === 'red' ? '#dc2626' : '#111827'
    const fontWeight = highlight === 'green' || highlight === 'red' ? '600' : 'normal'
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0; vertical-align: top;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
  }

  // Always generate the full rule details HTML (not conditional on isExpanded)
  const ruleDetailsHtml = `
    <div style="padding: 0.75rem; padding-top: 0;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <!-- Basic Information -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">info</span>
            Basic Information
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Transaction ID', rule.transactionId || 'N/A')}
              ${renderField('Policy Type', flat.policyType)}
              ${renderField('IP Family', flat.ipFamily)}
              ${renderField('Position', flat.position)}
              ${flat.after ? renderField('Positioned After', flat.after) : ''}
            </tbody>
          </table>
        </div>

        <!-- Action & Traffic Control -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">bolt</span>
            Action & Traffic Control
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Action', flat.action || 'N/A', flat.action === 'Accept' ? 'green' : flat.action === 'Deny' ? 'red' : null)}
              ${renderField('Log Traffic', flat.logTraffic || 'Disable')}
              ${renderField('Schedule', flat.schedule || 'All The Time')}
            </tbody>
          </table>
        </div>

        <!-- Source Configuration -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">login</span>
            Source Configuration
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${flat.sourceZones ? renderField('Source Zones', flat.sourceZones) : ''}
              ${flat.sourceNetworks ? renderField('Source Networks', flat.sourceNetworks) : ''}
              ${!flat.sourceZones && !flat.sourceNetworks ? renderField('Source', 'Any') : ''}
            </tbody>
          </table>
        </div>

        <!-- Destination Configuration -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">logout</span>
            Destination Configuration
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${flat.destinationZones ? renderField('Destination Zones', flat.destinationZones) : ''}
              ${flat.destinationNetworks ? renderField('Destination Networks', flat.destinationNetworks) : ''}
              ${!flat.destinationZones && !flat.destinationNetworks ? renderField('Destination', 'Any') : ''}
              ${flat.services ? renderField('Services/Ports', flat.services) : ''}
            </tbody>
          </table>
        </div>

        <!-- Security Features -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">shield_lock</span>
            Security Features
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Web Filter', flat.webFilter || 'None')}
              ${renderField('Application Control', flat.applicationControl || 'None')}
              ${renderField('Intrusion Prevention', flat.intrusionPrevention || 'None')}
              ${renderField('Virus Scanning', flat.scanVirus || 'Disable')}
              ${renderField('Zero Day Protection', flat.zeroDayProtection || 'Disable')}
              ${renderField('Proxy Mode', flat.proxyMode || 'Disable')}
              ${renderField('HTTPS Decryption', flat.decryptHTTPS || 'Disable')}
            </tbody>
          </table>
        </div>

        <!-- User Policy Details (if applicable) -->
        ${rule.userPolicy ? `
          <div>
            <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
              <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">groups</span>
              User Policy Details
            </h4>
            <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
              <tbody>
                ${(() => {
                  // Extract Identity - try flattened version first, then fallback to policy
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
                  return identityValue ? renderField('Identity/Groups', identityValue) : '';
                })()}
                ${policy.MatchIdentity ? renderField('Match Identity', policy.MatchIdentity) : ''}
                ${policy.ShowCaptivePortal ? renderField('Show Captive Portal', policy.ShowCaptivePortal) : ''}
                ${policy.DataAccounting ? renderField('Data Accounting', policy.DataAccounting) : ''}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>

      <!-- Exclusions (if any) - matches ReportView.jsx exactly -->
      ${(() => {
        const exclusions = policy.Exclusions || {}
        // Prefer XML-derived arrays; fall back to object-derived if XML yields empty (matches ReportView.jsx)
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

        if (!hasExclusions) return ''

        return `
          <div style="margin-top: 1rem; padding: 0.75rem; background-color: #fefce8; border: 1px solid #fde047; border-radius: 0.375rem;">
            <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
              <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">block</span>
              Exclusions
            </h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.75rem;">
              ${sourceZones.length > 0 ? `
                <div>
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Source Zones:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(sourceZones.join(', '))}</p>
                </div>
              ` : ''}
              ${destZones.length > 0 ? `
                <div>
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Destination Zones:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(destZones.join(', '))}</p>
                </div>
              ` : ''}
              ${sourceNetworks.length > 0 ? `
                <div>
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Source Networks:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(sourceNetworks.join(', '))}</p>
                </div>
              ` : ''}
              ${destNetworks.length > 0 ? `
                <div>
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Destination Networks:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(destNetworks.join(', '))}</p>
                </div>
              ` : ''}
              ${services.length > 0 ? `
                <div>
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Services:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(services.join(', '))}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `
      })()}
    </div>
  `
  
  return `
    <div style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;">
      <button 
        onclick="toggleRule('${ruleId}')" 
        id="rule-btn-${ruleId}"
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.625rem; background: none; border: none; cursor: pointer; text-align: left;"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="rule-chevron-${ruleId}">
            <path d="${isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'}" />
          </svg>
          <div style="flex: 1;">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.125rem;">
              Rule #${index + 1}: ${escapeHtml(flat.name || 'Unnamed Rule')}
            </h3>
            ${flat.description ? `<p style="font-size: 0.75rem; color: #4b5563;">${escapeHtml(flat.description)}</p>` : ''}
          </div>
        </div>
        <div style="margin-left: 0.75rem;">
          ${statusBadge}
        </div>
      </button>
      <div id="rule-content-${ruleId}" style="display: ${isExpanded ? 'block' : 'none'};">
        ${ruleDetailsHtml}
      </div>
    </div>
  `
}

// Generate SSL/TLS Inspection Rule HTML
function generateSSLTLSInspectionRule(rule, index, isExpanded = false) {
  const flat = flattenSSLTLSInspectionRule(rule)
  
  const statusBadge = flat.enable === 'Yes' 
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">✓ Enabled</span>'
    : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">✗ Disabled</span>'

  // Helper function to render a field
  const renderField = (label, value, highlight = null) => {
    if (value === null || value === undefined || value === '') return ''
    const color = highlight === 'green' ? '#15803d' : '#111827'
    const fontWeight = highlight === 'green' ? '600' : 'normal'
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0; vertical-align: top;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
  }

  // Always generate the full rule details HTML
  const ruleDetailsHtml = `
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${renderField('Transaction ID', rule.transactionId || 'N/A')}
        ${renderField('Name', flat.name)}
        ${renderField('Description', flat.description || 'N/A')}
        ${renderField('Is Default', flat.isDefault || 'No')}
        ${renderField('Enable', flat.enable || 'No')}
        ${renderField('Log Connections', flat.logConnections || 'Disable')}
        ${renderField('Decrypt Action', flat.decryptAction || 'N/A', flat.decryptAction === 'Decrypt' ? 'green' : null)}
        ${renderField('Decryption Profile', flat.decryptionProfile || 'N/A')}
        ${flat.moveToName ? renderField('Move To', `${flat.moveToName} (${flat.moveToOrderBy})`) : ''}
        ${renderField('Source Zones', flat.sourceZones || 'Any')}
        ${renderField('Source Networks', flat.sourceNetworks || 'Any')}
        ${renderField('Identity', flat.identity || 'Any')}
        ${renderField('Destination Zones', flat.destinationZones || 'Any')}
        ${renderField('Destination Networks', flat.destinationNetworks || 'Any')}
        ${renderField('Services', flat.services || 'Any')}
        ${renderField('Websites/Categories', flat.websites || 'Any')}
      </tbody>
    </table>
  `

  return `
    <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem; background-color: #ffffff;">
      <div style="padding: 0.625rem; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <div style="flex: 1;">
            <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.125rem 0;">
              Rule #${index + 1}: ${escapeHtml(flat.name || 'Unnamed Rule')}
            </h3>
            ${flat.description ? `<p style="font-size: 0.75rem; color: #6b7280; margin: 0;">${escapeHtml(flat.description)}</p>` : ''}
          </div>
        </div>
        <div style="margin-left: 0.75rem;">
          ${statusBadge}
        </div>
      </div>
      <div style="padding: 0.75rem;">
${ruleDetailsHtml}
      </div>
    </div>
  `
}

// Generate NAT Rule HTML
function generateNATRule(rule, index, isExpanded = false) {
  const flat = flattenNATRule(rule)
  const ruleId = `nat-${rule.transactionId || rule.id || index}`
  
  const statusBadge = (flat.status === 'Enable' || flat.status === 'Yes' || flat.status === 'ON')
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">✓ Enabled</span>'
    : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">✗ Disabled</span>'

  // Helper function to render a field
  const renderField = (label, value, highlight = null) => {
    if (value === null || value === undefined || value === '') return ''
    const color = highlight === 'green' ? '#15803d' : '#111827'
    const fontWeight = highlight === 'green' ? '600' : 'normal'
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0; vertical-align: top;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
  }

  // Always generate the full rule details HTML
  const ruleDetailsHtml = `
    <div style="padding: 0.75rem; padding-top: 0;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <!-- Basic Information -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">info</span>
            Basic Information
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Transaction ID', rule.transactionId || 'N/A')}
              ${renderField('NAT Type', flat.natType || 'N/A')}
              ${renderField('IP Family', flat.ipFamily || 'N/A')}
              ${renderField('Position', flat.position || 'N/A')}
              ${flat.after ? renderField('Positioned After', flat.after) : ''}
            </tbody>
          </table>
        </div>

        <!-- Action & Traffic Control -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">bolt</span>
            Action & Traffic Control
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Action', flat.action || 'N/A', flat.action === 'Accept' ? 'green' : null)}
              ${renderField('Log Traffic', flat.logTraffic || 'Disable')}
              ${renderField('Schedule', flat.schedule || 'All The Time')}
            </tbody>
          </table>
        </div>

        <!-- Source Configuration -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">login</span>
            Source Configuration
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${flat.sourceZones ? renderField('Source Zones', flat.sourceZones) : ''}
              ${flat.sourceNetworks ? renderField('Source Networks', flat.sourceNetworks) : ''}
              ${!flat.sourceZones && !flat.sourceNetworks ? renderField('Source', 'Any') : ''}
            </tbody>
          </table>
        </div>

        <!-- Destination Configuration -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">logout</span>
            Destination Configuration
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${flat.destinationZones ? renderField('Destination Zones', flat.destinationZones) : ''}
              ${flat.destinationNetworks ? renderField('Destination Networks', flat.destinationNetworks) : ''}
              ${flat.services ? renderField('Services/Ports', flat.services) : ''}
              ${!flat.destinationZones && !flat.destinationNetworks ? renderField('Destination', 'Any') : ''}
            </tbody>
          </table>
        </div>

        <!-- NAT Translation - Source -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">swap_horiz</span>
            Source NAT Translation
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Original Source', flat.originalSource || 'N/A')}
              ${renderField('Translated Source', flat.translatedSource || 'N/A')}
            </tbody>
          </table>
        </div>

        <!-- NAT Translation - Destination -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">swap_horiz</span>
            Destination NAT Translation
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Original Destination', flat.originalDestination || 'N/A')}
              ${renderField('Translated Destination', flat.translatedDestination || 'N/A')}
              ${flat.originalService ? renderField('Original Service', flat.originalService) : ''}
              ${flat.translatedService ? renderField('Translated Service', flat.translatedService) : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
  
  return `
    <div style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;">
      <button 
        onclick="toggleRule('${ruleId}')" 
        id="rule-btn-${ruleId}"
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.625rem; background: none; border: none; cursor: pointer; text-align: left;"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="rule-chevron-${ruleId}">
            <path d="${isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'}" />
          </svg>
          <div style="flex: 1;">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.125rem;">
              Rule #${index + 1}: ${escapeHtml(flat.name || 'Unnamed NAT Rule')}
            </h3>
            ${flat.description ? `<p style="font-size: 0.75rem; color: #4b5563;">${escapeHtml(flat.description)}</p>` : ''}
          </div>
        </div>
        <div style="margin-left: 0.75rem;">
          ${statusBadge}
        </div>
      </button>
      <div id="rule-content-${ruleId}" style="display: ${isExpanded ? 'block' : 'none'};">
        ${ruleDetailsHtml}
      </div>
    </div>
  `
}

// Main HTML generator function
export function generateHTMLReport(data, sectionVisibility = {}) {
  if (!data) return ''

  // Calculate entity counts
  const entityCounts = {
    firewallRules: data.firewallRules?.length || 0,
    enabledRules: data.firewallRules?.filter(r => r.status === 'Enable').length || 0,
    disabledRules: data.firewallRules?.filter(r => r.status !== 'Enable').length || 0,
    userPolicies: data.firewallRules?.filter(r => r.policyType === 'User').length || 0,
    networkPolicies: data.firewallRules?.filter(r => r.policyType === 'Network').length || 0,
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

  const totalEntities = Object.values(entityCounts).reduce((a, b) => a + b, 0) + 
                        Object.values(dynamicEntities).reduce((a, b) => a + b, 0)

  // Build sections HTML
  let sectionsHtml = ''

  // Host Objects Section
  if ((sectionVisibility.ipHosts !== false && data.ipHosts?.length) || 
      (sectionVisibility.fqdnHosts !== false && data.fqdnHosts?.length) || 
      (sectionVisibility.macHosts !== false && data.macHosts?.length)) {
    let hostObjectsHtml = ''
    if (sectionVisibility.ipHosts !== false && data.ipHosts && data.ipHosts.length > 0) {
      hostObjectsHtml += `<div id="ip-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('ip-hosts', `<span class="material-symbols-outlined" style="color: #4b5563;">dns</span> IP Hosts`, generateEntityTable('IP Hosts', 'dns', data.ipHosts, 'IP Address', (item) => item.fields?.IPAddress || ''), true)}</div>`
    }
    if (sectionVisibility.fqdnHosts !== false && data.fqdnHosts && data.fqdnHosts.length > 0) {
      hostObjectsHtml += `<div id="fqdn-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('fqdn-hosts', `<span class="material-symbols-outlined" style="color: #4b5563;">language</span> FQDN Hosts`, generateEntityTable('FQDN Hosts', 'language', data.fqdnHosts), true)}</div>`
    }
    if (sectionVisibility.macHosts !== false && data.macHosts && data.macHosts.length > 0) {
      hostObjectsHtml += `<div id="mac-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('mac-hosts', `<span class="material-symbols-outlined" style="color: #4b5563;">devices</span> MAC Hosts`, generateEntityTable('MAC Hosts', 'devices', data.macHosts, 'MAC Address', (item) => item.fields?.MACAddress || ''), true)}</div>`
    }
    sectionsHtml += hostObjectsHtml
  }

  // Firewall Rules
  if (sectionVisibility.firewallRules !== false && data.firewallRules && data.firewallRules.length > 0) {
    const rulesHtml = data.firewallRules.map((rule, idx) => generateFirewallRule(rule, idx, false)).join('')
    sectionsHtml += `<div id="firewall-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('firewall-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">shield</span> Firewall Rules`, `<div style="display: flex; flex-direction: column; gap: 1rem;">${rulesHtml}</div>`, true)}</div>`
  }

  // SSL/TLS Inspection Rules
  if (sectionVisibility.sslTlsInspectionRules !== false && data.sslTlsInspectionRules && data.sslTlsInspectionRules.length > 0) {
    const sslRulesHtml = data.sslTlsInspectionRules.map((rule, idx) => generateSSLTLSInspectionRule(rule, idx, false)).join('')
    sectionsHtml += `<div id="ssl-tls-inspection-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ssl-tls-inspection-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">lock</span> SSL/TLS Inspection Rules (${data.sslTlsInspectionRules.length})`, `<div style="display: flex; flex-direction: column; gap: 1rem;">${sslRulesHtml}</div>`, true)}</div>`
  }

  // NAT Rules
  if (sectionVisibility.NATRule !== false && data.entitiesByTag?.NATRule && data.entitiesByTag.NATRule.length > 0) {
    const natRulesHtml = data.entitiesByTag.NATRule.map((rule, idx) => generateNATRule(rule, idx, false)).join('')
    sectionsHtml += `<div id="nat-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('nat-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">swap_horiz</span> NAT Rules (${data.entitiesByTag.NATRule.length})`, `<div style="display: flex; flex-direction: column; gap: 1rem;">${natRulesHtml}</div>`, true)}</div>`
  }

  // Groups Section
  if ((sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups?.length) || 
      (sectionVisibility.ipHostGroups !== false && data.ipHostGroups?.length) || 
      (sectionVisibility.serviceGroups !== false && data.serviceGroups?.length) ||
      (sectionVisibility.groups !== false && data.groups?.length)) {
    let groupsHtml = ''
    if (sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups && data.fqdnHostGroups.length > 0) {
      groupsHtml += `<div id="fqdn-host-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('fqdn-host-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> FQDN Host Groups`, generateEntityTable('FQDN Host Groups', 'group_work', data.fqdnHostGroups), true)}</div>`
    }
    if (sectionVisibility.ipHostGroups !== false && data.ipHostGroups && data.ipHostGroups.length > 0) {
      groupsHtml += `<div id="ip-host-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('ip-host-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> IP Host Groups`, generateEntityTable('IP Host Groups', 'group_work', data.ipHostGroups), true)}</div>`
    }
    if (sectionVisibility.serviceGroups !== false && data.serviceGroups && data.serviceGroups.length > 0) {
      groupsHtml += `<div id="service-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('service-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> Service Groups`, generateEntityTable('Service Groups', 'group_work', data.serviceGroups), true)}</div>`
    }
    if (sectionVisibility.groups !== false && data.groups && data.groups.length > 0) {
      groupsHtml += `<div id="groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('groups', `<span class="material-symbols-outlined" style="color: #4b5563;">groups</span> Other Groups`, generateEntityTable('Other Groups', 'groups', data.groups), true)}</div>`
    }
    sectionsHtml += groupsHtml
  }

  // Services - use dedicated Services table generator to match ReportView.jsx format
  if (sectionVisibility.services !== false && data.services && data.services.length > 0) {
    sectionsHtml += `<div id="services-section" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('services-section', '<span class="material-symbols-outlined" style="color: #4b5563;">construction</span> Services', generateServicesTable(data.services), true)}</div>`
  }

  // Additional dynamic entities
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && sectionVisibility[tag] !== false) {
        if (!['IPHost', 'FQDNHost', 'MACHost', 'Service', 'Services', 'Group', 'FQDNHostGroup', 'IPHostGroup', 'ServiceGroup',
              'Country', 'WebFilterPolicy', 'Schedule', 'VLAN', 'Alias', 'Interface', 'LAG', 'WirelessNetwork', 'XFRMInterface',
              'CertificateAuthority', 'SelfSignedCertificate', 'Certificate', 'Zone', 'Network', 'REDDevice', 'WirelessAccessPoint',
              'IPSPolicy', 'IntrusionPrevention', 'VirusScanning', 'WebFilter', 'NATRule'].includes(tag)) {
          const icon = getEntityIcon(tag)
          const tableHtml = tag === 'VPNIPSecConnection' 
            ? generateVPNIPSecConnectionTable(items)
            : generateEntityTable(tag, icon, items)
          sectionsHtml += `<div id="additional-${tag}" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection(`additional-${tag}`, `<span class="material-symbols-outlined" style="color: #4b5563;">${icon}</span> ${escapeHtml(tag)} (${items.length})`, tableHtml, true)}</div>`
        }
      }
    })
  }

  // Interfaces & Network
  if (sectionVisibility.portsWithVlans !== false && (
    (data.entitiesByTag?.Interface?.length > 0) || 
    (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
    (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
    (data.entitiesByTag?.WirelessNetwork?.length > 0)
  )) {
    const interfacesHtml = generateInterfacesSection(data)
    sectionsHtml += `<div id="ports-vlans-aliases" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ports-vlans-aliases', `<span class="material-symbols-outlined" style="color: #4b5563;">settings_ethernet</span> Interfaces & Network`, interfacesHtml, true)}</div>`
  }

  // Security Policies
  const securityPoliciesHtml = []
  if (sectionVisibility.Country !== false && dynamicEntities.Country) {
    securityPoliciesHtml.push(generateEntityTable('Countries', 'flag', data.entitiesByTag.Country || []))
  }
  if (sectionVisibility.WebFilterPolicy !== false && dynamicEntities.WebFilterPolicy) {
    securityPoliciesHtml.push(generateEntityTable('Web Filter Policies', 'filter_alt', data.entitiesByTag.WebFilterPolicy || []))
  }
  if (sectionVisibility.Schedule !== false && dynamicEntities.Schedule) {
    securityPoliciesHtml.push(generateEntityTable('Schedules', 'schedule', data.entitiesByTag.Schedule || []))
  }
  if (sectionVisibility.IPSPolicy !== false && dynamicEntities.IPSPolicy) {
    securityPoliciesHtml.push(generateEntityTable('IPS Policies', 'security', data.entitiesByTag.IPSPolicy || []))
  }
  if (sectionVisibility.IntrusionPrevention !== false && dynamicEntities.IntrusionPrevention) {
    securityPoliciesHtml.push(generateEntityTable('Intrusion Prevention', 'security', data.entitiesByTag.IntrusionPrevention || []))
  }
  if (sectionVisibility.VirusScanning !== false && dynamicEntities.VirusScanning) {
    securityPoliciesHtml.push(generateEntityTable('Virus Scanning', 'scanner', data.entitiesByTag.VirusScanning || []))
  }
  if (sectionVisibility.WebFilter !== false && dynamicEntities.WebFilter) {
    securityPoliciesHtml.push(generateEntityTable('Web Filters', 'web', data.entitiesByTag.WebFilter || []))
  }
  if (securityPoliciesHtml.length > 0) {
    sectionsHtml += `<div id="security-policies" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('security-policies', `<span class="material-symbols-outlined" style="color: #4b5563;">security</span> Security Policies`, securityPoliciesHtml.join(''), true)}</div>`
  }

  // Certificates
  const certificatesHtml = []
  if (sectionVisibility.CertificateAuthority !== false && dynamicEntities.CertificateAuthority) {
    certificatesHtml.push(generateEntityTable('Certificate Authorities', 'verified', data.entitiesByTag.CertificateAuthority || []))
  }
  if (sectionVisibility.SelfSignedCertificate !== false && dynamicEntities.SelfSignedCertificate) {
    certificatesHtml.push(generateEntityTable('Self-Signed Certificates', 'verified', data.entitiesByTag.SelfSignedCertificate || []))
  }
  if (sectionVisibility.Certificate !== false && dynamicEntities.Certificate) {
    certificatesHtml.push(generateEntityTable('Certificates', 'verified', data.entitiesByTag.Certificate || []))
  }
  if (certificatesHtml.length > 0) {
    sectionsHtml += `<div id="certificates" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('certificates', `<span class="material-symbols-outlined" style="color: #4b5563;">verified</span> Certificates`, certificatesHtml.join(''), true)}</div>`
  }

  // Network Configuration
  const networkConfigHtml = []
  if (sectionVisibility.Zone !== false && dynamicEntities.Zone) {
    networkConfigHtml.push(generateEntityTable('Zones', 'location_city', data.entitiesByTag.Zone || []))
  }
  if (sectionVisibility.Network !== false && dynamicEntities.Network) {
    networkConfigHtml.push(generateEntityTable('Networks', 'router', data.entitiesByTag.Network || []))
  }
  if (sectionVisibility.REDDevice !== false && dynamicEntities.REDDevice) {
    networkConfigHtml.push(generateEntityTable('RED Devices', 'devices', data.entitiesByTag.REDDevice || []))
  }
  if (sectionVisibility.WirelessAccessPoint !== false && dynamicEntities.WirelessAccessPoint) {
    networkConfigHtml.push(generateEntityTable('Wireless Access Points', 'wifi', data.entitiesByTag.WirelessAccessPoint || []))
  }
  if (networkConfigHtml.length > 0) {
    sectionsHtml += `<div id="network-config" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('network-config', `<span class="material-symbols-outlined" style="color: #4b5563;">router</span> Network Configuration`, networkConfigHtml.join(''), true)}</div>`
  }

  // Build sidebar HTML - matching ReportView.jsx structure exactly
  const allSections = []
  const filteredRules = data.firewallRules || []
  
  // === SECTION 1: HOST OBJECTS ===
  if (entityCounts.ipHosts > 0) allSections.push({ key: 'ipHosts', name: 'IP Hosts', icon: 'dns', count: entityCounts.ipHosts })
  if (entityCounts.fqdnHosts > 0) allSections.push({ key: 'fqdnHosts', name: 'FQDN Hosts', icon: 'language', count: entityCounts.fqdnHosts })
  if (entityCounts.macHosts > 0) allSections.push({ key: 'macHosts', name: 'MAC Hosts', icon: 'devices', count: entityCounts.macHosts })
  
  // === SECTION 2: INTERFACES & NETWORK ===
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
  
  // === SECTION 3: FIREWALL RULES ===
  if (filteredRules.length > 0) {
    allSections.push({ key: 'firewallRules', name: 'Firewall Rules', icon: 'shield', count: filteredRules.length })
  }
  
  // === SECTION 3.5: NAT RULES ===
  if (data.entitiesByTag?.NATRule?.length > 0) {
    allSections.push({ key: 'NATRule', name: 'NAT Rules', icon: 'swap_horiz', count: data.entitiesByTag.NATRule.length })
  }
  
  // === SECTION 4: GROUPS ===
  if (entityCounts.fqdnHostGroups > 0) allSections.push({ key: 'fqdnHostGroups', name: 'FQDN Host Groups', icon: 'group_work', count: entityCounts.fqdnHostGroups })
  if (entityCounts.ipHostGroups > 0) allSections.push({ key: 'ipHostGroups', name: 'IP Host Groups', icon: 'group_work', count: entityCounts.ipHostGroups })
  if (entityCounts.serviceGroups > 0) allSections.push({ key: 'serviceGroups', name: 'Service Groups', icon: 'group_work', count: entityCounts.serviceGroups })
  if (entityCounts.groups > 0) allSections.push({ key: 'groups', name: 'Other Groups', icon: 'groups', count: entityCounts.groups })
  
  // === SECTION 5: SERVICES ===
  if (entityCounts.services > 0) {
    allSections.push({ key: 'services', name: 'Services', icon: 'construction', count: entityCounts.services })
  }
  
  // === SECTION 6: SECURITY POLICIES ===
  if (dynamicEntities.WebFilterPolicy) allSections.push({ key: 'WebFilterPolicy', name: 'Web Filter Policies', icon: 'filter_alt', count: dynamicEntities.WebFilterPolicy })
  if (dynamicEntities.Schedule) allSections.push({ key: 'Schedule', name: 'Schedules', icon: 'schedule', count: dynamicEntities.Schedule })
  if (dynamicEntities.Country) allSections.push({ key: 'Country', name: 'Countries', icon: 'flag', count: dynamicEntities.Country })
  if (dynamicEntities.IPSPolicy) allSections.push({ key: 'IPSPolicy', name: 'IPS Policies', icon: 'security', count: dynamicEntities.IPSPolicy })
  if (dynamicEntities.IntrusionPrevention) allSections.push({ key: 'IntrusionPrevention', name: 'Intrusion Prevention', icon: 'security', count: dynamicEntities.IntrusionPrevention })
  if (dynamicEntities.VirusScanning) allSections.push({ key: 'VirusScanning', name: 'Virus Scanning', icon: 'scanner', count: dynamicEntities.VirusScanning })
  if (dynamicEntities.WebFilter) allSections.push({ key: 'WebFilter', name: 'Web Filters', icon: 'web', count: dynamicEntities.WebFilter })
  
  // === SECTION 7: CERTIFICATES ===
  const certificateCount = (dynamicEntities.CertificateAuthority || 0) + 
                           (dynamicEntities.SelfSignedCertificate || 0) + 
                           (dynamicEntities.Certificate || 0)
  if (certificateCount > 0) {
    allSections.push({ 
      key: 'certificates', 
      name: 'Certificates', 
      icon: 'verified', 
      count: certificateCount,
      isGroup: true
    })
  }
  
  // === SECTION 8: NETWORK & SYSTEM CONFIGURATION ===
  if (dynamicEntities.Zone) allSections.push({ key: 'Zone', name: 'Zones', icon: 'location_city', count: dynamicEntities.Zone })
  if (dynamicEntities.Network) allSections.push({ key: 'Network', name: 'Networks', icon: 'router', count: dynamicEntities.Network })
  if (dynamicEntities.REDDevice) allSections.push({ key: 'REDDevice', name: 'RED Devices', icon: 'devices', count: dynamicEntities.REDDevice })
  if (dynamicEntities.WirelessAccessPoint) allSections.push({ key: 'WirelessAccessPoint', name: 'Wireless Access Points', icon: 'wifi', count: dynamicEntities.WirelessAccessPoint })
  
  // === SECTION 9: ADDITIONAL ENTITIES ===
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && ![
        'IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
        'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork','XFRMInterface',
        'CertificateAuthority','SelfSignedCertificate','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
        'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter','NATRule'
      ].includes(tag)) {
        allSections.push({ key: tag, name: tag, icon: getEntityIcon(tag), count: items.length })
      }
    })
  }

  // Apply sorting to sections (default sort for HTML export)
  const sortedSections = [...allSections].sort((a, b) => {
    // Default sort: keep original order
    return 0
  })
  
  const sidebarHtml = `
    <div style="width: 14rem; min-width: 14rem; background-color: #f9fafb; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; height: 100vh; flex-shrink: 0;">
      <div style="padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
        <h3 style="font-size: 0.75rem; font-weight: 600; color: #111827; margin-bottom: 0.375rem;">Select Sections to Display</h3>
        <input
          type="text"
          id="section-search"
          placeholder="Search sections..."
          oninput="filterSections()"
          style="width: 100%; padding: 0.375rem 0.375rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem; margin-bottom: 0.375rem; outline: none;"
          onfocus="this.style.boxShadow='0 0 0 1px #005BC8'"
          onblur="this.style.boxShadow=''"
        />
        <select
          id="section-sort"
          onchange="sortSections()"
          style="width: 100%; padding: 0.375rem 0.375rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem; margin-bottom: 0.375rem; outline: none; font-family: Arial, Helvetica, sans-serif;"
          onfocus="this.style.boxShadow='0 0 0 1px #005BC8'"
          onblur="this.style.boxShadow=''"
        >
          <option value="default">Sort: Default</option>
          <option value="name-asc">Sort: Name (A-Z)</option>
          <option value="name-desc">Sort: Name (Z-A)</option>
          <option value="count-desc">Sort: Count (High to Low)</option>
          <option value="count-asc">Sort: Count (Low to High)</option>
        </select>
        <div style="display: flex; gap: 0.375rem;">
          <button onclick="selectAllSections()" style="flex: 1; padding: 0.25rem 0.375rem; font-size: 0.75rem; font-weight: 500; color: white; background-color: #005BC8; border: none; border-radius: 0.25rem; cursor: pointer; font-family: Arial, Helvetica, sans-serif;" onmouseover="this.style.backgroundColor='#004A9F'" onmouseout="this.style.backgroundColor='#005BC8'">Select All</button>
          <button onclick="deselectAllSections()" style="flex: 1; padding: 0.25rem 0.375rem; font-size: 0.75rem; font-weight: 500; color: #374151; background-color: white; border: 1px solid #d1d5db; border-radius: 0.25rem; cursor: pointer; font-family: Arial, Helvetica, sans-serif;">Deselect All</button>
        </div>
      </div>
      <div id="sidebar-sections" style="flex: 1; overflow-y: auto; padding: 0.25rem;">
        ${sortedSections.map(section => {
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
          
          return `
            <label data-section-key="${section.key}" data-section-name="${escapeHtml(section.name)}" data-section-count="${section.count || 0}" class="sidebar-section-item" style="display: flex; align-items: center; gap: 0.375rem; cursor: pointer; padding: 0.375rem; border-radius: 0.25rem;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
              <input type="checkbox" data-section-key="${section.key}" ${isVisible ? 'checked' : ''} onchange="${section.key === 'certificates' ? 'toggleCertificatesGroup()' : `toggleSectionVisibility('${section.key}')`}" style="width: 1rem; height: 1rem; accent-color: #005BC8; cursor: pointer; flex-shrink: 0;" onclick="event.stopPropagation()" />
              <span class="material-symbols-outlined" style="font-size: 0.875rem; color: #4b5563; flex-shrink: 0;">${section.icon}</span>
              <span style="font-size: 0.75rem; color: #374151; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(section.name)}</span>
              ${section.count !== null ? `<span style="font-size: 0.75rem; color: #6b7280; font-weight: 500; margin-left: auto; flex-shrink: 0;">(${section.count})</span>` : ''}
            </label>
          `
        }).join('')}
      </div>
    </div>
  `

  // Generate full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firewall Configuration Report</title>
  <!-- Fonts are bundled locally - no external dependencies -->
  <style>
    /* Local Material Symbols Font */
    @font-face {
      font-family: 'Material Symbols Outlined';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('./fonts/MaterialSymbolsOutlined.woff2') format('woff2');
    }
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f2f4;
      color: #111827;
    }
    .report-container {
      display: flex;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      max-height: 100vh;
    }
    .report-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 2px solid #005BC8;
      margin-bottom: 1.5rem;
    }
    .report-header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .report-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .stat-box {
      background-color: #f9fafb;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.125rem;
    }
    .stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 2px solid #d1d5db;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${sidebarHtml}
    <div class="main-content">
      <div class="report-header">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="padding: 0.75rem; border-radius: 0.5rem; background-color: #005BC8; min-width: 48px; min-height: 48px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
              <svg width="28" height="28" viewBox="0 0 65 65" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                <path fill="#fff" d="M.24,10.78v25.07c0,4.25,2.3,8.16,6.02,10.22l26.1,14.48.17.09,26.22-14.57c3.71-2.06,6.01-5.97,6.01-10.22V10.78H.24ZM42.23,40.48c-1.94,1.08-4.14,1.65-6.36,1.64l-24.2-.07,13.57-7.57c1.31-.73,2.79-1.12,4.29-1.12l25.62-.08-12.91,7.2ZM41.86,28.09c-1.31.73-2.79,1.12-4.29,1.12l-25.62.08,12.91-7.2c1.94-1.08,4.14-1.65,6.36-1.64l24.2.07-13.57,7.57Z"/>
              </svg>
            </div>
            <div>
              <h1>Firewall Configuration Report</h1>
              <p style="font-size: 1rem; color: #4b5563; margin-top: 0.25rem;">Statement of Work Documentation</p>
            </div>
          </div>
        </div>
        <div class="report-stats">
          <div class="stat-box">
            <div class="stat-label">Report Generated</div>
            <div class="stat-value">${formatDate(new Date())}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">API Version</div>
            <div class="stat-value">${data.metadata?.apiVersion || 'N/A'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Entities</div>
            <div class="stat-value">${totalEntities.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Entity Types</div>
            <div class="stat-value">${Object.keys(dynamicEntities).length + 8}</div>
          </div>
        </div>
      </div>
      <div style="padding: 0 1.5rem;">
        ${sectionsHtml}
      </div>
      <div class="footer" style="padding: 0 1.5rem 1.5rem;">
        <p>This report was automatically generated from firewall configuration XML</p>
        <p style="margin-top: 0.125rem;">Generated on ${formatDate(new Date())}</p>
      </div>
    </div>
  </div>
  <script>
    const expandedSections = {}
    const expandedRules = {}
    
    function toggleSection(sectionId) {
      const content = document.getElementById('section-content-' + sectionId)
      const button = document.getElementById('section-btn-' + sectionId)
      const chevron = document.getElementById('chevron-' + sectionId)
      
      if (!content || !button) return
      
      const isExpanded = expandedSections[sectionId] === true
      expandedSections[sectionId] = !isExpanded
      content.style.display = expandedSections[sectionId] ? 'block' : 'none'
      
      if (chevron) {
        const path = chevron.querySelector('path')
        if (path) {
          path.setAttribute('d', expandedSections[sectionId] ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6')
        }
      }
    }
    
    function toggleRule(ruleId) {
      const content = document.getElementById('rule-content-' + ruleId)
      const button = document.getElementById('rule-btn-' + ruleId)
      const chevron = document.getElementById('rule-chevron-' + ruleId)
      
      if (!content || !button) return
      
      const isExpanded = expandedRules[ruleId] === true
      expandedRules[ruleId] = !isExpanded
      content.style.display = expandedRules[ruleId] ? 'block' : 'none'
      
      if (chevron) {
        const path = chevron.querySelector('path')
        if (path) {
          path.setAttribute('d', expandedRules[ruleId] ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6')
        }
      }
    }
    
    // Map section keys to their HTML IDs
    const sectionIdMap = {
      'ipHosts': 'ip-hosts',
      'fqdnHosts': 'fqdn-hosts',
      'macHosts': 'mac-hosts',
      'portsWithVlans': 'ports-vlans-aliases',
      'firewallRules': 'firewall-rules',
      'NATRule': 'nat-rules',
      'fqdnHostGroups': 'fqdn-host-groups',
      'ipHostGroups': 'ip-host-groups',
      'serviceGroups': 'service-groups',
      'groups': 'groups',
      'services': 'services-section',
      'WebFilterPolicy': 'security-policies',
      'Schedule': 'security-policies',
      'Country': 'security-policies',
      'IPSPolicy': 'security-policies',
      'IntrusionPrevention': 'security-policies',
      'VirusScanning': 'security-policies',
      'WebFilter': 'security-policies',
      'certificates': 'certificates',
      'CertificateAuthority': 'certificates',
      'SelfSignedCertificate': 'certificates',
      'Certificate': 'certificates',
      'Zone': 'network-config',
      'Network': 'network-config',
      'REDDevice': 'network-config',
      'WirelessAccessPoint': 'network-config'
    }
    
    function toggleCertificatesGroup() {
      const checkbox = document.querySelector('input[data-section-key="certificates"]')
      if (!checkbox) return
      
      const isChecked = checkbox.checked
      const certSection = document.getElementById('certificates')
      if (certSection) {
        certSection.style.display = isChecked ? 'block' : 'none'
      }
    }
    
    function toggleSectionVisibility(sectionKey) {
      const checkbox = document.querySelector('input[data-section-key="' + sectionKey + '"]')
      if (!checkbox) return
      
      const isChecked = checkbox.checked
      
      // Map section key to HTML ID
      const htmlId = sectionIdMap[sectionKey]
      if (htmlId) {
        const section = document.getElementById(htmlId)
        if (section) {
          section.style.display = isChecked ? 'block' : 'none'
        }
      } else {
        // For additional entities, use the key directly
        const section = document.getElementById('additional-' + sectionKey)
        if (section) {
          section.style.display = isChecked ? 'block' : 'none'
        }
      }
    }
    
    function filterSections() {
      const searchInput = document.getElementById('section-search')
      if (!searchInput) return
      
      const searchTerm = searchInput.value.toLowerCase()
      const items = document.querySelectorAll('.sidebar-section-item')
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase()
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none'
      })
    }
    
    function sortSections() {
      const sortSelect = document.getElementById('section-sort')
      if (!sortSelect) return
      
      const sortOption = sortSelect.value
      const container = document.getElementById('sidebar-sections')
      if (!container) return
      
      const items = Array.from(container.querySelectorAll('.sidebar-section-item'))
      
      // Extract section data for sorting using data attributes
      const sectionsData = items.map(item => {
        const name = item.getAttribute('data-section-name') || ''
        const count = parseInt(item.getAttribute('data-section-count') || '0') || 0
        return { item, name, count }
      })
      
      // Sort based on option
      sectionsData.sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name)
          case 'name-desc':
            return b.name.localeCompare(a.name)
          case 'count-desc':
            return b.count - a.count
          case 'count-asc':
            return a.count - b.count
          default:
            return 0 // Keep original order
        }
      })
      
      // Re-append items in sorted order
      sectionsData.forEach(({ item }) => {
        container.appendChild(item)
      })
    }
    
    function selectAllSections() {
      document.querySelectorAll('input[type="checkbox"][data-section-key]').forEach(cb => {
        cb.checked = true
        toggleSectionVisibility(cb.getAttribute('data-section-key'))
      })
    }
    
    function deselectAllSections() {
      document.querySelectorAll('input[type="checkbox"][data-section-key]').forEach(cb => {
        cb.checked = false
        toggleSectionVisibility(cb.getAttribute('data-section-key'))
      })
    }
    
    // Initialize all sections as expanded
    document.querySelectorAll('[id^="section-content-"]').forEach(el => {
      const sectionId = el.id.replace('section-content-', '')
      expandedSections[sectionId] = true
    })
    
    // Initialize section visibility based on checkboxes
    document.querySelectorAll('input[type="checkbox"][data-section-key]').forEach(cb => {
      toggleSectionVisibility(cb.getAttribute('data-section-key'))
    })
  </script>
</body>
</html>`

  return html
}
