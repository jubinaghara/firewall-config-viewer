import { flattenFirewallRule, formatTagName } from './xmlParser'

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

// Helper to flatten entity fields
function flattenFields(obj, prefix = '') {
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
    if (value == null) return
    if (Array.isArray(value)) {
      if (value.length === 0) return
      const allPrimitive = value.every(item => (item == null) || (typeof item !== 'object'))
      if (allPrimitive) {
        const summarized = value.map(item => summarizeObject(item)).join(' | ')
        rows.push([fullKey, summarized])
      } else {
        value.forEach((item, idx) => {
          const subRows = flattenFields(item, `${fullKey}[${idx}]`)
          rows.push(...subRows)
        })
      }
    } else if (typeof value === 'object') {
      const subRows = flattenFields(value, fullKey)
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

// Generate entity table HTML
function generateEntityTable(title, icon, items, primaryKeyLabel = null, primaryValueGetter = null) {
  if (!items || items.length === 0) return ''
  
  let rows = ''
  items.forEach((it, idx) => {
    const name = escapeHtml(it.name || it.fields?.Name || primaryValueGetter?.(it) || formatTagName(it.tag || '') || '')
    const primary = primaryKeyLabel && primaryValueGetter ? escapeHtml(primaryValueGetter(it)) : ''
    const details = flattenFields(it.fields)
    
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
              const val = escapeHtml(String(v))
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
    
    rows += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 0.625rem 1rem; font-size: 0.75rem; color: #4b5563; font-weight: 500;">${idx + 1}</td>
        <td style="padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; color: #111827; word-break: break-word; overflow-wrap: anywhere; max-width: 200px;">${name}</td>
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
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #6366f1;">vpn_key</span>
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
            <span class="material-symbols-outlined" style="font-size: 1rem;">info</span>
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
            <span class="material-symbols-outlined" style="font-size: 1rem;">bolt</span>
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
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #005BC8;">login</span>
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
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #16a34a;">logout</span>
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
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #9333ea;">shield_lock</span>
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
              <span class="material-symbols-outlined" style="font-size: 1rem; color: #4f46e5;">groups</span>
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
              <span class="material-symbols-outlined" style="font-size: 1rem; color: #ea580c;">block</span>
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
      hostObjectsHtml += `<div id="ip-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('ip-hosts', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('IPHost')};">dns</span> IP Hosts`, generateEntityTable('IP Hosts', 'dns', data.ipHosts, 'IP Address', (item) => item.fields?.IPAddress || ''), true)}</div>`
    }
    if (sectionVisibility.fqdnHosts !== false && data.fqdnHosts && data.fqdnHosts.length > 0) {
      hostObjectsHtml += `<div id="fqdn-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('fqdn-hosts', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('FQDNHost')};">language</span> FQDN Hosts`, generateEntityTable('FQDN Hosts', 'language', data.fqdnHosts), true)}</div>`
    }
    if (sectionVisibility.macHosts !== false && data.macHosts && data.macHosts.length > 0) {
      hostObjectsHtml += `<div id="mac-hosts" style="margin-bottom: 1rem;">${generateCollapsibleSection('mac-hosts', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('MACHost')};">devices</span> MAC Hosts`, generateEntityTable('MAC Hosts', 'devices', data.macHosts, 'MAC Address', (item) => item.fields?.MACAddress || ''), true)}</div>`
    }
    sectionsHtml += hostObjectsHtml
  }

  // Firewall Rules
  if (sectionVisibility.firewallRules !== false && data.firewallRules && data.firewallRules.length > 0) {
    const rulesHtml = data.firewallRules.map((rule, idx) => generateFirewallRule(rule, idx, false)).join('')
    sectionsHtml += `<div id="firewall-rules" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('firewall-rules', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('FirewallRule')};">shield</span> Detailed Firewall Rules Analysis`, `<div style="display: flex; flex-direction: column; gap: 1rem;">${rulesHtml}</div>`, true)}</div>`
  }

  // Groups Section
  if ((sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups?.length) || 
      (sectionVisibility.ipHostGroups !== false && data.ipHostGroups?.length) || 
      (sectionVisibility.serviceGroups !== false && data.serviceGroups?.length) ||
      (sectionVisibility.groups !== false && data.groups?.length)) {
    let groupsHtml = ''
    if (sectionVisibility.fqdnHostGroups !== false && data.fqdnHostGroups && data.fqdnHostGroups.length > 0) {
      groupsHtml += `<div id="fqdn-host-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('fqdn-host-groups', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('FQDNHostGroup')};">group_work</span> FQDN Host Groups`, generateEntityTable('FQDN Host Groups', 'group_work', data.fqdnHostGroups), true)}</div>`
    }
    if (sectionVisibility.ipHostGroups !== false && data.ipHostGroups && data.ipHostGroups.length > 0) {
      groupsHtml += `<div id="ip-host-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('ip-host-groups', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('IPHostGroup')};">group_work</span> IP Host Groups`, generateEntityTable('IP Host Groups', 'group_work', data.ipHostGroups), true)}</div>`
    }
    if (sectionVisibility.serviceGroups !== false && data.serviceGroups && data.serviceGroups.length > 0) {
      groupsHtml += `<div id="service-groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('service-groups', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('ServiceGroup')};">group_work</span> Service Groups`, generateEntityTable('Service Groups', 'group_work', data.serviceGroups), true)}</div>`
    }
    if (sectionVisibility.groups !== false && data.groups && data.groups.length > 0) {
      groupsHtml += `<div id="groups" style="margin-bottom: 1rem;">${generateCollapsibleSection('groups', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('Group')};">groups</span> Other Groups`, generateEntityTable('Other Groups', 'groups', data.groups), true)}</div>`
    }
    sectionsHtml += groupsHtml
  }

  // Services
  if (sectionVisibility.services !== false && data.services && data.services.length > 0) {
    sectionsHtml += `<div id="services-section" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('services-section', '<span class="material-symbols-outlined" style="color: #005BC8;">construction</span> Services', generateEntityTable('Services', 'construction', data.services), true)}</div>`
  }

  // Additional dynamic entities
  if (data.entitiesByTag) {
    Object.entries(data.entitiesByTag).forEach(([tag, items]) => {
      if (items && items.length > 0 && sectionVisibility[tag] !== false) {
        if (!['IPHost', 'FQDNHost', 'MACHost', 'Service', 'Services', 'Group', 'FQDNHostGroup', 'IPHostGroup', 'ServiceGroup',
              'Country', 'WebFilterPolicy', 'Schedule', 'VLAN', 'Alias', 'Interface', 'LAG', 'WirelessNetwork',
              'CertificateAuthority', 'SelfSignedCertificate', 'Certificate', 'Zone', 'Network', 'REDDevice', 'WirelessAccessPoint',
              'IPSPolicy', 'IntrusionPrevention', 'VirusScanning', 'WebFilter'].includes(tag)) {
          const icon = getEntityIcon(tag)
          const iconColor = getEntityIconColor(tag)
          const tableHtml = tag === 'VPNIPSecConnection' 
            ? generateVPNIPSecConnectionTable(items)
            : generateEntityTable(tag, icon, items)
          sectionsHtml += `<div id="additional-${tag}" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection(`additional-${tag}`, `<span class="material-symbols-outlined" style="color: ${iconColor};">${icon}</span> ${escapeHtml(tag)} (${items.length})`, tableHtml, true)}</div>`
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
    // Note: Interfaces & Network is complex - for now, just show a placeholder
    // This can be enhanced later with full interface/VLAN/Alias rendering
    sectionsHtml += `<div id="ports-vlans-aliases" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('ports-vlans-aliases', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('Interface')};">settings_ethernet</span> Interfaces & Network`, '<p style="padding: 1rem; color: #6b7280;">Interfaces and network configuration details</p>', true)}</div>`
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
    sectionsHtml += `<div id="security-policies" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('security-policies', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('IPSPolicy')};">security</span> Security Policies`, securityPoliciesHtml.join(''), true)}</div>`
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
    sectionsHtml += `<div id="certificates" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('certificates', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('Certificate')};">verified</span> Certificates`, certificatesHtml.join(''), true)}</div>`
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
    sectionsHtml += `<div id="network-config" style="margin-bottom: 1rem; scroll-mt-4;">${generateCollapsibleSection('network-config', `<span class="material-symbols-outlined" style="color: ${getEntityIconColor('Network')};">router</span> Network Configuration`, networkConfigHtml.join(''), true)}</div>`
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
        'Country','WebFilterPolicy','Schedule','VLAN','Alias','Interface','LAG','WirelessNetwork',
        'CertificateAuthority','SelfSignedCertificate','Certificate','Zone','Network','REDDevice','WirelessAccessPoint',
        'IPSPolicy','IntrusionPrevention','VirusScanning','WebFilter'
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
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
  <style>
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
