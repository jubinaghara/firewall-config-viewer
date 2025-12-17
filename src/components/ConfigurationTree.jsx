import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown, Network, Search, X, ArrowLeft, Loader2, Download } from 'lucide-react'
import { buildEntityReferenceTreeAsync, convertToVisualizationTree } from '../utils/entityReferenceTree'
import { generateConfigTreeHTML } from '../utils/configTreeHtmlGenerator'
import { combineStyles } from '../utils/themeUtils'
import theme from '../theme'

/**
 * Configuration Tree Component
 * 
 * Displays a tree structure showing where XML entity names are referenced
 * throughout the configuration file.
 */
function ConfigurationTree({ xmlContent, onClose, onLoadingChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [isBuildingTree, setIsBuildingTree] = useState(true)
  const [referenceTree, setReferenceTree] = useState({})
  const [buildProgress, setBuildProgress] = useState(0)
  const cancelledRef = useRef(false)

  // Build reference tree from XML content asynchronously with progress
  useEffect(() => {
    if (!xmlContent || typeof xmlContent !== 'string') {
      setReferenceTree({})
      setIsBuildingTree(false)
      setBuildProgress(0)
      if (onLoadingChange) onLoadingChange(false)
      return
    }

    cancelledRef.current = false
    setIsBuildingTree(true)
    setBuildProgress(0)
    if (onLoadingChange) onLoadingChange(true)

    // Use async function with progress callback
    const buildTree = async () => {
      try {
        const tree = await buildEntityReferenceTreeAsync(xmlContent, (progress) => {
          if (!cancelledRef.current) {
            setBuildProgress(progress)
          }
        })
        
        if (!cancelledRef.current) {
          setReferenceTree(tree)
        }
      } catch (error) {
        console.error('Error building reference tree:', error)
        if (!cancelledRef.current) {
          setReferenceTree({})
        }
      } finally {
        if (!cancelledRef.current) {
          setIsBuildingTree(false)
          setBuildProgress(100)
          if (onLoadingChange) onLoadingChange(false)
        }
      }
    }

    // Small delay to ensure loading state is visible
    const timeoutId = setTimeout(buildTree, 50)
    
    return () => {
      cancelledRef.current = true
      clearTimeout(timeoutId)
    }
  }, [xmlContent, onLoadingChange])

  // Filter entities based on search term (search by both entity name and tag name)
  // Sort alphabetically by XML tag name first, then by entity name
  const filteredEntities = useMemo(() => {
    const allEntities = Object.keys(referenceTree)
    
    // Sort by tag name first, then by entity name
    const sortedEntities = allEntities.sort((a, b) => {
      const tagA = (referenceTree[a]?.primaryTag || 'Unknown').toLowerCase()
      const tagB = (referenceTree[b]?.primaryTag || 'Unknown').toLowerCase()
      
      // First compare by tag name
      if (tagA !== tagB) {
        return tagA.localeCompare(tagB)
      }
      
      // If tags are the same, sort by entity name
      return a.toLowerCase().localeCompare(b.toLowerCase())
    })
    
    if (!searchTerm.trim()) {
      return sortedEntities
    }
    
    const term = searchTerm.toLowerCase()
    return sortedEntities.filter(name => {
      const entityData = referenceTree[name]
      const entityNameLower = name.toLowerCase()
      const tagNameLower = (entityData?.primaryTag || '').toLowerCase()
      // Search in both entity name and tag name
      return entityNameLower.includes(term) || tagNameLower.includes(term)
    })
  }, [referenceTree, searchTerm])

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Expand all nodes
  const expandAll = () => {
    const allNodes = new Set()
    Object.keys(referenceTree).forEach(entityName => {
      allNodes.add(`entity-${entityName}`)
      const entityRef = referenceTree[entityName]
      if (entityRef && entityRef.references) {
        entityRef.references.forEach((ref, idx) => {
          allNodes.add(`parent-${entityName}-${idx}`)
          allNodes.add(`context-${entityName}-${idx}`)
        })
      }
    })
    setExpandedNodes(allNodes)
  }

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  // Handle entity selection
  const handleEntitySelect = (entityName) => {
    setSelectedEntity(entityName)
    // Auto-expand the selected entity's tree
    const nodeId = `entity-${entityName}`
    setExpandedNodes(prev => new Set([...prev, nodeId]))
  }

  // Render tree node
  const renderTreeNode = (treeData, entityName, level = 0) => {
    if (!treeData || !treeData.children || treeData.children.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic pl-8 py-1">
          No references found
        </div>
      )
    }

    return (
      <div className="pl-4">
        {treeData.children.map((parentEntity, parentIdx) => {
          const parentNodeId = `parent-${entityName}-${parentIdx}`
          const isExpanded = expandedNodes.has(parentNodeId)
          const hasChildren = parentEntity.children && parentEntity.children.length > 0

          return (
            <div key={parentIdx} className="mb-1">
              {/* Parent Entity Node */}
              <div
                className="flex items-center py-1 px-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                style={{
                  paddingLeft: `${level * 16 + 8}px`,
                  backgroundColor: isExpanded ? theme.colors.background.hover : 'transparent'
                }}
                onClick={() => hasChildren && toggleNode(parentNodeId)}
              >
                {hasChildren && (
                  <div className="mr-1 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                )}
                {!hasChildren && <div className="w-5 mr-1" />}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Network className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {parentEntity.parentEntityTag}
                  </span>
                  <span className="text-sm text-gray-600 truncate">
                    {parentEntity.parentEntityName}
                  </span>
                </div>
              </div>

              {/* Context Children */}
              {isExpanded && hasChildren && (
                <div className="ml-4">
                  {parentEntity.children.map((context, ctxIdx) => {
                    const contextNodeId = `context-${entityName}-${parentIdx}-${ctxIdx}`
                    return (
                      <div
                        key={ctxIdx}
                        className="flex items-center py-1 px-2 rounded hover:bg-gray-50"
                        style={{
                          paddingLeft: `${(level + 1) * 16 + 8}px`
                        }}
                      >
                        <div className="w-5 mr-1" />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.colors.secondary.main }}
                          />
                          <span className="text-xs text-gray-700 truncate">
                            {context.contextTag}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            ({context.referenceElement})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const selectedTreeData = selectedEntity && referenceTree[selectedEntity]
    ? convertToVisualizationTree(referenceTree[selectedEntity])
    : null

  // Handle HTML export
  const handleExportHTML = () => {
    if (!referenceTree || Object.keys(referenceTree).length === 0) {
      alert('No usage reference data available to export')
      return
    }

    try {
      const htmlContent = generateConfigTreeHTML(referenceTree, selectedEntity)
      
      // Create and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `configuration-tree-report-${new Date().toISOString().split('T')[0]}.html`
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
          <Network className="w-6 h-6" style={{ color: theme.colors.primary.main }} />
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text.heading }}>
            Usage reference
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHTML}
            disabled={isBuildingTree || Object.keys(referenceTree).length === 0}
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
              if (!isBuildingTree && Object.keys(referenceTree).length > 0) {
                e.target.style.backgroundColor = theme.components.button.primary.hover
              }
            }}
            onMouseLeave={(e) => {
              if (!isBuildingTree && Object.keys(referenceTree).length > 0) {
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
              placeholder="Search entity name..."
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
          {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'} found
        </div>
      </div>

      {/* Main Content */}
      {!xmlContent ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No XML content available</p>
            <p className="text-sm">Please upload a configuration file first</p>
          </div>
        </div>
      ) : isBuildingTree ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center w-full max-w-md">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: theme.colors.primary.main }} />
            <p className="text-lg font-medium mb-2" style={{ color: theme.colors.text.heading }}>
              Building usage references
            </p>
            <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
              {buildProgress < 15 ? 'Parsing XML structure...' :
               buildProgress < 35 ? 'Indexing text nodes...' :
               buildProgress < 95 ? 'Analyzing entity references...' :
               'Finalizing...'}
            </p>
            {/* Progress bar */}
            <div 
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: theme.colors.border.light }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${buildProgress}%`,
                  backgroundColor: theme.colors.primary.main
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>
              {buildProgress}% complete
            </p>
          </div>
        </div>
      ) : (
      <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>
        {/* Entity List */}
        <div
          className="w-1/3 border-r flex flex-col"
          style={{ 
            borderColor: theme.colors.border.light,
            maxHeight: 'calc(100vh - 280px)',
            minHeight: 0
          }}
        >
          <div className="p-4 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {filteredEntities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'No entities found matching your search' : 'No entities found'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredEntities.map((entityName) => {
                  const isSelected = selectedEntity === entityName
                  const entityData = referenceTree[entityName]
                  const refCount = entityData?.references?.length || 0
                  const tagName = entityData?.primaryTag || 'Unknown'
                  return (
                    <div
                      key={entityName}
                      onClick={() => handleEntitySelect(entityName)}
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'font-semibold' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? theme.colors.primary.light : 'transparent',
                        color: isSelected ? theme.colors.primary.main : theme.colors.text.primary
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = theme.colors.background.hover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="text-xs font-medium truncate"
                              style={{ color: theme.colors.text.secondary }}
                            >
                              {tagName}
                            </span>
                            <span className="text-xs text-gray-400">›</span>
                            <span className="text-sm truncate">{entityName}</span>
                          </div>
                        </div>
                        {refCount > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: theme.colors.badge.tag.bg,
                              color: theme.colors.badge.tag.text
                            }}
                          >
                            {refCount}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tree View */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{ 
            maxHeight: 'calc(100vh - 280px)',
            minHeight: 0
          }}
        >
          {!selectedEntity ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Select an entity to view its references</p>
                <p className="text-sm">Choose an entity from the list to see where it's referenced in the configuration</p>
              </div>
            </div>
          ) : selectedTreeData ? (
            <div>
              <div className="mb-4 pb-4 border-b" style={{ borderColor: theme.colors.border.light }}>
                <h3 className="text-lg font-semibold mb-1" style={{ color: theme.colors.text.heading }}>
                  {selectedEntity}
                </h3>
                <p className="text-sm text-gray-600">
                  Referenced in {selectedTreeData.children.length} {selectedTreeData.children.length === 1 ? 'entity' : 'entities'}
                </p>
              </div>
              <div className="tree-container">
                {renderTreeNode(selectedTreeData, selectedEntity)}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No reference data available for this entity</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default ConfigurationTree

