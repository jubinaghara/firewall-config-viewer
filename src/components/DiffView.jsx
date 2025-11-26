import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { Plus, Minus, Edit, FileText, ChevronDown, ChevronRight, Download, Filter, Search, X, Home } from 'lucide-react'
import { generateHTMLDiff } from '../utils/htmlDiffGenerator'
import { formatTagName } from '../utils/xmlParser'
import theme from '../theme'

export default function DiffView({ diffResults, oldFileName, newFileName, onHomeClick }) {
  const [expandedSections, setExpandedSections] = useState({})
  const [expandedItems, setExpandedItems] = useState({})
  const [filterType, setFilterType] = useState('all') // 'all', 'added', 'removed', 'modified'
  const [selectedTags, setSelectedTags] = useState(new Set()) // Selected entity types (tags)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const tagDropdownRef = useRef(null)

  const grouped = useMemo(() => {
    const groups = {}
    
    // Group by entity type
    const allItems = [
      ...diffResults.added.map(item => ({ ...item, changeType: 'added' })),
      ...diffResults.removed.map(item => ({ ...item, changeType: 'removed' })),
      ...diffResults.modified.map(item => ({ ...item, changeType: 'modified' }))
    ]

    allItems.forEach(item => {
      if (!groups[item.tag]) {
        groups[item.tag] = {
          tag: item.tag,
          added: [],
          removed: [],
          modified: []
        }
      }
      groups[item.tag][item.changeType].push(item)
    })

    return groups
  }, [diffResults])

  // Get all available tags
  const allTags = useMemo(() => {
    return Object.keys(grouped).sort()
  }, [grouped])

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return allTags
    const query = tagSearchQuery.toLowerCase()
    return allTags.filter(tag => tag.toLowerCase().includes(query))
  }, [allTags, tagSearchQuery])

  // Initialize selectedTags with all tags when tags are first loaded
  useEffect(() => {
    if (selectedTags.size === 0 && allTags.length > 0) {
      setSelectedTags(new Set(allTags))
    }
  }, [allTags.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setIsTagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tag)) {
        newSet.delete(tag)
      } else {
        newSet.add(tag)
      }
      return newSet
    })
  }

  const selectAllTags = () => {
    setSelectedTags(new Set(filteredTags))
  }

  const deselectAllTags = () => {
    setSelectedTags(new Set())
  }

  const toggleSection = (tag) => {
    setExpandedSections(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }))
  }

  const toggleItem = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleExport = () => {
    const html = generateHTMLDiff(diffResults, oldFileName, newFileName)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `config-diff-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filter by selected tags and change type
  const filteredGrouped = useMemo(() => {
    return Object.entries(grouped).filter(([tag, items]) => {
      // Filter by selected tags
      if (selectedTags.size > 0 && !selectedTags.has(tag)) {
        return false
      }
      
      // Filter by change type
      if (filterType === 'all') return true
      return items[filterType]?.length > 0
    })
  }, [grouped, selectedTags, filterType])

  const selectedTagsCount = selectedTags.size
  const totalTagsCount = allTags.length

  return (
    <div className="w-full">
      {/* Header with Summary */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Differences</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span><strong>Old:</strong> {oldFileName || 'Current File'}</span>
              <span>→</span>
              <span><strong>New:</strong> {newFileName || 'New File'}</span>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700 font-medium mb-1">Removed</div>
            <div className="text-2xl font-bold text-red-900">{diffResults.summary.removed}</div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-700 font-medium mb-1">Modified</div>
            <div className="text-2xl font-bold text-yellow-900">{diffResults.summary.modified}</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-700 font-medium mb-1">Added</div>
            <div className="text-2xl font-bold text-green-900">{diffResults.summary.added}</div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700 font-medium mb-1">Unchanged</div>
            <div className="text-2xl font-bold text-gray-900">{diffResults.summary.unchanged}</div>
          </div>
        </div>

        {/* Entity Type Filter Dropdown */}
        <div className="mb-4 relative" ref={tagDropdownRef}>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filter by Entity Type (XML Tags)</h3>
            <span className="text-xs text-gray-500">
              ({selectedTagsCount} of {totalTagsCount} selected)
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <span className="text-sm text-gray-700">
                {selectedTagsCount === 0 
                  ? 'No tags selected' 
                  : selectedTagsCount === totalTagsCount
                  ? 'All tags selected'
                  : `${selectedTagsCount} tag${selectedTagsCount !== 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTagDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    {tagSearchQuery && (
                      <button
                        onClick={() => setTagSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Select All / Deselect All */}
                <div className="px-2 py-1.5 border-b border-gray-200 flex gap-2">
                  <button
                    onClick={selectAllTags}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllTags}
                    className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 rounded"
                  >
                    Deselect All
                  </button>
                </div>

                {/* Tag List */}
                <div className="overflow-y-auto max-h-64">
                  {filteredTags.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No tags found</div>
                  ) : (
                    filteredTags.map(tag => {
                      const isSelected = selectedTags.has(tag)
                      const tagCount = (grouped[tag]?.added.length || 0) + 
                                      (grouped[tag]?.removed.length || 0) + 
                                      (grouped[tag]?.modified.length || 0)
                      return (
                        <label
                          key={tag}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTag(tag)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 flex-1">{tag}</span>
                          <span className="text-xs text-gray-500">({tagCount})</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Type Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Changes
          </button>
          <button
            onClick={() => setFilterType('removed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'removed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Removed ({diffResults.summary.removed})
          </button>
          <button
            onClick={() => setFilterType('modified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'modified'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Modified ({diffResults.summary.modified})
          </button>
          <button
            onClick={() => setFilterType('added')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'added'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Added ({diffResults.summary.added})
          </button>
        </div>
      </div>

      {/* Diff Sections */}
      <div className="space-y-4">
        {filteredGrouped.map(([tag, items]) => {
          const hasChanges = items.added.length > 0 || items.removed.length > 0 || items.modified.length > 0
          if (!hasChanges && filterType !== 'all') return null

          const isExpanded = expandedSections[tag] !== false
          const totalCount = items.added.length + items.removed.length + items.modified.length

          return (
            <div key={tag} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(tag)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{tag}</span>
                  <span className="text-sm text-gray-500">({totalCount} changes)</span>
                </div>
                <div className="flex items-center gap-2">
                  {items.removed.length > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      -{items.removed.length}
                    </span>
                  )}
                  {items.modified.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                      ~{items.modified.length}
                    </span>
                  )}
                  {items.added.length > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      +{items.added.length}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200">
                  {/* Removed Items */}
                  {items.removed.map((item, idx) => (
                    <DiffItem
                      key={`removed-${item.key}-${idx}`}
                      item={item}
                      type="removed"
                      isExpanded={expandedItems[`removed-${item.key}`]}
                      onToggle={() => toggleItem(`removed-${item.key}`)}
                    />
                  ))}

                  {/* Modified Items */}
                  {items.modified.map((item, idx) => (
                    <DiffItem
                      key={`modified-${item.key}-${idx}`}
                      item={item}
                      type="modified"
                      isExpanded={expandedItems[`modified-${item.key}`]}
                      onToggle={() => toggleItem(`modified-${item.key}`)}
                    />
                  ))}

                  {/* Added Items */}
                  {items.added.map((item, idx) => (
                    <DiffItem
                      key={`added-${item.key}-${idx}`}
                      item={item}
                      type="added"
                      isExpanded={expandedItems[`added-${item.key}`]}
                      onToggle={() => toggleItem(`added-${item.key}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredGrouped.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No changes found for the selected filters.</p>
        </div>
      )}

      {onHomeClick && (
        <div className="mt-8 text-center">
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:underline mx-auto"
            style={{
              color: theme.components.landingCard.linkColor,
              fontFamily: theme.typography.fontFamily.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Helper to parse any entity from XML and return structured data
function parseEntityFromXml(xmlString, tagName) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    const entityElement = doc.querySelector(tagName) || doc.documentElement
    if (!entityElement) return null

    const getText = (tagName) => {
      const el = entityElement.querySelector(tagName)
      return el ? el.textContent.trim() : ''
    }

    const getArrayValue = (parentTag, childTag) => {
      const parent = entityElement.querySelector(parentTag)
      if (!parent) return []
      return Array.from(parent.querySelectorAll(childTag)).map(el => el.textContent.trim())
    }

    // Special handling for FirewallRule
    if (tagName === 'FirewallRule') {
      const policy = entityElement.querySelector('NetworkPolicy') || entityElement.querySelector('UserPolicy')
      const getPolicyValue = (tagName) => {
        if (!policy) return ''
        const el = policy.querySelector(tagName)
        return el ? el.textContent.trim() : ''
      }

      const getPolicyArray = (parentTag, childTag) => {
        if (!policy) return []
        const parent = policy.querySelector(parentTag)
        if (!parent) return []
        return Array.from(parent.querySelectorAll(childTag)).map(el => el.textContent.trim())
      }

      return {
        _entityType: 'FirewallRule',
        name: getText('Name'),
        description: getText('Description'),
        status: getText('Status'),
        ipFamily: getText('IPFamily'),
        policyType: getText('PolicyType'),
        position: getText('Position'),
        after: entityElement.querySelector('After > Name')?.textContent.trim() || '',
        action: getPolicyValue('Action'),
        logTraffic: getPolicyValue('LogTraffic'),
        schedule: getPolicyValue('Schedule'),
        sourceZones: getPolicyArray('SourceZones', 'Zone'),
        destinationZones: getPolicyArray('DestinationZones', 'Zone'),
        sourceNetworks: getPolicyArray('SourceNetworks', 'Network'),
        destinationNetworks: getPolicyArray('DestinationNetworks', 'Network'),
        services: getPolicyArray('Services', 'Service'),
        webFilter: getPolicyValue('WebFilter'),
        applicationControl: getPolicyValue('ApplicationControl'),
        intrusionPrevention: getPolicyValue('IntrusionPrevention'),
        scanVirus: getPolicyValue('ScanVirus'),
        zeroDayProtection: getPolicyValue('ZeroDayProtection'),
        proxyMode: getPolicyValue('ProxyMode'),
        decryptHTTPS: getPolicyValue('DecryptHTTPS'),
      }
    }

    // Generic entity parsing
    const fields = {}
    let name = getText('Name')
    
    // Helper to parse nested structures recursively
    const parseNestedElement = (element) => {
      if (element.children.length === 0) {
        return element.textContent.trim()
      }
      
      const children = Array.from(element.children)
      if (children.length === 0) {
        return element.textContent.trim()
      }
      
      // Check if all children have the same tag (array pattern)
      const firstTag = children[0].tagName
      const allSameTag = children.every(c => c.tagName === firstTag)
      
      if (allSameTag) {
        // Check if they're simple values or complex objects
        if (children.every(c => c.children.length === 0)) {
          // Simple array of values (e.g., <Category>netbios</Category><Category>os-linux</Category>)
          return children.map(c => c.textContent.trim())
        } else {
          // Array of complex objects (e.g., <Rule>...</Rule><Rule>...</Rule>)
          return children.map(c => {
            const obj = {}
            // Process all direct children of the Rule element
            Array.from(c.children).forEach(grandchild => {
              const grandKey = grandchild.tagName
              // Handle empty elements (e.g., <SmartFilter/>)
              if (grandchild.children.length === 0) {
                const text = grandchild.textContent.trim()
                // Always include the field, even if empty
                obj[grandKey] = text
              } else {
                // Recursively parse nested structures
                const grandChildren = Array.from(grandchild.children)
                // Check if all children have the same tag (array pattern)
                if (grandChildren.length > 0) {
                  const grandFirstTag = grandChildren[0]?.tagName
                  const allSameTag = grandFirstTag && grandChildren.every(gc => gc.tagName === grandFirstTag)
                  
                  if (allSameTag) {
                    // All children have same tag - it's an array
                    if (grandChildren.every(gc => gc.children.length === 0)) {
                      // Simple array of text values (e.g., CategoryList with multiple Category)
                      obj[grandKey] = grandChildren.map(gc => gc.textContent.trim())
                    } else {
                      // Array of complex objects - recursively parse each
                      obj[grandKey] = grandChildren.map(gc => parseNestedElement(gc))
                    }
                  } else {
                    // Mixed children - create object with all fields
                    const nestedObj = {}
                    grandChildren.forEach(gc => {
                      if (gc.children.length === 0) {
                        nestedObj[gc.tagName] = gc.textContent.trim()
                      } else {
                        nestedObj[gc.tagName] = parseNestedElement(gc)
                      }
                    })
                    obj[grandKey] = nestedObj
                  }
                } else {
                  // Empty nested element - set as empty string or empty object
                  obj[grandKey] = ''
                }
              }
            })
            return obj
          })
        }
      } else {
        // Mixed tags - create object
        const obj = {}
        children.forEach(c => {
          const childKey = c.tagName
          if (c.children.length === 0) {
            obj[childKey] = c.textContent.trim()
          } else {
            obj[childKey] = parseNestedElement(c)
          }
        })
        return obj
      }
    }
    
    // Parse all direct children - preserve order by processing in document order
    Array.from(entityElement.children).forEach(child => {
      const key = child.tagName
      if (child.children.length === 0) {
        // Simple text node - always include, even if empty
        fields[key] = child.textContent.trim()
      } else {
        // Parse nested structure - always include
        const parsed = parseNestedElement(child)
        fields[key] = parsed
      }
    })

    // Ensure Name is always in fields, using the extracted name value
    if (name) {
      fields.Name = name
    } else if (fields.Name !== undefined) {
      // Use the Name from fields if name is empty
      name = fields.Name
    } else {
      // Ensure Name field exists even if empty
      fields.Name = ''
      name = ''
    }

    return {
      _entityType: tagName,
      name: name || fields.Name || '',
      ...fields
    }
  } catch (e) {
    return null
  }
}

// Helper to render any entity in readable format
function renderEntity(entity, type, tagName, compareEntity = undefined) {
  if (!entity) return null

  // Helper to format nested structures for display
  const formatNestedValue = (value, indent = 0) => {
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) {
      // Check if array contains objects
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        // Array of objects - format each object (e.g., RuleList with multiple Rules)
        // Ensure ALL Rules are displayed, even if some fields are empty
        return value.map((obj, idx) => {
          const objStr = Object.entries(obj)
            .map(([k, v]) => {
              const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
              if (Array.isArray(v)) {
                // Check if array contains objects or simple values
                if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
                  // Nested array of objects - format recursively
                  return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
                } else {
                  // Simple array (like CategoryList) - comma separated, show all items
                  return `${formattedKey}: ${v.length > 0 ? v.join(', ') : '(empty)'}`
                }
              } else if (typeof v === 'object' && v !== null) {
                return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
              }
              // Show the value, or '(empty)' if it's an empty string for important fields
              const displayValue = (v === '' && (k === 'RuleName' || k === 'Name' || k === 'Description')) ? '(empty)' : (v || '')
              return `${formattedKey}: ${displayValue}`
            })
            .join('; ')
          return `[${idx + 1}] ${objStr}`
        }).join(' | ')
      } else {
        // Simple array - comma separated
        return value.join(', ')
      }
    } else if (typeof value === 'object' && value !== null) {
      // Object - format as key-value pairs
      return Object.entries(value)
        .map(([k, v]) => {
          const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
          if (Array.isArray(v)) {
            // Check if array contains objects or simple values
            if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
              return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
            } else {
              return `${formattedKey}: ${v.join(', ')}`
            }
          } else if (typeof v === 'object' && v !== null) {
            return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
          }
          return `${formattedKey}: ${v}`
        })
        .join('; ')
    }
    return String(value)
  }

  // Helper to compare arrays and highlight differences
  const compareArrays = (oldArr, newArr) => {
    if (!Array.isArray(oldArr) && !Array.isArray(newArr)) return null
    const old = Array.isArray(oldArr) ? oldArr : []
    const new_ = Array.isArray(newArr) ? newArr : []
    
    const oldSet = new Set(old)
    const newSet = new Set(new_)
    
    const removed = old.filter(item => !newSet.has(item))
    const added = new_.filter(item => !oldSet.has(item))
    const unchanged = old.filter(item => newSet.has(item))
    
    return { removed, added, unchanged }
  }

  // Helper to compare arrays of objects and identify changed items
  const compareObjectArrays = (oldArr, newArr) => {
    if (!Array.isArray(oldArr) && !Array.isArray(newArr)) return null
    const old = Array.isArray(oldArr) ? oldArr : []
    const new_ = Array.isArray(newArr) ? newArr : []
    
    // Check if arrays contain objects
    if (old.length > 0 && typeof old[0] === 'object' && old[0] !== null && !Array.isArray(old[0])) {
      // Compare by index and content
      const maxLen = Math.max(old.length, new_.length)
      const result = []
      
      for (let i = 0; i < maxLen; i++) {
        const oldItem = old[i]
        const newItem = new_[i]
        
        if (oldItem === undefined && newItem !== undefined) {
          result.push({ index: i, type: 'added', oldItem: null, newItem })
        } else if (oldItem !== undefined && newItem === undefined) {
          result.push({ index: i, type: 'removed', oldItem, newItem: null })
        } else if (oldItem !== undefined && newItem !== undefined) {
          // Compare objects by JSON stringification
          const oldStr = JSON.stringify(oldItem)
          const newStr = JSON.stringify(newItem)
          if (oldStr !== newStr) {
            result.push({ index: i, type: 'modified', oldItem, newItem })
          } else {
            result.push({ index: i, type: 'unchanged', oldItem, newItem })
          }
        }
      }
      
      return result
    }
    
    return null
  }

  // Helper to format a rule object - no highlighting, clean display
  const formatRuleWithHighlights = (newRule, oldRule, index) => {
    if (!newRule && !oldRule) return null
    
    const parts = []
    const allKeys = new Set([...Object.keys(newRule || {}), ...Object.keys(oldRule || {})])
    
    allKeys.forEach((key, keyIdx) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
      const newVal = newRule?.[key]
      const oldVal = oldRule?.[key]
      
      let valueDisplay = null
      
      if (Array.isArray(newVal || oldVal)) {
        // Show all items from new array, no highlighting
        const newArr = Array.isArray(newVal) ? newVal : []
        const valueParts = []
        
        newArr.forEach((item, i) => {
          if (i > 0) {
            valueParts.push(<span key={`sep-${i}`}>, </span>)
          }
          valueParts.push(
            <span key={i} className="text-gray-700">
              {item}
            </span>
          )
        })
        
        valueDisplay = valueParts.length > 0 ? valueParts : <span className="text-gray-400 italic">(empty)</span>
      } else if (typeof (newVal || oldVal) === 'object' && (newVal || oldVal) !== null) {
        // Object - format it as string
        const formatted = formatNestedValue(newVal || oldVal)
        valueDisplay = <span className="text-gray-700">{formatted}</span>
      } else {
        // Simple value - no highlighting
        const displayVal = newVal !== undefined ? newVal : oldVal
        valueDisplay = <span className="text-gray-700">{String(displayVal || '')}</span>
      }
      
      parts.push(
        <span key={key}>
          {keyIdx > 0 && '; '}
          <span>{formattedKey}: </span>
          {valueDisplay}
        </span>
      )
    })
    
    return (
      <span>
        <span className="text-gray-700">[{index + 1}]</span> {parts}
      </span>
    )
  }

  // Render field with diff highlighting for arrays (OLD view - shows RED for removed, normal for unchanged)
  const renderFieldWithDiff = (label, oldValue, newValue, highlight = null, showEmpty = false) => {
    // Handle empty values
    if (!showEmpty) {
      if ((oldValue === null || oldValue === undefined || oldValue === '') && 
          (newValue === null || newValue === undefined || newValue === '')) return null
      if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === 0 && newValue.length === 0) return null
    }
    
    // If there's no comparison value (newValue is undefined), just render normally without highlighting
    // This happens for newly added or removed entities where there's no old/new comparison
    if (newValue === undefined) {
      // No comparison - just render the value normally
      let displayValue = ''
      if (Array.isArray(oldValue)) {
        if (oldValue.length > 0 && typeof oldValue[0] === 'object' && oldValue[0] !== null && !Array.isArray(oldValue[0])) {
          displayValue = formatNestedValue(oldValue)
        } else {
          displayValue = oldValue.map(v => {
            if (typeof v === 'object' && v !== null) {
              return formatNestedValue([v])
            }
            return String(v)
          }).join(', ')
        }
      } else if (typeof oldValue === 'object' && oldValue !== null) {
        displayValue = formatNestedValue(oldValue)
      } else {
        displayValue = String(oldValue || '')
      }
      
      // Apply only the provided highlight (for status fields, etc.), not diff-based highlighting
      let colorClass = 'text-gray-700'
      if (highlight === 'green') {
        colorClass = 'text-green-700'
      } else if (highlight === 'red') {
        colorClass = 'text-red-700'
      }
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <span className={`text-sm flex-1 ${colorClass} break-words`} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {displayValue || '(empty)'}
          </span>
        </div>
      )
    }
    
    // Perform deep comparison only when we have both old and new values
    const diff = deepCompareValues(oldValue, newValue)
    
    // Handle simple arrays with diff highlighting (OLD view)
    if (diff.isSimpleArray && diff.type !== 'unchanged' && newValue !== undefined) {
      const parts = []
      
      // Unchanged items (normal color)
      if (diff.unchanged && diff.unchanged.length > 0) {
        parts.push(
          <span key="unchanged" className="text-gray-700">
            {diff.unchanged.join(', ')}
            {(diff.removed.length > 0 || diff.added.length > 0) && ', '}
          </span>
        )
      }
      
      // Removed items (RED) - shown in OLD view
      if (diff.removed && diff.removed.length > 0) {
        parts.push(
          <span key="removed" className="text-red-700 font-semibold bg-red-50 px-1 rounded">
            {diff.removed.join(', ')}
            {diff.added.length > 0 && ', '}
          </span>
        )
      }
      
      // Added items (not shown in OLD view, they're in NEW view)
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {parts.length > 0 ? parts : <span className="text-gray-400 italic">(empty)</span>}
          </div>
        </div>
      )
    }
    
    // Handle array of objects with diff highlighting (OLD view)
    if (diff.isArrayOfObjects && diff.items && newValue !== undefined) {
      const parts = []
      diff.items.forEach((item, idx) => {
        if (idx > 0) {
          parts.push(<span key={`sep-${idx}`}> | </span>)
        }
        
        if (item.type === 'removed') {
          // Removed item - RED
          const formattedItem = formatNestedValue([item.oldItem])
          const itemText = formattedItem.replace(/^\[1\]\s*/, '')
          parts.push(
            <span key={idx} className="text-red-700 font-semibold bg-red-50 px-1 rounded">
              [{item.index + 1}] {itemText}
            </span>
          )
        } else if (item.type === 'added') {
          // Added item - not shown in OLD view (shown in NEW view)
          // Skip it here
        } else if (item.type === 'modified') {
          // Modified item - show old value with YELLOW/ORANGE highlighting
          const formattedItem = formatNestedValue([item.oldItem])
          const itemText = formattedItem.replace(/^\[1\]\s*/, '')
          parts.push(
            <span key={idx} className="text-yellow-700 font-semibold bg-yellow-50 px-1 rounded">
              [{item.index + 1}] {itemText}
            </span>
          )
        } else {
          // Unchanged item - normal color
          const formattedItem = formatNestedValue([item.oldItem || item.newItem])
        const itemText = formattedItem.replace(/^\[1\]\s*/, '')
        parts.push(
          <span key={idx} className="text-gray-700">
              [{item.index + 1}] {itemText}
          </span>
        )
        }
      })
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {parts.length > 0 ? parts : <span className="text-gray-400 italic">(empty)</span>}
          </div>
        </div>
      )
    }
    
    // Handle nested objects with diff highlighting (OLD view)
    if (diff.isObject && diff.fields && newValue !== undefined) {
      const parts = []
      Object.entries(diff.fields).forEach(([key, fieldDiff]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
        let nestedDisplay = ''
        
        if (fieldDiff.type === 'removed') {
          // Removed field - RED
          if (Array.isArray(fieldDiff.oldValue)) {
            nestedDisplay = Array.isArray(fieldDiff.oldValue) ? fieldDiff.oldValue.join(', ') : ''
        } else {
            nestedDisplay = String(fieldDiff.oldValue || '')
          }
          parts.push(
            <div key={key} className="mb-1">
              <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
              <span className="text-sm text-red-700 font-semibold bg-red-50 px-1 rounded">{nestedDisplay}</span>
            </div>
          )
        } else if (fieldDiff.type === 'added') {
          // Added field - not shown in OLD view
        } else if (fieldDiff.type === 'modified') {
          // Modified field - show old value in YELLOW/ORANGE
          if (Array.isArray(fieldDiff.oldValue)) {
            nestedDisplay = Array.isArray(fieldDiff.oldValue) ? fieldDiff.oldValue.join(', ') : ''
          } else if (typeof fieldDiff.oldValue === 'object' && fieldDiff.oldValue !== null) {
            nestedDisplay = formatNestedValue(fieldDiff.oldValue)
          } else {
            nestedDisplay = String(fieldDiff.oldValue || '')
          }
          parts.push(
            <div key={key} className="mb-1">
              <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
              <span className="text-sm text-yellow-700 font-semibold bg-yellow-50 px-1 rounded">{nestedDisplay}</span>
            </div>
          )
        } else {
          // Unchanged field - normal color
          if (Array.isArray(fieldDiff.oldValue)) {
            nestedDisplay = Array.isArray(fieldDiff.oldValue) ? fieldDiff.oldValue.join(', ') : ''
          } else if (typeof fieldDiff.oldValue === 'object' && fieldDiff.oldValue !== null) {
            nestedDisplay = formatNestedValue(fieldDiff.oldValue)
          } else {
            nestedDisplay = String(fieldDiff.oldValue || '')
          }
        parts.push(
          <div key={key} className="mb-1">
            <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
            <span className="text-sm text-gray-700">{nestedDisplay}</span>
          </div>
        )
        }
      })
      
      if (parts.length > 0) {
        return (
          <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
            <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
            <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
              {parts}
            </div>
          </div>
        )
      }
    }
    
    // Regular field rendering with highlighting (OLD view)
    let displayValue = ''
    let isRemoved = false
    let isModified = false
    
    if (newValue !== undefined) {
      // We have a comparison value
      if (diff.type === 'removed') {
        isRemoved = true
        displayValue = String(oldValue || '')
      } else if (diff.type === 'modified') {
        isModified = true
        displayValue = String(oldValue || '')
      } else {
        displayValue = String(oldValue || '')
      }
    } else {
      // No comparison - just show the value
      displayValue = String(oldValue || '')
    }
    
    if (Array.isArray(oldValue)) {
      if (oldValue.length > 0 && typeof oldValue[0] === 'object' && oldValue[0] !== null && !Array.isArray(oldValue[0])) {
        displayValue = formatNestedValue(oldValue)
      } else {
        displayValue = oldValue.map(v => {
          if (typeof v === 'object' && v !== null) {
            return formatNestedValue([v])
          }
          return String(v)
        }).join(', ')
      }
    } else if (typeof oldValue === 'object' && oldValue !== null) {
      displayValue = formatNestedValue(oldValue)
    }
    
    // Apply color based on diff type and highlight parameter
    let colorClass = 'text-gray-700'
    if (highlight === 'green') {
      colorClass = 'text-green-700'
    } else if (highlight === 'red') {
      colorClass = 'text-red-700'
    } else if (isRemoved) {
      colorClass = 'text-red-700 font-semibold bg-red-50 px-1 rounded'
    } else if (isModified) {
      colorClass = 'text-yellow-700 font-semibold bg-yellow-50 px-1 rounded'
    }
    
    return (
      <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
        <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
        <span className={`text-sm flex-1 ${colorClass} break-words`} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
          {displayValue || '(empty)'}
        </span>
      </div>
    )
  }

  const renderField = (label, value, highlight = null, showEmpty = true, compareValue = undefined) => {
    return renderFieldWithDiff(label, value, compareValue, highlight, showEmpty)
  }

  // Special rendering for FirewallRule
  if (entity._entityType === 'FirewallRule') {
    // Only use compareFields if compareEntity actually exists (not for newly added/removed entities)
    const hasComparison = compareEntity !== undefined && compareEntity !== null
    
    return (
      <div className="p-4 space-y-4">
        {/* Basic Information */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Information</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderField('Name', entity.name, null, true, hasComparison ? compareEntity.name : undefined)}
            {renderField('Description', entity.description, null, true, hasComparison ? compareEntity.description : undefined)}
            {renderField('Status', entity.status, entity.status === 'Enable' ? 'green' : null, true, hasComparison ? compareEntity.status : undefined)}
            {renderField('Policy Type', entity.policyType, null, true, hasComparison ? compareEntity.policyType : undefined)}
            {renderField('IP Family', entity.ipFamily, null, true, hasComparison ? compareEntity.ipFamily : undefined)}
            {renderField('Position', entity.position, null, true, hasComparison ? compareEntity.position : undefined)}
            {entity.after && renderField('Positioned After', entity.after, null, true, hasComparison ? compareEntity.after : undefined)}
          </div>
        </div>

        {/* Action & Traffic */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Action & Traffic Control</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderField('Action', entity.action, entity.action === 'Accept' ? 'green' : entity.action === 'Deny' ? 'red' : null, true, hasComparison ? compareEntity.action : undefined)}
            {renderField('Log Traffic', entity.logTraffic, null, true, hasComparison ? compareEntity.logTraffic : undefined)}
            {renderField('Schedule', entity.schedule || 'All The Time', null, true, hasComparison ? (compareEntity.schedule || 'All The Time') : undefined)}
          </div>
        </div>

        {/* Source Configuration */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Source Configuration</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderField('Source Zones', entity.sourceZones && entity.sourceZones.length > 0 ? entity.sourceZones : ['Any'], null, true, hasComparison ? (compareEntity.sourceZones && compareEntity.sourceZones.length > 0 ? compareEntity.sourceZones : ['Any']) : undefined)}
            {renderField('Source Networks', entity.sourceNetworks && entity.sourceNetworks.length > 0 ? entity.sourceNetworks : ['Any'], null, true, hasComparison ? (compareEntity.sourceNetworks && compareEntity.sourceNetworks.length > 0 ? compareEntity.sourceNetworks : ['Any']) : undefined)}
          </div>
        </div>

        {/* Destination Configuration */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Destination Configuration</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderField('Destination Zones', entity.destinationZones && entity.destinationZones.length > 0 ? entity.destinationZones : ['Any'], null, true, hasComparison ? (compareEntity.destinationZones && compareEntity.destinationZones.length > 0 ? compareEntity.destinationZones : ['Any']) : undefined)}
            {renderField('Destination Networks', entity.destinationNetworks && entity.destinationNetworks.length > 0 ? entity.destinationNetworks : ['Any'], null, true, hasComparison ? (compareEntity.destinationNetworks && compareEntity.destinationNetworks.length > 0 ? compareEntity.destinationNetworks : ['Any']) : undefined)}
            {renderField('Services/Ports', entity.services && entity.services.length > 0 ? entity.services : ['Any'], null, true, hasComparison ? (compareEntity.services && compareEntity.services.length > 0 ? compareEntity.services : ['Any']) : undefined)}
          </div>
        </div>

        {/* Security Features */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Security Features</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderField('Web Filter', entity.webFilter || 'None', null, true, hasComparison ? (compareEntity.webFilter || 'None') : undefined)}
            {renderField('Application Control', entity.applicationControl || 'None', null, true, hasComparison ? (compareEntity.applicationControl || 'None') : undefined)}
            {renderField('Intrusion Prevention', entity.intrusionPrevention || 'None', null, true, hasComparison ? (compareEntity.intrusionPrevention || 'None') : undefined)}
            {renderField('Virus Scanning', entity.scanVirus || 'Disable', null, true, hasComparison ? (compareEntity.scanVirus || 'Disable') : undefined)}
            {renderField('Zero Day Protection', entity.zeroDayProtection || 'Disable', null, true, hasComparison ? (compareEntity.zeroDayProtection || 'Disable') : undefined)}
            {renderField('Proxy Mode', entity.proxyMode || 'Disable', null, true, hasComparison ? (compareEntity.proxyMode || 'Disable') : undefined)}
            {renderField('HTTPS Decryption', entity.decryptHTTPS || 'Disable', null, true, hasComparison ? (compareEntity.decryptHTTPS || 'Disable') : undefined)}
          </div>
        </div>
      </div>
    )
  }

  // Generic entity rendering - group fields logically
  const { _entityType, name, ...fields } = entity
  // Only use compareFieldsObj if compareEntity actually exists (not for newly added/removed entities)
  const hasComparison = compareEntity !== undefined && compareEntity !== null
  const compareFieldsObj = hasComparison ? Object.fromEntries(
    Object.keys(compareEntity).filter(k => k !== '_entityType' && k !== 'name').map(k => [k, compareEntity[k]])
  ) : {}
  
  // Priority fields to show first (sorted)
  const priorityFields = ['Name', 'Description', 'Status', 'Type', 'IPAddress', 'MACAddress', 'FQDN', 'IPFamily', 'PolicyType']
  const allFieldKeys = Object.keys(fields).sort() // Sort all keys alphabetically
  const priorityFieldKeys = priorityFields.filter(k => fields.hasOwnProperty(k))
  const otherFieldKeys = allFieldKeys.filter(k => !priorityFields.includes(k))
  
  // Group fields into sections (sorted)
  const basicFields = {}
  const otherFieldsObj = {}
  
  priorityFieldKeys.forEach(key => {
    basicFields[key] = fields[key]
  })
  
  otherFieldKeys.forEach(key => {
    otherFieldsObj[key] = fields[key]
  })

  return (
    <div className="p-4 space-y-4">
      {/* Basic Information */}
      {Object.keys(basicFields).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Information</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {Object.entries(basicFields).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              const highlight = (key === 'Status' && value === 'Enable') ? 'green' : 
                               (key === 'Status' && value === 'Disable') ? 'red' : null
              return <Fragment key={key}>{renderField(label, value, highlight, true, hasComparison ? compareFieldsObj[key] : undefined)}</Fragment>
            })}
          </div>
        </div>
      )}

      {/* Additional Fields */}
      {Object.keys(otherFieldsObj).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Additional Details</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {Object.entries(otherFieldsObj).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              return <Fragment key={key}>{renderField(label, value, null, true, hasComparison ? compareFieldsObj[key] : undefined)}</Fragment>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Deep comparison helper - accurately compares values including nested structures
function deepCompareValues(oldValue, newValue) {
  // Handle null/undefined
  if (oldValue === null || oldValue === undefined) {
    if (newValue === null || newValue === undefined) return { type: 'unchanged' }
    return { type: 'added', oldValue: null, newValue }
  }
  if (newValue === null || newValue === undefined) {
    return { type: 'removed', oldValue, newValue: null }
  }

  // Handle arrays
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    const oldArr = Array.isArray(oldValue) ? oldValue : []
    const newArr = Array.isArray(newValue) ? newValue : []
    
    // Check if arrays contain objects
    const oldHasObjects = oldArr.length > 0 && typeof oldArr[0] === 'object' && oldArr[0] !== null && !Array.isArray(oldArr[0])
    const newHasObjects = newArr.length > 0 && typeof newArr[0] === 'object' && newArr[0] !== null && !Array.isArray(newArr[0])
    
    if (oldHasObjects || newHasObjects) {
      // Array of objects - compare by content, not just index
      // Create maps to match objects by their content signature
      const oldItemMap = new Map()
      const newItemMap = new Map()
      
      // Index old items by their JSON signature
      oldArr.forEach((item, idx) => {
        const signature = JSON.stringify(item)
        if (!oldItemMap.has(signature)) {
          oldItemMap.set(signature, [])
        }
        oldItemMap.get(signature).push({ item, originalIndex: idx })
      })
      
      // Index new items by their JSON signature
      newArr.forEach((item, idx) => {
        const signature = JSON.stringify(item)
        if (!newItemMap.has(signature)) {
          newItemMap.set(signature, [])
        }
        newItemMap.get(signature).push({ item, originalIndex: idx })
      })
      
      // Track which items have been matched
      const oldMatched = new Set()
      const newMatched = new Set()
      const items = []
      
      // First pass: find exact matches (unchanged items)
      oldItemMap.forEach((oldEntries, signature) => {
        if (newItemMap.has(signature)) {
          const newEntries = newItemMap.get(signature)
          const minCount = Math.min(oldEntries.length, newEntries.length)
          for (let i = 0; i < minCount; i++) {
            const oldEntry = oldEntries[i]
            const newEntry = newEntries[i]
            oldMatched.add(oldEntry.originalIndex)
            newMatched.add(newEntry.originalIndex)
            items.push({
              index: items.length,
              type: 'unchanged',
              oldItem: oldEntry.item,
              newItem: newEntry.item,
              oldIndex: oldEntry.originalIndex,
              newIndex: newEntry.originalIndex
            })
          }
        }
      })
      
      // Second pass: find modified items (same position but different content)
      // Compare items at same index if not already matched
      const maxLen = Math.max(oldArr.length, newArr.length)
      for (let i = 0; i < maxLen; i++) {
        const oldItem = oldArr[i]
        const newItem = newArr[i]
        
        if (oldItem !== undefined && newItem !== undefined && 
            !oldMatched.has(i) && !newMatched.has(i)) {
          // Items at same index but different content - check if they're similar (modified)
          const oldStr = JSON.stringify(oldItem)
          const newStr = JSON.stringify(newItem)
          if (oldStr !== newStr) {
            // Check if they share some keys (modified) vs completely different (removed+added)
            const oldKeys = Object.keys(oldItem)
            const newKeys = Object.keys(newItem)
            const sharedKeys = oldKeys.filter(k => newKeys.includes(k))
            
            if (sharedKeys.length > 0) {
              // Modified - same structure, different values
              oldMatched.add(i)
              newMatched.add(i)
              items.push({
                index: items.length,
                type: 'modified',
                oldItem,
                newItem,
                oldIndex: i,
                newIndex: i
              })
            }
          }
        }
      }
      
      // Third pass: identify remaining items as added or removed
      oldArr.forEach((oldItem, idx) => {
        if (!oldMatched.has(idx)) {
          items.push({
            index: items.length,
            type: 'removed',
            oldItem,
            newItem: null,
            oldIndex: idx,
            newIndex: null
          })
        }
      })
      
      newArr.forEach((newItem, idx) => {
        if (!newMatched.has(idx)) {
          items.push({
            index: items.length,
            type: 'added',
            oldItem: null,
            newItem,
            oldIndex: null,
            newIndex: idx
          })
        }
      })
      
      const hasChanges = items.some(item => item.type !== 'unchanged')
      return {
        type: hasChanges ? 'modified' : 'unchanged',
        oldValue,
        newValue,
        items,
        isArrayOfObjects: true
      }
    } else {
      // Simple array - compare sets (order-independent)
      const oldSet = new Set(oldArr.map(v => String(v)))
      const newSet = new Set(newArr.map(v => String(v)))
      
      const removed = oldArr.filter(v => !newSet.has(String(v)))
      const added = newArr.filter(v => !oldSet.has(String(v)))
      const unchanged = oldArr.filter(v => newSet.has(String(v)))
      
      if (removed.length === 0 && added.length === 0) {
        return { type: 'unchanged', oldValue, newValue }
      }
      
      return {
        type: 'modified',
        oldValue,
        newValue,
        removed,
        added,
        unchanged,
        isSimpleArray: true
      }
    }
  }

  // Handle objects
  if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
    const oldKeys = Object.keys(oldValue)
    const newKeys = Object.keys(newValue)
    const allKeys = new Set([...oldKeys, ...newKeys])
    
    const fields = {}
    let hasChanges = false
    
    allKeys.forEach(key => {
      const fieldDiff = deepCompareValues(oldValue[key], newValue[key])
      if (fieldDiff.type !== 'unchanged') hasChanges = true
      fields[key] = fieldDiff
    })
    
    return {
      type: hasChanges ? 'modified' : 'unchanged',
      oldValue,
      newValue,
      fields,
      isObject: true
    }
  }

  // Handle primitive values
  if (String(oldValue) === String(newValue)) {
    return { type: 'unchanged', oldValue, newValue }
  }
  
  return { type: 'modified', oldValue, newValue }
}

// Render entity with highlights for changed fields (for side-by-side view)
function renderEntityWithHighlights(newEntity, oldEntity, tagName) {
  if (!newEntity) return null
  
  // Helper to format nested structures
  const formatNestedValue = (value, indent = 0) => {
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        return value.map((obj, idx) => {
          const objStr = Object.entries(obj)
            .map(([k, v]) => {
              const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
              if (Array.isArray(v)) {
                if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
                  return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
                } else {
                  return `${formattedKey}: ${v.join(', ')}`
                }
              } else if (typeof v === 'object' && v !== null) {
                return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
              }
              return `${formattedKey}: ${v}`
            })
            .join('; ')
          return `[${idx + 1}] ${objStr}`
        }).join(' | ')
      } else {
        return value.join(', ')
      }
    } else if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => {
          const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
          if (Array.isArray(v)) {
            if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
              return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
            } else {
              return `${formattedKey}: ${v.join(', ')}`
            }
          } else if (typeof v === 'object' && v !== null) {
            return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
          }
          return `${formattedKey}: ${v}`
        })
        .join('; ')
    }
    return String(value)
  }

  // Render field with accurate diff highlighting (NEW view - shows GREEN for added, normal for unchanged)
  const renderFieldWithHighlights = (label, newValue, oldValue, showEmpty = false, highlight = null) => {
    if (!showEmpty) {
      if ((oldValue === null || oldValue === undefined || oldValue === '') && 
          (newValue === null || newValue === undefined || newValue === '')) return null
      if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === 0 && newValue.length === 0) return null
    }
    
    // If there's no comparison value (oldValue is undefined), just render normally without highlighting
    // This happens for newly added entities where there's no old/new comparison
    if (oldValue === undefined) {
      // No comparison - just render the value normally
      let displayValue = ''
      if (Array.isArray(newValue)) {
        if (newValue.length > 0 && typeof newValue[0] === 'object' && newValue[0] !== null && !Array.isArray(newValue[0])) {
          displayValue = formatNestedValue(newValue)
        } else {
          displayValue = newValue.map(v => {
            if (typeof v === 'object' && v !== null) {
              return formatNestedValue([v])
            }
            return String(v)
          }).join(', ')
        }
      } else if (typeof newValue === 'object' && newValue !== null) {
        displayValue = formatNestedValue(newValue)
      } else {
        displayValue = String(newValue || '')
      }
      
      // Apply only the provided highlight (for status fields, etc.), not diff-based highlighting
      let colorClass = 'text-gray-700'
      if (highlight === 'green') {
        colorClass = 'text-green-700'
      } else if (highlight === 'red') {
        colorClass = 'text-red-700'
      }
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <span className={`text-sm flex-1 ${colorClass} break-words`} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {displayValue || '(empty)'}
          </span>
        </div>
      )
    }
    
    // Perform deep comparison only when we have both old and new values
    const diff = deepCompareValues(oldValue, newValue)
    
    // Handle simple arrays with diff highlighting
    if (diff.isSimpleArray && diff.type !== 'unchanged') {
    const parts = []
      
      // Unchanged items (normal color)
      if (diff.unchanged && diff.unchanged.length > 0) {
        parts.push(
          <span key="unchanged" className="text-gray-700">
            {diff.unchanged.join(', ')}
            {(diff.removed.length > 0 || diff.added.length > 0) && ', '}
            </span>
          )
      }
      
      // Removed items (not shown in NEW view, but we show what's missing)
      // Actually, in NEW view we don't show removed items, they're in OLD view
      
      // Added items (GREEN)
      if (diff.added && diff.added.length > 0) {
      parts.push(
          <span key="added" className="text-green-700 font-semibold bg-green-50 px-1 rounded">
            {diff.added.join(', ')}
        </span>
      )
      }
    
    return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {parts.length > 0 ? parts : <span className="text-gray-400 italic">(empty)</span>}
          </div>
        </div>
      )
    }
    
    // Handle array of objects with diff highlighting
    if (diff.isArrayOfObjects && diff.items) {
      const parts = []
      diff.items.forEach((item, idx) => {
        if (idx > 0) {
          parts.push(<span key={`sep-${idx}`}> | </span>)
        }
        
        if (item.type === 'added') {
          // Added item - GREEN
          const formattedItem = formatNestedValue([item.newItem])
          const itemText = formattedItem.replace(/^\[1\]\s*/, '')
          parts.push(
            <span key={idx} className="text-green-700 font-semibold bg-green-50 px-1 rounded">
              [{item.index + 1}] {itemText}
            </span>
          )
        } else if (item.type === 'removed') {
          // Removed item - not shown in NEW view (shown in OLD view)
          // Skip it here
        } else if (item.type === 'modified') {
          // Modified item - show new value with YELLOW/ORANGE highlighting
          const formattedItem = formatNestedValue([item.newItem])
          const itemText = formattedItem.replace(/^\[1\]\s*/, '')
          parts.push(
            <span key={idx} className="text-yellow-700 font-semibold bg-yellow-50 px-1 rounded">
              [{item.index + 1}] {itemText}
            </span>
          )
        } else {
          // Unchanged item - normal color
          const formattedItem = formatNestedValue([item.newItem || item.oldItem])
        const itemText = formattedItem.replace(/^\[1\]\s*/, '')
        parts.push(
          <span key={idx} className="text-gray-700">
              [{item.index + 1}] {itemText}
          </span>
        )
        }
      })
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {parts.length > 0 ? parts : <span className="text-gray-400 italic">(empty)</span>}
          </div>
        </div>
      )
    }
    
    // Handle nested objects with diff highlighting
    if (diff.isObject && diff.fields) {
      const parts = []
      Object.entries(diff.fields).forEach(([key, fieldDiff]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
        let nestedDisplay = ''
        
        if (fieldDiff.type === 'added') {
          // Added field - GREEN
          if (Array.isArray(fieldDiff.newValue)) {
            nestedDisplay = Array.isArray(fieldDiff.newValue) ? fieldDiff.newValue.join(', ') : ''
          } else {
            nestedDisplay = String(fieldDiff.newValue || '')
          }
          parts.push(
            <div key={key} className="mb-1">
              <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
              <span className="text-sm text-green-700 font-semibold bg-green-50 px-1 rounded">{nestedDisplay}</span>
            </div>
          )
        } else if (fieldDiff.type === 'removed') {
          // Removed field - not shown in NEW view
        } else if (fieldDiff.type === 'modified') {
          // Modified field - show new value in YELLOW/ORANGE
          if (Array.isArray(fieldDiff.newValue)) {
            nestedDisplay = Array.isArray(fieldDiff.newValue) ? fieldDiff.newValue.join(', ') : ''
          } else if (typeof fieldDiff.newValue === 'object' && fieldDiff.newValue !== null) {
            nestedDisplay = formatNestedValue(fieldDiff.newValue)
          } else {
            nestedDisplay = String(fieldDiff.newValue || '')
          }
          parts.push(
            <div key={key} className="mb-1">
              <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
              <span className="text-sm text-yellow-700 font-semibold bg-yellow-50 px-1 rounded">{nestedDisplay}</span>
            </div>
          )
        } else {
          // Unchanged field - normal color
          if (Array.isArray(fieldDiff.newValue)) {
            nestedDisplay = Array.isArray(fieldDiff.newValue) ? fieldDiff.newValue.join(', ') : ''
          } else if (typeof fieldDiff.newValue === 'object' && fieldDiff.newValue !== null) {
            nestedDisplay = formatNestedValue(fieldDiff.newValue)
          } else {
            nestedDisplay = String(fieldDiff.newValue || '')
          }
          parts.push(
            <div key={key} className="mb-1">
              <span className="text-xs font-semibold text-gray-600">{formattedKey}: </span>
              <span className="text-sm text-gray-700">{nestedDisplay}</span>
            </div>
          )
        }
      })
      
      if (parts.length > 0) {
        return (
          <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
            <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
            <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
              {parts}
            </div>
          </div>
        )
      }
    }
    
    // Regular field rendering with highlighting
    let displayValue = ''
    let isAdded = false
    let isModified = false
    
    if (diff.type === 'added') {
      isAdded = true
      displayValue = String(newValue || '')
    } else if (diff.type === 'modified') {
      isModified = true
      displayValue = String(newValue || '')
    } else if (Array.isArray(newValue)) {
      if (newValue.length > 0 && typeof newValue[0] === 'object' && newValue[0] !== null && !Array.isArray(newValue[0])) {
        displayValue = formatNestedValue(newValue)
      } else {
        displayValue = newValue.map(v => {
          if (typeof v === 'object' && v !== null) {
            return formatNestedValue([v]).replace(/^\[1\]\s*/, '')
          }
          return String(v)
        }).join(', ')
      }
    } else if (typeof newValue === 'object' && newValue !== null) {
      displayValue = formatNestedValue(newValue)
    } else {
      displayValue = String(newValue || '')
    }
    
    // Apply color based on diff type and highlight parameter
    let colorClass = 'text-gray-700'
    if (highlight === 'green') {
      colorClass = 'text-green-700'
    } else if (highlight === 'red') {
      colorClass = 'text-red-700'
    } else if (isAdded) {
      colorClass = 'text-green-700 font-semibold bg-green-50 px-1 rounded'
    } else if (isModified) {
      colorClass = 'text-yellow-700 font-semibold bg-yellow-50 px-1 rounded'
    }
    
    return (
      <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
        <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
        <span className={`text-sm flex-1 ${colorClass} break-words`} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
          {displayValue || '(empty)'}
        </span>
      </div>
    )
  }

  // Special rendering for FirewallRule - use same structure as renderEntity
  if (newEntity._entityType === 'FirewallRule') {
    // Only use oldFields if oldEntity actually exists (not for newly added entities)
    const hasComparison = oldEntity !== undefined && oldEntity !== null
    
    return (
      <div className="p-4 space-y-4">
        {/* Basic Information */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Information</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderFieldWithHighlights('Name', newEntity.name, hasComparison ? oldEntity.name : undefined, true)}
            {renderFieldWithHighlights('Description', newEntity.description, hasComparison ? oldEntity.description : undefined, true)}
            {renderFieldWithHighlights('Status', newEntity.status, hasComparison ? oldEntity.status : undefined, true, newEntity.status === 'Enable' ? 'green' : null)}
            {renderFieldWithHighlights('Policy Type', newEntity.policyType, hasComparison ? oldEntity.policyType : undefined, true)}
            {renderFieldWithHighlights('IP Family', newEntity.ipFamily, hasComparison ? oldEntity.ipFamily : undefined, true)}
            {renderFieldWithHighlights('Position', newEntity.position, hasComparison ? oldEntity.position : undefined, true)}
            {newEntity.after && renderFieldWithHighlights('Positioned After', newEntity.after, hasComparison ? oldEntity.after : undefined, true)}
          </div>
        </div>

        {/* Action & Traffic */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Action & Traffic Control</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderFieldWithHighlights('Action', newEntity.action, hasComparison ? oldEntity.action : undefined, true, newEntity.action === 'Accept' ? 'green' : newEntity.action === 'Deny' ? 'red' : null)}
            {renderFieldWithHighlights('Log Traffic', newEntity.logTraffic, hasComparison ? oldEntity.logTraffic : undefined, true)}
            {renderFieldWithHighlights('Schedule', newEntity.schedule || 'All The Time', hasComparison ? (oldEntity.schedule || 'All The Time') : undefined, true)}
          </div>
        </div>

        {/* Source Configuration */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Source Configuration</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderFieldWithHighlights('Source Zones', newEntity.sourceZones && newEntity.sourceZones.length > 0 ? newEntity.sourceZones : ['Any'], hasComparison ? (oldEntity.sourceZones && oldEntity.sourceZones.length > 0 ? oldEntity.sourceZones : ['Any']) : undefined, true)}
            {renderFieldWithHighlights('Source Networks', newEntity.sourceNetworks && newEntity.sourceNetworks.length > 0 ? newEntity.sourceNetworks : ['Any'], hasComparison ? (oldEntity.sourceNetworks && oldEntity.sourceNetworks.length > 0 ? oldEntity.sourceNetworks : ['Any']) : undefined, true)}
          </div>
        </div>

        {/* Destination Configuration */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Destination Configuration</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderFieldWithHighlights('Destination Zones', newEntity.destinationZones && newEntity.destinationZones.length > 0 ? newEntity.destinationZones : ['Any'], hasComparison ? (oldEntity.destinationZones && oldEntity.destinationZones.length > 0 ? oldEntity.destinationZones : ['Any']) : undefined, true)}
            {renderFieldWithHighlights('Destination Networks', newEntity.destinationNetworks && newEntity.destinationNetworks.length > 0 ? newEntity.destinationNetworks : ['Any'], hasComparison ? (oldEntity.destinationNetworks && oldEntity.destinationNetworks.length > 0 ? oldEntity.destinationNetworks : ['Any']) : undefined, true)}
            {renderFieldWithHighlights('Services/Ports', newEntity.services && newEntity.services.length > 0 ? newEntity.services : ['Any'], hasComparison ? (oldEntity.services && oldEntity.services.length > 0 ? oldEntity.services : ['Any']) : undefined, true)}
          </div>
        </div>

        {/* Security Features */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Security Features</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {renderFieldWithHighlights('Web Filter', newEntity.webFilter || 'None', hasComparison ? (oldEntity.webFilter || 'None') : undefined, true)}
            {renderFieldWithHighlights('Application Control', newEntity.applicationControl || 'None', hasComparison ? (oldEntity.applicationControl || 'None') : undefined, true)}
            {renderFieldWithHighlights('Intrusion Prevention', newEntity.intrusionPrevention || 'None', hasComparison ? (oldEntity.intrusionPrevention || 'None') : undefined, true)}
            {renderFieldWithHighlights('Virus Scanning', newEntity.scanVirus || 'Disable', hasComparison ? (oldEntity.scanVirus || 'Disable') : undefined, true)}
            {renderFieldWithHighlights('Zero Day Protection', newEntity.zeroDayProtection || 'Disable', hasComparison ? (oldEntity.zeroDayProtection || 'Disable') : undefined, true)}
            {renderFieldWithHighlights('Proxy Mode', newEntity.proxyMode || 'Disable', hasComparison ? (oldEntity.proxyMode || 'Disable') : undefined, true)}
            {renderFieldWithHighlights('HTTPS Decryption', newEntity.decryptHTTPS || 'Disable', hasComparison ? (oldEntity.decryptHTTPS || 'Disable') : undefined, true)}
          </div>
        </div>
      </div>
    )
  }

  // Generic entity rendering - group fields logically (same structure as renderEntity)
  const { _entityType, name, ...fields } = newEntity
  // Only use oldFieldsObj if oldEntity actually exists (not for newly added entities)
  const hasComparison = oldEntity !== undefined && oldEntity !== null
  const oldFieldsObj = hasComparison ? Object.fromEntries(
    Object.keys(oldEntity).filter(k => k !== '_entityType' && k !== 'name').map(k => [k, oldEntity[k]])
  ) : {}
  
  // Priority fields to show first (sorted)
  const priorityFields = ['Name', 'Description', 'Status', 'Type', 'IPAddress', 'MACAddress', 'FQDN', 'IPFamily', 'PolicyType']
  const allFieldKeys = Object.keys(fields).sort() // Sort all keys alphabetically
  const priorityFieldKeys = priorityFields.filter(k => fields.hasOwnProperty(k))
  const otherFieldKeys = allFieldKeys.filter(k => !priorityFields.includes(k))
  
  // Group fields into sections (sorted)
  const basicFields = {}
  const otherFieldsObj = {}
  
  priorityFieldKeys.forEach(key => {
    basicFields[key] = fields[key]
  })
  
  otherFieldKeys.forEach(key => {
    otherFieldsObj[key] = fields[key]
  })

  return (
    <div className="p-4 space-y-4">
      {/* Basic Information */}
      {Object.keys(basicFields).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Information</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {Object.entries(basicFields).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              const highlight = (key === 'Status' && value === 'Enable') ? 'green' : 
                               (key === 'Status' && value === 'Disable') ? 'red' : null
              return <Fragment key={key}>{renderFieldWithHighlights(label, value, hasComparison ? oldFieldsObj[key] : undefined, true, highlight)}</Fragment>
            })}
          </div>
        </div>
      )}

      {/* Additional Fields */}
      {Object.keys(otherFieldsObj).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Additional Details</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {Object.entries(otherFieldsObj).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              return <Fragment key={key}>{renderFieldWithHighlights(label, value, hasComparison ? oldFieldsObj[key] : undefined, true)}</Fragment>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Render entity with diff comparison (for modified entities)
function renderEntityWithDiff(oldEntity, newEntity, tagName) {
  if (!oldEntity || !newEntity) return null
  
  // Helper to compare arrays and highlight differences
  const compareArrays = (oldArr, newArr) => {
    if (!Array.isArray(oldArr) && !Array.isArray(newArr)) return null
    const old = Array.isArray(oldArr) ? oldArr : []
    const new_ = Array.isArray(newArr) ? newArr : []
    
    const oldSet = new Set(old)
    const newSet = new Set(new_)
    
    const removed = old.filter(item => !newSet.has(item))
    const added = new_.filter(item => !oldSet.has(item))
    const unchanged = old.filter(item => newSet.has(item))
    
    return { removed, added, unchanged }
  }

  // Helper to format nested structures for display
  const formatNestedValue = (value, indent = 0) => {
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        // Array of objects - format each object (e.g., RuleList with multiple Rules)
        return value.map((obj, idx) => {
          const objStr = Object.entries(obj)
            .map(([k, v]) => {
              const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
              if (Array.isArray(v)) {
                // Check if array contains objects or simple values
                if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
                  // Nested array of objects - format recursively
                  return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
                } else {
                  // Simple array (like CategoryList) - comma separated
                  return `${formattedKey}: ${v.join(', ')}`
                }
              } else if (typeof v === 'object' && v !== null) {
                return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
              }
              return `${formattedKey}: ${v}`
            })
            .join('; ')
          return `[${idx + 1}] ${objStr}`
        }).join(' | ')
      } else {
        return value.join(', ')
      }
    } else if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => {
          const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
          if (Array.isArray(v)) {
            // Check if array contains objects or simple values
            if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
              return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
            } else {
              return `${formattedKey}: ${v.join(', ')}`
            }
          } else if (typeof v === 'object' && v !== null) {
            return `${formattedKey}: ${formatNestedValue(v, indent + 1)}`
          }
          return `${formattedKey}: ${v}`
        })
        .join('; ')
    }
    return String(value)
  }

  // Render field with diff highlighting
  const renderFieldWithDiff = (label, oldValue, newValue, showEmpty = false) => {
    if (!showEmpty) {
      if ((oldValue === null || oldValue === undefined || oldValue === '') && 
          (newValue === null || newValue === undefined || newValue === '')) return null
      if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === 0 && newValue.length === 0) return null
    }
    
    // Compare arrays if both are arrays
    const arrayDiff = compareArrays(oldValue, newValue)
    const isArrayComparison = arrayDiff !== null && (arrayDiff.removed.length > 0 || arrayDiff.added.length > 0 || arrayDiff.unchanged.length > 0)
    
    if (isArrayComparison) {
      // Render with highlighting
      const parts = []
      
      // Unchanged items
      if (arrayDiff.unchanged.length > 0) {
        parts.push(
          <span key="unchanged" className="text-gray-700">
            {arrayDiff.unchanged.join(', ')}
            {(arrayDiff.removed.length > 0 || arrayDiff.added.length > 0) && ', '}
          </span>
        )
      }
      
      // Removed items (red) - no strikethrough, just color
      if (arrayDiff.removed.length > 0) {
        parts.push(
          <span key="removed" className="text-red-700 font-semibold bg-red-50 px-1 rounded">
            {arrayDiff.removed.join(', ')}
            {arrayDiff.added.length > 0 && ', '}
          </span>
        )
      }
      
      // Added items (green)
      if (arrayDiff.added.length > 0) {
        parts.push(
          <span key="added" className="text-green-700 font-semibold bg-green-50 px-1 rounded">
            {arrayDiff.added.join(', ')}
          </span>
        )
      }
      
      return (
        <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
          <div className="text-sm flex-1 break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
            {parts.length > 0 ? parts : <span className="text-gray-400 italic">(empty)</span>}
          </div>
        </div>
      )
    }
    
    // Regular field rendering - check if values differ
    const valuesDiffer = JSON.stringify(oldValue) !== JSON.stringify(newValue)
    const displayValue = newValue !== undefined ? newValue : oldValue
    
    let formattedValue = ''
    if (Array.isArray(displayValue)) {
      // Check if array contains objects
      if (displayValue.length > 0 && typeof displayValue[0] === 'object' && displayValue[0] !== null && !Array.isArray(displayValue[0])) {
        // Array of objects - format properly
        formattedValue = formatNestedValue(displayValue)
      } else {
        // Simple array - comma separated
        formattedValue = displayValue.join(', ')
      }
    } else if (typeof displayValue === 'object' && displayValue !== null) {
      formattedValue = formatNestedValue(displayValue)
    } else {
      formattedValue = String(displayValue || '')
    }
    
    const color = valuesDiffer ? 'text-yellow-700' : 'text-gray-700'
    return (
      <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-b-0">
        <span className="text-xs font-semibold text-gray-600 w-40 flex-shrink-0">{label}:</span>
        <span className={`text-sm flex-1 ${color} break-words`} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
          {formattedValue || '(empty)'}
        </span>
      </div>
    )
  }
  
  // Get all unique field keys from both entities
  const allKeys = new Set([
    ...Object.keys(oldEntity).filter(k => k !== '_entityType' && k !== 'name'),
    ...Object.keys(newEntity).filter(k => k !== '_entityType' && k !== 'name')
  ])
  
  // Priority fields to show first (sorted)
  const priorityFields = ['Name', 'Description', 'Status', 'Type', 'IPAddress', 'MACAddress', 'FQDN', 'IPFamily', 'PolicyType']
  const allFieldKeys = Array.from(allKeys).sort() // Sort all keys alphabetically
  const priorityFieldKeys = priorityFields.filter(k => allKeys.has(k))
  const otherFieldKeys = allFieldKeys.filter(k => !priorityFields.includes(k))
  
  return (
    <div className="p-4 space-y-4">
      {/* Basic Information */}
      {priorityFieldKeys.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Basic Information</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {priorityFieldKeys.map(key => {
              const oldValue = oldEntity[key]
              const newValue = newEntity[key]
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              return <Fragment key={key}>{renderFieldWithDiff(label, oldValue, newValue, true)}</Fragment>
            })}
          </div>
        </div>
      )}

      {/* Additional Fields */}
      {otherFieldKeys.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Additional Details</h4>
          <div className="bg-gray-50 rounded p-3 space-y-1">
            {otherFieldKeys.map(key => {
              const oldValue = oldEntity[key]
              const newValue = newEntity[key]
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              return <Fragment key={key}>{renderFieldWithDiff(label, oldValue, newValue, true)}</Fragment>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DiffItem({ item, type, isExpanded, onToggle }) {
  const getIcon = () => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'removed':
        return <Minus className="w-4 h-4 text-red-600" />
      case 'modified':
        return <span className="text-yellow-600 font-bold text-lg">~</span>
      default:
        return null
    }
  }

  // Parse entity for readable display
  const parsedEntity = useMemo(() => {
    if (type === 'modified') {
      return {
        old: parseEntityFromXml(item.oldRawXml, item.tag),
        new: parseEntityFromXml(item.newRawXml, item.tag)
      }
    } else {
      return parseEntityFromXml(item.rawXml, item.tag)
    }
  }, [item, type])

  // Helper to format value for GitHub-style diff
  const formatValue = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Split by newlines for multi-line values
    return str.split('\n')
  }

  // Helper to render GitHub-style diff lines
  const renderDiffLines = (oldValue, newValue, fieldName) => {
    if (oldValue === null && newValue === null) return []
    if (oldValue === null) {
      // All new
      const newLines = formatValue(newValue)
      return newLines.map((line, i) => ({ type: 'added', old: null, new: line, oldLineNum: null, newLineNum: i + 1 }))
    }
    if (newValue === null) {
      // All removed
      const oldLines = formatValue(oldValue)
      return oldLines.map((line, i) => ({ type: 'removed', old: line, new: null, oldLineNum: i + 1, newLineNum: null }))
    }
    
    const oldLines = formatValue(oldValue)
    const newLines = formatValue(newValue)
    
    // Simple line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length)
    const lines = []
    let oldLineNum = 0
    let newLineNum = 0

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]
      
      if (oldLine === undefined && newLine !== undefined) {
        // Added line
        newLineNum++
        lines.push({ type: 'added', old: null, new: newLine, oldLineNum: null, newLineNum })
      } else if (oldLine !== undefined && newLine === undefined) {
        // Removed line
        oldLineNum++
        lines.push({ type: 'removed', old: oldLine, new: null, oldLineNum, newLineNum: null })
      } else if (oldLine !== newLine) {
        // Modified line - show both
        oldLineNum++
        newLineNum++
        lines.push({ type: 'removed', old: oldLine, new: null, oldLineNum, newLineNum: null })
        lines.push({ type: 'added', old: null, new: newLine, oldLineNum: null, newLineNum })
      } else {
        // Unchanged line
        oldLineNum++
        newLineNum++
        lines.push({ type: 'unchanged', old: oldLine, new: newLine, oldLineNum, newLineNum })
      }
    }

    return lines
  }

  return (
    <div className="border-l-4 border-gray-300 bg-gray-50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors bg-white"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {getIcon()}
          <span className="font-medium text-gray-900">{item.name || formatTagName(item.tag || '') || 'Unnamed'}</span>
          {type === 'modified' && item.changes && (
            <span className="text-sm text-gray-500">
              ({item.changes.length} field{item.changes.length !== 1 ? 's' : ''} changed)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="bg-white border-t border-gray-200">
          {type === 'modified' && parsedEntity.old && parsedEntity.new ? (
            // Entity - Modified: Show side-by-side comparison with highlighted changes
            <div className="grid grid-cols-2 gap-4 p-4">
              <div className="border-r border-gray-200 pr-4">
                <div className="mb-3 pb-2 border-b border-red-200">
                  <h3 className="text-sm font-semibold text-red-700 uppercase">Old / Current</h3>
                </div>
                {renderEntity(parsedEntity.old, 'removed', item.tag, parsedEntity.new)}
              </div>
              <div className="pl-4">
                <div className="mb-3 pb-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">New / Updated</h3>
                </div>
                {renderEntityWithHighlights(parsedEntity.new, parsedEntity.old, item.tag)}
              </div>
            </div>
          ) : (type === 'added' || type === 'removed') && parsedEntity ? (
            // Entity - Added/Removed: Show readable format
            <div className={`p-4 ${type === 'removed' ? 'bg-red-50' : 'bg-green-50'}`}>
              {renderEntity(parsedEntity, type, item.tag)}
            </div>
          ) : type === 'modified' && item.changes ? (
            // GitHub-style unified diff for modified items
            <div className="overflow-x-auto">
              {item.changes.map((change, idx) => {
                const lines = renderDiffLines(change.oldValue, change.newValue, change.field)
                const hasChanges = lines.some(l => l.type !== 'unchanged')
                
                return (
                  <div key={idx} className="border-b border-gray-200 last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {change.field}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-mono text-sm" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                        <tbody>
                          {hasChanges ? (
                            lines.map((line, lineIdx) => {
                              // Skip consecutive unchanged lines if there are many (show context)
                              const prevLine = lines[lineIdx - 1]
                              const nextLine = lines[lineIdx + 1]
                              const shouldSkip = line.type === 'unchanged' && 
                                lines.length > 20 && 
                                prevLine?.type === 'unchanged' && 
                                nextLine?.type === 'unchanged'
                              
                              if (shouldSkip) return null
                              
                              return (
                                <tr
                                  key={lineIdx}
                                  className={`
                                    ${line.type === 'removed' ? 'bg-red-50 hover:bg-red-100' : ''}
                                    ${line.type === 'added' ? 'bg-green-50 hover:bg-green-100' : ''}
                                    ${line.type === 'unchanged' ? 'bg-white hover:bg-gray-50' : ''}
                                    border-b border-gray-100
                                  `}
                                >
                                  <td className="px-4 py-0.5 text-right text-gray-500 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}>
                                    {line.oldLineNum || ''}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-gray-500 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}>
                                    {line.newLineNum || ''}
                                  </td>
                                  <td className="px-4 py-0.5 pl-4 break-all">
                                    {line.type === 'removed' && (
                                      <span className="text-red-800 whitespace-pre-wrap">- {line.old || ''}</span>
                                    )}
                                    {line.type === 'added' && (
                                      <span className="text-green-800 whitespace-pre-wrap">+ {line.new || ''}</span>
                                    )}
                                    {line.type === 'unchanged' && (
                                      <span className="text-gray-700 whitespace-pre-wrap">  {line.old || ''}</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-center text-gray-500 italic">
                                (no changes)
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // GitHub-style diff for added/removed items
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-sm" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                <tbody>
                  {type === 'removed' && item.rawXml && (
                    <tr className="bg-red-50 hover:bg-red-100 border-b border-gray-100">
                      <td className="px-4 py-0.5 text-right text-gray-500 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}>
                        1
                      </td>
                      <td className="px-4 py-0.5 text-right text-gray-400 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}></td>
                      <td className="px-4 py-0.5 pl-4 text-red-800 whitespace-pre-wrap break-all">
                        - {item.rawXml}
                      </td>
                    </tr>
                  )}
                  {type === 'added' && item.rawXml && (
                    <tr className="bg-green-50 hover:bg-green-100 border-b border-gray-100">
                      <td className="px-4 py-0.5 text-right text-gray-400 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}></td>
                      <td className="px-4 py-0.5 text-right text-gray-500 select-none border-r border-gray-200 w-12 bg-gray-50" style={{ userSelect: 'none' }}>
                        1
                      </td>
                      <td className="px-4 py-0.5 pl-4 text-green-800 whitespace-pre-wrap break-all">
                        + {item.rawXml}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
