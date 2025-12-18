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
    Country: 'flag', WebFilterPolicy: 'filter_alt', WebFilterCategory: 'filter_list', Schedule: 'schedule',
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
    REDDevice: 'devices', ZoneType: 'dns', RoutingTable: 'route', GatewayHost: 'router',
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
    Country: '#ef4444', WebFilterPolicy: '#10b981', WebFilterCategory: '#14b8a6', Schedule: '#2563eb',
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
    REDDevice: '#7c3aed', ZoneType: '#2563eb', RoutingTable: '#3b82f6', GatewayHost: '#3b82f6',
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
        <tr>
          <td>${escapeHtml(d.ProtocolName)}</td>
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
// Helper to check if a value represents a boolean/enable-disable state
function isBooleanValue(value) {
  const str = String(value).toLowerCase().trim()
  return ['true', 'false', 'enable', 'disable', 'enabled', 'disabled', 'on', 'off', 'yes', 'no', '1', '0'].includes(str)
}

function getBooleanState(value) {
  const str = String(value).toLowerCase().trim()
  if (['true', 'enable', 'enabled', 'on', 'yes', '1'].includes(str)) return true
  if (['false', 'disable', 'disabled', 'off', 'no', '0'].includes(str)) return false
  return null
}

// Recursively process nested objects into the tree structure
function processNestedObject(obj, prefix = '') {
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
function groupFieldsHierarchically(fields) {
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

// Generate grouped fields HTML for hierarchical display
function generateGroupedFieldsHTML(fields, itemId, level = 0) {
  const grouped = groupFieldsHierarchically(fields)
  
  const hasNestedStructure = Object.keys(grouped).some(key => {
    const item = grouped[key]
    return item && item._children && Object.keys(item._children).length > 0
  })
  
  // If no nested structure, fall back to flat display
  if (!hasNestedStructure) {
    let html = '<table class="sophos-field-table" style="width: 100%; table-layout: fixed;"><colgroup><col style="width: 40%; min-width: 200px;" /><col style="width: 60%;" /></colgroup><tbody>'
    Object.entries(fields).forEach(([k, v]) => {
      const val = String(v)
      const isBoolean = isBooleanValue(v)
      const boolState = isBoolean ? getBooleanState(v) : null
      
      html += '<tr class="sophos-table-row">'
      html += `<td class="sophos-table-cell-label" style="word-break: break-word; overflow-wrap: anywhere; padding: 0.5rem 0.75rem 0.5rem 0; vertical-align: top;">${escapeHtml(k)}</td>`
      html += '<td class="sophos-table-cell-value" style="word-break: break-word; overflow-wrap: anywhere; padding: 0.5rem 0 0.5rem 0.5rem; vertical-align: top;">'
      
      if (boolState !== null) {
        const checkColor = boolState ? '#3b82f6' : '#d1d5db'
        const checkBg = boolState ? '#3b82f6' : '#f3f4f6'
        const textColor = boolState ? '#1e40af' : '#6b7280'
        const checkmark = boolState ? '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />' : ''
        html += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 16px; height: 16px; border-radius: 4px; border: 2px solid ${checkColor}; background-color: ${checkBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg style="width: 10px; height: 10px; color: white;" fill="currentColor" viewBox="0 0 20 20">${checkmark}</svg></div><span style="font-size: 0.75rem; font-weight: 500; color: ${textColor};">${boolState ? 'Enabled' : 'Disabled'}</span></div>`
      } else {
        html += `<span style="font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(val)}</span>`
      }
      
      html += '</td></tr>'
    })
    html += '</tbody></table>'
    return html
  }
  
  // Render grouped structure
  const renderGroup = (group, path = '', depth = 0) => {
    let html = ''
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
    
    // Render direct values
    if (directValues.length > 0) {
      directValues.forEach(({ key, value, isBoolean }) => {
        const boolState = isBoolean ? getBooleanState(value) : null
        const displayValue = String(value)
        
        html += '<div style="display: grid; grid-template-columns: minmax(200px, 320px) 1fr; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">'
        html += `<span style="font-size: 0.75rem; font-weight: 500; color: #6b7280; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(key)}:</span>`
        
        if (boolState !== null) {
          const checkColor = boolState ? '#10b981' : '#d1d5db'
          const checkBg = boolState ? '#10b981' : '#f3f4f6'
          const textColor = boolState ? '#059669' : '#6b7280'
          const checkmark = boolState ? '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />' : ''
          html += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 16px; height: 16px; border-radius: 4px; border: 2px solid ${checkColor}; background-color: ${checkBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg style="width: 10px; height: 10px; color: white;" fill="currentColor" viewBox="0 0 20 20">${checkmark}</svg></div><span style="font-size: 0.75rem; font-weight: 500; color: ${textColor};">${boolState ? 'Enabled' : 'Disabled'}</span></div>`
        } else {
          html += `<span style="font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(displayValue)}</span>`
        }
        
        html += '</div>'
      })
    }
    
    // Render child groups (always expanded in HTML export)
    if (childGroups.length > 0) {
      childGroups.forEach(({ key, children }) => {
        html += `<div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; margin-top: 0.5rem; ${depth > 0 ? 'margin-left: 1rem;' : ''}">`
        html += `<div style="padding: 0.5rem; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">`
        html += `<span style="font-size: 0.75rem; font-weight: 600; color: #111827;">${escapeHtml(key)}</span>`
        html += '</div>'
        html += `<div style="padding: 0.5rem; background-color: #f9fafb;">`
        html += renderGroup(children, path ? `${path}.${key}` : key, depth + 1)
        html += '</div>'
        html += '</div>'
      })
    }
    
    return html
  }
  
  return `<div style="space-y: 0.5rem;">${renderGroup(grouped)}</div>`
}

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
        // Use comma separator for better readability, or format as badges for long lists
        const items = value.map(item => summarizeObject(item)).filter(Boolean)
        if (items.length > 5 || items.some(item => item.length > 50)) {
          // For long lists, format as numbered badges (similar to formatArrayFieldLinesHTML)
          const formatted = `<div style="display: flex; flex-direction: column; gap: 0.125rem; max-width: 100%;">${items.map((item, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.7rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(item)}</span>
            </span>`
          ).join('')}</div>`
          rows.push([fullKey, formatted])
        } else {
          // For short lists, use comma separator
          const summarized = items.join(', ')
          rows.push([fullKey, summarized])
        }
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
      
      // Special handling for FQDNHostList - extract FQDN values and format nicely
      if (key === 'FQDNHostList' || key.toLowerCase().includes('fqdnhostlist')) {
        const fqdnValues = []
        if (value.FQDN) {
          if (Array.isArray(value.FQDN)) {
            fqdnValues.push(...value.FQDN.filter(Boolean).map(String))
          } else {
            fqdnValues.push(String(value.FQDN))
          }
        }
        // Also check for nested arrays
        Object.values(value).forEach(v => {
          if (Array.isArray(v)) {
            v.forEach(item => {
              if (typeof item === 'string') fqdnValues.push(item)
              else if (item && typeof item === 'object' && item.FQDN) {
                if (Array.isArray(item.FQDN)) fqdnValues.push(...item.FQDN.filter(Boolean).map(String))
                else fqdnValues.push(String(item.FQDN))
              }
            })
          } else if (typeof v === 'string' && v) {
            fqdnValues.push(v)
          }
        })
        
        if (fqdnValues.length > 0) {
          const uniqueValues = Array.from(new Set(fqdnValues.filter(Boolean)))
          if (uniqueValues.length > 5) {
            // Format as numbered badges for long lists
            const formatted = `<div style="display: flex; flex-direction: column; gap: 0.125rem; max-width: 100%;">${uniqueValues.map((item, idx) => 
              `<span style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.7rem;">
                <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                  ${idx + 1}
                </span>
                <span style="display: block; flex: 1; word-break: break-word; overflow-wrap: anywhere; font-family: monospace;">${escapeHtml(item)}</span>
              </span>`
            ).join('')}</div>`
            rows.push([fullKey, formatted])
            return
          } else {
            rows.push([fullKey, uniqueValues.join(', ')])
            return
          }
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
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; min-width: 120px;">${serviceType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; max-width: 400px;">${serviceDetailsHtml}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">construction</span>
        <span style="display: inline-flex; align-items: center;">Services</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Type</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Service Details</th>
            </tr>
          </thead>
          <tbody>
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
    
    if (!it.fields || Object.keys(it.fields).length === 0) {
      detailsHtml = '<span style="color: #9ca3af; font-style: italic;">No details</span>'
    } else if (useGroupedView) {
      // Use grouped view for Zones and AdminSettings
      detailsHtml = generateGroupedFieldsHTML(it.fields, `${title}-${it.transactionId}-${it.name}-${idx}`)
    } else {
      detailsHtml = `
        <table class="sophos-field-table" style="width: 100%; max-width: 100%; table-layout: fixed;">
          <colgroup>
            <col class="sophos-col-250" style="width: 40%; min-width: 200px;" />
            <col class="sophos-col-auto" style="width: 60%;" />
          </colgroup>
          <tbody>
            ${details.map(([k, v]) => {
              // If this is ServiceDetails and it's already formatted as HTML table, don't escape it
              const isServiceDetailsTable = k === 'ServiceDetails' && typeof v === 'string' && v.includes('<table')
              // Check if value is already HTML (from array formatting with badges)
              const isHTML = typeof v === 'string' && (v.includes('<div') || v.includes('<span') || v.includes('<table'))
              const val = isServiceDetailsTable || isHTML ? v : escapeHtml(String(v))
              const isBoolean = isBooleanValue(v)
              const boolState = isBoolean ? getBooleanState(v) : null
              
              let valueHtml = val
              if (boolState !== null) {
                const checkColor = boolState ? '#10b981' : '#d1d5db'
                const checkBg = boolState ? '#10b981' : '#f3f4f6'
                const textColor = boolState ? '#059669' : '#6b7280'
                const checkmark = boolState ? '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />' : ''
                valueHtml = `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 16px; height: 16px; border-radius: 4px; border: 2px solid ${checkColor}; background-color: ${checkBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg style="width: 10px; height: 10px; color: white;" fill="currentColor" viewBox="0 0 20 20">${checkmark}</svg></div><span style="font-size: 0.75rem; font-weight: 500; color: ${textColor};">${boolState ? 'Enabled' : 'Disabled'}</span></div>`
              } else if (!isHTML && typeof v === 'string' && v.length > 100) {
                // For long text values, add better formatting
                valueHtml = `<span style="font-size: 0.75rem; line-height: 1.5; word-break: break-word; overflow-wrap: anywhere; display: block;">${val}</span>`
              }
              
              return `
                <tr class="sophos-table-row">
                  <td class="sophos-table-cell-label" style="word-break: break-word; overflow-wrap: anywhere; font-size: 0.75rem; color: #6b7280; font-weight: 500; padding: 0.375rem 0.75rem 0.375rem 0;">${escapeHtml(k)}</td>
                  <td class="sophos-table-cell-value" style="word-break: break-word; overflow-wrap: anywhere; max-width: 0; padding: 0.375rem 0 0.375rem 0.5rem; font-size: 0.75rem; color: #111827;">${valueHtml}</td>
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
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        ${isService ? `<td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #1f2937; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(serviceType)}</td>` : ''}
        ${primaryKeyLabel ? `<td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">${primary}</td>` : ''}
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 500px;">
            ${detailsHtml}
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
      <div class="sophos-table-wrapper" style="max-width: 100%; box-sizing: border-box;">
        <table class="sophos-table" style="min-width: auto !important; width: 100%; table-layout: auto; max-width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header" style="min-width: 120px; max-width: 200px;">Name</th>
              ${isService ? `<th class="sophos-table-header" style="min-width: 80px; max-width: 120px;">Type</th>` : ''}
              ${primaryKeyLabel ? `<th class="sophos-table-header" style="min-width: 120px; max-width: 250px;">${escapeHtml(primaryKeyLabel)}</th>` : ''}
              <th class="sophos-table-header" style="min-width: 200px;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Generate singleton entity card HTML
function generateSingletonEntityCardHTML(item, icon, title) {
  if (!item || !item.fields) return ''
  
  const fields = item.fields
  const grouped = groupFieldsHierarchically(fields)
  
  const renderFieldRow = (key, value, isBoolean) => {
    const boolState = isBoolean ? getBooleanState(value) : null
    const displayValue = String(value)
    
    let valueHtml = ''
    if (boolState !== null) {
      const checkColor = boolState ? '#10b981' : '#d1d5db'
      const checkBg = boolState ? '#10b981' : '#f3f4f6'
      const textColor = boolState ? '#059669' : '#6b7280'
      const checkmark = boolState ? '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />' : ''
      valueHtml = `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 16px; height: 16px; border-radius: 4px; border: 2px solid ${checkColor}; background-color: ${checkBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg style="width: 10px; height: 10px; color: white;" fill="currentColor" viewBox="0 0 20 20">${checkmark}</svg></div><span style="font-size: 0.75rem; font-weight: 500; color: ${textColor};">${boolState ? 'Enabled' : 'Disabled'}</span></div>`
    } else {
      valueHtml = `<span style="word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(displayValue || '-')}</span>`
    }
    
    return `
      <div style="display: grid; grid-template-columns: minmax(200px, 320px) 1fr; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; align-items: start;">
        <div style="font-size: 0.75rem; font-weight: 500; color: #6b7280; word-break: break-word; overflow-wrap: anywhere; flex-shrink: 0;">
          ${escapeHtml(key)}
        </div>
        <div style="font-size: 0.75rem; color: #111827; min-width: 0;">
          ${valueHtml}
        </div>
      </div>
    `
  }
  
  const renderGroup = (group, path = '', level = 0, isTopLevel = false) => {
    let html = ''
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
    
    // Render direct values - use two columns at top level
    if (directValues.length > 0) {
      if (isTopLevel) {
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.5rem;">'
      }
      directValues.forEach(({ key, value, isBoolean }) => {
        html += renderFieldRow(key, value, isBoolean)
      })
      if (isTopLevel) {
        html += '</div>'
      }
    }
    
    // Render child groups (always expanded in HTML export) - use two columns at top level
    if (childGroups.length > 0) {
      if (isTopLevel) {
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">'
      }
      childGroups.forEach(({ key, children }) => {
        html += `<div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; ${!isTopLevel ? 'margin-top: 0.5rem;' : ''}">`
        html += `<div style="padding: 0.625rem; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">`
        html += `<span style="font-size: 0.75rem; font-weight: 600; color: #111827;">${escapeHtml(key)}</span>`
        html += '</div>'
        html += `<div style="padding: 0.75rem; background-color: #ffffff;">`
        html += renderGroup(children, path ? `${path}.${key}` : key, level + 1, false)
        html += '</div>'
        html += '</div>'
      })
      if (isTopLevel) {
        html += '</div>'
      }
    }
    
    return html
  }
  
  const hasNestedStructure = Object.keys(grouped).some(key => {
    const item = grouped[key]
    return item && item._children && Object.keys(item._children).length > 0
  })
  
  // If no nested structure, render flat key-value pairs
  if (!hasNestedStructure) {
    let fieldsHtml = ''
    if (Object.keys(fields).length === 0) {
      fieldsHtml = '<span style="color: #9ca3af; font-style: italic; font-size: 0.75rem;">No configuration data</span>'
    } else {
      Object.entries(fields).forEach(([k, v]) => {
        const isBoolean = isBooleanValue(v)
        fieldsHtml += renderFieldRow(k, v, isBoolean)
      })
    }
    
    return `
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 1.5rem;">
        <div style="background-color: #f9fafb; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${icon ? `<span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">${icon}</span>` : ''}
            <span style="font-size: 0.875rem; font-weight: 600; color: #111827;">${escapeHtml(title)}</span>
          </div>
        </div>
        <div style="padding: 1rem;">
          ${fieldsHtml}
        </div>
      </div>
    `
  }
  
  // Render with nested structure - use two-column layout for top level
  return `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 1.5rem;">
      <div style="background-color: #f9fafb; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${icon ? `<span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">${icon}</span>` : ''}
          <span style="font-size: 0.875rem; font-weight: 600; color: #111827;">${escapeHtml(title)}</span>
        </div>
      </div>
      <div style="padding: 1rem;">
        ${renderGroup(grouped, '', 0, true)}
      </div>
    </div>
  `
}

// Generate VPN IPSec Connection table HTML with Local/Remote columns
function generateVPNIPSecConnectionTable(items) {
  if (!items || items.length === 0) return ''
  
  // Note: The XML parser already extracts each Configuration as a separate VPNIPSecConnection entity
  // So items already contains individual Configuration entries, not nested Configuration structures
  // We can use items directly

  // Format LocalSubnet array
  const formatLocalSubnet = (localSubnet) => {
    if (!localSubnet) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const subnets = []
    if (Array.isArray(localSubnet)) {
      subnets.push(...localSubnet.filter(Boolean).map(s => typeof s === 'string' ? s.trim() : String(s).trim()).filter(Boolean))
    } else if (typeof localSubnet === 'string' && localSubnet.trim()) {
      subnets.push(localSubnet.trim())
    }
    
    if (subnets.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    if (subnets.length === 1) return `<span style="color: #111827; font-family: monospace; font-size: 0.75rem;">${escapeHtml(subnets[0])}</span>`
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 200px; max-height: 150px; overflow-y: auto;">${subnets.map((subnet, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.25rem; height: 1rem; padding: 0 0.25rem; background-color: #f3f4f6; color: #1f2937; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; font-family: monospace; word-break: break-word;">${escapeHtml(subnet)}</span>
      </div>
    `).join('')}</div>`
  }

  // Format RemoteNetwork
  const formatRemoteNetwork = (remoteNetwork) => {
    if (!remoteNetwork) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    if (typeof remoteNetwork === 'string') return `<span style="color: #111827;">${escapeHtml(remoteNetwork)}</span>`
    if (typeof remoteNetwork === 'object' && remoteNetwork.Network) {
      const networks = Array.isArray(remoteNetwork.Network) ? remoteNetwork.Network : [remoteNetwork.Network]
      if (networks.length === 1) {
        return `<span style="color: #111827;">${escapeHtml(networks[0])}</span>`
      }
      return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 150px;">${networks.filter(Boolean).map((net, idx) => `
        <span style="color: #111827; font-size: 0.75rem;">${escapeHtml(net)}</span>
      `).join('')}</div>`
    }
    return '<span style="color: #9ca3af; font-style: italic;">-</span>'
  }
  
  // Format AllowedUser
  const formatAllowedUser = (allowedUser) => {
    if (!allowedUser) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
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
    
    if (users.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    if (users.length === 1) return `<span style="color: #111827; font-size: 0.75rem;">${escapeHtml(users[0])}</span>`
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 150px; max-height: 100px; overflow-y: auto;">${users.map((user, idx) => `
      <span style="color: #111827; font-size: 0.75rem;">${escapeHtml(user)}</span>
    `).join('')}</div>`
  }

  // Format Status
  const formatStatus = (status) => {
    if (!status) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    const statusMap = {
      '1': { text: 'Active', color: 'bg-green-100 text-green-700' },
      '2': { text: 'Inactive', color: 'bg-gray-100 text-gray-600' },
      '3': { text: 'Disconnected', color: 'bg-red-100 text-red-700' }
    }
    const statusInfo = statusMap[String(status)] || { text: String(status), color: 'bg-gray-100 text-gray-600' }
    // Convert Tailwind classes to inline styles
    const colorMap = {
      'bg-green-100 text-green-700': { bg: '#d1fae5', text: '#15803d' },
      'bg-gray-100 text-gray-600': { bg: '#f3f4f6', text: '#4b5563' },
      'bg-red-100 text-red-700': { bg: '#fee2e2', text: '#b91c1c' }
    }
    const colors = colorMap[statusInfo.color] || { bg: '#f3f4f6', text: '#4b5563' }
    return `<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: ${colors.bg}; color: ${colors.text};">${escapeHtml(statusInfo.text)}</span>`
  }
  
  let rows = ''
  items.forEach((item, idx) => {
    const config = item.fields || {}
    const name = escapeHtml(config.Name || item.name || '-')
    const connectionType = escapeHtml(config.ConnectionType || '-')
    const policy = escapeHtml(config.Policy || '-')
    const authenticationType = escapeHtml(config.AuthenticationType || '-')
    const subnetFamily = escapeHtml(config.SubnetFamily || '-')
    const endpointFamily = escapeHtml(config.EndpointFamily || '-')
    const localWANPort = escapeHtml(config.LocalWANPort || config.AliasLocalWANPort || '-')
    const remoteHost = config.RemoteHost && config.RemoteHost !== '*' ? escapeHtml(config.RemoteHost) : '-'
    const localID = escapeHtml(config.LocalID || '-')
    const localIDType = escapeHtml(config.LocalIDType || 'ID')
    const remoteID = escapeHtml(config.RemoteID || '-')
    const remoteIDType = escapeHtml(config.RemoteIDType || 'ID')
    const userAuthMode = config.UserAuthenticationMode || 'Disable'
    const protocol = escapeHtml(config.Protocol || '-')
    const actionOnVPNRestart = escapeHtml(config.ActionOnVPNRestart || '-')
    
    const localSubnetHTML = formatLocalSubnet(config.LocalSubnet)
    const remoteNetworkHTML = formatRemoteNetwork(config.RemoteNetwork)
    const allowedUserHTML = formatAllowedUser(config.AllowedUser)
    const statusHTML = formatStatus(config.Status)
    
    const userAuthModeBadge = userAuthMode === 'Enable' || userAuthMode === 'ON' || userAuthMode === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(userAuthMode) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(userAuthMode) + '</span>'
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; min-width: 150px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${connectionType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${policy}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${authenticationType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 100px;">${subnetFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 100px;">${endpointFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace; min-width: 120px;">${localWANPort}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace; min-width: 120px;">${remoteHost}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 150px;">
          ${localID !== '-' ? `<div style="display: flex; flex-direction: column; gap: 0.125rem;"><span style="color: #6b7280; font-size: 0.75rem;">${localIDType}:</span><span style="color: #111827; font-size: 0.875rem;">${localID}</span></div>` : '-'}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 200px;">
            ${localSubnetHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 150px;">
            ${remoteNetworkHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 150px;">
          ${remoteID !== '-' ? `<div style="display: flex; flex-direction: column; gap: 0.125rem;"><span style="color: #6b7280; font-size: 0.75rem;">${remoteIDType}:</span><span style="color: #111827; font-size: 0.875rem;">${remoteID}</span></div>` : '-'}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 120px;">
          <span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; ${userAuthMode === 'Enable' || userAuthMode === 'ON' || userAuthMode === 'Yes' ? 'background-color: #dbeafe; color: #1e40af;' : 'background-color: #f3f4f6; color: #4b5563;'}">${escapeHtml(userAuthMode || 'Disable')}</span>
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 120px;">
            ${allowedUserHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 80px;">${protocol}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 100px;">${statusHTML}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${actionOnVPNRestart}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">vpn_key</span>
        <span style="display: inline-flex; align-items: center;">VPN IPSec Connections</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto;">
        <table class="sophos-table sophos-table-wide">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header sophos-cell-min-150">Name</th>
              <th class="sophos-table-header sophos-cell-min-120">Connection Type</th>
              <th class="sophos-table-header sophos-cell-min-120">Policy</th>
              <th class="sophos-table-header sophos-cell-min-120">Authentication Type</th>
              <th class="sophos-table-header sophos-cell-min-100">Subnet Family</th>
              <th class="sophos-table-header sophos-cell-min-100">Endpoint Family</th>
              <th class="sophos-table-header sophos-cell-min-120">Local WAN Port</th>
              <th class="sophos-table-header sophos-cell-min-120">Remote Host</th>
              <th class="sophos-table-header sophos-cell-min-150">Local ID</th>
              <th class="sophos-table-header sophos-cell-min-200">Local Subnet</th>
              <th class="sophos-table-header sophos-cell-min-150">Remote Network</th>
              <th class="sophos-table-header sophos-cell-min-150">Remote ID</th>
              <th class="sophos-table-header sophos-cell-min-120">User Auth Mode</th>
              <th class="sophos-table-header sophos-cell-min-120">Allowed User</th>
              <th class="sophos-table-header sophos-cell-min-80">Protocol</th>
              <th class="sophos-table-header sophos-cell-min-100">Status</th>
              <th class="sophos-table-header sophos-cell-min-120">Action On VPN Restart</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateUniCastRouteTable(items) {
  if (!items || items.length === 0) return ''
  
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
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const ipFamily = escapeHtml(fields.IPFamily || 'N/A')
    const destination = formatDestination(fields)
    const gateway = escapeHtml(fields.Gateway || 'N/A')
    const interfaceName = escapeHtml(fields.Interface || 'N/A')
    const distanceDisplay = fields.AdministrativeDistance !== undefined && fields.AdministrativeDistance !== null
      ? `${fields.Distance || 0} (AD: ${fields.AdministrativeDistance})`
      : fields.Distance !== undefined && fields.Distance !== null
      ? String(fields.Distance)
      : 'N/A'
    const status = fields.Status || 'N/A'
    const description = escapeHtml(fields.Description || '-')
    
    const statusBadge = renderStatusBadgeHTML(status)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-weight: 500; word-break: break-word; overflow-wrap: anywhere; max-width: 100px;">${ipFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 200px; font-family: monospace;">${escapeHtml(destination)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 150px; font-family: monospace;">${gateway}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${interfaceName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 100px;">${escapeHtml(distanceDisplay)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${statusBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${description}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">route</span>
        <span>Unicast Routes</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">IP Family</th>
              <th class="sophos-table-header">Destination</th>
              <th class="sophos-table-header">Gateway</th>
              <th class="sophos-table-header">Interface</th>
              <th class="sophos-table-header">Distance</th>
              <th class="sophos-table-header">Status</th>
              <th class="sophos-table-header">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Helper to format array/object fields for HTML
function generateWirelessAccessPointTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format WirelessNetworks array
  const formatWirelessNetworks = (networks) => {
    if (!networks) return '-'
    if (Array.isArray(networks)) {
      return escapeHtml(networks.filter(Boolean).join(', '))
    }
    if (typeof networks === 'object' && networks.Network) {
      const networkList = Array.isArray(networks.Network) ? networks.Network : [networks.Network]
      return escapeHtml(networkList.filter(Boolean).join(', '))
    }
    return escapeHtml(String(networks))
  }

  // Format ScanTime
  const formatScanTime = (scanTime) => {
    if (!scanTime) return '-'
    if (typeof scanTime === 'string') return escapeHtml(scanTime)
    if (typeof scanTime === 'object' && scanTime.Time) {
      const times = Array.isArray(scanTime.Time) ? scanTime.Time : [scanTime.Time]
      return escapeHtml(times.filter(Boolean).join(', '))
    }
    return '-'
  }

  // Format AllowedChannels
  const formatAllowedChannels = (channels) => {
    if (!channels) return '-'
    if (typeof channels === 'string') {
      return escapeHtml(channels.split(',').map(c => c.trim()).join(', '))
    }
    if (Array.isArray(channels)) {
      return escapeHtml(channels.filter(Boolean).join(', '))
    }
    return escapeHtml(String(channels))
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const id = escapeHtml(fields.ID || '-')
    const label = escapeHtml(fields.Label || '-')
    const apType = escapeHtml(fields.APType || '-')
    const country = escapeHtml(fields.Country || '-')
    const wirelessNetworks = formatWirelessNetworks(fields.WirelessNetworks)
    const interfaceName = escapeHtml(fields.Interface || '-')
    const lanMac = escapeHtml(fields.LanMac || '-')
    const wifiMac = escapeHtml(fields.WifiMac || '-')
    const band = escapeHtml(fields.Band || '-')
    const channel24 = escapeHtml(fields['Channel2.4GHz'] || fields.Channel24GHz || '-')
    const txPower = escapeHtml(fields.TXPower || '-')
    const channel5 = escapeHtml(fields.Channel5GHz || '-')
    const txPower5 = escapeHtml(fields.TXPower5GHz || '-')
    const channelWidth = escapeHtml(fields.ChannelWidth || '-')
    const channelWidth11a = escapeHtml(fields.ChannelWidth11a || '-')
    const stp = fields.STP || 'Disable'
    const vlanTagging = fields.VLANTagging || 'Disable'
    const dynChan = fields.DynChan || 'Disable'
    const timeBasedScan = fields.TimeBasedScan || 'Disable'
    const scanTime = formatScanTime(fields.ScanTime)
    const dynChan5 = fields.DynChan5GHz || 'Disable'
    const timeBasedScan5 = fields.TimeBasedScan5GHz || 'Disable'
    const scanTime5 = formatScanTime(fields.ScanTime5GHz)
    const allowedChannels = formatAllowedChannels(fields.AllowedChannels)

    const renderBadge = (value) => {
      const isEnabled = value === 'Enable' || value === 'ON' || value === 'Yes'
      return isEnabled
        ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(value) + '</span>'
        : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(value) + '</span>'
    }

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; font-family: monospace; white-space: nowrap;">${id}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; white-space: nowrap;">${label}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${apType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 80px;">${country}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${wirelessNetworks}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px; font-family: monospace;">${interfaceName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; max-width: 150px; font-family: monospace;">${lanMac}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; max-width: 150px; font-family: monospace;">${wifiMac}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${band}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${channel24}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${txPower}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${channel5}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${txPower5}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${channelWidth}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 130px;">${channelWidth11a}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(stp)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(vlanTagging)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(dynChan)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(timeBasedScan)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${scanTime}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(dynChan5)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${renderBadge(timeBasedScan5)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${scanTime5}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px; font-family: monospace;">${allowedChannels}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">wifi</span>
        <span>Wireless Access Points</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table" style="min-width: 2000px;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">ID</th>
              <th class="sophos-table-header">Label</th>
              <th class="sophos-table-header">AP Type</th>
              <th class="sophos-table-header">Country</th>
              <th class="sophos-table-header">Wireless Networks</th>
              <th class="sophos-table-header">Interface</th>
              <th class="sophos-table-header">LAN MAC</th>
              <th class="sophos-table-header">WiFi MAC</th>
              <th class="sophos-table-header">Band</th>
              <th class="sophos-table-header">Channel 2.4GHz</th>
              <th class="sophos-table-header">TX Power</th>
              <th class="sophos-table-header">Channel 5GHz</th>
              <th class="sophos-table-header">TX Power 5GHz</th>
              <th class="sophos-table-header">Channel Width</th>
              <th class="sophos-table-header">Channel Width 11a</th>
              <th class="sophos-table-header">STP</th>
              <th class="sophos-table-header">VLAN Tagging</th>
              <th class="sophos-table-header">Dynamic Channel</th>
              <th class="sophos-table-header">Time Based Scan</th>
              <th class="sophos-table-header">Scan Time</th>
              <th class="sophos-table-header">Dynamic Channel 5GHz</th>
              <th class="sophos-table-header">Time Based Scan 5GHz</th>
              <th class="sophos-table-header">Scan Time 5GHz</th>
              <th class="sophos-table-header">Allowed Channels</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateREDDeviceTable(items) {
  if (!items || items.length === 0) return ''
  
  // Helper to convert netmask to CIDR (reuse from existing code if available)
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

  // Format nested NetworkSetting
  const formatNetworkSetting = (networkSetting) => {
    if (!networkSetting || typeof networkSetting !== 'object') return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const parts = []
    if (networkSetting.Zone) parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Zone:</span><span style="color: #111827;">${escapeHtml(networkSetting.Zone)}</span></div>`)
    if (networkSetting.IPAddress) {
      const ip = escapeHtml(networkSetting.IPAddress)
      const netmask = networkSetting.NetMask || networkSetting.Netmask
      let ipDisplay = ip
      if (netmask) {
        const cidr = netmaskToCIDR(netmask)
        ipDisplay += cidr ? `/${cidr}` : ` (${escapeHtml(netmask)})`
      }
      parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">IP:</span><span style="color: #111827; font-family: monospace;">${ipDisplay}</span></div>`)
    }
    if (networkSetting.OperationMode) parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Mode:</span><span style="color: #111827;">${escapeHtml(networkSetting.OperationMode)}</span></div>`)
    if (networkSetting.TunnelCompression) parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Compression:</span><span style="color: #111827;">${escapeHtml(networkSetting.TunnelCompression)}</span></div>`)
    if (networkSetting.MACFilter && typeof networkSetting.MACFilter === 'object' && networkSetting.MACFilter.FilterType) {
      parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">MAC Filter:</span><span style="color: #111827;">${escapeHtml(networkSetting.MACFilter.FilterType)}</span></div>`)
    }
    
    if (parts.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    return `<div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem; background-color: #f9fafb; min-width: 300px;"><div style="display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.75rem;">${parts.join('')}</div></div>`
  }

  // Format UplinkSettings
  const formatUplinkSettings = (uplinkSettings) => {
    if (!uplinkSettings || typeof uplinkSettings !== 'object') return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const parts = []
    if (uplinkSettings.Uplink && typeof uplinkSettings.Uplink === 'object' && uplinkSettings.Uplink.Connection) {
      parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Primary:</span><span style="color: #111827;">${escapeHtml(uplinkSettings.Uplink.Connection)}</span></div>`)
    }
    if (uplinkSettings.SecondUplinkMode) parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Second Mode:</span><span style="color: #111827;">${escapeHtml(uplinkSettings.SecondUplinkMode)}</span></div>`)
    if (uplinkSettings.SecondUplink && typeof uplinkSettings.SecondUplink === 'object' && uplinkSettings.SecondUplink.Connection) {
      parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">Second:</span><span style="color: #111827;">${escapeHtml(uplinkSettings.SecondUplink.Connection)}</span></div>`)
    }
    if (uplinkSettings.UMTS3GFailover) parts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #4b5563; font-weight: 500;">3G Failover:</span><span style="color: #111827;">${escapeHtml(uplinkSettings.UMTS3GFailover)}</span></div>`)
    if (uplinkSettings.FailOverSettings && typeof uplinkSettings.FailOverSettings === 'object') {
      const fos = uplinkSettings.FailOverSettings
      const failoverParts = []
      if (fos.MobileNetwork) failoverParts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #6b7280; font-size: 0.625rem;">Network:</span><span style="color: #374151; font-size: 0.625rem;">${escapeHtml(fos.MobileNetwork)}</span></div>`)
      if (fos.APN) failoverParts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #6b7280; font-size: 0.625rem;">APN:</span><span style="color: #374151; font-size: 0.625rem;">${escapeHtml(fos.APN)}</span></div>`)
      if (fos.DialString) failoverParts.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: #6b7280; font-size: 0.625rem;">Dial:</span><span style="color: #374151; font-size: 0.625rem;">${escapeHtml(fos.DialString)}</span></div>`)
      if (failoverParts.length > 0) {
        parts.push(`<div style="margin-top: 0.25rem; padding-top: 0.25rem; border-top: 1px solid #d1d5db;"><div style="color: #4b5563; font-weight: 500; margin-bottom: 0.25rem; font-size: 0.75rem;">Failover Settings:</div><div style="display: flex; flex-direction: column; gap: 0.25rem; margin-left: 0.5rem;">${failoverParts.join('')}</div></div>`)
      }
    }
    
    if (parts.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    return `<div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem; background-color: #f9fafb; min-width: 300px;"><div style="display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.75rem;">${parts.join('')}</div></div>`
  }

  // Format SwitchSettings
  const formatSwitchSettings = (switchSettings) => {
    if (!switchSettings || typeof switchSettings !== 'object') return '-'
    if (switchSettings.LANPortMode) return `LAN Port Mode: ${escapeHtml(switchSettings.LANPortMode)}`
    return '-'
  }

  // Format AdvancedSettings
  const formatAdvancedSettings = (advancedSettings) => {
    if (!advancedSettings || typeof advancedSettings !== 'object') return '-'
    if (advancedSettings.RemoteIPAssignment) return `Remote IP: ${escapeHtml(advancedSettings.RemoteIPAssignment)}`
    return '-'
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const branchName = escapeHtml(fields.BranchName || '-')
    const device = escapeHtml(fields.Device || '-')
    const redDeviceID = escapeHtml(fields.REDDeviceID || '-')
    const status = fields.Status || 'Disable'
    const tunnelID = escapeHtml(fields.TunnelID || '-')
    const redMTU = escapeHtml(fields.REDMTU || '-')
    const authorized = fields.Authorized
    const utmHostName = escapeHtml(fields.UTMHostName || '-')
    const secondUTMHostName = escapeHtml(fields.SecondUTMHostName || '-')
    const use2ndIP = escapeHtml(fields.Use2ndIPHostNameFor || '-')
    const deploymentMode = escapeHtml(fields.DeploymentMode || '-')
    const networkSetting = formatNetworkSetting(fields.NetworkSetting)
    const uplinkSettings = formatUplinkSettings(fields.UplinkSettings)
    const switchSettings = formatSwitchSettings(fields.SwitchSettings)
    const advancedSettings = formatAdvancedSettings(fields.AdvancedSettings)
    const description = escapeHtml(fields.Description || '-')

    // Use renderStatusBadgeHTML function which already has white-space: nowrap
    const statusBadge = renderStatusBadgeHTML(status)

    const authorizedBadge = authorized === '1' || authorized === 1 || authorized === 'Yes' || authorized === 'Enable'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46; white-space: nowrap;">Yes</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563; white-space: nowrap;">No</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; min-width: 150px;">${branchName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 100px;">${device}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; min-width: 180px; font-family: monospace;">${redDeviceID}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; white-space: nowrap;">${statusBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${tunnelID}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${redMTU}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${authorizedBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 150px; font-family: monospace;">${utmHostName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 150px; font-family: monospace;">${secondUTMHostName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${use2ndIP}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 150px;">${deploymentMode}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${networkSetting}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${uplinkSettings}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${switchSettings}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${advancedSettings}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${description}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">devices</span>
        <span style="display: inline-flex; align-items: center;">RED Devices</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header" style="min-width: 150px;">Branch Name</th>
              <th class="sophos-table-header" style="min-width: 100px;">Device</th>
              <th class="sophos-table-header" style="min-width: 180px;">RED Device ID</th>
              <th class="sophos-table-header">Status</th>
              <th class="sophos-table-header">Tunnel ID</th>
              <th class="sophos-table-header">RED MTU</th>
              <th class="sophos-table-header">Authorized</th>
              <th class="sophos-table-header">UTM Host Name</th>
              <th class="sophos-table-header">Second UTM Host Name</th>
              <th class="sophos-table-header">Use 2nd IP For</th>
              <th class="sophos-table-header">Deployment Mode</th>
              <th class="sophos-table-header">Network Setting</th>
              <th class="sophos-table-header">Uplink Settings</th>
              <th class="sophos-table-header">Switch Settings</th>
              <th class="sophos-table-header">Advanced Settings</th>
              <th class="sophos-table-header">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateDNSHostEntryTable(items) {
  if (!items || items.length === 0) return ''
  
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

  // Calculate total number of address entries
  const totalAddresses = items.reduce((sum, it) => {
    const fields = it.fields || {}
    const addresses = extractAddresses(fields.AddressList)
    return sum + addresses.length
  }, 0)

  // Render AddressList as structured HTML
  const renderAddressListHTML = (addressList) => {
    const addresses = extractAddresses(addressList)
    if (addresses.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No addresses</span>'

      return addresses.map((addr, addrIdx) => {
        const entryType = escapeHtml(addr.EntryType || '-')
        const ipFamily = escapeHtml(addr.IPFamily || '-')
        const ipAddress = escapeHtml(addr.IPAddress || '-')
        const ttl = escapeHtml(String(addr.TTL || '-'))
        const weight = escapeHtml(String(addr.Weight || '-'))
        const publishOnWAN = addr.PublishOnWAN || 'Disable'
        const wanBadge = publishOnWAN === 'Enable' || publishOnWAN === 'ON' || publishOnWAN === 'Yes'
          ? '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(publishOnWAN) + '</span>'
          : '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(publishOnWAN) + '</span>'

        return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; background-color: #f9fafb; margin-bottom: ${addrIdx < addresses.length - 1 ? '0.5rem' : '0'}; min-width: 500px;">
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.7rem; min-width: 500px;">
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 100px;">
              <span style="color: #6b7280; font-weight: 500;">Type:</span>
              <span style="color: #111827;">${entryType}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 100px;">
              <span style="color: #6b7280; font-weight: 500;">Family:</span>
              <span style="color: #111827;">${ipFamily}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 150px;">
              <span style="color: #6b7280; font-weight: 500;">IP:</span>
              <span style="color: #111827; font-family: monospace; white-space: nowrap;">${ipAddress}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 80px;">
              <span style="color: #6b7280; font-weight: 500;">TTL:</span>
              <span style="color: #111827;">${ttl}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 90px;">
              <span style="color: #6b7280; font-weight: 500;">Weight:</span>
              <span style="color: #111827;">${weight}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 120px;">
              <span style="color: #6b7280; font-weight: 500;">WAN:</span>
              ${wanBadge}
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const hostName = escapeHtml(fields.HostName || '-')
    const addressListHTML = renderAddressListHTML(fields.AddressList)
    const addReverseDNS = fields.AddReverseDNSLookUp || 'Disable'
    
    const reverseDNSBadge = addReverseDNS === 'Enable' || addReverseDNS === 'ON' || addReverseDNS === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(addReverseDNS) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(addReverseDNS) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 250px; font-family: monospace; vertical-align: top;">${hostName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 550px;">
            ${addressListHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top;">${reverseDNSBadge}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">dns</span>
        <span style="display: inline-flex; align-items: center;">DNS Host Entries</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
        ${totalAddresses > 0 ? `<span style="color: #6b7280; font-weight: normal; font-size: 0.75rem;">- ${totalAddresses} address${totalAddresses !== 1 ? 'es' : ''}</span>` : ''}
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Host Name</th>
              <th class="sophos-table-header">Address List</th>
              <th class="sophos-table-header">Add Reverse DNS Lookup</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateGatewayHostTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format MonitoringCondition array
  const formatMonitoringCondition = (monitoringCondition) => {
    if (!monitoringCondition) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
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
    
    if (rules.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    return `<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${rules.map((rule, idx) => {
      const protocol = rule.Protocol ? escapeHtml(rule.Protocol) : null
      const port = rule.Port ? escapeHtml(rule.Port) : null
      const ipAddress = rule.IPAddress ? escapeHtml(rule.IPAddress) : null
      const condition = rule.Condition ? escapeHtml(rule.Condition) : null
      
      // Determine condition badge color
      let conditionBadge = ''
      if (condition) {
        const conditionLower = condition.toLowerCase()
        const isSuccess = conditionLower === 'success'
        const isFailure = conditionLower === 'failure'
        const bgColor = isSuccess ? '#d1fae5' : (isFailure ? '#fee2e2' : '#f3f4f6')
        const textColor = isSuccess ? '#15803d' : (isFailure ? '#b91c1c' : '#4b5563')
        conditionBadge = `<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: ${bgColor}; color: ${textColor};">${condition}</span>`
      }
      
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; background-color: #f9fafb; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: #111827;">Rule ${idx + 1}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem;">
            ${protocol ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: #6b7280; font-weight: 500;">Protocol:</span>
                <span style="color: #111827;">${protocol}</span>
              </div>
            ` : ''}
            ${port ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: #6b7280; font-weight: 500;">Port:</span>
                <span style="color: #111827; font-family: monospace;">${port}</span>
              </div>
            ` : ''}
            ${ipAddress ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: #6b7280; font-weight: 500;">IP:</span>
                <span style="color: #111827; font-family: monospace;">${ipAddress}</span>
              </div>
            ` : ''}
            ${condition ? `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color: #6b7280; font-weight: 500;">Condition:</span>
                ${conditionBadge}
              </div>
            ` : ''}
          </div>
        </div>
      `
    }).join('')}</div>`
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const ipFamily = escapeHtml(fields.IPFamily || '-')
    const gatewayIP = escapeHtml(fields.GatewayIP || '-')
    const interfaceName = escapeHtml(fields.Interface || '-')
    const networkZone = escapeHtml(fields.NetworkZone || '-')
    const healthcheck = fields.Healthcheck || 'OFF'
    const mailNotification = fields.MailNotification || 'OFF'
    const interval = escapeHtml(fields.Interval || '-')
    const failureRetries = escapeHtml(fields.FailureRetries || '-')
    const timeout = escapeHtml(fields.Timeout || '-')
    const monitoringCondition = formatMonitoringCondition(fields.MonitoringCondition)

    const healthcheckBadge = healthcheck === 'ON' || healthcheck === 'Enable' || healthcheck === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(healthcheck) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(healthcheck) + '</span>'

    const mailBadge = mailNotification === 'ON' || mailNotification === 'Enable' || mailNotification === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(mailNotification) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(mailNotification) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${ipFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; word-break: break-word; overflow-wrap: anywhere; max-width: 150px; font-family: monospace;">${gatewayIP}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px; font-family: monospace;">${interfaceName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${networkZone}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${healthcheckBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${mailBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 80px;">${interval}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${failureRetries}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 100px;">${timeout}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${monitoringCondition}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">router</span>
        <span style="display: inline-flex; align-items: center;">Gateway Hosts</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">IP Family</th>
              <th class="sophos-table-header">Gateway IP</th>
              <th class="sophos-table-header">Interface</th>
              <th class="sophos-table-header">Network Zone</th>
              <th class="sophos-table-header">Healthcheck</th>
              <th class="sophos-table-header">Mail Notification</th>
              <th class="sophos-table-header">Interval</th>
              <th class="sophos-table-header">Failure Retries</th>
              <th class="sophos-table-header">Timeout</th>
              <th class="sophos-table-header">Monitoring Condition</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateRouterAdvertisementTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format PrefixAdvertisementConfiguration
  const formatPrefixConfiguration = (prefixConfig) => {
    if (!prefixConfig) return '<span style="color: #9ca3af; font-style: italic;">No prefix configuration</span>'
    
    if (prefixConfig.PrefixAdvertisementConfigurationDetail) {
      const details = Array.isArray(prefixConfig.PrefixAdvertisementConfigurationDetail)
        ? prefixConfig.PrefixAdvertisementConfigurationDetail
        : [prefixConfig.PrefixAdvertisementConfigurationDetail]
      
      return details.filter(Boolean).map((detail, idx) => {
        const prefix = escapeHtml(detail.Prefix64 || detail.Prefix || '-')
        const onLink = detail['On-link'] || 'Disable'
        const autonomous = detail.Autonomous || 'Disable'
        const preferredLifetime = escapeHtml(String(detail.PreferredLifeTime || '-'))
        const validLifetime = escapeHtml(String(detail.ValidLifeTime || '-'))
        
        const onLinkBadge = onLink === 'Enable' || onLink === 'ON' || onLink === 'Yes'
          ? '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(onLink) + '</span>'
          : '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(onLink) + '</span>'
        
        const autonomousBadge = autonomous === 'Enable' || autonomous === 'ON' || autonomous === 'Yes'
          ? '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(autonomous) + '</span>'
          : '<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.7rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(autonomous) + '</span>'
        
        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; background-color: #f9fafb; margin-bottom: ${idx < details.length - 1 ? '0.5rem' : '0'}; min-width: 400px;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.7rem; min-width: 400px;">
              <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 200px;">
                <span style="color: #6b7280; font-weight: 500;">Prefix:</span>
                <span style="color: #111827; font-family: monospace; white-space: nowrap;">${prefix}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 100px;">
                <span style="color: #6b7280; font-weight: 500;">On-link:</span>
                ${onLinkBadge}
              </div>
              <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 120px;">
                <span style="color: #6b7280; font-weight: 500;">Autonomous:</span>
                ${autonomousBadge}
              </div>
              <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 120px;">
                <span style="color: #6b7280; font-weight: 500;">Preferred Lifetime:</span>
                <span style="color: #111827;">${preferredLifetime}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; min-width: 120px;">
                <span style="color: #6b7280; font-weight: 500;">Valid Lifetime:</span>
                <span style="color: #111827;">${validLifetime}</span>
              </div>
            </div>
          </div>
        `
      }).join('')
    }
    return '<span style="color: #9ca3af; font-style: italic;">No prefix details</span>'
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const interfaceName = escapeHtml(fields.Interface || '-')
    const minInterval = escapeHtml(String(fields.MinAdvertisementInterval || '-'))
    const maxInterval = escapeHtml(String(fields.MaxAdvertisementInterval || '-'))
    const manageIP = fields.ManageIPAddressfromDHCPv6 || 'Disable'
    const manageOther = fields.ManageOtherParametersfromDHCPv6 || 'Disable'
    const defaultGateway = fields.DefaultGateway || 'Disable'
    const linkMTU = escapeHtml(String(fields.LinkMTU || '-'))
    const reachableTime = escapeHtml(String(fields.ReachableTime || '-'))
    const retransmitTime = escapeHtml(String(fields.RetransmitTime || '-'))
    const hopLimit = escapeHtml(String(fields.HopLimit || '-'))
    const defaultGatewayLifetime = escapeHtml(String(fields.DefaultGatewayLifeTime || '-'))
    const description = escapeHtml(fields.Description || '-')
    const prefixConfigHTML = formatPrefixConfiguration(fields.PrefixAdvertisementConfiguration)
    
    const manageIPBadge = manageIP === 'Enable' || manageIP === 'ON' || manageIP === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(manageIP) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(manageIP) + '</span>'
    
    const manageOtherBadge = manageOther === 'Enable' || manageOther === 'ON' || manageOther === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(manageOther) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(manageOther) + '</span>'
    
    const defaultGatewayBadge = defaultGateway === 'Enable' || defaultGateway === 'ON' || defaultGateway === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(defaultGateway) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(defaultGateway) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; font-family: monospace;">${interfaceName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${minInterval}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${maxInterval}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${manageIPBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${manageOtherBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${defaultGatewayBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 450px;">
            ${prefixConfigHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${linkMTU}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${reachableTime}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${retransmitTime}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${hopLimit}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${defaultGatewayLifetime}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${description}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">router</span>
        <span style="display: inline-flex; align-items: center;">Router Advertisements</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Interface</th>
              <th class="sophos-table-header">Min Advertisement Interval</th>
              <th class="sophos-table-header">Max Advertisement Interval</th>
              <th class="sophos-table-header">Manage IP from DHCPv6</th>
              <th class="sophos-table-header">Manage Other from DHCPv6</th>
              <th class="sophos-table-header">Default Gateway</th>
              <th class="sophos-table-header">Prefix Configuration</th>
              <th class="sophos-table-header">Link MTU</th>
              <th class="sophos-table-header">Reachable Time</th>
              <th class="sophos-table-header">Retransmit Time</th>
              <th class="sophos-table-header">Hop Limit</th>
              <th class="sophos-table-header">Default Gateway Lifetime</th>
              <th class="sophos-table-header">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateIPSPolicyTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format RuleList
  const formatRuleListHTML = (ruleList) => {
    if (!ruleList) return '<span style="color: #9ca3af; font-style: italic;">No rules</span>'
    
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
    
    if (rules.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No rules</span>'
    
    const tableRows = rules.map((rule, idx) => {
      const categoriesHTML = rule.categories.length > 0
        ? rule.categories.map(cat => `<span style="padding: 0.125rem 0.375rem; background-color: #dbeafe; color: #1e40af; border-radius: 0.25rem; font-size: 0.625rem; display: inline-block; margin-right: 0.25rem; margin-bottom: 0.25rem;">${escapeHtml(cat)}</span>`).join('')
        : '-'
      
      const severitiesHTML = rule.severities.length > 0
        ? rule.severities.map(sev => `<span style="padding: 0.125rem 0.375rem; background-color: #f3e8ff; color: #7c3aed; border-radius: 0.25rem; font-size: 0.625rem; display: inline-block; margin-right: 0.25rem; margin-bottom: 0.25rem;">${escapeHtml(sev)}</span>`).join('')
        : '-'
      
      const targetsHTML = rule.targets.length > 0
        ? rule.targets.map(target => `<span style="padding: 0.125rem 0.375rem; background-color: #d1fae5; color: #065f46; border-radius: 0.25rem; font-size: 0.625rem; display: inline-block; margin-right: 0.25rem; margin-bottom: 0.25rem;">${escapeHtml(target)}</span>`).join('')
        : '-'
      
      const platformsHTML = rule.platforms.length > 0
        ? rule.platforms.map(platform => `<span style="padding: 0.125rem 0.375rem; background-color: #fed7aa; color: #9a3412; border-radius: 0.25rem; font-size: 0.625rem; display: inline-block; margin-right: 0.25rem; margin-bottom: 0.25rem;">${escapeHtml(platform)}</span>`).join('')
        : '-'
      
      const actionBadge = rule.action === 'Recommended' || rule.action === 'recommended'
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">${escapeHtml(rule.action)}</span>`
        : rule.action === 'Block' || rule.action === 'block'
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(rule.action)}</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">${escapeHtml(rule.action)}</span>`
      
      const smartFilterValue = rule.smartFilter && rule.smartFilter !== '-' ? escapeHtml(rule.smartFilter) : '-'
      
      return `
        <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937; font-family: monospace; border-right: 1px solid #e5e7eb;">${rule.index}</td>
          <td style="padding: 0.5rem; color: #111827; font-weight: 500; border-right: 1px solid #e5e7eb; word-break: break-word;">${escapeHtml(rule.ruleName)}</td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb;">${escapeHtml(rule.signatureSelectionType)}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${categoriesHTML}</div>
          </td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${severitiesHTML}</div>
          </td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${targetsHTML}</div>
          </td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${platformsHTML}</div>
          </td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb;">${escapeHtml(rule.ruleType)}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">${actionBadge}</td>
          <td style="padding: 0.5rem; color: #374151;">${smartFilterValue}</td>
        </tr>
      `
    }).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">#</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Rule Name</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Signature Selection</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Categories</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Severity</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Target</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Platform</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Rule Type</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Action</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Smart Filter</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  }

  const rows = items.map((item, idx) => {
    const fields = item.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const ruleListHTML = formatRuleListHTML(fields.RuleList)

    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
      </tr>
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="3" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto;">
            ${ruleListHTML}
          </div>
        </td>
      </tr>
    `
  }).join('')
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">security</span>
        <span>IPS Policies</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 1000px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateWebFilterPolicyTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format RuleList
  const formatRuleListHTML = (ruleList) => {
    if (!ruleList) return '<span style="color: #9ca3af; font-style: italic;">No rules</span>'
    
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
    
    if (rules.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No rules</span>'
    
    const tableRows = rules.map((rule, idx) => {
      const categoriesHTML = rule.categories.length > 0
        ? rule.categories.map((cat, catIdx) => 
            `<span style="padding: 0.125rem 0.375rem; background-color: #dbeafe; color: #1e40af; border-radius: 0.25rem; font-size: 0.625rem; display: inline-block; margin-right: 0.25rem; margin-bottom: 0.25rem;">${escapeHtml(cat.id)} (${escapeHtml(cat.type)})</span>`
          ).join('')
        : '-'
      
      const httpActionBadge = rule.httpAction === 'Deny' || rule.httpAction === 'deny'
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(rule.httpAction)}</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(rule.httpAction)}</span>`
      
      const httpsActionBadge = rule.httpsAction === 'Deny' || rule.httpsAction === 'deny'
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(rule.httpsAction)}</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(rule.httpsAction)}</span>`
      
      const followHTTPBadge = rule.followHTTP
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
      
      const policyEnabledBadge = rule.policyRuleEnabled
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Enabled</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">Disabled</span>`
      
      const cclEnabledBadge = rule.cclRuleEnabled
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Enabled</span>`
        : `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">Disabled</span>`
      
      const exceptionsValue = rule.exceptions.length > 0 ? escapeHtml(rule.exceptions.join(', ')) : '-'
      
      return `
        <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937; font-family: monospace; border-right: 1px solid #e5e7eb;">${rule.index}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">${categoriesHTML}</div>
          </td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">${httpActionBadge}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">${httpsActionBadge}</td>
          <td style="padding: 0.5rem; text-align: center; border-right: 1px solid #e5e7eb;">${followHTTPBadge}</td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb; word-break: break-word;">${exceptionsValue}</td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb;">${escapeHtml(rule.schedule)}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">${policyEnabledBadge}</td>
          <td style="padding: 0.5rem;">${cclEnabledBadge}</td>
        </tr>
      `
    }).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">#</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Categories</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">HTTP Action</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">HTTPS Action</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Follow HTTP</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Exceptions</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Schedule</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Policy Rule</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">CCL Rule</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `
  }

  const rows = items.map((item, idx) => {
    const fields = item.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const defaultAction = fields.DefaultAction || '-'
    const enableReporting = fields.EnableReporting || '-'
    const quotaLimit = fields.QuotaLimit || '-'
    const youtubeFilterEnabled = fields.YoutubeFilterEnabled === '1' || fields.YoutubeFilterEnabled === 1
    const enforceSafeSearch = fields.EnforceSafeSearch === '1' || fields.EnforceSafeSearch === 1
    const office365Enabled = fields.Office365Enabled === '1' || fields.Office365Enabled === 1
    const xffEnabled = fields.XFFEnabled === '1' || fields.XFFEnabled === 1
    
    const defaultActionBadge = defaultAction === 'Allow' || defaultAction === 'allow'
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(defaultAction)}</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(defaultAction)}</span>`
    
    const enableReportingBadge = enableReporting === 'Enable' || enableReporting === '1' || enableReporting === 1
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(enableReporting)}</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">${escapeHtml(enableReporting)}</span>`
    
    const youtubeFilterBadge = youtubeFilterEnabled
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const enforceSafeSearchBadge = enforceSafeSearch
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const office365Badge = office365Enabled
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const xffBadge = xffEnabled
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const ruleListHTML = formatRuleListHTML(fields.RuleList)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${defaultActionBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${enableReportingBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${quotaLimit}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${youtubeFilterBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${enforceSafeSearchBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${office365Badge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${xffBadge}</td>
      </tr>
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="10" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto;">
            ${ruleListHTML}
          </div>
        </td>
      </tr>
    `
  }).join('')
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">filter_alt</span>
        <span>Web Filter Policies</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 1400px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Default Action</th>
              <th class="sophos-table-header">Enable Reporting</th>
              <th class="sophos-table-header">Quota Limit</th>
              <th class="sophos-table-header">Youtube Filter</th>
              <th class="sophos-table-header">Enforce Safe Search</th>
              <th class="sophos-table-header">Office365 Enabled</th>
              <th class="sophos-table-header">XFF Enabled</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateApplicationFilterCategoryTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format ApplicationSettings
  const formatApplicationSettingsHTML = (applicationSettings) => {
    if (!applicationSettings) return '<span style="color: #9ca3af; font-style: italic;">No applications</span>'
    
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
    
    if (applications.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No applications</span>'
    
    const applicationsHTML = applications.map((app, idx) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: 0.25rem; min-width: 300px;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
          <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
            ${idx + 1}
          </span>
          <div style="display: flex; flex-direction: column; gap: 0.125rem; flex: 1;">
            <span style="color: #111827; font-weight: 500;">${escapeHtml(app.name)}</span>
            <span style="color: #6b7280; font-size: 0.625rem; font-style: italic;">QoS: ${escapeHtml(app.qosPolicy)}</span>
          </div>
        </div>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${applicationsHTML}</div>`
  }

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const qosPolicy = escapeHtml(fields.QoSPolicy || '-')
    const bandwidthUsageType = escapeHtml(fields.BandwidthUsageType || '-')
    const applicationSettingsHTML = formatApplicationSettingsHTML(fields.ApplicationSettings)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${qosPolicy}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${bandwidthUsageType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 350px;">${applicationSettingsHTML}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">apps</span>
        <span style="display: inline-flex; align-items: center;">Application Filter Categories</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">QoS Policy</th>
              <th class="sophos-table-header">Bandwidth Usage Type</th>
              <th class="sophos-table-header">Application Settings</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateApplicationFilterPolicyTable(items) {
  if (!items || items.length === 0) return ''
  
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
  const formatCategoryListHTML = (categoryList) => {
    if (!categoryList) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
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
    
    if (categories.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const categoriesHTML = categories.map((cat, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(cat)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; max-height: 150px; overflow-y: auto; min-width: 150px;">${categoriesHTML}</div>`
  }

  // Format CharacteristicsList
  const formatCharacteristicsListHTML = (characteristicsList) => {
    if (!characteristicsList) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
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
    
    if (characteristics.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const characteristicsHTML = characteristics.map((char, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(char)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; max-height: 150px; overflow-y: auto; min-width: 200px;">${characteristicsHTML}</div>`
  }

  // Format ApplicationList
  const formatApplicationListHTML = (applicationList) => {
    if (!applicationList) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
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
    
    if (applications.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    
    const applicationsHTML = applications.map((app, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(app)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; max-height: 200px; overflow-y: auto; min-width: 200px;">${applicationsHTML}</div>`
  }

  if (allRules.length === 0) return ''

  const rows = allRules.map((rule, idx) => {
    const fields = rule
    const policyName = escapeHtml(rule._policyName || 'Unnamed Policy')
    const policyDescription = escapeHtml(rule._policyDescription || '')
    const defaultAction = rule._defaultAction || '-'
    const microAppSupport = rule._microAppSupport === 'True' || rule._microAppSupport === true || rule._microAppSupport === '1'
    const selectAllRule = fields.SelectAllRule === 'Enable' || fields.SelectAllRule === '1' || fields.SelectAllRule === 1
    const action = fields.Action || '-'
    const schedule = escapeHtml(fields.Schedule || '-')
    
    const defaultActionBadge = defaultAction === 'Allow' || defaultAction === 'allow'
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(defaultAction)}</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(defaultAction)}</span>`
    
    const microAppSupportBadge = microAppSupport
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const selectAllRuleBadge = selectAllRule
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Yes</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>`
    
    const actionBadge = action === 'Deny' || action === 'deny'
      ? `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(action)}</span>`
      : `<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(action)}</span>`
    
    const categoriesHTML = formatCategoryListHTML(fields.CategoryList)
    const characteristicsHTML = formatCharacteristicsListHTML(fields.CharacteristicsList)
    const applicationsHTML = formatApplicationListHTML(fields.ApplicationList)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; white-space: nowrap; min-width: 150px;">${policyName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; min-width: 200px; max-width: 300px;">${policyDescription || '-'}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 120px;">${defaultActionBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 100px;">${microAppSupportBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 100px;">${selectAllRuleBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 150px;">${categoriesHTML}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 200px;">${characteristicsHTML}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 200px;">${applicationsHTML}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 100px;">${actionBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${schedule}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">filter_alt</span>
        <span style="display: inline-flex; align-items: center;">Application Filter Policies - Rules</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${allRules.length} rules)</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto;">
        <table class="sophos-table sophos-table-wide">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header sophos-cell-min-150">Policy Name</th>
              <th class="sophos-table-header sophos-cell-min-200">Description</th>
              <th class="sophos-table-header sophos-cell-min-120">Default Action</th>
              <th class="sophos-table-header sophos-cell-min-100">Micro App Support</th>
              <th class="sophos-table-header sophos-cell-min-100">Select All Rule</th>
              <th class="sophos-table-header sophos-cell-min-150">Category List</th>
              <th class="sophos-table-header sophos-cell-min-200">Characteristics List</th>
              <th class="sophos-table-header sophos-cell-min-200">Application List</th>
              <th class="sophos-table-header sophos-cell-min-100">Action</th>
              <th class="sophos-table-header sophos-cell-min-120">Schedule</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateUserGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format GroupDetail entries as a table
  const formatGroupDetailsHTML = (groupDetails) => {
    if (!groupDetails) return '<span style="color: #9ca3af; font-style: italic;">No group details</span>'
    
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
    
    if (details.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No group details</span>'
    
    const rowsHTML = details.map((detail, idx) => {
      const groupType = detail.GroupType || '-'
      const name = escapeHtml(detail.Name || '-')
      const afterName = detail.After && typeof detail.After === 'object' && detail.After.Name ? escapeHtml(detail.After.Name) : '-'
      const qosPolicy = escapeHtml(detail.QoSPolicy || '-')
      const quarantineDigest = detail.QuarantineDigest || 'Disable'
      const sslvpnPolicy = escapeHtml(detail.SSLVPNPolicy || '-')
      const clientlessPolicy = escapeHtml(detail.ClientlessPolicy || '-')
      const surfingQuotaPolicy = escapeHtml(detail.SurfingQuotaPolicy || '-')
      const accessTimePolicy = escapeHtml(detail.AccessTimePolicy || '-')
      const dataTransferPolicy = escapeHtml(detail.DataTransferPolicy || '-')
      const macBinding = detail.MACBinding || 'Disable'
      const l2tp = detail.L2TP || 'Disable'
      const pptp = detail.PPTP || 'Disable'
      const sophosConnectClient = detail.SophosConnectClient || 'Disable'
      const loginRestriction = escapeHtml(detail.LoginRestriction || '-')
      
      const groupTypeBadge = groupType === 'Normal' 
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(groupType) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #e9d5ff; color: #6b21a8;">' + escapeHtml(groupType) + '</span>'
      
      const quarantineDigestBadge = quarantineDigest === 'Enable' || quarantineDigest === 'ON' || quarantineDigest === 'Yes'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(quarantineDigest) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(quarantineDigest) + '</span>'
      
      const macBindingBadge = macBinding === 'Enable' || macBinding === 'ON' || macBinding === 'Yes'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(macBinding) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(macBinding) + '</span>'
      
      const l2tpBadge = l2tp === 'Enable' || l2tp === 'ON' || l2tp === 'Yes'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(l2tp) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(l2tp) + '</span>'
      
      const pptpBadge = pptp === 'Enable' || pptp === 'ON' || pptp === 'Yes'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(pptp) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(pptp) + '</span>'
      
      const sophosConnectClientBadge = sophosConnectClient === 'Enable' || sophosConnectClient === 'ON' || sophosConnectClient === 'Yes'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(sophosConnectClient) + '</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(sophosConnectClient) + '</span>'
      
      return `
        <tr class="sophos-table-row" style="transition: background-color 0.2s;">
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${groupType !== '-' ? groupTypeBadge : '-'}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${name}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-style: italic; word-break: break-word; overflow-wrap: anywhere;">${afterName}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${qosPolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${quarantineDigestBadge}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${sslvpnPolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${clientlessPolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${surfingQuotaPolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${accessTimePolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${dataTransferPolicy}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${macBindingBadge}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${l2tpBadge}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${pptpBadge}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${sophosConnectClientBadge}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${loginRestriction}</td>
        </tr>
      `
    }).join('')
    
    return `
      <div style="overflow-x: auto; max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 50px;">#</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 100px;">Group Type</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 150px;">Name</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">After</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">QoS Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">Quarantine Digest</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">SSL VPN Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">Clientless Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 150px;">Surfing Quota Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 130px;">Access Time Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 130px;">Data Transfer Policy</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 100px;">MAC Binding</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 80px;">L2TP</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 80px;">PPTP</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 150px;">Sophos Connect Client</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">Login Restriction</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `
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

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const groupDetailsHTML = formatGroupDetailsHTML(fields.GroupDetail)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 1200px;">${groupDetailsHTML}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">group</span>
        <span>User Groups</span>
        <span style="color: #6b7280; font-weight: normal;">(${totalGroupDetailsCount})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header">Group Details</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateApplicationClassificationBatchAssignmentTable(items) {
  if (!items || items.length === 0) return ''
  
  // Extract ClassAssignment entries from ClassAssignmentList
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

  // Format ClassAssignmentList as a nested table
  const formatClassAssignmentsHTML = (classAssignmentList) => {
    const assignments = getClassAssignments(classAssignmentList)
    
    if (assignments.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No assignments</span>'
    
    const rowsHTML = assignments.map((assignment, idx) => {
      const app = escapeHtml(assignment.app || '-')
      const classValue = assignment.class || '-'
      
      let classBadge = '-'
      if (classValue !== '-') {
        let bgColor = '#dbeafe'
        let textColor = '#1e40af'
        if (classValue === 'Sanctioned') {
          bgColor = '#d1fae5'
          textColor = '#065f46'
        } else if (classValue === 'Tolerated') {
          bgColor = '#fef3c7'
          textColor = '#92400e'
        } else if (classValue === 'Unsanctioned') {
          bgColor = '#fee2e2'
          textColor = '#991b1b'
        }
        classBadge = `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: ${bgColor}; color: ${textColor};">${escapeHtml(classValue)}</span>`
      }
      
      return `
        <tr class="sophos-table-row" style="transition: background-color 0.2s;">
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${app}</td>
          <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${classBadge}</td>
        </tr>
      `
    }).join('')
    
    return `
      <div style="overflow-x: auto; max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 50px;">#</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 250px;">Application</th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; min-width: 120px;">Class</th>
            </tr>
          </thead>
          <tbody style="background-color: #ffffff;">
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `
  }

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const classAssignmentsHTML = formatClassAssignmentsHTML(fields.ClassAssignmentList)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; vertical-align: top; word-break: break-word; overflow-wrap: anywhere;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 500px;">${classAssignmentsHTML}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">apps</span>
        <span>Application Classification Assignments</span>
        <span style="color: #6b7280; font-weight: normal;">(${totalClassAssignmentCount})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header" style="min-width: 150px;">Name</th>
              <th class="sophos-table-header">Class Assignments</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateSSLVPNPolicyTable(items) {
  if (!items || items.length === 0) return ''
  
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
    if (!permRes) return '<span style="color: #9ca3af; font-style: italic;">No resources</span>'
    
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
    
    if (uniqueResources.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No resources</span>'
    
    const resourcesHTML = uniqueResources.map((res, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(res)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${resourcesHTML}</div>`
  }

  let rows = ''
  allTunnelPolicies.forEach((tp, idx) => {
    const name = escapeHtml(tp.Name || '-')
    const description = escapeHtml(tp.Description || '-')
    const useAsDefaultGateway = tp.UseAsDefaultGateway || 'Off'
    const disconnectIdleClients = tp.DisconnectIdleClients || 'Off'
    const overrideGlobalTimeout = tp.OverrideGlobalTimeout ? `${tp.OverrideGlobalTimeout} min` : '-'
    const resourcesHTML = formatResources(tp.PermittedNetworkResourcesIPv4)
    
    const useAsDefaultGatewayBadge = useAsDefaultGateway === 'On' || useAsDefaultGateway === 'ON' || useAsDefaultGateway === 'Yes' || useAsDefaultGateway === 'Enable'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(useAsDefaultGateway) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(useAsDefaultGateway) + '</span>'
    
    const disconnectIdleClientsBadge = disconnectIdleClients === 'On' || disconnectIdleClients === 'ON' || disconnectIdleClients === 'Yes' || disconnectIdleClients === 'Enable'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(disconnectIdleClients) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(disconnectIdleClients) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${useAsDefaultGatewayBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
          ${resourcesHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${disconnectIdleClientsBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${escapeHtml(overrideGlobalTimeout)}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">vpn_key</span>
        <span>SSL VPN Tunnel Policies</span>
        <span style="color: #6b7280; font-weight: normal;">(${allTunnelPolicies.length} policies from ${items.length} SSL VPN configuration${items.length !== 1 ? 's' : ''})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Use As Default Gateway</th>
              <th class="sophos-table-header">Permitted Network Resources IPv4</th>
              <th class="sophos-table-header">Disconnect Idle Clients</th>
              <th class="sophos-table-header">Override Global Timeout</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateWebFilterCategoryTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format DomainList
  const formatDomainList = (domainList) => {
    if (!domainList) return '<span style="color: #9ca3af; font-style: italic;">No domains</span>'
    
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
    
    if (domains.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No domains</span>'
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${domains.map((domain, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; font-family: monospace; word-break: break-word;">${escapeHtml(domain)}</span>
      </div>
    `).join('')}</div>`
  }

  // Format KeywordList
  const formatKeywordList = (keywordList) => {
    if (!keywordList) return '<span style="color: #9ca3af; font-style: italic;">No keywords</span>'
    
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
    
    if (keywords.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No keywords</span>'
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${keywords.map((keyword, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(keyword)}</span>
      </div>
    `).join('')}</div>`
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const classification = escapeHtml(fields.Classification || '-')
    const configureCategory = escapeHtml(fields.ConfigureCategory || '-')
    const qosPolicy = escapeHtml(fields.QoSPolicy || '-')
    const description = escapeHtml(fields.Description || '-')
    const overrideDefaultDeniedMessage = fields.OverrideDefaultDeniedMessage || 'Disable'
    const notification = fields.Notification || 'Disable'
    const domainListHTML = formatDomainList(fields.DomainList)
    const keywordListHTML = formatKeywordList(fields.KeywordList)
    
    const overrideBadge = overrideDefaultDeniedMessage === 'Enable' || overrideDefaultDeniedMessage === 'ON' || overrideDefaultDeniedMessage === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(overrideDefaultDeniedMessage) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(overrideDefaultDeniedMessage) + '</span>'
    
    const notificationBadge = notification === 'Enable' || notification === 'ON' || notification === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(notification) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(notification) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${classification}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${configureCategory}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${qosPolicy}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${overrideBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${notificationBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
            ${domainListHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
            ${keywordListHTML}
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">filter_list</span>
        <span>Web Filter Categories</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Classification</th>
              <th class="sophos-table-header">Configure Category</th>
              <th class="sophos-table-header">QoS Policy</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Override Default Denied Message</th>
              <th class="sophos-table-header">Notification</th>
              <th class="sophos-table-header">Domain List</th>
              <th class="sophos-table-header">Keyword List</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateZoneTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format ApplianceAccess
  const formatApplianceAccessHTML = (applianceAccess) => {
    if (!applianceAccess) return '<span style="color: #9ca3af; font-style: italic;">No appliance access</span>'
    
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
    
    if (services.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No services configured</span>'
    
    const servicesHTML = services.map((serviceCategory, catIdx) => {
      const itemsHTML = serviceCategory.items.map((item, itemIdx) => {
        const badgeStyle = item.status === 'Enable' || item.status === '1' || item.status === 1
          ? 'background-color: #d1fae5; color: #065f46;'
          : 'background-color: #f3f4f6; color: #4b5563;'
        return `<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; ${badgeStyle} margin-right: 0.25rem; margin-bottom: 0.25rem; display: inline-block;">${escapeHtml(item.name)}: ${escapeHtml(String(item.status))}</span>`
      }).join('')
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem; background-color: #f9fafb; margin-bottom: ${catIdx < services.length - 1 ? '0.5rem' : '0'}; min-width: 400px;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #111827; margin-bottom: 0.375rem;">${escapeHtml(serviceCategory.category)}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
            ${itemsHTML}
          </div>
        </div>
      `
    }).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 400px; max-height: 300px; overflow-y: auto;">${servicesHTML}</div>`
  }

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const type = escapeHtml(fields.Type || '-')
    const description = escapeHtml(fields.Description || '-')
    const applianceAccessHTML = formatApplianceAccessHTML(fields.ApplianceAccess)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${type}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 450px;">${applianceAccessHTML}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">location_city</span>
        <span>Zones</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Type</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Appliance Access</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateScheduleTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format ScheduleDetails
  const formatScheduleDetailsHTML = (scheduleDetails) => {
    if (!scheduleDetails) return '<span style="color: #9ca3af; font-style: italic;">No schedule details</span>'
    
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
    
    if (details.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No schedule details</span>'
    
    const detailsHTML = details.map((detail, idx) => {
      const days = escapeHtml(String(detail.Days || detail.days || '-'))
      const startTime = escapeHtml(String(detail.StartTime || detail.startTime || '-'))
      const stopTime = escapeHtml(String(detail.StopTime || detail.stopTime || '-'))
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem; background-color: #f9fafb; margin-bottom: ${idx < details.length - 1 ? '0.5rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.5rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: #111827;">Schedule Detail ${idx + 1}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #4b5563; font-weight: 500;">Days:</span>
              <span style="color: #111827; font-weight: 500;">${days}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #4b5563; font-weight: 500;">Time:</span>
              <span style="color: #374151;">${startTime} - ${stopTime}</span>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${detailsHTML}</div>`
  }

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const type = escapeHtml(fields.Type || '-')
    const scheduleDetailsHTML = formatScheduleDetailsHTML(fields.ScheduleDetails)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${type}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${scheduleDetailsHTML}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">schedule</span>
        <span>Schedules</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Type</th>
              <th class="sophos-table-header">Schedule Details</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateFileTypeTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format FileExtensionList
  const formatFileExtensionListHTML = (fileExtensionList) => {
    if (!fileExtensionList) return '<span style="color: #9ca3af; font-style: italic;">No extensions</span>'
    
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
    
    if (extensions.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No extensions</span>'
    
    const extensionsHTML = extensions.map((ext, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; font-family: monospace;">${escapeHtml(ext)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${extensionsHTML}</div>`
  }

  // Format MIMEHeaderList
  const formatMIMEHeaderListHTML = (mimeHeaderList) => {
    if (!mimeHeaderList) return '<span style="color: #9ca3af; font-style: italic;">No MIME headers</span>'
    
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
    
    if (headers.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No MIME headers</span>'
    
    const headersHTML = headers.map((header, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; word-break: break-word;">${escapeHtml(header)}</span>
      </div>
    `).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${headersHTML}</div>`
  }

  const rows = items.map((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const fileExtensionsHTML = formatFileExtensionListHTML(fields.FileExtensionList)
    const mimeHeadersHTML = formatMIMEHeaderListHTML(fields.MIMEHeaderList)
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${fileExtensionsHTML}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 350px;">${mimeHeadersHTML}</td>
      </tr>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">description</span>
        <span>File Types</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">File Extensions</th>
              <th class="sophos-table-header">MIME Headers</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateUserActivityTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format CategoryList
  const formatCategoryList = (categoryList) => {
    if (!categoryList) return '<span style="color: #9ca3af; font-style: italic;">No categories</span>'
    
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
    
    if (categories.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No categories</span>'
    
    return categories.map((category, idx) => {
      const categoryId = escapeHtml(category.ID || category.id || '-')
      const categoryType = escapeHtml(category.type || category.Type || '-')
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < categories.length - 1 ? '0.25rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <div style="display: flex; flex-direction: column; gap: 0.125rem; flex: 1;">
              <span style="color: #111827; font-weight: 500;">${categoryId}</span>
              <span style="color: #6b7280; font-size: 0.65rem; font-style: italic;">${categoryType}</span>
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const desc = escapeHtml(fields.Desc || fields.Description || '-')
    const newName = escapeHtml(fields.NewName || '-')
    const categoryListHTML = formatCategoryList(fields.CategoryList)

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${desc}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${newName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
            ${categoryListHTML}
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">person</span>
        <span>User Activities</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">New Name</th>
              <th class="sophos-table-header">Category List</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateClientlessUserTable(items) {
  if (!items || items.length === 0) return ''
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const userName = escapeHtml(fields.UserName || '-')
    const ipAddress = escapeHtml(fields.IPAddress || '-')
    const clientLessGroup = escapeHtml(fields.ClientLessGroup || '-')
    const name = escapeHtml(fields.Name || '-')
    const email = escapeHtml(fields.Email || '-')
    const description = escapeHtml(fields.Description || '-')
    const quarantineDigest = fields.QuarantineDigest || 'Disable'
    const qosPolicy = escapeHtml(fields.QoSPolicy || '-')
    const status = fields.Status || '-'
    
    const quarantineDigestBadge = quarantineDigest === 'Enable' || quarantineDigest === 'ON' || quarantineDigest === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(quarantineDigest) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(quarantineDigest) + '</span>'
    
    let statusBadge = ''
    if (status === 'Active' || status === 'ON' || status === 'Enabled') {
      statusBadge = '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(status) + '</span>'
    } else if (status === 'Inactive' || status === 'OFF' || status === 'Disabled') {
      statusBadge = '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">' + escapeHtml(status) + '</span>'
    } else {
      statusBadge = '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(status) + '</span>'
    }

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${userName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; font-family: monospace;">${ipAddress}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${clientLessGroup}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">${email}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem;">${quarantineDigestBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${qosPolicy}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem;">${statusBadge}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">person</span>
        <span>Clientless Users</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">User Name</th>
              <th class="sophos-table-header">IP Address</th>
              <th class="sophos-table-header">Clientless Group</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Email</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Quarantine Digest</th>
              <th class="sophos-table-header">QoS Policy</th>
              <th class="sophos-table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateMACHostTable(items) {
  if (!items || items.length === 0) return ''
  
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
    
    if (macAddresses.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No MAC addresses</span>'
    
    return macAddresses.map((mac, idx) => {
      const macValue = typeof mac === 'string' ? mac : (mac.MACAddress || mac || '-')
      const escapedMac = escapeHtml(macValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < macAddresses.length - 1 ? '0.25rem' : '0'}; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500; font-family: monospace;">${escapedMac}</span>
          </div>
        </div>
      `
    }).join('')
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const desc = escapeHtml(fields.Description || '-')
    const type = escapeHtml(fields.Type || '-')
    const macList = fields.MACList
    const singleMAC = fields.MACAddress
    const macListHTML = formatMACList(macList, type, singleMAC)

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${desc}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-weight: 500;">${type}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 250px; max-height: 200px; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${macListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">devices</span>
        <span>MAC Hosts</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Type</th>
              <th class="sophos-table-header">MAC Address(es)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateIPHostTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format IP Address List (for IPList type)
  const formatIPList = (listOfIPAddresses) => {
    if (!listOfIPAddresses) return '<span style="color: #9ca3af; font-style: italic;">No IP addresses</span>'
    
    // Handle comma-separated string
    const ipAddresses = typeof listOfIPAddresses === 'string' 
      ? listOfIPAddresses.split(',').map(ip => ip.trim()).filter(Boolean)
      : Array.isArray(listOfIPAddresses)
      ? listOfIPAddresses.filter(Boolean)
      : []
    
    if (ipAddresses.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No IP addresses</span>'
    
    return ipAddresses.map((ip, idx) => {
      const ipValue = typeof ip === 'string' ? ip : (ip.IPAddress || ip || '-')
      const escapedIP = escapeHtml(ipValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < ipAddresses.length - 1 ? '0.25rem' : '0'}; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500; font-family: monospace;">${escapedIP}</span>
          </div>
        </div>
      `
    }).join('')
  }

  // Format IP Address/Network display
  const formatIPAddress = (fields) => {
    const hostType = fields.HostType || ''
    const ipAddress = fields.IPAddress || ''
    const subnet = fields.Subnet || ''
    
    if (hostType === 'Network' && ipAddress && subnet) {
      const cidr = netmaskToCIDR(subnet)
      const escapedIP = escapeHtml(ipAddress)
      const escapedSubnet = escapeHtml(subnet)
      return `
        <span style="font-family: monospace; font-size: 0.875rem;">
          ${escapedIP}
          ${cidr ? `<span style="color: #6b7280;">/${cidr}</span>` : ''}
          <span style="color: #9ca3af; font-size: 0.75rem; margin-left: 0.5rem;">(${escapedSubnet})</span>
        </span>
      `
    } else if (hostType === 'IP' && ipAddress) {
      const escapedIP = escapeHtml(ipAddress)
      return `<span style="font-family: monospace; font-size: 0.875rem;">${escapedIP}</span>`
    } else if (hostType === 'IPList') {
      return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 200px; max-height: 200px; overflow-y: auto;">${formatIPList(fields.ListOfIPAddresses)}</div>`
    }
    
    return '<span style="color: #9ca3af; font-style: italic;">-</span>'
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const desc = escapeHtml(fields.Description || '-')
    const ipFamily = escapeHtml(fields.IPFamily || '-')
    const hostType = escapeHtml(fields.HostType || '-')
    const ipAddressHTML = formatIPAddress(fields)

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${desc}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-weight: 500;">${ipFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-weight: 500;">${hostType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 250px;">
          ${ipAddressHTML}
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">dns</span>
        <span>IP Hosts</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">IP Family</th>
              <th class="sophos-table-header">Host Type</th>
              <th class="sophos-table-header">IP Address/Network/IP List</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Format Members list similar to CategoryList (handles Member array and CountryList.Country)
function formatMembersHTML(members, countryList = null) {
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
  
  if (memberList.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No members</span>'
  
  return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${memberList.map((member, idx) => {
    const memberName = typeof member === 'string' ? escapeHtml(member) : escapeHtml(member.Name || member.name || String(member))
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; min-width: 300px;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
          <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
            ${idx + 1}
          </span>
          <span style="color: #111827; font-weight: 500;">${memberName}</span>
        </div>
      </div>
    `
  }).join('')}</div>`
}

function generateIPHostGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format Host List
  const formatHostListHTML = (hostList) => {
    if (!hostList) return '<span style="color: #9ca3af; font-style: italic;">No hosts</span>'
    
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
    
    if (hosts.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No hosts</span>'
    
    return hosts.map((host, idx) => {
      const hostValue = typeof host === 'string' ? host : (host.Host || host || '-')
      const escapedHost = escapeHtml(hostValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < hosts.length - 1 ? '0.25rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500; font-family: monospace;">${escapedHost}</span>
          </div>
        </div>
      `
    }).join('')
  }
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const ipFamily = escapeHtml(fields.IPFamily || '-')
    const hostListHTML = formatHostListHTML(fields.HostList)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-weight: 500;">${ipFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 350px; max-height: 200px; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${hostListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">group_work</span>
        <span style="display: inline-flex; align-items: center;">IP Host Groups</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">IP Family</th>
              <th class="sophos-table-header">Hosts</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateFQDNGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format FQDN Host List
  const formatFQDNHostListHTML = (fqdnHostList) => {
    if (!fqdnHostList) return '<span style="color: #9ca3af; font-style: italic;">No FQDN hosts</span>'
    
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
    
    if (fqdnHosts.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No FQDN hosts</span>'
    
    return fqdnHosts.map((fqdn, idx) => {
      const fqdnValue = typeof fqdn === 'string' ? fqdn : (fqdn.FQDNHost || fqdn || '-')
      const escapedFQDN = escapeHtml(fqdnValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < fqdnHosts.length - 1 ? '0.25rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500; font-family: monospace;">${escapedFQDN}</span>
          </div>
        </div>
      `
    }).join('')
  }
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const fqdnHostListHTML = formatFQDNHostListHTML(fields.FQDNHostList)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 350px; max-height: 200px; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${fqdnHostListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">group_work</span>
        <span style="display: inline-flex; align-items: center;">FQDN Host Groups</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">FQDN Hosts</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateServiceGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format Service List
  const formatServiceListHTML = (serviceList) => {
    if (!serviceList) return '<span style="color: #9ca3af; font-style: italic;">No services</span>'
    
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
    
    if (services.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No services</span>'
    
    return services.map((service, idx) => {
      const serviceValue = typeof service === 'string' ? service : (service.Service || service || '-')
      const escapedService = escapeHtml(serviceValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < services.length - 1 ? '0.25rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500;">${escapedService}</span>
          </div>
        </div>
      `
    }).join('')
  }
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const serviceListHTML = formatServiceListHTML(fields.ServiceList)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 350px; max-height: 200px; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${serviceListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">group_work</span>
        <span style="display: inline-flex; align-items: center;">Service Groups</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Services</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateCountryGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format Country List
  const formatCountryListHTML = (countryList) => {
    if (!countryList) return '<span style="color: #9ca3af; font-style: italic;">No countries</span>'
    
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
    
    if (countries.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No countries</span>'
    
    return countries.map((country, idx) => {
      const countryValue = typeof country === 'string' ? country : (country.Country || country || '-')
      const escapedCountry = escapeHtml(countryValue)
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.375rem; background-color: #f9fafb; margin-bottom: ${idx < countries.length - 1 ? '0.25rem' : '0'}; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-weight: 500;">${escapedCountry}</span>
          </div>
        </div>
      `
    }).join('')
  }
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const countryListHTML = formatCountryListHTML(fields.CountryList)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; min-width: 350px; max-height: 200px; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${countryListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">group_work</span>
        <span>Country Groups</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Countries</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateAntiVirusHTTPScanningRuleTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format URLRegex array
  const formatURLRegex = (urlRegex) => {
    if (!urlRegex) return '<span style="color: #9ca3af; font-style: italic;">No URL regex patterns</span>'
    
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
    
    if (uniquePatterns.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No URL regex patterns</span>'
    
    return `<div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${uniquePatterns.map((pattern, idx) => `
      <div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.75rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace; flex-shrink: 0; margin-top: 0.125rem;">
          ${idx + 1}
        </span>
        <span style="color: #111827; font-family: monospace; word-break: break-all; font-size: 0.75rem; line-height: 1.5;">${escapeHtml(pattern)}</span>
      </div>
    `).join('')}</div>`
  }

  // Format After field
  const formatAfter = (after) => {
    if (!after) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
    if (typeof after === 'object') {
      if (after.Name) {
        return escapeHtml(after.Name)
      }
      // Try to find Name in nested structure
      const name = after.name || after.NAME || Object.values(after).find(v => typeof v === 'string' && v.trim())
      return name ? escapeHtml(name) : '<span style="color: #9ca3af; font-style: italic;">-</span>'
    }
    return escapeHtml(String(after))
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const after = formatAfter(fields.After)
    const urlRegexHTML = formatURLRegex(fields.URLRegex)
    const action = fields.Action || '-'
    
    const actionBadge = action === 'ByPass' || action === 'Bypass' || action === 'Allow'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(action) + '</span>'
      : action === 'Block' || action === 'Deny'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">' + escapeHtml(action) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(action) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${after}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 400px;">
            ${urlRegexHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${actionBadge}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">scanner</span>
        <span>Anti-Virus HTTP Scanning Rules</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">After</th>
              <th class="sophos-table-header">URL Regex Patterns</th>
              <th class="sophos-table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateWebFilterExceptionTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format DomainList - contains URLRegex and DstIp
  const formatDomainList = (domainList) => {
    if (!domainList) return '<span style="color: #9ca3af; font-style: italic;">No domain list</span>'
    
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
              urlRegexPatterns.push(v.trim())
            }
          })
        } else if (typeof val === 'string' && val.trim()) {
          urlRegexPatterns.push(val.trim())
        }
      })
    }
    
    // Remove duplicates
    const uniqueUrlRegex = Array.from(new Set(urlRegexPatterns))
    const uniqueDstIps = Array.from(new Set(dstIps))
    
    if (uniqueUrlRegex.length === 0 && uniqueDstIps.length === 0) {
      return '<span style="color: #9ca3af; font-style: italic;">No domain list</span>'
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 400px; max-height: 250px; overflow-y: auto;">'
    
    if (uniqueUrlRegex.length > 0) {
      html += '<div><div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem;">URL Regex:</div>'
      html += '<div style="display: flex; flex-direction: column; gap: 0.25rem;">'
      uniqueUrlRegex.forEach((pattern, idx) => {
        html += `
          <div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace; flex-shrink: 0; margin-top: 0.125rem;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-family: monospace; word-break: break-all; font-size: 0.75rem; line-height: 1.625;">${escapeHtml(pattern)}</span>
          </div>
        `
      })
      html += '</div></div>'
    }
    
    if (uniqueDstIps.length > 0) {
      html += '<div><div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Destination IPs:</div>'
      html += '<div style="display: flex; flex-direction: column; gap: 0.25rem;">'
      uniqueDstIps.forEach((ip, idx) => {
        html += `
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #d1fae5; color: #065f46; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
              ${idx + 1}
            </span>
            <span style="color: #111827; font-family: monospace; word-break: break-word;">${escapeHtml(ip)}</span>
          </div>
        `
      })
      html += '</div></div>'
    }
    
    html += '</div>'
    return html
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const desc = escapeHtml(fields.Desc || fields.Description || '-')
    const newName = escapeHtml(fields.NewName || '-')
    const domainListHTML = formatDomainList(fields.DomainList)
    
    const enabled = fields.Enabled || 'off'
    const httpsDecrypt = fields.HttpsDecrypt || 'off'
    const certValidation = fields.CertValidation || 'off'
    const virusScan = fields.VirusScan || 'off'
    const zeroDayProtection = fields.ZeroDayProtection || 'off'
    const policyCheck = fields.PolicyCheck || 'off'
    const isDefault = fields.IsDefault || 'no'
    
    const enabledBadge = enabled === 'on' || enabled === 'ON' || enabled === 'Yes' || enabled === 'Enable'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + escapeHtml(enabled) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(enabled) + '</span>'
    
    const httpsDecryptBadge = httpsDecrypt === 'on' || httpsDecrypt === 'ON' || httpsDecrypt === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(httpsDecrypt) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(httpsDecrypt) + '</span>'
    
    const certValidationBadge = certValidation === 'on' || certValidation === 'ON' || certValidation === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(certValidation) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(certValidation) + '</span>'
    
    const virusScanBadge = virusScan === 'on' || virusScan === 'ON' || virusScan === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(virusScan) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(virusScan) + '</span>'
    
    const zeroDayProtectionBadge = zeroDayProtection === 'on' || zeroDayProtection === 'ON' || zeroDayProtection === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(zeroDayProtection) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(zeroDayProtection) + '</span>'
    
    const policyCheckBadge = policyCheck === 'on' || policyCheck === 'ON' || policyCheck === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(policyCheck) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(policyCheck) + '</span>'
    
    const isDefaultBadge = isDefault === 'yes' || isDefault === 'Yes' || isDefault === 'on' || isDefault === 'ON'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #fef3c7; color: #92400e;">' + escapeHtml(isDefault) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(isDefault) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${desc}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${newName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${enabledBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${httpsDecryptBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${certValidationBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${virusScanBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${zeroDayProtectionBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${policyCheckBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 450px;">
          ${domainListHTML}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${isDefaultBadge}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">filter_alt</span>
        <span>Web Filter Exceptions</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">New Name</th>
              <th class="sophos-table-header">Enabled</th>
              <th class="sophos-table-header">HTTPS Decrypt</th>
              <th class="sophos-table-header">Cert Validation</th>
              <th class="sophos-table-header">Virus Scan</th>
              <th class="sophos-table-header">Zero Day Protection</th>
              <th class="sophos-table-header">Policy Check</th>
              <th class="sophos-table-header">Domain List</th>
              <th class="sophos-table-header">Is Default</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateAVASAddressGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format RBLList
  const formatRBLList = (rblList) => {
    if (!rblList) return '<span style="color: #9ca3af; font-style: italic;">No RBL services</span>'
    
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
    
    if (uniqueRBLNames.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No RBL services</span>'
    
    return uniqueRBLNames.map((rblName, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; margin-bottom: ${idx < uniqueRBLNames.length - 1 ? '0.25rem' : '0'};">
        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
          ${idx + 1}
        </span>
        <span style="color: #111827; font-family: monospace; word-break: break-word;">${escapeHtml(rblName)}</span>
      </div>
    `).join('')
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const groupType = escapeHtml(fields.GroupType || '-')
    const description = escapeHtml(fields.Description || '-')
    const rblListHTML = formatRBLList(fields.RBLList)

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${groupType}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
            ${rblListHTML}
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">security</span>
        <span>AVAS Address Groups</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Group Type</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">RBL List</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateDHCPTable(items) {
  if (!items || items.length === 0) return ''
  
  const rows = items.map((item, idx) => {
    const fields = item.fields || {}
    // Handle both nested (fields.DHCPOption) and direct (fields.OptionCode) structures
    const dhcpOption = fields.DHCPOption || {}
    const optionCode = escapeHtml(dhcpOption.OptionCode || fields.OptionCode || '-')
    const optionName = escapeHtml(dhcpOption.OptionName || fields.OptionName || '-')
    const optionType = escapeHtml(dhcpOption.OptionType || fields.OptionType || '-')
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; font-family: monospace;">${optionCode}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${optionName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere;">${optionType}</td>
      </tr>
    `
  }).join('')
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">dns</span>
        <span>DHCP Options</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Option Code</th>
              <th class="sophos-table-header">Option Name</th>
              <th class="sophos-table-header">Option Type</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateDHCPv6Table(items) {
  if (!items || items.length === 0) return ''
  
  const rows = items.map((item, idx) => {
    const fields = item.fields || {}
    // Handle both nested (fields.DHCPOption) and direct (fields.OptionCode) structures
    // Note: DHCPV6 uses DHCPOption as the child tag name, not DHCPV6Option
    const dhcpv6Option = fields.DHCPOption || fields.DHCPv6Option || fields.DHCPV6Option || {}
    const optionCode = escapeHtml(dhcpv6Option.OptionCode || fields.OptionCode || '-')
    const optionName = escapeHtml(dhcpv6Option.OptionName || fields.OptionName || '-')
    const optionType = escapeHtml(dhcpv6Option.OptionType || fields.OptionType || '-')
    
    return `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; font-family: monospace;">${optionCode}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${optionName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere;">${optionType}</td>
      </tr>
    `
  }).join('')
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">dns</span>
        <span>DHCPv6 Options</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Option Code</th>
              <th class="sophos-table-header">Option Name</th>
              <th class="sophos-table-header">Option Type</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateAdministrationProfileTable(items) {
  if (!items || items.length === 0) return ''
  
  // Helper to render permission badge HTML
  const renderPermissionBadgeHTML = (permission) => {
    if (!permission || permission === 'None') {
      return '<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">None</span>'
    }
    if (permission === 'Read-Write' || permission === 'ReadWrite') {
      return '<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Read-Write</span>'
    }
    if (permission === 'Read-Only' || permission === 'ReadOnly') {
      return '<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">Read-Only</span>'
    }
    return `<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">${escapeHtml(permission)}</span>`
  }

  // Helper to render permission group HTML
  const renderPermissionGroupHTML = (groupName, permissions) => {
    if (!permissions || typeof permissions !== 'object') return ''
    
    const permissionEntries = Object.entries(permissions).filter(([key, value]) => 
      key && value !== undefined && value !== null
    )
    
    if (permissionEntries.length === 0) return ''

    const permissionItems = permissionEntries.map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background-color: #f9fafb; border-radius: 0.25rem; margin-bottom: 0.5rem;">
          <span style="font-size: 0.75rem; color: #374151; font-weight: 500; flex: 1; margin-right: 0.5rem; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(label)}</span>
          <div style="flex-shrink: 0;">
            ${renderPermissionBadgeHTML(value)}
          </div>
        </div>
      `
    }).join('')

    return `
      <div style="margin-bottom: 1rem;">
        <h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb;">
          ${escapeHtml(groupName)}
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
          ${permissionItems}
        </div>
      </div>
    `
  }

  // Top-level permissions
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

  const profilesHTML = items.map((item, idx) => {
    const fields = item.fields || {}
    const profileName = escapeHtml(fields.Name || `Profile ${idx + 1}`)
    
    // Top-level permissions HTML
    const topLevelHTML = topLevelPermissions.map(permKey => {
      const value = fields[permKey]
      if (value === undefined || value === null) return ''
      const label = permKey.replace(/([A-Z])/g, ' $1').trim()
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background-color: #f9fafb; border-radius: 0.25rem; margin-bottom: 0.5rem;">
          <span style="font-size: 0.75rem; color: #374151; font-weight: 500; flex: 1; margin-right: 0.5rem; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(label)}</span>
          <div style="flex-shrink: 0;">
            ${renderPermissionBadgeHTML(value)}
          </div>
        </div>
      `
    }).filter(Boolean).join('')

    // Nested groups HTML
    const nestedGroupsHTML = nestedGroups.map(group => {
      const groupPermissions = fields[group.key]
      if (!groupPermissions || typeof groupPermissions !== 'object') return ''
      return renderPermissionGroupHTML(group.label, groupPermissions)
    }).filter(Boolean).join('')

    return `
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <div style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;">
          <h4 style="font-size: 1rem; font-weight: 600; color: #111827;">${profileName}</h4>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb;">
            General Permissions
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
            ${topLevelHTML}
          </div>
        </div>

        ${nestedGroupsHTML}
      </div>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">admin_panel_settings</span>
        <span>Administration Profiles</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${profilesHTML}
      </div>
    </div>
  `
}

function generateAntiSpamRuleTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format rule details HTML
  const formatRuleDetailsHTML = (fields) => {
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
    
    if (details.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No details</span>'
    
    const detailsRows = details.map((detail, idx) => {
      const quarantineHTML = detail.quarantine
        ? `<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: ${detail.quarantine === 'Enable' || detail.quarantine === '1' ? '#d1fae5' : '#f3f4f6'}; color: ${detail.quarantine === 'Enable' || detail.quarantine === '1' ? '#065f46' : '#4b5563'};">${escapeHtml(detail.quarantine)}</span>`
        : '-'
      
      return `
        <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937; font-family: monospace; border-right: 1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding: 0.5rem; color: #374151; font-weight: 500; border-right: 1px solid #e5e7eb;">${escapeHtml(detail.label)}</td>
          <td style="padding: 0.5rem; border-right: 1px solid #e5e7eb;">
            <span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">
              ${escapeHtml(detail.action)}
            </span>
          </td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb; word-break: break-word;">
            ${detail.value !== '-' ? escapeHtml(detail.value) : '-'}
          </td>
          <td style="padding: 0.5rem;">
            ${quarantineHTML}
          </td>
        </tr>
      `
    }).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">#</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Type</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Action</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Value/Parameter</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Quarantine</th>
          </tr>
        </thead>
        <tbody>
          ${detailsRows}
        </tbody>
      </table>
    `
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const afterName = escapeHtml(fields.After?.Name || '-')
    const markSpamCondition = fields.MarkSpamIf?.Condition || '-'
    const markSpamMatch = fields.MarkSpamIf?.MatchIs || '-'
    const markSpamIf = markSpamCondition !== '-' && markSpamMatch !== '-'
      ? `${markSpamCondition}: ${markSpamMatch}`
      : markSpamCondition !== '-' ? markSpamCondition : '-'
    const markSpamIfEscaped = escapeHtml(markSpamIf)
    const ruleDetailsHTML = formatRuleDetailsHTML(fields)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${afterName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${markSpamIfEscaped}</td>
      </tr>
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="4" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto;">
            ${ruleDetailsHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">email</span>
        <span>Anti-Spam Rules</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">After</th>
              <th class="sophos-table-header">Mark Spam If</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateWebFilterURLGroupTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format URL list HTML
  const formatURLListHTML = (urlList) => {
    if (!urlList) return '<span style="color: #9ca3af; font-style: italic;">No URLs</span>'
    
    const urls = []
    
    // Handle different structures
    if (urlList.URL) {
      const urlArray = Array.isArray(urlList.URL) ? urlList.URL : [urlList.URL]
      urls.push(...urlArray.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
    } else if (Array.isArray(urlList)) {
      urls.push(...urlList.filter(Boolean).map(url => String(url).trim()).filter(Boolean))
    }
    
    if (urls.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No URLs</span>'
    
    const urlRows = urls.map((url, idx) => `
      <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937; font-family: monospace; border-right: 1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding: 0.5rem; color: #374151; word-break: break-word; font-family: monospace; font-size: 0.7rem;">${escapeHtml(url)}</td>
      </tr>
    `).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb; width: 60px;">#</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">URL</th>
          </tr>
        </thead>
        <tbody>
          ${urlRows}
        </tbody>
      </table>
    `
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const description = escapeHtml(fields.Description || '-')
    const isDefault = fields.IsDefault === 'Yes' || fields.IsDefault === '1' || fields.IsDefault === 1
    const isDefaultBadge = isDefault
      ? '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">Yes</span>'
      : '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">No</span>'
    const urlListHTML = formatURLListHTML(fields.URLlist)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${description}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${isDefaultBadge}</td>
      </tr>
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="4" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto; max-height: 400px; overflow-y: auto;">
            ${urlListHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">link</span>
        <span>Web Filter URL Groups</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Is Default</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateSyslogServerTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format LogSettings HTML
  const formatLogSettingsHTML = (logSettings) => {
    if (!logSettings || typeof logSettings !== 'object') return '<span style="color: #9ca3af; font-style: italic;">No log settings</span>'
    
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
    
    if (settings.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No log settings</span>'
    
    const settingsRows = settings.map((setting, idx) => {
      const statusBadge = setting.value === 'Enable'
        ? '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Enable</span>'
        : '<span style="padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">Disable</span>'
      
      return `
        <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 0.5rem; color: #374151; font-weight: 500; border-right: 1px solid #e5e7eb;">${escapeHtml(setting.category)}</td>
          <td style="padding: 0.5rem; color: #374151; border-right: 1px solid #e5e7eb; word-break: break-word;">${escapeHtml(setting.setting)}</td>
          <td style="padding: 0.5rem;">${statusBadge}</td>
        </tr>
      `
    }).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Category</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb;">Setting</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${settingsRows}
        </tbody>
      </table>
    `
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || '-')
    const serverAddress = escapeHtml(fields.ServerAddress || '-')
    const port = escapeHtml(fields.Port || '-')
    const enableSecureConnection = fields.EnableSecureConnection === 'Enable' || fields.EnableSecureConnection === '1' || fields.EnableSecureConnection === 1
    const secureConnectionBadge = enableSecureConnection
      ? '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">Enable</span>'
      : '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">Disable</span>'
    const facility = escapeHtml(fields.Facility || '-')
    const severityLevel = escapeHtml(fields.SeverityLevel || '-')
    const format = escapeHtml(fields.Format || '-')
    const logSettingsHTML = fields.LogSettings ? formatLogSettingsHTML(fields.LogSettings) : ''
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${serverAddress}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace;">${port}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${secureConnectionBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${facility}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151;">${severityLevel}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace;">${format}</td>
      </tr>
      ${logSettingsHTML ? `
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="8" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto; max-height: 400px; overflow-y: auto;">
            ${logSettingsHTML}
          </div>
        </td>
      </tr>
      ` : ''}
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">dns</span>
        <span>Syslog Servers</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 1200px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Server Address</th>
              <th class="sophos-table-header">Port</th>
              <th class="sophos-table-header">Secure Connection</th>
              <th class="sophos-table-header">Facility</th>
              <th class="sophos-table-header">Severity Level</th>
              <th class="sophos-table-header">Format</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateMessagesTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format message details HTML
  const formatMessageDetailsHTML = (fields) => {
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
    
    if (messageGroups.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No messages</span>'
    
    const groupsHTML = messageGroups.map((group, groupIdx) => {
      const messagesRows = group.messages.map((msg, idx) => `
        <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 0.5rem; color: #374151; font-weight: 500; border-right: 1px solid #e5e7eb; vertical-align: top; width: 200px;">${escapeHtml(msg.name)}</td>
          <td style="padding: 0.5rem; color: #374151; word-break: break-word; white-space: pre-wrap;">${escapeHtml(msg.value)}</td>
        </tr>
      `).join('')
      
      return `
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb;">
            ${escapeHtml(group.type)}
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb; width: 200px;">Message Type</th>
                <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Message Content</th>
              </tr>
            </thead>
            <tbody>
              ${messagesRows}
            </tbody>
          </table>
        </div>
      `
    }).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 1rem;">${groupsHTML}</div>`
  }

  // Get message type for main row
  const getMessageType = (fields) => {
    const types = []
    if (fields.SMTP) types.push('SMTP')
    if (fields.Administration) types.push('Administration')
    if (fields.SMSCustomization) types.push('SMS Customization')
    return types.length > 0 ? types.join(', ') : '-'
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const messageType = escapeHtml(getMessageType(fields))
    const messageDetailsHTML = formatMessageDetailsHTML(fields)
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">${messageType}</td>
      </tr>
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="2" class="sophos-table-cell" style="padding: 1rem; font-size: 0.75rem;">
          <div style="width: 100%; overflow-x: auto; max-height: 500px; overflow-y: auto;">
            ${messageDetailsHTML}
          </div>
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">message</span>
        <span>Messages</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 600px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Message Type</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateAdminSettingsTable(items) {
  if (!items || items.length === 0) return ''
  
  // Helper to render setting badge HTML
  const renderSettingBadgeHTML = (value) => {
    if (!value || value === 'Disable' || value === '0' || value === 0) {
      return '<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + (value === 'Disable' || value === '0' || value === 0 ? 'Disable' : escapeHtml(value || 'No')) + '</span>'
    }
    return '<span style="padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + (value === 'Enable' || value === '1' || value === 1 ? 'Enable' : escapeHtml(value)) + '</span>'
  }

  // Helper to render a single setting row (key-value pair)
  const renderSettingRowHTML = (label, value, isBoolean = false) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
    return `
      <div style="display: grid; grid-template-columns: 200px 1fr; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">
        <span style="font-size: 0.75rem; color: #4b5563; font-weight: 500; word-break: break-word;">${escapeHtml(label)}</span>
        <div style="font-size: 0.75rem; color: #111827;">
          ${isBoolean ? renderSettingBadgeHTML(displayValue) : `<span style="font-family: monospace;">${escapeHtml(displayValue)}</span>`}
        </div>
      </div>
    `
  }

  // Helper to render setting group HTML - cleaner two-column layout
  const renderSettingGroupHTML = (groupName, groupData, isNested = false) => {
    if (!groupData || typeof groupData !== 'object') return ''
    
    const entries = Object.entries(groupData).filter(([key, value]) => 
      key && value !== undefined && value !== null && value !== ''
    )
    
    if (entries.length === 0) return ''

    // Separate nested objects from simple values
    const simpleEntries = entries.filter(([, value]) => !(value && typeof value === 'object' && !Array.isArray(value)))
    const nestedEntries = entries.filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))

    let html = `
      <div style="${isNested ? 'margin-top: 0.75rem;' : ''}">
        <h4 style="font-size: 0.75rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #d1d5db;">
          ${escapeHtml(groupName)}
        </h4>
    `
    
    // Render simple values
    if (simpleEntries.length > 0) {
      html += '<div style="margin-bottom: 0.75rem;">'
      simpleEntries.forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
        const isBoolean = displayValue === 'Enable' || displayValue === 'Disable' || displayValue === '1' || displayValue === '0'
        html += renderSettingRowHTML(label, displayValue, isBoolean)
      })
      html += '</div>'
    }
    
    // Render nested objects
    if (nestedEntries.length > 0) {
      nestedEntries.forEach(([key, value]) => {
        html += renderSettingGroupHTML(key.replace(/([A-Z])/g, ' $1').trim(), value, true)
      })
    }
    
    html += '</div>'
    return html
  }

  const settingsHTML = items.map((item, idx) => {
    const fields = item.fields || {}
    
    // Build left and right column content
    let leftColumn = ''
    let rightColumn = ''
    
    // Left column
    if (fields.HostnameSettings) {
      leftColumn += renderSettingGroupHTML('Hostname Settings', fields.HostnameSettings)
    }
    if (fields.LoginSecurity) {
      leftColumn += renderSettingGroupHTML('Login Security', fields.LoginSecurity)
    }
    if (fields.LoginDisclaimer) {
      leftColumn += `
        <div>
          <h4 style="font-size: 0.75rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #d1d5db;">
            Login Disclaimer
          </h4>
          ${renderSettingRowHTML('Status', fields.LoginDisclaimer, true)}
        </div>
      `
    }
    
    // Right column
    if (fields.WebAdminSettings) {
      rightColumn += renderSettingGroupHTML('Web Admin Settings', fields.WebAdminSettings)
    }
    if (fields.PasswordComplexitySettings) {
      rightColumn += renderSettingGroupHTML('Password Complexity Settings', fields.PasswordComplexitySettings)
    }
    if (fields.DefaultConfigurationLanguage) {
      rightColumn += `
        <div>
          <h4 style="font-size: 0.75rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #d1d5db;">
            Default Configuration Language
          </h4>
          ${renderSettingRowHTML('Language', fields.DefaultConfigurationLanguage, false)}
        </div>
      `
    }
    
    return `
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">${leftColumn}</div>
          <div style="display: flex; flex-direction: column; gap: 1rem;">${rightColumn}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">settings</span>
        <span>Admin Settings</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${settingsHTML}
      </div>
    </div>
  `
}

function generateBackupRestoreTable(items) {
  if (!items || items.length === 0) return ''
  
  // Helper to render setting badge HTML
  const renderSettingBadgeHTML = (value) => {
    if (!value || value === 'Disable' || value === '0' || value === 0) {
      return '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + (value === 'Disable' || value === '0' || value === 0 ? 'Disable' : escapeHtml(value || 'No')) + '</span>'
    }
    return '<span style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">' + (value === 'Enable' || value === '1' || value === 1 ? 'Enable' : escapeHtml(value)) + '</span>'
  }

  // Helper to render setting group as table rows
  const renderSettingsGroupRows = (groupName, groupData) => {
    if (!groupData || typeof groupData !== 'object') return ''
    
    const entries = Object.entries(groupData).filter(([key, value]) => 
      key && value !== undefined && value !== null && value !== ''
    )
    
    if (entries.length === 0) return ''

    const rowsHTML = entries.map(([key, value]) => {
      // Skip password fields for security
      if (key.toLowerCase().includes('password') && typeof value === 'string' && value.length > 20) {
        const formattedKey = escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())
        return `
          <tr class="sophos-table-row">
            <td class="sophos-table-cell" style="font-size: 0.75rem; color: #4b5563; font-weight: 500; min-width: 200px;">${formattedKey}</td>
            <td class="sophos-table-cell" style="font-size: 0.75rem; color: #6b7280; font-style: italic;">(Encrypted)</td>
          </tr>
        `
      }
      
      const formattedKey = escapeHtml(key.replace(/([A-Z])/g, ' $1').trim())
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
      const isBoolean = displayValue === 'Enable' || displayValue === 'Disable' || displayValue === '1' || displayValue === '0'
      const isMonospace = key === 'EmailAddress' || key === 'FTPServer' || key === 'FtpPath'
      
      let valueHTML
      if (isBoolean) {
        valueHTML = renderSettingBadgeHTML(displayValue)
      } else {
        valueHTML = `<span style="color: #111827; ${isMonospace ? 'font-family: monospace;' : ''} word-break: break-word;">${escapeHtml(displayValue)}</span>`
      }
      
      return `
        <tr class="sophos-table-row">
          <td class="sophos-table-cell" style="font-size: 0.75rem; color: #4b5563; font-weight: 500; min-width: 200px;">${formattedKey}</td>
          <td class="sophos-table-cell" style="font-size: 0.75rem; word-break: break-word; overflow-wrap: anywhere;">${valueHTML}</td>
        </tr>
      `
    }).join('')

    return `
      <tr class="sophos-table-row" style="background-color: #f9fafb;">
        <td colspan="2" class="sophos-table-cell" style="padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; color: #1f2937; border-bottom: 2px solid #e5e7eb;">
          ${escapeHtml(groupName)}
        </td>
      </tr>
      ${rowsHTML}
    `
  }

  // Get backup mode for display
  const getBackupMode = (fields) => {
    const scheduleBackup = fields.ScheduleBackup
    if (!scheduleBackup) return '-'
    return scheduleBackup.BackupMode || scheduleBackup.backupMode || '-'
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const backupMode = escapeHtml(getBackupMode(fields))
    
    const scheduleBackupRows = renderSettingsGroupRows('Schedule Backup', fields.ScheduleBackup)

    rows += `
      <tr class="sophos-table-row" style="background-color: #f0f9ff; border-top: 2px solid #e5e7eb;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; vertical-align: top;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 600; color: #111827;">
          <div style="margin-bottom: 0.5rem;">Backup Mode: <span style="font-weight: 500;">${backupMode}</span></div>
          ${scheduleBackupRows ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
              <tbody>
                ${scheduleBackupRows}
              </tbody>
            </table>
          ` : ''}
        </td>
      </tr>
    `
  })

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">backup</span>
        <span>Backup & Restore</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table" style="width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Backup Configuration</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateContentConditionListTable(items) {
  if (!items || items.length === 0) return ''

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || it.name || '-')
    const description = escapeHtml(fields.Description || '-')
    const key = escapeHtml(fields.Key || '-')

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere;">
          ${name}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere;">
          ${description}
        </td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #111827; font-family: monospace; word-break: break-word; overflow-wrap: anywhere;">
          ${key}
        </td>
      </tr>
    `
  })

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">list</span>
        <span>Content Condition List</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
              <th class="sophos-table-header">Description</th>
              <th class="sophos-table-header">Key</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateMTADataControlListTable(items) {
  if (!items || items.length === 0) return ''
  
  // Format signatures list HTML
  const formatSignaturesListHTML = (signatures) => {
    if (!signatures) return '<span style="color: #9ca3af; font-style: italic;">No signatures</span>'
    
    const sigList = []
    
    // Handle different structures
    if (signatures.Signature) {
      const sigArray = Array.isArray(signatures.Signature) ? signatures.Signature : [signatures.Signature]
      sigList.push(...sigArray.filter(Boolean).map(sig => String(sig).trim()).filter(Boolean))
    } else if (Array.isArray(signatures)) {
      sigList.push(...signatures.filter(Boolean).map(sig => String(sig).trim()).filter(Boolean))
    }
    
    if (sigList.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No signatures</span>'
    
    const sigRows = sigList.map((sig, idx) => `
      <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937; font-family: monospace; border-right: 1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding: 0.5rem; color: #374151; word-break: break-word; font-size: 0.7rem;">${escapeHtml(sig)}</td>
      </tr>
    `).join('')
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem; border-right: 1px solid #e5e7eb; width: 60px;">#</th>
            <th style="padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; color: #374151; font-size: 0.75rem;">Signature</th>
          </tr>
        </thead>
        <tbody>
          ${sigRows}
        </tbody>
      </table>
    `
  }

  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    const name = escapeHtml(fields.Name || it.name || '-')
    const signaturesHTML = formatSignaturesListHTML(fields.Signatures)

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 250px;">
          ${name}
        </td>
      </tr>
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" colspan="2" style="padding: 0.625rem 1rem; font-size: 0.75rem; vertical-align: top; min-width: 100%; padding-left: 2rem; padding-right: 2rem;">
          <div style="width: 100%; overflow-x: auto; max-height: 500px; overflow-y: auto;">
            ${signaturesHTML}
          </div>
        </td>
      </tr>
    `
  })

  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">security</span>
        <span>MTA Data Control List</span>
        <span style="color: #6b7280; font-weight: normal;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper" style="overflow-x: auto; overflow-y: visible; max-width: 100%;">
        <table class="sophos-table" style="min-width: 800px; width: 100%;">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Name</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function generateGatewayConfigurationTable(items) {
  if (!items || items.length === 0) return ''
  
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
    if (!failOverRules) return '<span style="color: #9ca3af; font-style: italic;">No failover rules</span>'
    
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
    
    if (rules.length === 0) return '<span style="color: #9ca3af; font-style: italic;">No failover rules</span>'
    
    // Container with scrollable max-height like ReportView.jsx
    const rulesHtml = rules.map((rule, idx) => {
      const protocol = escapeHtml(rule.Protocol || '-')
      const ipAddress = escapeHtml(rule.IPAddress || '-')
      const port = escapeHtml(rule.Port || '-')
      const condition = escapeHtml(rule.Condition || '-')
      
      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; background-color: #f9fafb; min-width: 300px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;">
              ${idx + 1}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">Rule ${idx + 1}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; font-size: 0.75rem; margin-left: 1.75rem;">
            <div style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="color: #6b7280; font-weight: 500;">Protocol:</span>
              <span style="color: #111827;">${protocol}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="color: #6b7280; font-weight: 500;">IP:</span>
              <span style="color: #111827; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;">${ipAddress}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="color: #6b7280; font-weight: 500;">Port:</span>
              <span style="color: #111827;">${port}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="color: #6b7280; font-weight: 500;">Condition:</span>
              <span style="color: #111827;">${condition}</span>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    return `<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${rulesHtml}</div>`
  }

  let rows = ''
  allGateways.forEach((gw, idx) => {
    const name = escapeHtml(gw.Name || '-')
    const ipFamily = escapeHtml(gw.IPFamily || '-')
    const ipAddress = escapeHtml(gw.IPAddress || '-')
    const type = gw.Type || '-'
    const weight = escapeHtml(String(gw.Weight || '-'))
    const gatewayFailoverTimeout = gw.GatewayFailoverTimeout ? `${gw.GatewayFailoverTimeout}s` : '-'
    const failOverRulesHTML = formatFailOverRules(gw.FailOverRules)
    
    // Type badge - Active/ON/Yes = green, otherwise gray (matching ReportView.jsx)
    const typeBadge = type === 'Active' || type === 'active' || type === 'ON' || type === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dcfce7; color: #15803d;">' + escapeHtml(type) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(type) + '</span>'

    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; min-width: 150px;">${name}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 100px;">${ipFamily}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace; min-width: 150px;">${ipAddress}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; min-width: 100px;">${typeBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 80px;">${weight}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; min-width: 120px;">${escapeHtml(gatewayFailoverTimeout)}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; vertical-align: top; min-width: 350px;">
            ${failOverRulesHTML}
        </td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">router</span>
        <span style="display: inline-flex; align-items: center;">Gateway Configurations</span>
        <span style="color: #6b7280; font-weight: normal;">(${allGateways.length} gateways from ${items.length} configuration${items.length !== 1 ? 's' : ''})</span>
      </h3>
      <div style="overflow-x: auto; border: 1px solid #d1d5db; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
        <table style="min-width: 1400px; width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb;">#</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 150px;">Name</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 100px;">IP Family</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 150px;">IP Address</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 100px;">Type</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 80px;">Weight</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 120px;">Gateway Failover Timeout</th>
              <th style="padding: 0.625rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; min-width: 350px;">Failover Rules</th>
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

function generateAuthenticationServerTable(items) {
  if (!items || items.length === 0) return ''
  
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

  if (allActiveDirectoryEntries.length === 0) return ''

  // Format SearchQueries
  const formatSearchQueries = (searchQueries) => {
    if (!searchQueries) return '-'
    if (typeof searchQueries === 'string') return escapeHtml(searchQueries)
    if (Array.isArray(searchQueries)) {
      return searchQueries.map(q => {
        if (typeof q === 'string') return escapeHtml(q)
        if (q && typeof q === 'object' && q.Query) {
          const queries = Array.isArray(q.Query) ? q.Query : [q.Query]
          return queries.map(query => escapeHtml(String(query))).join(' | ')
        }
        return escapeHtml(String(q))
      }).join(' | ')
    }
    if (typeof searchQueries === 'object' && searchQueries.Query) {
      if (Array.isArray(searchQueries.Query)) {
        return searchQueries.Query.map(q => escapeHtml(String(q))).join(' | ')
      }
      return escapeHtml(String(searchQueries.Query))
    }
    return '-'
  }

  let rows = ''
  allActiveDirectoryEntries.forEach((ad, idx) => {
    const serverName = escapeHtml(ad.ServerName || '-')
    const serverAddress = escapeHtml(ad.ServerAddress || '-')
    const port = escapeHtml(ad.Port || '-')
    const netBIOSDomain = escapeHtml(ad.NetBIOSDomain || '-')
    const domainName = escapeHtml(ad.DomainName || '-')
    const connectionSecurity = escapeHtml(ad.ConnectionSecurity || '-')
    const validCertReq = ad.ValidCertReq || 'Disable'
    const displayNameAttribute = escapeHtml(ad.DisplayNameAttribute || '-')
    const emailAttribute = escapeHtml(ad.EmailAddressAttribute || '-')
    const searchQueries = formatSearchQueries(ad.SearchQueries)
    
    const validCertBadge = validCertReq === 'Enable' || validCertReq === 'ON' || validCertReq === 'Yes'
      ? '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">' + escapeHtml(validCertReq) + '</span>'
      : '<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #4b5563;">' + escapeHtml(validCertReq) + '</span>'
    
    rows += `
      <tr class="sophos-table-row" style="transition: background-color 0.2s;">
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${serverName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #1f2937; font-family: monospace; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${serverAddress}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 80px;">${port}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${netBIOSDomain}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${domainName}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; max-width: 120px;">${connectionSecurity}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem;">${validCertBadge}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${displayNameAttribute}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; word-break: break-word; overflow-wrap: anywhere; max-width: 150px;">${emailAttribute}</td>
        <td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #374151; font-family: monospace; word-break: break-word; overflow-wrap: anywhere; max-width: 300px;">${searchQueries}</td>
      </tr>
    `
  })
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">fingerprint</span>
        <span>Authentication Servers (Active Directory)</span>
        <span style="color: #6b7280; font-weight: normal;">(${allActiveDirectoryEntries.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              <th class="sophos-table-header">Server Name</th>
              <th class="sophos-table-header">Server Address</th>
              <th class="sophos-table-header">Port</th>
              <th class="sophos-table-header">NetBIOS Domain</th>
              <th class="sophos-table-header">Domain Name</th>
              <th class="sophos-table-header">Connection Security</th>
              <th class="sophos-table-header">Valid Cert Req</th>
              <th class="sophos-table-header">Display Name Attribute</th>
              <th class="sophos-table-header">Email Attribute</th>
              <th class="sophos-table-header">Search Queries</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function formatArrayFieldHTML(field, separator = ', ') {
  if (!field) return '-'
  if (Array.isArray(field)) {
    return escapeHtml(field.filter(Boolean).join(separator) || '-')
  }
  if (typeof field === 'object' && field !== null) {
    const values = []
    Object.entries(field).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        values.push(...val.filter(Boolean).map(v => escapeHtml(String(v))))
      } else if (val) {
        values.push(escapeHtml(String(val)))
      }
    })
    return values.length > 0 ? values.join(separator) : '-'
  }
  return escapeHtml(String(field))
}

// Helper to format array/object fields with line breaks for HTML (one per line)
function formatArrayFieldLinesHTML(field) {
  if (!field) return '-'
  const values = []
  
  if (Array.isArray(field)) {
    values.push(...field.filter(Boolean).map(v => escapeHtml(String(v))))
  } else if (typeof field === 'object' && field !== null) {
    // Handle objects like { Network: ['a', 'b'] } or { Member: 'x' }
    Object.entries(field).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        values.push(...val.filter(Boolean).map(v => escapeHtml(String(v))))
      } else if (val && typeof val === 'object') {
        // Handle nested objects like { Network: { Network: ['a', 'b'] } }
        if (val.Network) {
          const networks = Array.isArray(val.Network) ? val.Network : [val.Network]
          values.push(...networks.filter(Boolean).map(v => escapeHtml(String(v))))
        } else if (val.Service) {
          const services = Array.isArray(val.Service) ? val.Service : [val.Service]
          values.push(...services.filter(Boolean).map(v => escapeHtml(String(v))))
        } else if (val.User) {
          const users = Array.isArray(val.User) ? val.User : [val.User]
          values.push(...users.filter(Boolean).map(v => escapeHtml(String(v))))
        } else {
          // Try to extract any array values
          Object.values(val).forEach(v => {
            if (Array.isArray(v)) {
              values.push(...v.filter(Boolean).map(item => escapeHtml(String(item))))
            } else if (v) {
              values.push(escapeHtml(String(v)))
            }
          })
        }
      } else if (val) {
        values.push(escapeHtml(String(val)))
      }
    })
  } else {
    return escapeHtml(String(field))
  }
  
  if (values.length === 0) return '-'
  
  // Return as HTML with line breaks and numbered badges
  return `<div style="display: flex; flex-direction: column; gap: 0.125rem;">${values.map((val, idx) => 
    `<span style="display: flex; align-items: center; gap: 0.375rem;">
      <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
        ${idx + 1}
      </span>
      <span style="display: block; flex: 1;">${val}</span>
    </span>`
  ).join('')}</div>`
}

// Helper to render status badge for HTML
function renderStatusBadgeHTML(status) {
  const statusStr = String(status || '').toLowerCase()
  const statusNum = typeof status === 'number' ? status : (statusStr === '1' ? 1 : statusStr === '0' ? 0 : null)
  const isActive = statusNum === 1 || statusStr === 'on' || statusStr === 'enable' || statusStr === 'enabled' || statusStr === 'active'
  const displayText = statusNum === 1 ? 'Enable' : statusNum === 0 ? 'Disable' : (status || 'N/A')
  const badgeStyle = isActive
    ? 'background-color: #dbeafe; color: #1e40af;'
    : 'background-color: #f3f4f6; color: #4b5563;'
  return `<span style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; ${badgeStyle}">${escapeHtml(displayText)}</span>`
}

// Generic configurable table generator for HTML
function generateConfigurableEntityTableHTML(items, title, icon, columns) {
  if (!items || items.length === 0) return ''
  
  let rows = ''
  items.forEach((it, idx) => {
    const fields = it.fields || {}
    rows += '<tr class="sophos-table-row" style="transition: background-color 0.2s;">'
    rows += `<td class="sophos-table-cell" style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500; white-space: nowrap;">${idx + 1}</td>`
    
    columns.forEach((col) => {
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
      // Check if value is already HTML (string starting with <)
      const isHTML = typeof value === 'string' && value.trim().startsWith('<')
      const cellContent = col.render 
        ? col.render(value, fields, it) 
        : (isHTML ? value : escapeHtml(String(value)))
      // For cells with small maxWidth or status badges, prevent wrapping
      const maxWidthValue = col.cellStyle?.maxWidth
      const maxWidthNum = maxWidthValue ? parseInt(String(maxWidthValue).replace('px', '')) : null
      const isShortCell = maxWidthNum !== null && maxWidthNum <= 150
      const isStatusCell = col.render === renderStatusBadgeHTML
      const cellStyle = {
        padding: '0.625rem 1rem',
        fontSize: '0.75rem',
        color: '#374151',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: (isShortCell || isStatusCell) ? 'nowrap' : 'normal',
        ...(col.cellStyle || {})
      }
      const styleStr = Object.entries(cellStyle).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
      rows += `<td class="sophos-table-cell" style="${styleStr}">${cellContent}</td>`
    })
    
    rows += '</tr>'
  })
  
  const headerCells = columns.map((col) => {
    // Use sophos-table-header class to match WebFilterException styling
    // Apply any additional header styles if specified
    const headerStyle = col.headerStyle || {}
    const styleStr = Object.keys(headerStyle).length > 0 
      ? Object.entries(headerStyle).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
      : ''
    return `<th class="sophos-table-header"${styleStr ? ` style="${styleStr}"` : ''}>${escapeHtml(col.header)}</th>`
  }).join('')
  
  return `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">${icon}</span>
        <span style="display: inline-flex; align-items: center;">${escapeHtml(title)}</span>
        <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${items.length})</span>
      </h3>
      <div class="sophos-table-wrapper">
        <table class="sophos-table">
          <thead>
            <tr>
              <th class="sophos-table-header sophos-col-checkbox">#</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Get table configuration for HTML generation
function getTableConfigHTML(tag) {
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
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem;">${targets.map((target, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(target)}</span>
            </span>`
          ).join('')}</div>`
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
        { header: 'Enable SLA', field: 'EnableSLA', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem;">${gateways.map((gw, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(gw)}</span>
            </span>`
          ).join('')}</div>`
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
        { header: 'Source Networks', field: 'SourceNetworks', getValue: (f) => formatArrayFieldLinesHTML(f.SourceNetworks), cellStyle: { maxWidth: '200px' } },
        { header: 'Destination Networks', field: 'DestinationNetworks', getValue: (f) => formatArrayFieldLinesHTML(f.DestinationNetworks), cellStyle: { maxWidth: '200px' } },
        { header: 'Services', field: 'Services', getValue: (f) => formatArrayFieldLinesHTML(f.Services), cellStyle: { maxWidth: '150px' } },
        { header: 'Users', field: 'Users', getValue: (f) => formatArrayFieldLinesHTML(f.Users), cellStyle: { maxWidth: '150px' } },
        { header: 'Healthcheck', field: 'Healthcheck', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } }
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
        { header: 'Enabled', field: 'Enabled', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
        { header: 'Active', field: 'active', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
            // Fallback to formatArrayFieldLinesHTML
            return formatArrayFieldLinesHTML(f.RBLList)
          }
          if (rblValues.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem;">${rblValues.map((val, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(String(val))}</span>
            </span>`
          ).join('')}</div>`
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
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem;">${hosts.map((host, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(String(host))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '300px' } }
      ]
    },
    DNSHostEntry: {
      title: 'DNS Host Entries',
      icon: 'dns',
      columns: [
        { header: 'Hostname', field: 'HostName', getValue: (f) => f.HostName || f.Hostname || f.Name || '-' },
        { header: 'IP Addresses', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const addresses = []
          
          // Handle AddressList.Address structure
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            // Check if AddressList has Address property
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object') {
                  const ip = addr.IPAddress || addr.IPv4Address || addr.IPv6Address || ''
                  if (ip) {
                    addresses.push(ip)
                  }
                }
              })
            } else if (Array.isArray(addressList)) {
              // AddressList might be an array directly
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object') {
                  const ip = addr.IPAddress || addr.IPv4Address || addr.IPv6Address || ''
                  if (ip) {
                    addresses.push(ip)
                  }
                }
              })
            }
          }
          
          if (addresses.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem;">${addresses.map((addr, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1; font-family: monospace;">${escapeHtml(String(addr))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '300px' } },
        { header: 'Entry Type', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const entryTypes = []
          
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.EntryType) {
                  entryTypes.push(addr.EntryType)
                }
              })
            } else if (Array.isArray(addressList)) {
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.EntryType) {
                  entryTypes.push(addr.EntryType)
                }
              })
            }
          }
          
          if (entryTypes.length === 0) return '-'
          return entryTypes.join(', ')
        } },
        { header: 'IP Family', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const ipFamilies = []
          
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.IPFamily) {
                  ipFamilies.push(addr.IPFamily)
                }
              })
            } else if (Array.isArray(addressList)) {
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.IPFamily) {
                  ipFamilies.push(addr.IPFamily)
                }
              })
            }
          }
          
          if (ipFamilies.length === 0) return '-'
          return Array.from(new Set(ipFamilies)).join(', ')
        } },
        { header: 'TTL', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const ttls = []
          
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.TTL) {
                  ttls.push(addr.TTL)
                }
              })
            } else if (Array.isArray(addressList)) {
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.TTL) {
                  ttls.push(addr.TTL)
                }
              })
            }
          }
          
          if (ttls.length === 0) return '-'
          return ttls.join(', ')
        } },
        { header: 'Weight', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const weights = []
          
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.Weight) {
                  weights.push(addr.Weight)
                }
              })
            } else if (Array.isArray(addressList)) {
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.Weight) {
                  weights.push(addr.Weight)
                }
              })
            }
          }
          
          if (weights.length === 0) return '-'
          return weights.join(', ')
        } },
        { header: 'Publish On WAN', field: 'AddressList', getValue: (f) => {
          if (!f || !f.AddressList) return '-'
          const publishFlags = []
          
          let addressList = f.AddressList
          if (addressList && typeof addressList === 'object') {
            if (addressList.Address) {
              const addressArray = Array.isArray(addressList.Address) 
                ? addressList.Address 
                : [addressList.Address]
              
              addressArray.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.PublishOnWAN) {
                  publishFlags.push(addr.PublishOnWAN)
                }
              })
            } else if (Array.isArray(addressList)) {
              addressList.forEach(addr => {
                if (addr && typeof addr === 'object' && addr.PublishOnWAN) {
                  publishFlags.push(addr.PublishOnWAN)
                }
              })
            }
          }
          
          if (publishFlags.length === 0) return '-'
          return publishFlags.join(', ')
        } },
        { header: 'Add Reverse DNS Lookup', field: 'AddReverseDNSLookUp', getValue: (f) => f.AddReverseDNSLookUp || '-', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '150px' } }
      ]
    },
    SiteToSiteServer: {
      title: 'Site-to-Site Servers',
      icon: 'vpn_key',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Static IP', field: 'StaticIP' },
        { header: 'Local Networks', field: 'LocalNetworks', getValue: (f) => formatArrayFieldLinesHTML(f.LocalNetworks), cellStyle: { maxWidth: '200px' } },
        { header: 'Remote Networks', field: 'RemoteNetworks', getValue: (f) => formatArrayFieldLinesHTML(f.RemoteNetworks), cellStyle: { maxWidth: '200px' } },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
          return formatArrayFieldLinesHTML(extensions)
        }, cellStyle: { maxWidth: '200px' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    WirelessAccessPoint: {
      title: 'Wireless Access Points',
      icon: 'wifi',
      columns: [
        { header: 'ID', field: 'ID', getValue: (f) => (f && (f.ID || f.Label || f.Name)) || '-' },
        { header: 'Label', field: 'Label', getValue: (f) => (f && (f.Label || f.ID)) || '-' },
        { header: 'AP Type', field: 'APType', getValue: (f) => (f && f.APType) || '-' },
        { header: 'Country', field: 'Country', getValue: (f) => (f && f.Country) || '-' },
        { header: 'Interface', field: 'Interface', getValue: (f) => (f && f.Interface) || '-' },
        { header: 'Wireless Networks', field: 'WirelessNetworks', getValue: (f) => {
          if (!f || !f.WirelessNetworks) return '-'
          const networks = []
          if (typeof f.WirelessNetworks === 'object' && f.WirelessNetworks.Network) {
            const networkList = Array.isArray(f.WirelessNetworks.Network) 
              ? f.WirelessNetworks.Network 
              : [f.WirelessNetworks.Network]
            networks.push(...networkList.filter(Boolean).map(n => (typeof n === 'string' ? n : (n.Name || n.name || String(n)))))
          }
          return networks.length > 0 ? networks.join(', ') : '-'
        }, cellStyle: { maxWidth: '200px' } },
        { header: 'Channel 2.4GHz', field: 'Channel2.4GHz', getValue: (f) => (f && (f['Channel2.4GHz'] || f['channel2.4ghz'])) || '-' },
        { header: 'Channel 5GHz', field: 'Channel5GHz', getValue: (f) => (f && f.Channel5GHz) || '-' },
        { header: 'TX Power', field: 'TXPower', getValue: (f) => (f && f.TXPower) || '-' }
      ]
    },
    WirelessNetworks: {
      title: 'Wireless Networks',
      icon: 'wifi',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Hardware Name', field: 'HardwareName', getValue: (f) => f.HardwareName || '-' },
        { header: 'SSID', field: 'SSID', getValue: (f) => f.SSID || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
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
        { header: 'Interface Status', field: 'InterfaceStatus', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Client Isolation', field: 'ClientIsolation', getValue: (f) => f.ClientIsolation || '-' },
        { header: 'Hide SSID', field: 'HideSSID', getValue: (f) => f.HideSSID || '-' },
        { header: 'MAC Filtering', field: 'MACFiltering', getValue: (f) => f.MACFiltering || '-' },
        { header: 'Encryption', field: 'Encryption', getValue: (f) => f.Encryption || '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    DHCPRelay: {
      title: 'DHCP Relays',
      icon: 'router',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => (f && f.Name) || '-' },
        { header: 'Interface', field: 'Interface', getValue: (f) => (f && f.Interface) || '-' },
        { header: 'DHCP Server IP', field: 'DHCPServerIP', getValue: (f) => {
          if (!f || !f.DHCPServerIP) return '-'
          const servers = Array.isArray(f.DHCPServerIP) ? f.DHCPServerIP : [f.DHCPServerIP]
          return servers.filter(Boolean).join(', ') || '-'
        }, cellStyle: { maxWidth: '250px' } },
        { header: 'IP Family', field: 'IPFamily', getValue: (f) => (f && f.IPFamily) || '-' },
        { header: 'Relay through IPSec', field: 'RelaythroughIPSec', getValue: (f) => (f && f.RelaythroughIPSec) || '-' }
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
    SSLBookMark: {
      title: 'SSL Bookmarks',
      icon: 'bookmark',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'URL', field: 'URL', cellStyle: { maxWidth: '300px', fontFamily: 'monospace', fontSize: '0.7rem' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    WirelessNetwork: {
      title: 'Wireless Networks',
      icon: 'wifi',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'SSID', field: 'SSID', getValue: (f) => f.SSID || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Network Zone', field: 'NetworkZone', getValue: (f) => f.NetworkZone || '-' },
        { header: 'Security Mode', field: 'SecurityMode', getValue: (f) => f.SecurityMode || '-' },
        { header: 'Radio Band', field: 'RadioBand', getValue: (f) => f.RadioBand || '-' },
        { header: 'Channel', field: 'Channel', getValue: (f) => f.Channel || '-' },
        { header: 'IP Assignment', field: 'IPAssignment', getValue: (f) => f.IPAssignment || '-' },
        { header: 'IP Address', field: 'IPAddress', getValue: (f) => {
          if (!f || !f.IPAddress) return '-'
          const ip = f.IPAddress
          const netmask = f.Netmask
          if (netmask) {
            const cidr = netmaskToCIDR(netmask)
            return cidr ? `${ip}/${cidr}` : ip
          }
          return ip
        } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    REDDevice: {
      title: 'RED Devices',
      icon: 'devices',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || f.BranchName || f.Device || '-' },
        { header: 'Branch Name', field: 'BranchName', getValue: (f) => f.BranchName || '-' },
        { header: 'Device', field: 'Device', getValue: (f) => f.Device || '-' },
        { header: 'RED Device ID', field: 'REDDeviceID', getValue: (f) => f.REDDeviceID || '-', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem' } },
        { header: 'Tunnel ID', field: 'TunnelID', getValue: (f) => f.TunnelID || '-' },
        { header: 'RED MTU', field: 'REDMTU', getValue: (f) => f.REDMTU || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Authorized', field: 'Authorized', getValue: (f) => f.Authorized === '1' || f.Authorized === 1 ? 'Yes' : 'No' },
        { header: 'Deployment Mode', field: 'DeploymentMode', getValue: (f) => f.DeploymentMode || '-' },
        { header: 'UTM Host Name', field: 'UTMHostName', getValue: (f) => f.UTMHostName || '-', cellStyle: { fontFamily: 'monospace' } },
        { header: '2nd UTM Host Name', field: 'SecondUTMHostName', getValue: (f) => f.SecondUTMHostName || '-' },
        { header: 'Use 2nd IP For', field: 'Use2ndIPHostNameFor', getValue: (f) => f.Use2ndIPHostNameFor || '-' },
        { header: 'Network Zone', field: 'NetworkSetting', getValue: (f) => f.NetworkSetting?.Zone || '-' },
        { header: 'Network IP', field: 'NetworkSetting', getValue: (f) => {
          if (!f.NetworkSetting?.IPAddress) return '-'
          const ip = f.NetworkSetting.IPAddress
          const netmask = f.NetworkSetting.NetMask || f.NetworkSetting.Netmask
          if (netmask) {
            const cidr = netmaskToCIDR(netmask)
            return cidr ? `${ip}/${cidr}` : `${ip} (${netmask})`
          }
          return ip
        }, cellStyle: { fontFamily: 'monospace' } },
        { header: 'Tunnel Compression', field: 'NetworkSetting', getValue: (f) => f.NetworkSetting?.TunnelCompression || '-' },
        { header: 'Operation Mode', field: 'NetworkSetting', getValue: (f) => f.NetworkSetting?.OperationMode || '-' },
        { header: 'MAC Filter Type', field: 'NetworkSetting', getValue: (f) => f.NetworkSetting?.MACFilter?.FilterType || '-' },
        { header: 'Uplink Connection', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.Uplink?.Connection || '-' },
        { header: '2nd Uplink Mode', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.SecondUplinkMode || '-' },
        { header: '2nd Uplink Connection', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.SecondUplink?.Connection || '-' },
        { header: 'UMTS 3G Failover', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.UMTS3GFailover || '-' },
        { header: 'Failover Mobile Network', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.FailOverSettings?.MobileNetwork || '-' },
        { header: 'Failover APN', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.FailOverSettings?.APN || '-' },
        { header: 'Failover Dial String', field: 'UplinkSettings', getValue: (f) => f.UplinkSettings?.FailOverSettings?.DialString || '-', cellStyle: { fontFamily: 'monospace', fontSize: '0.7rem' } },
        { header: 'LAN Port Mode', field: 'SwitchSettings', getValue: (f) => f.SwitchSettings?.LANPortMode || '-' },
        { header: 'Remote IP Assignment', field: 'AdvancedSettings', getValue: (f) => f.AdvancedSettings?.RemoteIPAssignment || '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    RouterAdvertisement: {
      title: 'Router Advertisements',
      icon: 'router',
      columns: [
        { header: 'Interface', field: 'Interface', getValue: (f) => f.Interface || '-' },
        { header: 'Min Advertisement Interval', field: 'MinAdvertisementInterval', getValue: (f) => f.MinAdvertisementInterval || '-' },
        { header: 'Max Advertisement Interval', field: 'MaxAdvertisementInterval', getValue: (f) => f.MaxAdvertisementInterval || '-' },
        { header: 'Default Gateway', field: 'DefaultGateway', getValue: (f) => f.DefaultGateway || '-' },
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
        { header: 'Action', field: 'Action', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '120px' } },
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
    Application: {
      title: 'Applications',
      icon: 'apps',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' }
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
          if (!f.Phase1 || !f.Phase1.SupportedDHGroups) return '-'
          const dhGroups = f.Phase1.SupportedDHGroups.DHGroup
          if (!dhGroups) return '-'
          const groups = Array.isArray(dhGroups) ? dhGroups : [dhGroups]
          const filtered = groups.filter(Boolean)
          if (filtered.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 100px; overflow-y: auto;">${filtered.map(g => 
            `<span style="font-family: monospace;">${escapeHtml(String(g))}</span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '150px' } },
        { header: 'Phase 1 Key Life', field: 'Phase1KeyLife', getValue: (f) => f.Phase1 && f.Phase1.KeyLife ? `${f.Phase1.KeyLife}s` : '-' },
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
        { header: 'Phase 2 PFS', field: 'Phase2PFS', getValue: (f) => f.Phase2 && f.Phase2.PFSGroup ? f.Phase2.PFSGroup : '-' },
        { header: 'Phase 2 Key Life', field: 'Phase2KeyLife', getValue: (f) => f.Phase2 && f.Phase2.KeyLife ? `${f.Phase2.KeyLife}s` : '-' },
        { header: 'DPD', field: 'DPD', getValue: (f) => f.Phase1 && f.Phase1.DeadPeerDetection ? f.Phase1.DeadPeerDetection : '-' },
        { header: 'Re-Keying', field: 'AllowReKeying', getValue: (f) => f.AllowReKeying || '-' }
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; max-height: 150px; overflow-y: auto; font-size: 0.7rem;">${countries.map((country, idx) => {
            const countryValue = typeof country === 'string' ? country : (country.Country || country || '-')
            return `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(String(countryValue))}</span>
            </span>`
          }).join('')}</div>`
        }, cellStyle: { maxWidth: '300px' } }
      ]
    },
    WirelessNetworkStatus: {
      title: 'Wireless Network Status',
      icon: 'signal_wifi_4_bar',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } }
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 100px; overflow-y: auto;">${items.map(item => 
            `<span style="font-family: monospace;">${escapeHtml(item)}</span>`
          ).join('')}</div>`
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
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; max-height: 150px; overflow-y: auto; font-size: 0.7rem;">${sigList.map((sig, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 0.375rem; font-size: 0.625rem; font-weight: 600; font-family: monospace;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(sig)}</span>
            </span>`
          ).join('')}</div>`
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
          if (f.WebAccessibleResources && f.WebAccessibleResources.Bookmarks) {
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
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' }
      ]
    },
    GatewayHost: {
      title: 'Gateway Hosts',
      icon: 'router',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Gateway IP', field: 'GatewayIP', getValue: (f) => f.GatewayIP || '-', cellStyle: { fontFamily: 'monospace' } },
        { header: 'IP Family', field: 'IPFamily', getValue: (f) => f.IPFamily || '-' },
        { header: 'Interface', field: 'Interface', getValue: (f) => f.Interface || '-' },
        { header: 'Network Zone', field: 'NetworkZone', getValue: (f) => f.NetworkZone || '-' },
        { header: 'Healthcheck', field: 'Healthcheck', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Mail Notification', field: 'MailNotification', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Interval', field: 'Interval', getValue: (f) => f.Interval ? `${f.Interval}s` : '-' },
        { header: 'Failure Retries', field: 'FailureRetries', getValue: (f) => f.FailureRetries || '-' },
        { header: 'Timeout', field: 'Timeout', getValue: (f) => f.Timeout ? `${f.Timeout}s` : '-' },
        { header: 'Monitoring Conditions', field: 'MonitoringCondition', getValue: (f) => {
          if (!f || !f.MonitoringCondition) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
          
          const rules = []
          
          // Extract rules from different structures
          if (Array.isArray(f.MonitoringCondition)) {
            rules.push(...f.MonitoringCondition.filter(rule => typeof rule === 'object' && rule !== null))
          } else if (typeof f.MonitoringCondition === 'object' && f.MonitoringCondition.Rule) {
            const ruleArray = Array.isArray(f.MonitoringCondition.Rule) ? f.MonitoringCondition.Rule : [f.MonitoringCondition.Rule]
            rules.push(...ruleArray.filter(rule => typeof rule === 'object' && rule !== null))
          } else if (typeof f.MonitoringCondition === 'object') {
            rules.push(f.MonitoringCondition)
          }
          
          if (rules.length === 0) return '<span style="color: #9ca3af; font-style: italic;">-</span>'
          
          return `<div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 300px; max-height: 200px; overflow-y: auto;">${rules.map((rule, idx) => {
            const protocol = rule.Protocol ? escapeHtml(rule.Protocol) : null
            const port = rule.Port ? escapeHtml(rule.Port) : null
            const ipAddress = rule.IPAddress ? escapeHtml(rule.IPAddress) : null
            const condition = rule.Condition ? escapeHtml(rule.Condition) : null
            
            // Determine condition badge color
            let conditionBadge = ''
            if (condition) {
              const conditionLower = condition.toLowerCase()
              const isSuccess = conditionLower === 'success'
              const isFailure = conditionLower === 'failure'
              const bgColor = isSuccess ? '#d1fae5' : (isFailure ? '#fee2e2' : '#f3f4f6')
              const textColor = isSuccess ? '#15803d' : (isFailure ? '#b91c1c' : '#4b5563')
              conditionBadge = `<span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: ${bgColor}; color: ${textColor};">${condition}</span>`
            }
            
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; background-color: #f9fafb; min-width: 300px;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: monospace;">
                    ${idx + 1}
                  </span>
                  <span style="font-size: 0.75rem; font-weight: 600; color: #111827;">Rule ${idx + 1}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem;">
                  ${protocol ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="color: #6b7280; font-weight: 500;">Protocol:</span>
                      <span style="color: #111827;">${protocol}</span>
                    </div>
                  ` : ''}
                  ${port ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="color: #6b7280; font-weight: 500;">Port:</span>
                      <span style="color: #111827; font-family: monospace;">${port}</span>
                    </div>
                  ` : ''}
                  ${ipAddress ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="color: #6b7280; font-weight: 500;">IP:</span>
                      <span style="color: #111827; font-family: monospace;">${ipAddress}</span>
                    </div>
                  ` : ''}
                  ${condition ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="color: #6b7280; font-weight: 500;">Condition:</span>
                      ${conditionBadge}
                    </div>
                  ` : ''}
                </div>
              </div>
            `
          }).join('')}</div>`
        }, cellStyle: { maxWidth: '300px', fontSize: '0.7rem' } }
      ]
    },
    WebFilterCategory: {
      title: 'Web Filter Categories',
      icon: 'filter_list',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Classification', field: 'Classification', getValue: (f) => f.Classification || '-' },
        { header: 'Configure Category', field: 'ConfigureCategory', getValue: (f) => f.ConfigureCategory || '-' },
        { header: 'QoS Policy', field: 'QoSPolicy', getValue: (f) => f.QoSPolicy || '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-' },
        { header: 'Override Default Denied Message', field: 'OverrideDefaultDeniedMessage', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '150px' } },
        { header: 'Notification', field: 'Notification', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Domain List', field: 'DomainList', getValue: (f) => {
          if (!f || !f.DomainList) return '-'
          const domains = []
          
          // Handle different structures
          if (Array.isArray(f.DomainList)) {
            // DomainList is directly an array
            domains.push(...f.DomainList.filter(Boolean).map(d => typeof d === 'string' ? d : (d.Domain || d)))
          } else if (typeof f.DomainList === 'object') {
            // Handle DomainList.Domain structure
            if (f.DomainList.Domain) {
              const domainList = Array.isArray(f.DomainList.Domain) 
                ? f.DomainList.Domain 
                : [f.DomainList.Domain]
              domains.push(...domainList.filter(Boolean).map(d => typeof d === 'string' ? d : String(d)))
            } else {
              // Try to extract any array values from the object
              Object.values(f.DomainList).forEach(val => {
                if (Array.isArray(val)) {
                  domains.push(...val.filter(Boolean).map(d => typeof d === 'string' ? d : String(d)))
                } else if (val && typeof val === 'string') {
                  domains.push(val)
                }
              })
            }
          } else if (typeof f.DomainList === 'string') {
            domains.push(f.DomainList)
          }
          
          if (domains.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 200px; overflow-y: auto;">${domains.map((domain, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #EEEEEE; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1; font-family: monospace; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(domain))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '400px', fontSize: '0.7rem' } },
        { header: 'Keyword List', field: 'KeywordList', getValue: (f) => {
          if (!f || !f.KeywordList) return '-'
          const keywords = []
          
          // Handle different structures
          if (Array.isArray(f.KeywordList)) {
            // KeywordList is directly an array
            keywords.push(...f.KeywordList.filter(Boolean).map(k => typeof k === 'string' ? k : (k.Keyword || k)))
          } else if (typeof f.KeywordList === 'object') {
            // Handle KeywordList.Keyword structure
            if (f.KeywordList.Keyword) {
              const keywordList = Array.isArray(f.KeywordList.Keyword) 
                ? f.KeywordList.Keyword 
                : [f.KeywordList.Keyword]
              keywords.push(...keywordList.filter(Boolean).map(k => typeof k === 'string' ? k : String(k)))
            } else {
              // Try to extract any array values from the object
              Object.values(f.KeywordList).forEach(val => {
                if (Array.isArray(val)) {
                  keywords.push(...val.filter(Boolean).map(k => typeof k === 'string' ? k : String(k)))
                } else if (val && typeof val === 'string') {
                  keywords.push(val)
                }
              })
            }
          } else if (typeof f.KeywordList === 'string') {
            keywords.push(f.KeywordList)
          }
          
          if (keywords.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 200px; overflow-y: auto;">${keywords.map((keyword, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #EEEEEE; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(keyword))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '400px', fontSize: '0.7rem' } }
      ]
    },
    // FQDN Host table configuration
    FQDNHost: {
      title: 'FQDNHostList',
      icon: 'language',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-', cellStyle: { fontWeight: '500', color: '#111827' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } },
        { header: 'Values', field: 'FQDN', getValue: (f) => {
          if (!f) return '-'
          const values = []
          
          // Check for FQDN field (single or array)
          if (f.FQDN) {
            if (Array.isArray(f.FQDN)) {
              values.push(...f.FQDN.map(String))
            } else {
              values.push(String(f.FQDN))
            }
          }
          
          // Check for FQDNHostList which contains array of FQDN values
          if (f.FQDNHostList) {
            if (Array.isArray(f.FQDNHostList)) {
              f.FQDNHostList.forEach(item => {
                if (typeof item === 'string') values.push(item)
                else if (item && typeof item === 'object' && item.FQDN) {
                  if (Array.isArray(item.FQDN)) values.push(...item.FQDN.map(String))
                  else values.push(String(item.FQDN))
                }
              })
            } else if (f.FQDNHostList.FQDN) {
              if (Array.isArray(f.FQDNHostList.FQDN)) {
                values.push(...f.FQDNHostList.FQDN.map(String))
              } else {
                values.push(String(f.FQDNHostList.FQDN))
              }
            }
          }
          
          // Look for any other keys that may contain FQDN-like values (fallback)
          Object.entries(f).forEach(([k, v]) => {
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
          const uniqueValues = Array.from(new Set(values.filter(Boolean)))
          if (uniqueValues.length === 0) return '-'
          
          // Return comma-separated string to match ReportView.jsx
          return uniqueValues.join(', ')
        }, cellStyle: { maxWidth: '400px' } }
      ]
    },
    // Country table configuration
    Country: {
      title: 'Countries',
      icon: 'flag',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Country Code', field: 'CountryCode', getValue: (f) => f.CountryCode || f.Code || '-', cellStyle: { fontFamily: 'monospace', maxWidth: '120px' } },
        { header: 'Continent', field: 'Continent', getValue: (f) => f.Continent || '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    },
    // Intrusion Prevention table configuration
    IntrusionPrevention: {
      title: 'Intrusion Prevention',
      icon: 'security',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Policy', field: 'Policy', getValue: (f) => f.Policy || f.IPSPolicy || '-' },
        { header: 'Action', field: 'Action', getValue: (f) => f.Action || '-' },
        { header: 'Log', field: 'Log', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    },
    // Virus Scanning table configuration
    VirusScanning: {
      title: 'Virus Scanning',
      icon: 'scanner',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Scan Mode', field: 'ScanMode', getValue: (f) => f.ScanMode || f.Mode || '-' },
        { header: 'Action', field: 'Action', getValue: (f) => f.Action || '-' },
        { header: 'File Types', field: 'FileTypes', getValue: (f) => {
          if (!f.FileTypes) return '-'
          const types = Array.isArray(f.FileTypes) ? f.FileTypes : [f.FileTypes]
          return types.filter(Boolean).join(', ') || '-'
        }, cellStyle: { maxWidth: '200px' } },
        { header: 'Max File Size', field: 'MaxFileSize', getValue: (f) => f.MaxFileSize ? `${f.MaxFileSize} KB` : '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    },
    // Web Filter table configuration
    WebFilter: {
      title: 'Web Filters',
      icon: 'web',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Status', field: 'Status', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Policy', field: 'Policy', getValue: (f) => f.Policy || f.WebFilterPolicy || '-' },
        { header: 'Action', field: 'Action', getValue: (f) => f.Action || '-' },
        { header: 'Categories', field: 'Categories', getValue: (f) => {
          if (!f.Categories) return '-'
          const cats = Array.isArray(f.Categories) ? f.Categories : [f.Categories]
          if (cats.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 150px; overflow-y: auto;">${cats.filter(Boolean).map((cat, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(String(cat))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '250px' } },
        { header: 'Log', field: 'Log', render: renderStatusBadgeHTML, cellStyle: { maxWidth: '100px' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    },
    // Network table configuration
    Network: {
      title: 'Networks',
      icon: 'router',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'IP Address', field: 'IPAddress', getValue: (f) => f.IPAddress || f.Address || '-', cellStyle: { fontFamily: 'monospace' } },
        { header: 'Subnet/CIDR', field: 'Subnet', getValue: (f) => f.Subnet || f.Netmask || f.CIDR || '-', cellStyle: { fontFamily: 'monospace' } },
        { header: 'Gateway', field: 'Gateway', getValue: (f) => f.Gateway || '-', cellStyle: { fontFamily: 'monospace' } },
        { header: 'Zone', field: 'Zone', getValue: (f) => f.Zone || f.NetworkZone || '-' },
        { header: 'Interface', field: 'Interface', getValue: (f) => f.Interface || '-' },
        { header: 'VLAN ID', field: 'VLANID', getValue: (f) => f.VLANID || f.VlanID || '-' },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    },
    // Group table configuration (for Other Groups)
    Group: {
      title: 'Groups',
      icon: 'groups',
      columns: [
        { header: 'Name', field: 'Name', getValue: (f) => f.Name || '-' },
        { header: 'Type', field: 'Type', getValue: (f) => f.Type || f.GroupType || '-' },
        { header: 'Members', field: 'Members', getValue: (f) => {
          if (!f) return '-'
          // Try different member fields
          const membersList = f.Members || f.MemberList || f.HostList || f.IPHostList || f.FQDNHostList || f.ServiceList
          if (!membersList) return '-'
          
          let members = []
          if (Array.isArray(membersList)) {
            members = membersList.filter(Boolean).map(m => typeof m === 'string' ? m : (m.Name || m.Member || String(m)))
          } else if (typeof membersList === 'object') {
            // Try to extract member names from nested structure
            Object.values(membersList).forEach(val => {
              if (Array.isArray(val)) {
                members.push(...val.filter(Boolean).map(v => typeof v === 'string' ? v : (v.Name || v.Member || String(v))))
              } else if (typeof val === 'string') {
                members.push(val)
              }
            })
          }
          
          if (members.length === 0) return '-'
          return `<div style="display: flex; flex-direction: column; gap: 0.125rem; font-size: 0.7rem; max-height: 200px; overflow-y: auto;">${members.map((member, idx) => 
            `<span style="display: flex; align-items: center; gap: 0.375rem;">
              <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.25rem; padding: 0 0.375rem; background-color: #f3f4f6; color: #111827; border-radius: 9999px; font-size: 0.625rem; font-weight: 600; font-family: monospace; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <span style="display: block; flex: 1;">${escapeHtml(String(member))}</span>
            </span>`
          ).join('')}</div>`
        }, cellStyle: { maxWidth: '350px' } },
        { header: 'Description', field: 'Description', getValue: (f) => f.Description || '-', cellStyle: { maxWidth: '300px' } }
      ]
    }
  }

  return configs[tag] || null
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
        html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.375rem; border-radius: 9999px; background-color: ${statusColor === '#10b981' || statusColor === '#3b82f6' ? '#dbeafe' : '#f3f4f6'}; color: ${statusColor}; font-weight: 500;">${escapeHtml(interfaceEntity.fields.InterfaceStatus)}</span>`
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
            html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.25rem; border-radius: 4px; background-color: ${statusColor === '#10b981' || statusColor === '#3b82f6' ? '#dbeafe' : '#f3f4f6'}; color: ${statusColor};">${escapeHtml(vlan.fields.InterfaceStatus)}</span>`
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
            html += `<span style="font-size: 0.625rem; padding: 0.125rem 0.25rem; border-radius: 4px; background-color: ${statusColor === '#10b981' || statusColor === '#3b82f6' ? '#dbeafe' : '#f3f4f6'}; color: ${statusColor};">${escapeHtml(xfrm.fields.InterfaceStatus)}</span>`
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
function generateCollapsibleSection(sectionId, title, content, isExpanded = false, useBorder = false) {
  const borderStyle = useBorder ? 'border: 1px solid #e5e7eb;' : 'box-shadow: 0px 0px 6px 0px rgba(0, 0, 0, 0.1);'
  return `
    <div style="background-color: #ffffff; border-radius: 4px; ${borderStyle} margin-bottom: 1rem;">
      <button 
        onclick="toggleSection('${sectionId}')" 
        id="section-btn-${sectionId}"
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: none; border: none; border-bottom: 1px solid #e5e7eb; cursor: pointer; text-align: left;"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="font-weight: 600; font-size: 0.75rem; color: #111827; flex: 1; text-align: left; display: flex; align-items: center; gap: 0.5rem;">${title}</div>
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

// Helper function to truncate text
function truncateText(text, maxLen = 30) {
  if (!text) return 'Any'
  const str = String(text)
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen) + '...'
}

// Generate Firewall Rules Table HTML
function generateFirewallRulesTable(rules) {
  const tableHeader = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 40px;">#</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 140px;">Rule Name</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 70px;">Status</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 70px;">Action</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 100px;">Source</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 100px;">Destination</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 80px;">Services</th>
        </tr>
      </thead>
      <tbody>
  `
  
  const tableRows = rules.map((rule, index) => {
    const flat = flattenFirewallRule(rule)
    const ruleId = `fw-rule-${index}`
    const isEnabled = flat.status === 'Enable'
    
    const sourceSummary = flat.sourceZones || flat.sourceNetworks || 'Any'
    const destSummary = flat.destinationZones || flat.destinationNetworks || 'Any'
    const servicesSummary = flat.services || 'Any'
    
    const statusBadge = isEnabled
      ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ On</span>`
      : `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #6b7280;">✗ Off</span>`
    
    const actionBadge = flat.action === 'Accept'
      ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(flat.action || 'N/A')}</span>`
      : flat.action === 'Deny'
        ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">${escapeHtml(flat.action || 'N/A')}</span>`
        : `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #6b7280;">${escapeHtml(flat.action || 'N/A')}</span>`
    
    // Generate the expanded details HTML
    const detailsHtml = generateFirewallRule(rule, index, true)
    
    return `
      <tr onclick="toggleTableRule('${ruleId}')" style="border-bottom: 1px solid #e5e7eb; cursor: pointer;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'" id="row-${ruleId}">
        <td style="padding: 0.5rem; color: #6b7280;">
          <span style="display: flex; align-items: center; gap: 0.25rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="chevron-${ruleId}">
              <path d="M9 18l6-6-6-6" />
            </svg>
            ${index + 1}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          <div style="font-weight: 500; color: #111827;" title="${escapeHtml(flat.name || 'Unnamed Rule')}">${escapeHtml(truncateText(flat.name || 'Unnamed Rule', 35))}</div>
          ${flat.description ? `<div style="color: #6b7280; font-size: 0.625rem;" title="${escapeHtml(flat.description)}">${escapeHtml(truncateText(flat.description, 40))}</div>` : ''}
        </td>
        <td style="padding: 0.5rem;">${statusBadge}</td>
        <td style="padding: 0.5rem;">${actionBadge}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(sourceSummary)}">${escapeHtml(truncateText(sourceSummary, 25))}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(destSummary)}">${escapeHtml(truncateText(destSummary, 25))}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(servicesSummary)}">${escapeHtml(truncateText(servicesSummary, 20))}</td>
      </tr>
      <tr id="details-${ruleId}" style="display: none; background-color: #f9fafb;">
        <td colspan="7" style="padding: 0;">
          <div style="padding: 1rem; border-bottom: 2px solid #bfdbfe;">
            ${detailsHtml}
          </div>
        </td>
      </tr>
    `
  }).join('')
  
  const tableFooter = `
      </tbody>
    </table>
  `
  
  return `
    <div style="overflow-x: auto;">
      ${tableHeader}
      ${tableRows}
      ${tableFooter}
    </div>
  `
}

// Generate SSL/TLS Inspection Rules Table HTML
function generateSSLTLSInspectionRulesTable(rules) {
  const tableHeader = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 40px;">#</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 140px;">Rule Name</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 70px;">Status</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 100px;">Decrypt Action</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 100px;">Source</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 100px;">Destination</th>
        </tr>
      </thead>
      <tbody>
  `
  
  const tableRows = rules.map((rule, index) => {
    const flat = flattenSSLTLSInspectionRule(rule)
    const ruleId = `ssl-rule-${index}`
    const isEnabled = flat.enable === 'Yes'
    
    const sourceSummary = flat.sourceZones || flat.sourceNetworks || flat.identity || 'Any'
    const destSummary = flat.destinationZones || flat.destinationNetworks || flat.services || flat.websites || 'Any'
    
    const statusBadge = isEnabled
      ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ On</span>`
      : `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #6b7280;">✗ Off</span>`
    
    const decryptBadge = flat.decryptAction === 'Decrypt'
      ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">${escapeHtml(flat.decryptAction)}</span>`
      : flat.decryptAction === 'DoNotDecrypt'
        ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #ffedd5; color: #9a3412;">DoNotDecrypt</span>`
        : `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #6b7280;">${escapeHtml(flat.decryptAction || 'N/A')}</span>`
    
    // Generate the expanded details HTML
    const detailsHtml = generateSSLTLSInspectionRule(rule, index, true)
    
    return `
      <tr onclick="toggleTableRule('${ruleId}')" style="border-bottom: 1px solid #e5e7eb; cursor: pointer;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'" id="row-${ruleId}">
        <td style="padding: 0.5rem; color: #6b7280;">
          <span style="display: flex; align-items: center; gap: 0.25rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="chevron-${ruleId}">
              <path d="M9 18l6-6-6-6" />
            </svg>
            ${index + 1}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          <div style="font-weight: 500; color: #111827;" title="${escapeHtml(flat.name || 'Unnamed Rule')}">${escapeHtml(truncateText(flat.name || 'Unnamed Rule', 35))}</div>
          ${flat.description ? `<div style="color: #6b7280; font-size: 0.625rem;" title="${escapeHtml(flat.description)}">${escapeHtml(truncateText(flat.description, 40))}</div>` : ''}
        </td>
        <td style="padding: 0.5rem;">${statusBadge}</td>
        <td style="padding: 0.5rem;">${decryptBadge}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(sourceSummary)}">${escapeHtml(truncateText(sourceSummary, 25))}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(destSummary)}">${escapeHtml(truncateText(destSummary, 25))}</td>
      </tr>
      <tr id="details-${ruleId}" style="display: none; background-color: #f9fafb;">
        <td colspan="6" style="padding: 0;">
          <div style="padding: 1rem; border-bottom: 2px solid #bfdbfe;">
            ${detailsHtml}
          </div>
        </td>
      </tr>
    `
  }).join('')
  
  const tableFooter = `
      </tbody>
    </table>
  `
  
  return `
    <div style="overflow-x: auto;">
      ${tableHeader}
      ${tableRows}
      ${tableFooter}
    </div>
  `
}

// Generate NAT Rules Table HTML
function generateNATRulesTable(rules) {
  const tableHeader = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 40px;">#</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 130px;">Rule Name</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; width: 70px;">Status</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 90px;">Source</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 90px;">Destination</th>
          <th style="padding: 0.5rem; text-align: left; font-weight: 600; color: #374151; min-width: 90px;">Translation</th>
        </tr>
      </thead>
      <tbody>
  `
  
  const tableRows = rules.map((rule, index) => {
    const flat = flattenNATRule(rule)
    const ruleId = `nat-rule-${index}`
    const isEnabled = flat.status === 'Enable' || flat.status === 'Yes' || flat.status === 'ON'
    
    const sourceSummary = flat.sourceZones || flat.sourceNetworks || 'Any'
    const destSummary = flat.destinationZones || flat.destinationNetworks || 'Any'
    const translationSummary = flat.translatedSource || flat.translatedDestination || 'N/A'
    
    const statusBadge = isEnabled
      ? `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ On</span>`
      : `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 500; background-color: #f3f4f6; color: #6b7280;">✗ Off</span>`
    
    // Generate the expanded details HTML
    const detailsHtml = generateNATRule(rule, index, true)
    
    return `
      <tr onclick="toggleTableRule('${ruleId}')" style="border-bottom: 1px solid #e5e7eb; cursor: pointer;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'" id="row-${ruleId}">
        <td style="padding: 0.5rem; color: #6b7280;">
          <span style="display: flex; align-items: center; gap: 0.25rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="chevron-${ruleId}">
              <path d="M9 18l6-6-6-6" />
            </svg>
            ${index + 1}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          <div style="font-weight: 500; color: #111827;" title="${escapeHtml(flat.name || 'Unnamed NAT Rule')}">${escapeHtml(truncateText(flat.name || 'Unnamed NAT Rule', 30))}</div>
          ${flat.description ? `<div style="color: #6b7280; font-size: 0.625rem;" title="${escapeHtml(flat.description)}">${escapeHtml(truncateText(flat.description, 35))}</div>` : ''}
        </td>
        <td style="padding: 0.5rem;">${statusBadge}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(sourceSummary)}">${escapeHtml(truncateText(sourceSummary, 22))}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(destSummary)}">${escapeHtml(truncateText(destSummary, 22))}</td>
        <td style="padding: 0.5rem; color: #374151;" title="${escapeHtml(translationSummary)}">${escapeHtml(truncateText(translationSummary, 22))}</td>
      </tr>
      <tr id="details-${ruleId}" style="display: none; background-color: #f9fafb;">
        <td colspan="6" style="padding: 0;">
          <div style="padding: 1rem; border-bottom: 2px solid #bfdbfe;">
            ${detailsHtml}
          </div>
        </td>
      </tr>
    `
  }).join('')
  
  const tableFooter = `
      </tbody>
    </table>
  `
  
  return `
    <div style="overflow-x: auto;">
      ${tableHeader}
      ${tableRows}
      ${tableFooter}
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
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ Enabled</span>'
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
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
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
          <div style="margin-top: 1rem; padding: 0.75rem; background-color: #fefce8; border: 1px solid #fde047; border-radius: 0.375rem; overflow: hidden;">
            <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
              <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">block</span>
              Exclusions
            </h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.75rem; overflow-x: auto; max-width: 100%;">
              ${sourceZones.length > 0 ? `
                <div style="min-width: 0; overflow-wrap: break-word;">
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Source Zones:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">${escapeHtml(sourceZones.join(', '))}</p>
                </div>
              ` : ''}
              ${destZones.length > 0 ? `
                <div style="min-width: 0; overflow-wrap: break-word;">
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Destination Zones:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">${escapeHtml(destZones.join(', '))}</p>
                </div>
              ` : ''}
              ${sourceNetworks.length > 0 ? `
                <div style="min-width: 0; overflow-wrap: break-word;">
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Source Networks:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">${escapeHtml(sourceNetworks.join(', '))}</p>
                </div>
              ` : ''}
              ${destNetworks.length > 0 ? `
                <div style="min-width: 0; overflow-wrap: break-word;">
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Destination Networks:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">${escapeHtml(destNetworks.join(', '))}</p>
                </div>
              ` : ''}
              ${services.length > 0 ? `
                <div style="min-width: 0; overflow-wrap: break-word;">
                  <p style="font-weight: 500; color: #374151; margin-bottom: 0.125rem;">Services:</p>
                  <p style="color: #4b5563; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">${escapeHtml(services.join(', '))}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `
      })()}
    </div>
  `
  
  return `
    <div style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; max-width: 100%; box-sizing: border-box;">
      <button 
        onclick="toggleRule('${ruleId}')" 
        id="rule-btn-${ruleId}"
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.625rem; background: none; border: none; cursor: pointer; text-align: left; box-sizing: border-box;"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="rule-chevron-${ruleId}" style="flex-shrink: 0;">
            <path d="${isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'}" />
          </svg>
          <div style="flex: 1; min-width: 0;">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.125rem; word-break: break-word; overflow-wrap: anywhere;">
              Rule #${index + 1}: ${escapeHtml(flat.name || 'Unnamed Rule')}
            </h3>
            ${flat.description ? `<p style="font-size: 0.75rem; color: #4b5563; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(flat.description)}</p>` : ''}
          </div>
        </div>
        <div style="margin-left: 0.75rem; flex-shrink: 0;">
          ${statusBadge}
        </div>
      </button>
      <div id="rule-content-${ruleId}" style="display: ${isExpanded ? 'block' : 'none'}; overflow-x: auto; max-width: 100%; box-sizing: border-box;">
        ${ruleDetailsHtml}
      </div>
    </div>
  `
}

// Generate SSL/TLS Inspection Rule HTML
function generateSSLTLSInspectionRule(rule, index, isExpanded = false) {
  const flat = flattenSSLTLSInspectionRule(rule)
  const ruleId = `ssl-tls-${rule.transactionId || rule.id || index}`
  
  const statusBadge = flat.enable === 'Yes' 
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ Enabled</span>'
    : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">✗ Disabled</span>'

  // Decrypt action badge
  const decryptBadge = flat.decryptAction === 'Decrypt'
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #d1fae5; color: #065f46;">🔓 Decrypt</span>'
    : flat.decryptAction === 'DoNotDecrypt'
      ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #fee2e2; color: #991b1b;">🔒 Do Not Decrypt</span>'
      : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">⚙️ ' + escapeHtml(flat.decryptAction || 'N/A') + '</span>'

  // Helper function to render a field
  const renderField = (label, value, highlight = null) => {
    if (value === null || value === undefined || value === '') return ''
    const color = highlight === 'green' ? '#15803d' : '#111827'
    const fontWeight = highlight === 'green' ? '600' : 'normal'
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
  }

  // Always generate the full rule details HTML with grouped sections like NAT Rules
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
              ${renderField('Name', flat.name)}
              ${renderField('Description', flat.description || 'N/A')}
              ${renderField('Is Default', flat.isDefault || 'No')}
              ${flat.moveToName ? renderField('Move To', `${flat.moveToName} (${flat.moveToOrderBy})`) : ''}
            </tbody>
          </table>
        </div>

        <!-- Action & Logging -->
        <div>
          <h4 style="font-weight: 600; color: #111827; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #4b5563;">bolt</span>
            Action & Logging
          </h4>
          <table style="width: 100%; border-collapse: collapse; table-layout: auto;">
            <tbody>
              ${renderField('Enable', flat.enable || 'No')}
              ${renderField('Decrypt Action', flat.decryptAction || 'N/A', flat.decryptAction === 'Decrypt' ? 'green' : null)}
              ${renderField('Decryption Profile', flat.decryptionProfile || 'N/A')}
              ${renderField('Log Connections', flat.logConnections || 'Disable')}
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
              ${renderField('Source Zones', flat.sourceZones || 'Any')}
              ${renderField('Source Networks', flat.sourceNetworks || 'Any')}
              ${renderField('Identity', flat.identity || 'Any')}
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
              ${renderField('Destination Zones', flat.destinationZones || 'Any')}
              ${renderField('Destination Networks', flat.destinationNetworks || 'Any')}
              ${renderField('Services', flat.services || 'Any')}
              ${renderField('Websites/Categories', flat.websites || 'Any')}
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
              Rule #${index + 1}: ${escapeHtml(flat.name || 'Unnamed SSL/TLS Inspection Rule')}
            </h3>
            ${flat.description ? `<p style="font-size: 0.75rem; color: #4b5563;">${escapeHtml(flat.description)}</p>` : ''}
          </div>
        </div>
        <div style="margin-left: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          ${decryptBadge}
          ${statusBadge}
        </div>
      </button>
      <div id="rule-content-${ruleId}" style="display: ${isExpanded ? 'block' : 'none'};">
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
    ? '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af;">✓ Enabled</span>'
    : '<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #f3f4f6; color: #1f2937;">✗ Disabled</span>'

  // Helper function to render a field
  const renderField = (label, value, highlight = null) => {
    if (value === null || value === undefined || value === '') return ''
    const color = highlight === 'green' ? '#15803d' : '#111827'
    const fontWeight = highlight === 'green' ? '600' : 'normal'
    return `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="font-size: 0.75rem; font-weight: 500; color: #4b5563; min-width: 180px; max-width: 250px; white-space: nowrap; padding: 0.25rem 0.75rem 0.25rem 0;">${escapeHtml(label)}</td><td style="font-size: 0.75rem; color: ${color}; font-weight: ${fontWeight}; padding: 0.25rem 0; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(String(value))}</td></tr>`
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

// Helper function to fetch font and convert to base64
async function getFontAsBase64() {
  try {
    const fontPath = `${import.meta.env.BASE_URL || '/'}fonts/MaterialSymbolsOutlined.woff2`
    const response = await fetch(fontPath)
    if (!response.ok) {
      console.warn('Failed to load font file, using fallback')
      return null
    }
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1] // Remove data:font/woff2;base64, prefix
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Error loading font file:', error)
    return null
  }
}

// Main HTML generator function
export async function generateHTMLReport(data, sectionVisibility = {}) {
  if (!data) return ''
  
  // Fetch font as base64
  const fontBase64 = await getFontAsBase64()

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

  // Build sections HTML
  let sectionsHtml = ''

  // Host Objects Section - Individual sections (flat structure)
  if (sectionVisibility.ipHosts !== false && data.ipHosts && data.ipHosts.length > 0) {
    sectionsHtml += `<div id="ip-hosts" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ip-hosts', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">dns</span> <span style="display: inline-flex; align-items: center;">IP Hosts</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${data.ipHosts.length})</span>`, generateIPHostTable(data.ipHosts), false)}</div>`
  }
  if (sectionVisibility.fqdnHosts !== false && data.fqdnHosts && data.fqdnHosts.length > 0) {
    const fqdnHostConfig = getTableConfigHTML('FQDNHost')
    const fqdnHostTableHtml = fqdnHostConfig 
      ? generateConfigurableEntityTableHTML(data.fqdnHosts, fqdnHostConfig.title, fqdnHostConfig.icon, fqdnHostConfig.columns)
      : generateEntityTable('FQDN Hosts', 'language', data.fqdnHosts)
    sectionsHtml += `<div id="fqdn-hosts" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('fqdn-hosts', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">language</span> <span style="display: inline-flex; align-items: center;">FQDN Hosts</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${data.fqdnHosts.length})</span>`, fqdnHostTableHtml, false)}</div>`
  }
  if (sectionVisibility.macHosts !== false && data.macHosts && data.macHosts.length > 0) {
    sectionsHtml += `<div id="mac-hosts" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('mac-hosts', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">devices</span> <span style="display: inline-flex; align-items: center;">MAC Hosts</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${data.macHosts.length})</span>`, generateMACHostTable(data.macHosts), false)}</div>`
  }

  // Firewall Rules - Table View
  if (sectionVisibility.firewallRules !== false && data.firewallRules && data.firewallRules.length > 0) {
    const rulesTableHtml = generateFirewallRulesTable(data.firewallRules)
    sectionsHtml += `<div id="firewall-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('firewall-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">shield</span> Firewall Rules (${data.firewallRules.length})`, rulesTableHtml, false)}</div>`
  }

  // SSL/TLS Inspection Rules - Table View
  if (sectionVisibility.sslTlsInspectionRules !== false && data.sslTlsInspectionRules && data.sslTlsInspectionRules.length > 0) {
    const sslRulesTableHtml = generateSSLTLSInspectionRulesTable(data.sslTlsInspectionRules)
    sectionsHtml += `<div id="ssl-tls-inspection-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ssl-tls-inspection-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">lock</span> SSL/TLS Inspection Rules (${data.sslTlsInspectionRules.length})`, sslRulesTableHtml, false)}</div>`
  }

  // NAT Rules - Table View
  if (sectionVisibility.NATRule !== false && data.entitiesByTag?.NATRule && data.entitiesByTag.NATRule.length > 0) {
    const natRulesTableHtml = generateNATRulesTable(data.entitiesByTag.NATRule)
    sectionsHtml += `<div id="nat-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('nat-rules', `<span class="material-symbols-outlined" style="color: #4b5563;">swap_horiz</span> NAT Rules (${data.entitiesByTag.NATRule.length})`, natRulesTableHtml, false)}</div>`
  }

  // Groups Section
  if ((sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups?.length) || 
      (sectionVisibility.ipHostGroups !== false && data.ipHostGroups?.length) || 
      (sectionVisibility.serviceGroups !== false && data.serviceGroups?.length) ||
      (sectionVisibility.countryGroups !== false && data.entitiesByTag?.CountryGroup?.length) ||
      (sectionVisibility.groups !== false && data.groups?.length)) {
    let groupsHtml = ''
    if (sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups && data.fqdnHostGroups.length > 0) {
      groupsHtml += `<div id="fqdn-host-groups" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('fqdn-host-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> FQDN Host Groups (${data.fqdnHostGroups.length})`, generateFQDNGroupTable(data.fqdnHostGroups), false, true)}</div>`
    }
    if (sectionVisibility.ipHostGroups !== false && data.ipHostGroups && data.ipHostGroups.length > 0) {
      groupsHtml += `<div id="ip-host-groups" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ip-host-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> IP Host Groups (${data.ipHostGroups.length})`, generateIPHostGroupTable(data.ipHostGroups), false, true)}</div>`
    }
    if (sectionVisibility.serviceGroups !== false && data.serviceGroups && data.serviceGroups.length > 0) {
      groupsHtml += `<div id="service-groups" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('service-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> Service Groups (${data.serviceGroups.length})`, generateServiceGroupTable(data.serviceGroups), false, true)}</div>`
    }
    if (sectionVisibility.countryGroups !== false && data.entitiesByTag?.CountryGroup && data.entitiesByTag.CountryGroup.length > 0) {
      groupsHtml += `<div id="country-groups" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('country-groups', `<span class="material-symbols-outlined" style="color: #4b5563;">group_work</span> Country Groups (${data.entitiesByTag.CountryGroup.length})`, generateCountryGroupTable(data.entitiesByTag.CountryGroup), false, true)}</div>`
    }
    if (sectionVisibility.groups !== false && data.groups && data.groups.length > 0) {
      const groupConfig = getTableConfigHTML('Group')
      const groupTableHtml = groupConfig 
        ? generateConfigurableEntityTableHTML(data.groups, 'Other Groups', groupConfig.icon, groupConfig.columns)
        : generateEntityTable('Other Groups', 'groups', data.groups)
      groupsHtml += `<div id="groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('groups', `<span class="material-symbols-outlined" style="color: #4b5563;">groups</span> Other Groups`, groupTableHtml, false)}</div>`
    }
    sectionsHtml += groupsHtml
  }

  // Services - use dedicated Services table generator to match ReportView.jsx format
  if (sectionVisibility.services !== false && data.services && data.services.length > 0) {
    sectionsHtml += `<div id="services-section" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('services-section', '<span class="material-symbols-outlined" style="color: #4b5563;">construction</span> Services', generateServicesTable(data.services), false)}</div>`
  }

  // Collect certificates separately to group them
  const certificateSections = []

  // Additional dynamic entities
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && sectionVisibility[tag] !== false) {
        // Check if this is a certificate type
        const isCertificate = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate'].includes(tag)
        
        if (!['IPHost', 'FQDNHost', 'MACHost', 'Service', 'Services', 'Group', 'FQDNHostGroup', 'IPHostGroup', 'ServiceGroup',
              'Country', 'WebFilterPolicy', 'Schedule', 'VLAN', 'Alias', 'Interface', 'LAG', 'WirelessNetwork', 'XFRMInterface',
              'Zone', 'Network', 'REDDevice', 'WirelessAccessPoint',
              'IPSPolicy', 'IntrusionPrevention', 'VirusScanning', 'WebFilter', 'NATRule', 'After', 'GroupDetail'].includes(tag)) {
          const icon = getEntityIcon(tag)
          let tableHtml = ''
          if (tag === 'VPNIPSecConnection') {
            tableHtml = generateVPNIPSecConnectionTable(items)
          } else if (tag === 'UniCastRoute' || tag === 'UnicastRoute') {
            tableHtml = generateUniCastRouteTable(items)
          } else if (tag === 'AuthenticationServer' || tag === 'Authentication') {
            tableHtml = generateAuthenticationServerTable(items)
          } else if (tag === 'WirelessAccessPoint') {
            tableHtml = generateWirelessAccessPointTable(items)
          } else if (tag === 'REDDevice') {
            tableHtml = generateREDDeviceTable(items)
          } else if (tag === 'DNSHostEntry') {
            tableHtml = generateDNSHostEntryTable(items)
          } else if (tag === 'GatewayHost') {
            tableHtml = generateGatewayHostTable(items)
          } else if (tag === 'RouterAdvertisement') {
            tableHtml = generateRouterAdvertisementTable(items)
          } else if (tag === 'SSLVPNPolicy') {
            tableHtml = generateSSLVPNPolicyTable(items)
          } else if (tag === 'WebFilterCategory') {
            tableHtml = generateWebFilterCategoryTable(items)
          } else if (tag === 'UserActivity') {
            tableHtml = generateUserActivityTable(items)
          } else if (tag === 'ClientlessUser') {
            tableHtml = generateClientlessUserTable(items)
          } else if (tag === 'MACHost') {
            tableHtml = generateMACHostTable(items)
          } else if (tag === 'IPHost') {
            tableHtml = generateIPHostTable(items)
          } else if (tag === 'AntiVirusHTTPScanningRule') {
            tableHtml = generateAntiVirusHTTPScanningRuleTable(items)
          } else if (tag === 'WebFilterException') {
            tableHtml = generateWebFilterExceptionTable(items)
          } else if (tag === 'AVASAddressGroup') {
            tableHtml = generateAVASAddressGroupTable(items)
          } else if (tag === 'GatewayConfiguration') {
            tableHtml = generateGatewayConfigurationTable(items)
          } else if (tag === 'IPSPolicy') {
            tableHtml = generateIPSPolicyTable(items)
          } else if (tag === 'WebFilterPolicy') {
            tableHtml = generateWebFilterPolicyTable(items)
          } else if (tag === 'ApplicationFilterCategory') {
            tableHtml = generateApplicationFilterCategoryTable(items)
          } else if (tag === 'ApplicationFilterPolicy') {
            tableHtml = generateApplicationFilterPolicyTable(items)
          } else if (tag === 'FileType') {
            tableHtml = generateFileTypeTable(items)
          } else if (tag === 'UserGroup') {
            tableHtml = generateUserGroupTable(items)
          } else if (tag === 'ApplicationClassificationBatchAssignment') {
            tableHtml = generateApplicationClassificationBatchAssignmentTable(items)
          } else if (tag === 'DHCP') {
            tableHtml = generateDHCPTable(items)
          } else if (tag === 'DHCPv6' || tag === 'DHCPV6') {
            tableHtml = generateDHCPv6Table(items)
          } else if (tag === 'AdministrationProfile') {
            tableHtml = generateAdministrationProfileTable(items)
          } else if (tag === 'AntiSpamRule' || tag === 'AntiSpamRules') {
            tableHtml = generateAntiSpamRuleTable(items)
          } else if (tag === 'WebFilterURLGroup') {
            tableHtml = generateWebFilterURLGroupTable(items)
          } else if (tag === 'SyslogServer' || tag === 'SyslogServers') {
            tableHtml = generateSyslogServerTable(items)
          } else if (tag === 'Messages') {
            tableHtml = generateMessagesTable(items)
          } else if (tag === 'AdminSettings' || tag === 'AdminSetting') {
            tableHtml = generateAdminSettingsTable(items)
          } else if (tag === 'BackupRestore') {
            tableHtml = generateBackupRestoreTable(items)
          } else if (tag === 'ContentConditionList') {
            tableHtml = generateContentConditionListTable(items)
          } else if (tag === 'MTADataControlList') {
            tableHtml = generateMTADataControlListTable(items)
          } else {
            // Check if this is a singleton entity (only one instance)
            // Use card view for entities that appear only once
            const isSingleton = items.length === 1
            
            if (isSingleton) {
              tableHtml = generateSingletonEntityCardHTML(items[0], icon, tag)
            } else {
              // Try exact match first, then case-insensitive match
              let tableConfig = getTableConfigHTML(tag)
              if (!tableConfig) {
                const tagLower = tag.toLowerCase()
                const configKeys = ['HealthCheckProfile', 'SDWANProfile', 'SDWANPolicyRoute', 'DHCPServer', 'DHCPBinding', 
                                  'VPNConfiguration', 'ThirdPartyFeed', 'RealServers', 'ProtocolSecurity', 
                                  'ReverseAuthentication', 'OTPTokens', 'POPIMAPScanningPolicy', 'MTAAddressGroup', 'SMTPPolicy',
                                  'DNSRequestRoute', 'SiteToSiteServer', 'VoucherDefinition', 'WebFilterPolicy', 
                                  'CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate', 'FileType', 
                                  'WirelessAccessPoint', 'WirelessNetwork', 'REDDevice', 'RouterAdvertisement',
                                  'DHCPRelay', 'AccessTimePolicy', 'DataTransferPolicy', 
                                  'SurfingQuotaPolicy', 'QoSPolicy', 'SSLBookMark', 'SystemModules',
                                  'AntiVirusHTTPSScanningExceptions', 'Application', 'VPNProfile', 'CountryGroup',
                                  'WirelessNetworkStatus', 'DecryptionProfile', 'AnitSpamTrustedDomain', 
                                  'ContentConditionList', 'MTADataControlList', 'ClientlessPolicy', 'SMSGateway',
                                  'FQDNHost', 'Country', 'IntrusionPrevention', 'VirusScanning', 'WebFilter', 'Network', 'Group']
                const matchedKey = configKeys.find(key => key.toLowerCase() === tagLower)
                if (matchedKey) {
                  tableConfig = getTableConfigHTML(matchedKey)
                }
              }
              
              if (tableConfig) {
                tableHtml = generateConfigurableEntityTableHTML(items, tableConfig.title, tableConfig.icon, tableConfig.columns)
              } else {
                tableHtml = generateEntityTable(tag, icon, items)
              }
            }
          }
          
          const sectionHtml = `<div id="additional-${tag}" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection(`additional-${tag}`, `<span class="material-symbols-outlined" style="color: #4b5563;">${icon}</span> ${escapeHtml(tag)} (${items.length})`, tableHtml, false)}</div>`
          
          if (isCertificate) {
            certificateSections.push(sectionHtml)
          } else {
            sectionsHtml += sectionHtml
          }
        }
      }
    })
  }
  
  // Group certificates together
  if (certificateSections.length > 0) {
    sectionsHtml += `<div id="certificates" style="margin-bottom: 1rem;">${certificateSections.join('')}</div>`
  }

  // Interfaces & Network
  if (sectionVisibility.portsWithVlans !== false && (
    (data.entitiesByTag?.Interface?.length > 0) || 
    (data.portsWithEntities && Object.keys(data.portsWithEntities).length > 0) ||
    (data.lagsWithMembers && Object.keys(data.lagsWithMembers).length > 0) ||
    (data.entitiesByTag?.WirelessNetwork?.length > 0)
  )) {
    const interfacesHtml = generateInterfacesSection(data)
    sectionsHtml += `<div id="ports-vlans-aliases" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ports-vlans-aliases', `<span class="material-symbols-outlined" style="color: #4b5563;">settings_ethernet</span> Interfaces & Network`, interfacesHtml, false)}</div>`
  }

  // Security Policies - Individual sections (flat structure)
  if (sectionVisibility.Country !== false && dynamicEntities.Country) {
    const countryConfig = getTableConfigHTML('Country')
    const countryTableHtml = countryConfig 
      ? generateConfigurableEntityTableHTML(data.entitiesByTag.Country || [], countryConfig.title, countryConfig.icon, countryConfig.columns)
      : generateEntityTable('Countries', 'flag', data.entitiesByTag.Country || [])
    sectionsHtml += `<div id="countries" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('countries', `<span class="material-symbols-outlined" style="color: #4b5563;">flag</span> Countries (${dynamicEntities.Country})`, countryTableHtml, false)}</div>`
  }
  if (sectionVisibility.WebFilterPolicy !== false && dynamicEntities.WebFilterPolicy) {
    sectionsHtml += `<div id="webfilter-policies" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('webfilter-policies', `<span class="material-symbols-outlined" style="color: #4b5563;">filter_alt</span> Web Filter Policies (${dynamicEntities.WebFilterPolicy})`, generateWebFilterPolicyTable(data.entitiesByTag.WebFilterPolicy || []), false)}</div>`
  }
  if (sectionVisibility.Schedule !== false && dynamicEntities.Schedule) {
    sectionsHtml += `<div id="schedules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('schedules', `<span class="material-symbols-outlined" style="color: #4b5563;">schedule</span> Schedules (${dynamicEntities.Schedule})`, generateScheduleTable(data.entitiesByTag.Schedule || []), false)}</div>`
  }
  if (sectionVisibility.IPSPolicy !== false && dynamicEntities.IPSPolicy) {
    sectionsHtml += `<div id="ips-policies" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ips-policies', `<span class="material-symbols-outlined" style="color: #4b5563;">security</span> IPS Policies (${dynamicEntities.IPSPolicy})`, generateIPSPolicyTable(data.entitiesByTag.IPSPolicy || []), false)}</div>`
  }
  if (sectionVisibility.IntrusionPrevention !== false && dynamicEntities.IntrusionPrevention) {
    const ipsConfig = getTableConfigHTML('IntrusionPrevention')
    const ipsTableHtml = ipsConfig 
      ? generateConfigurableEntityTableHTML(data.entitiesByTag.IntrusionPrevention || [], ipsConfig.title, ipsConfig.icon, ipsConfig.columns)
      : generateEntityTable('Intrusion Prevention', 'security', data.entitiesByTag.IntrusionPrevention || [])
    sectionsHtml += `<div id="intrusion-prevention" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('intrusion-prevention', `<span class="material-symbols-outlined" style="color: #4b5563;">security</span> Intrusion Prevention (${dynamicEntities.IntrusionPrevention})`, ipsTableHtml, false)}</div>`
  }
  if (sectionVisibility.VirusScanning !== false && dynamicEntities.VirusScanning) {
    const virusConfig = getTableConfigHTML('VirusScanning')
    const virusTableHtml = virusConfig 
      ? generateConfigurableEntityTableHTML(data.entitiesByTag.VirusScanning || [], virusConfig.title, virusConfig.icon, virusConfig.columns)
      : generateEntityTable('Virus Scanning', 'scanner', data.entitiesByTag.VirusScanning || [])
    sectionsHtml += `<div id="virus-scanning" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('virus-scanning', `<span class="material-symbols-outlined" style="color: #4b5563;">scanner</span> Virus Scanning (${dynamicEntities.VirusScanning})`, virusTableHtml, false)}</div>`
  }
  if (sectionVisibility.WebFilter !== false && dynamicEntities.WebFilter) {
    const webFilterConfig = getTableConfigHTML('WebFilter')
    const webFilterTableHtml = webFilterConfig 
      ? generateConfigurableEntityTableHTML(data.entitiesByTag.WebFilter || [], webFilterConfig.title, webFilterConfig.icon, webFilterConfig.columns)
      : generateEntityTable('Web Filters', 'web', data.entitiesByTag.WebFilter || [])
    sectionsHtml += `<div id="web-filters" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('web-filters', `<span class="material-symbols-outlined" style="color: #4b5563;">web</span> Web Filters (${dynamicEntities.WebFilter})`, webFilterTableHtml, false)}</div>`
  }

  // Network Configuration - Individual sections (flattened like ReportView.jsx)
  if (sectionVisibility.Zone !== false && dynamicEntities.Zone) {
    sectionsHtml += `<div id="zones" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('zones', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">location_city</span> <span style="display: inline-flex; align-items: center;">Zones</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${dynamicEntities.Zone})</span>`, generateZoneTable(data.entitiesByTag.Zone || []), false)}</div>`
  }
  if (sectionVisibility.Network !== false && dynamicEntities.Network) {
    const networkConfig = getTableConfigHTML('Network')
    const networkTableHtml = networkConfig 
      ? generateConfigurableEntityTableHTML(data.entitiesByTag.Network || [], networkConfig.title, networkConfig.icon, networkConfig.columns)
      : generateEntityTable('Networks', 'router', data.entitiesByTag.Network || [])
    sectionsHtml += `<div id="networks" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('networks', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">router</span> <span style="display: inline-flex; align-items: center;">Networks</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${dynamicEntities.Network})</span>`, networkTableHtml, false)}</div>`
  }
  if (sectionVisibility.REDDevice !== false && dynamicEntities.REDDevice) {
    sectionsHtml += `<div id="red-devices" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('red-devices', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">devices</span> <span style="display: inline-flex; align-items: center;">RED Devices</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${dynamicEntities.REDDevice})</span>`, generateREDDeviceTable(data.entitiesByTag.REDDevice || []), false)}</div>`
  }
  if (sectionVisibility.WirelessAccessPoint !== false && dynamicEntities.WirelessAccessPoint) {
    sectionsHtml += `<div id="wireless-access-points" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('wireless-access-points', `<span class="material-symbols-outlined" style="color: #4b5563; display: inline-flex; align-items: center; vertical-align: middle;">wifi</span> <span style="display: inline-flex; align-items: center;">Wireless Access Points</span> <span style="color: #6b7280; font-weight: normal; display: inline-flex; align-items: center;">(${dynamicEntities.WirelessAccessPoint})</span>`, generateWirelessAccessPointTable(data.entitiesByTag.WirelessAccessPoint || []), false)}</div>`
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
  
  // === SECTION 3.6: SSL/TLS INSPECTION RULES ===
  if (data.sslTlsInspectionRules && data.sslTlsInspectionRules.length > 0) {
    allSections.push({ key: 'sslTlsInspectionRules', name: 'SSL/TLS Inspection Rules', icon: 'lock', count: data.sslTlsInspectionRules.length })
  }
  
  // === SECTION 4: GROUPS ===
  if (entityCounts.fqdnHostGroups > 0) allSections.push({ key: 'fqdnHostGroups', name: 'FQDN Host Groups', icon: 'group_work', count: entityCounts.fqdnHostGroups })
  if (entityCounts.ipHostGroups > 0) allSections.push({ key: 'ipHostGroups', name: 'IP Host Groups', icon: 'group_work', count: entityCounts.ipHostGroups })
  if (entityCounts.serviceGroups > 0) allSections.push({ key: 'serviceGroups', name: 'Service Groups', icon: 'group_work', count: entityCounts.serviceGroups })
  if (data.entitiesByTag?.CountryGroup?.length > 0) allSections.push({ key: 'countryGroups', name: 'Country Groups', icon: 'group_work', count: data.entitiesByTag.CountryGroup.length })
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
  
  // === SECTION 7: CERTIFICATES (Removed - certificate types are shown individually in Additional Entities) ===
  
  // === SECTION 8: NETWORK & SYSTEM CONFIGURATION ===
  if (dynamicEntities.Zone) allSections.push({ key: 'Zone', name: 'Zones', icon: 'location_city', count: dynamicEntities.Zone })
  if (dynamicEntities.Network) allSections.push({ key: 'Network', name: 'Networks', icon: 'router', count: dynamicEntities.Network })
  if (dynamicEntities.REDDevice) allSections.push({ key: 'REDDevice', name: 'RED Devices', icon: 'devices', count: dynamicEntities.REDDevice })
  if (dynamicEntities.WirelessAccessPoint) allSections.push({ key: 'WirelessAccessPoint', name: 'Wireless Access Points', icon: 'wifi', count: dynamicEntities.WirelessAccessPoint })
  
  // === SECTION 9: ADDITIONAL ENTITIES ===
  // First, check if we have any certificate types and add a certificates group section
  const certificateTypes = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate']
  let hasCertificates = false
  let totalCertificateCount = 0
  if (data.entitiesByTag) {
    certificateTypes.forEach(certType => {
      if (data.entitiesByTag[certType] && data.entitiesByTag[certType].length > 0) {
        hasCertificates = true
        totalCertificateCount += (dynamicEntities[certType] || data.entitiesByTag[certType].length)
      }
    })
  }
  if (hasCertificates) {
    allSections.push({ key: 'certificates', name: 'Certificates', icon: 'verified', count: totalCertificateCount })
  }
  
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && ![
        'IPHost','FQDNHost','MACHost','Service','Services','Group','FQDNHostGroup','IPHostGroup','ServiceGroup',
        'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork','XFRMInterface',
        'SelfSignedCertificate','CertificateAuthority','SelfSignedCertificateAuthority','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
        'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter','NATRule','After','GroupDetail'
      ].includes(tag)) {
        // Use dynamicEntities count (which has special handling for SSLVPNPolicy TunnelPolicy count)
        const count = dynamicEntities[tag] || items.length
        allSections.push({ key: tag, name: tag, icon: getEntityIcon(tag), count: count })
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
            const selfSignedAuthVisible = sectionVisibility.SelfSignedCertificateAuthority !== false
            const certVisible = sectionVisibility.Certificate !== false
            isVisible = certAuthVisible || selfSignedVisible || selfSignedAuthVisible || certVisible
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
  <style>
    /* Material Symbols Font embedded as base64 */
    @font-face {
      font-family: 'Material Symbols Outlined';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: ${fontBase64 ? `url('data:font/woff2;base64,${fontBase64}') format('woff2')` : `url('fonts/MaterialSymbolsOutlined.woff2') format('woff2')`};
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
    /* Table wrapper with horizontal scroll */
    .sophos-table-wrapper {
      overflow-x: auto !important;
      overflow-y: visible;
      max-width: 100%;
      box-sizing: border-box;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #fff;
      -webkit-overflow-scrolling: touch;
    }
    /* Base table styles */
    .sophos-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      border: 1px solid #e5e7eb;
      font-size: 0.75rem;
    }
    /* Table headers */
    .sophos-table-header {
      padding: 0.625rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: #111827;
      background-color: #f2f3f3;
      border-bottom: 2px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      white-space: nowrap;
      vertical-align: middle;
    }
    .sophos-table-header:last-child {
      border-right: none;
    }
    /* Table cells */
    .sophos-table-cell {
      padding: 0.625rem 1rem;
      font-size: 0.75rem;
      color: #111827;
      vertical-align: middle;
      word-break: break-word;
      overflow-wrap: anywhere;
      white-space: normal;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      line-height: 1.4;
    }
    .sophos-table-cell:last-child {
      border-right: none;
    }
    /* Table rows */
    .sophos-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
      transition: background-color 0.2s;
    }
    .sophos-table tbody tr:last-child {
      border-bottom: 1px solid #e5e7eb;
    }
    .sophos-table tbody tr:hover {
      background-color: #f7f9f9;
    }
    /* Checkbox column */
    .sophos-col-checkbox {
      width: 40px;
      text-align: center;
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
              <h1>Firewall configuration report</h1>
            </div>
          </div>
        </div>
        <div class="report-stats">
          <div class="stat-box">
            <div class="stat-label">Report Generated</div>
            <div class="stat-value">${formatDate(new Date())}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">XML API Version</div>
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
    let isPostDeselectMode = false
    
    // Helper function to map section keys to their section IDs for expansion
    function getSectionIdForExpansion(sectionKey) {
      const sectionIdMap = {
        'ipHosts': 'ip-hosts',
        'fqdnHosts': 'fqdn-hosts',
        'macHosts': 'mac-hosts',
        'portsWithVlans': 'ports-vlans-aliases',
        'firewallRules': 'firewall-rules',
        'NATRule': 'nat-rules',
        'sslTlsInspectionRules': 'ssl-tls-inspection-rules',
        'fqdnHostGroups': 'fqdn-host-groups',
        'ipHostGroups': 'ip-host-groups',
        'serviceGroups': 'service-groups',
        'countryGroups': 'country-groups',
        'groups': 'groups',
        'services': 'services-section',
        'WebFilterPolicy': 'webfilter-policies',
        'Schedule': 'schedules',
        'Country': 'countries',
        'IPSPolicy': 'ips-policies',
        'IntrusionPrevention': 'intrusion-prevention',
        'VirusScanning': 'virus-scanning',
        'WebFilter': 'web-filters',
        'Zone': 'zones',
        'Network': 'networks',
        'REDDevice': 'red-devices',
        'WirelessAccessPoint': 'wireless-access-points'
      }
      
      return sectionIdMap[sectionKey] || null
    }
    
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
    
    // Toggle table rule row expansion (for table-based rule views)
    function toggleTableRule(ruleId) {
      const detailsRow = document.getElementById('details-' + ruleId)
      const row = document.getElementById('row-' + ruleId)
      const chevron = document.getElementById('chevron-' + ruleId)
      
      if (!detailsRow) return
      
      const isExpanded = expandedRules[ruleId] === true
      expandedRules[ruleId] = !isExpanded
      detailsRow.style.display = expandedRules[ruleId] ? 'table-row' : 'none'
      
      // Update row background
      if (row) {
        row.style.backgroundColor = expandedRules[ruleId] ? '#eff6ff' : 'transparent'
      }
      
      // Update chevron direction
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
      'sslTlsInspectionRules': 'ssl-tls-inspection-rules',
      'fqdnHostGroups': 'fqdn-host-groups',
      'ipHostGroups': 'ip-host-groups',
      'serviceGroups': 'service-groups',
      'countryGroups': 'country-groups',
      'groups': 'groups',
      'services': 'services-section',
      'WebFilterPolicy': 'webfilter-policies',
      'Schedule': 'schedules',
      'Country': 'countries',
      'IPSPolicy': 'ips-policies',
      'IntrusionPrevention': 'intrusion-prevention',
      'VirusScanning': 'virus-scanning',
      'WebFilter': 'web-filters',
      'certificates': 'certificates',
      'CertificateAuthority': 'certificates',
      'SelfSignedCertificate': 'certificates',
      'Certificate': 'certificates',
      'Zone': 'zones',
      'Network': 'networks',
      'REDDevice': 'red-devices',
      'WirelessAccessPoint': 'wireless-access-points'
    }
    
    function toggleCertificatesGroup() {
      const checkbox = document.querySelector('input[data-section-key="certificates"]')
      if (!checkbox) return
      
      const isChecked = checkbox.checked
      const certSection = document.getElementById('certificates')
      if (certSection) {
        certSection.style.display = isChecked ? 'block' : 'none'
      }
      // Also toggle individual certificate sections
      const certTypes = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate']
      certTypes.forEach(certType => {
        const section = document.getElementById('additional-' + certType)
        if (section) {
          section.style.display = isChecked ? 'block' : 'none'
        }
      })
    }
    
    
    function toggleSectionVisibility(sectionKey) {
      const checkbox = document.querySelector('input[data-section-key="' + sectionKey + '"]')
      if (!checkbox) return
      
      const isChecked = checkbox.checked
      
      // Handle certificate types specially - they're grouped under "certificates"
      const certificateTypes = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate']
      if (certificateTypes.includes(sectionKey)) {
        const section = document.getElementById('additional-' + sectionKey)
        if (section) {
          section.style.display = isChecked ? 'block' : 'none'
        }
        // Update certificates group checkbox state based on any certificate being visible
        updateCertificatesGroupCheckbox()
        // Make sure certificates container is visible if any certificate is visible
        const certSection = document.getElementById('certificates')
        if (certSection) {
          const anyCertVisible = certificateTypes.some(certType => {
            const certCheckbox = document.querySelector('input[data-section-key="' + certType + '"]')
            return certCheckbox && certCheckbox.checked
          })
          // If no individual checkboxes exist, check the certificates group checkbox
          const certGroupCheckbox = document.querySelector('input[data-section-key="certificates"]')
          if (certGroupCheckbox) {
            certSection.style.display = certGroupCheckbox.checked ? 'block' : 'none'
          } else if (anyCertVisible) {
            certSection.style.display = 'block'
          }
        }
        // Certificates don't have individual expansion, so skip auto-expand
        return
      }
      
      // Map section key to HTML ID
      const htmlId = sectionIdMap[sectionKey]
      if (htmlId) {
        const section = document.getElementById(htmlId)
        if (section) {
          // Check if section was previously hidden (to detect selection vs deselection)
          const wasHidden = section.style.display === 'none' || section.style.display === ''
          section.style.display = isChecked ? 'block' : 'none'
          
          // Auto-expand if in post-deselect mode and section is being selected (was hidden, now visible)
          if (isPostDeselectMode && isChecked && wasHidden) {
            // Find the collapsible section within this section
            const collapsibleButton = section.querySelector('[id^="section-btn-"]')
            if (collapsibleButton) {
              const sectionId = collapsibleButton.id.replace('section-btn-', '')
              if (!expandedSections[sectionId]) {
                toggleSection(sectionId)
              }
            }
          }
        }
      } else {
        // For additional entities, use the key directly
        const section = document.getElementById('additional-' + sectionKey)
        if (section) {
          // Check if section was previously hidden (to detect selection vs deselection)
          const wasHidden = section.style.display === 'none' || section.style.display === ''
          section.style.display = isChecked ? 'block' : 'none'
          
          // Auto-expand if in post-deselect mode and section is being selected (was hidden, now visible)
          if (isPostDeselectMode && isChecked && wasHidden) {
            // Find the collapsible section within this section
            const collapsibleButton = section.querySelector('[id^="section-btn-"]')
            if (collapsibleButton) {
              const sectionId = collapsibleButton.id.replace('section-btn-', '')
              if (!expandedSections[sectionId]) {
                toggleSection(sectionId)
              }
            }
          }
        }
      }
    }
    
    function updateCertificatesGroupCheckbox() {
      const certificateTypes = ['CertificateAuthority', 'SelfSignedCertificate', 'SelfSignedCertificateAuthority', 'Certificate']
      const certGroupCheckbox = document.querySelector('input[data-section-key="certificates"]')
      if (!certGroupCheckbox) return
      
      // Check if any certificate type has a visible checkbox (individual certificate sections don't have checkboxes in sidebar)
      // The certificates group checkbox state is independent
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
      // Clear post-deselect mode when selecting all
      isPostDeselectMode = false
      
      document.querySelectorAll('input[type="checkbox"][data-section-key]').forEach(cb => {
        cb.checked = true
        const sectionKey = cb.getAttribute('data-section-key')
        if (sectionKey === 'certificates') {
          toggleCertificatesGroup()
        } else {
          toggleSectionVisibility(sectionKey)
        }
      })
    }
    
    function deselectAllSections() {
      // Set post-deselect mode when deselecting all
      isPostDeselectMode = true
      
      // Get all checkboxes and uncheck them
      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-section-key]')
      checkboxes.forEach(cb => {
        cb.checked = false
        const sectionKey = cb.getAttribute('data-section-key')
        // Handle certificates group specially
        if (sectionKey === 'certificates') {
          toggleCertificatesGroup()
        } else {
          toggleSectionVisibility(sectionKey)
        }
      })
    }
    
    // Initialize all sections as collapsed
    document.querySelectorAll('[id^="section-content-"]').forEach(el => {
      const sectionId = el.id.replace('section-content-', '')
      expandedSections[sectionId] = false
    })
    
    // Initialize section visibility based on checkboxes
    // First, handle certificates group
    const certGroupCheckbox = document.querySelector('input[data-section-key="certificates"]')
    if (certGroupCheckbox) {
      toggleCertificatesGroup()
    }
    
    // Then handle all other sections
    document.querySelectorAll('input[type="checkbox"][data-section-key]').forEach(cb => {
      const sectionKey = cb.getAttribute('data-section-key')
      if (sectionKey !== 'certificates') {
        toggleSectionVisibility(sectionKey)
      }
    })
  </script>
  <script>
    // Search functionality
    let searchMatches = []
    let currentMatchIndex = -1
    
    function escapeRegex(str) {
      if (typeof str !== 'string') return ''
      var specialCharsPattern = '[.*+?^$' + '{' + '}' + '()|[\\\\]\\\\]'
      var specialChars = new RegExp(specialCharsPattern, 'g')
      return str.replace(specialChars, function(match) { return '\\\\' + match })
    }
    
    function buildSearchRegex(query, options) {
      const { caseSensitive = false, useRegex = false, wholeWord = false } = options
      
      if (!query || query.trim() === '') {
        return { regex: null, error: null }
      }
      
      let pattern = query
      
      if (!useRegex) {
        pattern = escapeRegex(pattern)
      } else {
        try {
          new RegExp(pattern)
        } catch (e) {
          return { regex: null, error: e.message }
        }
      }
      
      if (wholeWord && !useRegex) {
        pattern = '\\\\b' + pattern + '\\\\b'
      } else if (wholeWord && useRegex) {
        if (!pattern.includes('\\\\b') && !pattern.startsWith('^') && !pattern.endsWith('$')) {
          pattern = '\\\\b(?:' + pattern + ')\\\\b'
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
    
    function performHTMLSearch() {
      const input = document.getElementById('global-search-input')
      const clearBtn = document.getElementById('search-clear-btn')
      const navContainer = document.getElementById('search-navigation')
      const errorSpan = document.getElementById('search-error')
      const statusSpan = document.getElementById('search-status')
      const matchCountSpan = document.getElementById('search-match-count')
      
      if (!input) return
      
      const query = input.value.trim()
      
      // Clear button visibility
      if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none'
      }
      
      // Clear previous highlights
      clearHighlights()
      
      if (!query) {
        searchMatches = []
        currentMatchIndex = -1
        if (navContainer) navContainer.style.display = 'none'
        if (errorSpan) {
          errorSpan.style.display = 'none'
          errorSpan.textContent = ''
        }
        if (statusSpan) {
          statusSpan.style.display = 'none'
          statusSpan.textContent = ''
        }
        return
      }
      
      const options = {
        caseSensitive: document.getElementById('search-case-sensitive')?.checked || false,
        useRegex: document.getElementById('search-use-regex')?.checked || false,
        wholeWord: document.getElementById('search-whole-word')?.checked || false
      }
      
      const { regex, error } = buildSearchRegex(query, options)
      
      if (error) {
        if (errorSpan) {
          errorSpan.style.display = 'inline'
          errorSpan.textContent = 'Error: ' + error
        }
        if (statusSpan) statusSpan.style.display = 'none'
        if (navContainer) navContainer.style.display = 'none'
        searchMatches = []
        currentMatchIndex = -1
        return
      }
      
      if (errorSpan) {
        errorSpan.style.display = 'none'
        errorSpan.textContent = ''
      }
      
      if (!regex) {
        searchMatches = []
        currentMatchIndex = -1
        if (navContainer) navContainer.style.display = 'none'
        if (statusSpan) {
          statusSpan.style.display = 'none'
          statusSpan.textContent = ''
        }
        return
      }
      
      // Find all text nodes and highlight matches
      const container = document.querySelector('[data-searchable-container]')
      if (!container) return
      
      searchMatches = []
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            let parent = node.parentElement
            while (parent) {
              if (parent.tagName === 'SCRIPT' || 
                  parent.tagName === 'STYLE' || 
                  parent.closest('.search-bar')) {
                return NodeFilter.FILTER_REJECT
              }
              if (parent === container) break
              parent = parent.parentElement
            }
            return NodeFilter.FILTER_ACCEPT
          }
        }
      )
      
      let node
      let nodeIndex = 0
      while (node = walker.nextNode()) {
        const text = node.textContent
        if (!text || !text.trim()) continue
        
        regex.lastIndex = 0
        const matches = []
        let match
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            index: match.index,
            text: match[0],
            length: match[0].length
          })
          
          if (match.index === regex.lastIndex) {
            regex.lastIndex++
          }
        }
        
        if (matches.length > 0) {
          highlightTextNode(node, matches, nodeIndex, searchMatches)
          nodeIndex++
        }
      }
      
      currentMatchIndex = searchMatches.length > 0 ? 0 : -1
      
      // Update UI
      if (matchCountSpan && searchMatches.length > 0) {
        matchCountSpan.textContent = (currentMatchIndex + 1) + ' / ' + searchMatches.length
      }
      
      if (navContainer) {
        navContainer.style.display = searchMatches.length > 0 ? 'flex' : 'none'
      }
      
      if (statusSpan) {
        if (searchMatches.length === 0) {
          statusSpan.style.display = 'inline'
          statusSpan.textContent = 'No matches found'
        } else {
          statusSpan.style.display = 'inline'
          statusSpan.textContent = searchMatches.length + ' ' + (searchMatches.length === 1 ? 'match' : 'matches') + ' found'
        }
      }
      
      // Auto-expand sections with matches
      if (searchMatches.length > 0) {
        expandSectionsWithMatchesHTML(searchMatches)
        // Scroll to first match
        setTimeout(() => {
          if (searchMatches[0] && searchMatches[0].element) {
            searchMatches[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 200)
      }
    }
    
    function highlightTextNode(textNode, matches, nodeIndex, matchesArray) {
      if (!textNode || matches.length === 0) return
      
      const text = textNode.textContent
      if (!text) return
      
      const parent = textNode.parentNode
      if (!parent) return
      
      const fragment = document.createDocumentFragment()
      let lastIndex = 0
      
      matches.forEach((match, idx) => {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)))
        }
        
        const mark = document.createElement('mark')
        mark.className = 'search-highlight'
        const matchId = 'match-' + nodeIndex + '-' + match.index + '-' + idx
        mark.setAttribute('data-match-id', matchId)
        mark.textContent = match.text
        fragment.appendChild(mark)
        
        matchesArray.push({
          element: mark,
          elementIndex: nodeIndex,
          matchIndex: match.index,
          text: match.text,
          id: matchId
        })
        
        lastIndex = match.index + match.length
      })
      
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)))
      }
      
      parent.replaceChild(fragment, textNode)
    }
    
    function clearHighlights() {
      const container = document.querySelector('[data-searchable-container]')
      if (!container) return
      
      container.querySelectorAll('.search-highlight, .search-highlight-current').forEach(el => {
        const parent = el.parentNode
        if (parent) {
          const textNode = document.createTextNode(el.textContent)
          parent.replaceChild(textNode, el)
          parent.normalize()
        }
      })
    }
    
    function expandSectionsWithMatchesHTML(matches) {
      const sectionsToExpand = new Set()
      const rulesToExpand = new Set()
      
      matches.forEach(match => {
        let element = match.element
        while (element && element !== document.body) {
          if (element.id === 'firewall-rules') sectionsToExpand.add('firewall-rules')
          if (element.id === 'ip-hosts') sectionsToExpand.add('ip-hosts')
          if (element.id === 'fqdn-hosts') sectionsToExpand.add('fqdn-hosts')
          if (element.id === 'mac-hosts') sectionsToExpand.add('mac-hosts')
          if (element.id === 'ports-vlans-aliases') sectionsToExpand.add('ports-vlans-aliases')
          
          if (element.id && element.id.startsWith('additional-')) {
            const tag = element.id.replace('additional-', '')
            sectionsToExpand.add('additional-' + tag)
          }
          
          if (element.id && element.id.startsWith('rule-')) {
            rulesToExpand.add(element.id)
          }
          
          element = element.parentElement
        }
      })
      
      sectionsToExpand.forEach(sectionId => {
        if (expandedSections[sectionId] !== true) {
          toggleSection(sectionId)
        }
      })
      
      rulesToExpand.forEach(ruleId => {
        if (expandedRules[ruleId] !== true) {
          toggleRule(ruleId)
        }
      })
    }
    
    function navigateToMatch(direction) {
      if (searchMatches.length === 0) return
      
      if (direction === 'next') {
        currentMatchIndex = currentMatchIndex < searchMatches.length - 1 ? currentMatchIndex + 1 : 0
      } else {
        currentMatchIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : searchMatches.length - 1
      }
      
      const match = searchMatches[currentMatchIndex]
      if (!match || !match.element) return
      
      // Remove previous current highlight
      document.querySelectorAll('.search-highlight-current').forEach(el => {
        el.classList.remove('search-highlight-current')
        el.style.backgroundColor = '#FFEB3B'
        el.style.border = 'none'
        el.style.fontWeight = 'normal'
      })
      
      // Scroll to match
      match.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Add current highlight
      setTimeout(() => {
        const highlightElement = document.querySelector('[data-match-id="' + match.id + '"]')
        if (highlightElement) {
          highlightElement.classList.add('search-highlight-current')
          highlightElement.style.backgroundColor = '#FF9800'
          highlightElement.style.border = '2px solid #FF6F00'
          highlightElement.style.fontWeight = 'bold'
        }
        
        // Update match count
        const matchCountSpan = document.getElementById('search-match-count')
        if (matchCountSpan) {
          matchCountSpan.textContent = (currentMatchIndex + 1) + ' / ' + searchMatches.length
        }
      }, 100)
    }
    
    function clearHTMLSearch() {
      const input = document.getElementById('global-search-input')
      if (input) input.value = ''
      clearHighlights()
      searchMatches = []
      currentMatchIndex = -1
      
      const clearBtn = document.getElementById('search-clear-btn')
      const navContainer = document.getElementById('search-navigation')
      const errorSpan = document.getElementById('search-error')
      const statusSpan = document.getElementById('search-status')
      
      if (clearBtn) clearBtn.style.display = 'none'
      if (navContainer) navContainer.style.display = 'none'
      if (errorSpan) {
        errorSpan.style.display = 'none'
        errorSpan.textContent = ''
      }
      if (statusSpan) {
        statusSpan.style.display = 'none'
        statusSpan.textContent = ''
      }
    }
    
    function handleSearchKeyDown(event) {
      // Ctrl+F or Cmd+F: Already handled by browser
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        return
      }
      
      // Enter: Next match
      if (event.key === 'Enter' && !event.shiftKey && searchMatches.length > 0) {
        event.preventDefault()
        navigateToMatch('next')
        return
      }
      
      // Shift+Enter: Previous match
      if (event.key === 'Enter' && event.shiftKey && searchMatches.length > 0) {
        event.preventDefault()
        navigateToMatch('prev')
        return
      }
      
      // Escape: Clear search
      if (event.key === 'Escape') {
        const input = document.getElementById('global-search-input')
        if (input && input.value) {
          event.preventDefault()
          clearHTMLSearch()
          input.blur()
        }
      }
    }
    
    // Debounce search
    let searchDebounceTimer = null
    function debouncedHTMLSearch() {
      clearTimeout(searchDebounceTimer)
      searchDebounceTimer = setTimeout(performHTMLSearch, 300)
    }
    
    // Keyboard shortcut for Ctrl+F
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const input = document.getElementById('global-search-input')
        if (input) {
          input.focus()
          input.select()
        }
      }
    })
  </script>
</body>
</html>`

  return html
}
