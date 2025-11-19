import { Zap, Globe, Users, Server, Filter, Settings, AlertTriangle } from 'lucide-react'
import theme from '../theme'

export default function RuleDetails({ rule, flat }) {
  const policy = rule.networkPolicy || rule.userPolicy || {}

  const renderSection = (title, icon, data) => {
    if (!data || Object.keys(data).length === 0) return null

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          {Object.entries(data).map(([key, value]) => {
            if (value === null || value === undefined || value === '') return null
            if (Array.isArray(value) && value.length === 0) return null
            if (typeof value === 'object' && Object.keys(value).length === 0) return null

            return (
              <div key={key} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-600 w-48 flex-shrink-0">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm text-gray-900 flex-1 text-right">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {value.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: theme.colors.badge.tag.bg, color: theme.colors.badge.tag.text }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : typeof value === 'object' ? (
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    String(value)
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5" style={{ color: theme.colors.primary.main }} />
            <h3 className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>Basic Information</h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <DetailRow label="Transaction ID" value={rule.transactionId || 'N/A'} />
            <DetailRow label="IP Family" value={flat.ipFamily} />
            <DetailRow label="Position" value={flat.position} />
            {flat.after && <DetailRow label="After Rule" value={flat.after} />}
          </div>
        </div>

        {/* Network Configuration */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-5 h-5" style={{ color: theme.colors.secondary.main }} />
            <h3 className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>Network Configuration</h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <DetailRow label="Source Zones" value={flat.sourceZones || 'Any'} />
            <DetailRow label="Destination Zones" value={flat.destinationZones || 'Any'} />
            {flat.sourceNetworks && (
              <DetailRow label="Source Networks" value={flat.sourceNetworks} />
            )}
            {flat.destinationNetworks && (
              <DetailRow label="Destination Networks" value={flat.destinationNetworks} />
            )}
            <DetailRow label="Services" value={flat.services || 'Any'} />
            <DetailRow label="Schedule" value={flat.schedule || 'All The Time'} />
          </div>
        </div>

        {/* Security Settings */}
        {policy && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-5 h-5" style={{ color: theme.colors.policy.user }} />
              <h3 className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>Security Settings</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              <DetailRow label="Log Traffic" value={flat.logTraffic || 'Disable'} />
              <DetailRow label="Web Filter" value={flat.webFilter || 'None'} />
              <DetailRow label="Application Control" value={flat.applicationControl || 'None'} />
              <DetailRow label="Intrusion Prevention" value={flat.intrusionPrevention || 'None'} />
              <DetailRow label="Scan Virus" value={flat.scanVirus || 'Disable'} />
              <DetailRow label="Zero Day Protection" value={flat.zeroDayProtection || 'Disable'} />
              <DetailRow label="Proxy Mode" value={flat.proxyMode || 'Disable'} />
              <DetailRow label="Decrypt HTTPS" value={flat.decryptHTTPS || 'Disable'} />
            </div>
          </div>
        )}

        {/* User Policy Specific */}
        {rule.userPolicy && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5" style={{ color: theme.colors.policy.user }} />
              <h3 className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>User Policy</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              {(() => {
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
                return identityValue ? <DetailRow label="Identity" value={identityValue} /> : null;
              })()}
              {policy.MatchIdentity && (
                <DetailRow label="Match Identity" value={policy.MatchIdentity} />
              )}
              {policy.ShowCaptivePortal && (
                <DetailRow label="Show Captive Portal" value={policy.ShowCaptivePortal} />
              )}
              {policy.DataAccounting && (
                <DetailRow label="Data Accounting" value={policy.DataAccounting} />
              )}
            </div>
          </div>
        )}

        {/* Exclusions */}
        {policy.Exclusions && Object.keys(policy.Exclusions).length > 0 && (
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-5 h-5" style={{ color: theme.colors.entity.application }} />
              <h3 className="text-sm font-semibold" style={{ color: theme.colors.text.primary }}>Exclusions</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {renderExclusions(policy.Exclusions)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value || value === 'N/A' || value === '') return null

  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 flex-1">{label}</span>
      <span className="text-sm text-gray-900 flex-1 text-right">{String(value)}</span>
    </div>
  )
}

function renderExclusions(exclusions) {
  const sections = []

  if (exclusions.SourceZones && exclusions.SourceZones.length > 0) {
    sections.push(
      <div key="source-zones" className="mb-3">
        <span className="text-xs font-medium text-gray-600">Source Zones: </span>
        <span className="text-sm text-gray-900">
          {Array.isArray(exclusions.SourceZones) 
            ? exclusions.SourceZones.join(', ')
            : (exclusions.SourceZones.Zone || []).join(', ')}
        </span>
      </div>
    )
  }

  if (exclusions.DestinationZones && exclusions.DestinationZones.length > 0) {
    sections.push(
      <div key="dest-zones" className="mb-3">
        <span className="text-xs font-medium text-gray-600">Destination Zones: </span>
        <span className="text-sm text-gray-900">
          {Array.isArray(exclusions.DestinationZones)
            ? exclusions.DestinationZones.join(', ')
            : (exclusions.DestinationZones.Zone || []).join(', ')}
        </span>
      </div>
    )
  }

  if (exclusions.SourceNetworks && exclusions.SourceNetworks.length > 0) {
    sections.push(
      <div key="source-nets" className="mb-3">
        <span className="text-xs font-medium text-gray-600">Source Networks: </span>
        <span className="text-sm text-gray-900">
          {Array.isArray(exclusions.SourceNetworks)
            ? exclusions.SourceNetworks.join(', ')
            : (exclusions.SourceNetworks.Network || []).join(', ')}
        </span>
      </div>
    )
  }

  if (exclusions.DestinationNetworks && exclusions.DestinationNetworks.length > 0) {
    sections.push(
      <div key="dest-nets" className="mb-3">
        <span className="text-xs font-medium text-gray-600">Destination Networks: </span>
        <span className="text-sm text-gray-900">
          {Array.isArray(exclusions.DestinationNetworks)
            ? exclusions.DestinationNetworks.join(', ')
            : (exclusions.DestinationNetworks.Network || []).join(', ')}
        </span>
      </div>
    )
  }

  if (exclusions.Services && exclusions.Services.length > 0) {
    sections.push(
      <div key="services" className="mb-3">
        <span className="text-xs font-medium text-gray-600">Services: </span>
        <span className="text-sm text-gray-900">
          {Array.isArray(exclusions.Services)
            ? exclusions.Services.join(', ')
            : (exclusions.Services.Service || []).join(', ')}
        </span>
      </div>
    )
  }

  return sections.length > 0 ? <div>{sections}</div> : null
}
