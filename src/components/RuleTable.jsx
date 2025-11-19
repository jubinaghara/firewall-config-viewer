import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, Clock, User, Network, CheckCircle2, XCircle } from 'lucide-react'
import { flattenFirewallRule } from '../utils/xmlParser'
import RuleDetails from './RuleDetails'
import theme from '../theme'

export default function RuleTable({ rules }) {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const totalPages = Math.ceil(rules.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRules = rules.slice(startIndex, startIndex + itemsPerPage)

  const getPolicyIcon = (policyType) => {
    switch (policyType) {
      case 'User':
        return <User className="w-4 h-4" style={{ color: theme.colors.policy.user }} />
      case 'Network':
        return <Network className="w-4 h-4" style={{ color: theme.colors.policy.network }} />
      default:
        return <Zap className="w-4 h-4" style={{ color: theme.colors.policy.default }} />
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'Enable') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: theme.colors.badge.enabled.bg, color: theme.colors.badge.enabled.text }}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Enabled
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: theme.colors.badge.disabled.bg, color: theme.colors.badge.disabled.text }}>
        <XCircle className="w-3 h-3 mr-1" />
        Disabled
      </span>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No firewall rules found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">label</span>Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">category</span>Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">toggle_on</span>Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">bolt</span>Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">login</span>Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="material-symbols-outlined align-middle mr-1 text-gray-400">logout</span>Destination</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRules.map((rule) => {
              const flat = flattenFirewallRule(rule)
              const isExpanded = expandedRows.has(rule.id)
              
              return (
                <>
                  <tr
                    key={rule.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(rule.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getPolicyIcon(flat.policyType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{flat.name || 'Unnamed Rule'}</div>
                          {flat.description && (
                            <div className="text-xs text-gray-500">{flat.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{flat.policyType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(flat.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium" style={{
                        color: flat.action === 'Accept' ? theme.colors.action.accept :
                               flat.action === 'Deny' ? theme.colors.action.deny :
                               theme.colors.action.neutral
                      }}>
                        {flat.action || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {flat.sourceZones || flat.sourceNetworks || 'Any'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {flat.destinationZones || flat.destinationNetworks || 'Any'}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 bg-gray-50">
                        <RuleDetails rule={rule} flat={flat} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, rules.length)} of {rules.length} rules
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
