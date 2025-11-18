import { escapeHtml } from './htmlGenerator'
import { formatTagName } from './xmlParser'

/**
 * Generate HTML report for diff view - matches DiffView.jsx format
 */
export function generateHTMLDiff(diffResults, oldFileName, newFileName) {
  const grouped = {}
  
  // Group by entity type
  const allItems = [
    ...diffResults.added.map(item => ({ ...item, changeType: 'added' })),
    ...diffResults.removed.map(item => ({ ...item, changeType: 'removed' })),
    ...diffResults.modified.map(item => ({ ...item, changeType: 'modified' }))
  ]

  allItems.forEach(item => {
    if (!grouped[item.tag]) {
      grouped[item.tag] = {
        tag: item.tag,
        added: [],
        removed: [],
        modified: []
      }
    }
    grouped[item.tag][item.changeType].push(item)
  })

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Parse entity from XML - same logic as DiffView.jsx
  const parseEntityFromXml = (xmlString, tagName) => {
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
            // Simple array of values
            return children.map(c => c.textContent.trim())
          } else {
            // Array of complex objects
            return children.map(c => {
              const obj = {}
              Array.from(c.children).forEach(grandchild => {
                const grandKey = grandchild.tagName
                if (grandchild.children.length === 0) {
                  const text = grandchild.textContent.trim()
                  obj[grandKey] = text
                } else {
                  const grandChildren = Array.from(grandchild.children)
                  if (grandChildren.length > 0) {
                    const grandFirstTag = grandChildren[0]?.tagName
                    const allSameTag = grandFirstTag && grandChildren.every(gc => gc.tagName === grandFirstTag)
                    
                    if (allSameTag) {
                      if (grandChildren.every(gc => gc.children.length === 0)) {
                        obj[grandKey] = grandChildren.map(gc => gc.textContent.trim())
                      } else {
                        obj[grandKey] = grandChildren.map(gc => parseNestedElement(gc))
                      }
                    } else {
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
      
      // Parse all direct children
      Array.from(entityElement.children).forEach(child => {
        const key = child.tagName
        if (child.children.length === 0) {
          fields[key] = child.textContent.trim()
        } else {
          const parsed = parseNestedElement(child)
          fields[key] = parsed
        }
      })

      // Ensure Name is always in fields
      if (name) {
        fields.Name = name
      } else if (fields.Name !== undefined) {
        name = fields.Name
      } else {
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

  // Format nested value for display
  const formatNestedValue = (value) => {
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        // Array of objects
        return value.map((obj, idx) => {
          const objStr = Object.entries(obj)
            .map(([k, v]) => {
              const formattedKey = k.replace(/([A-Z])/g, ' $1').trim()
              if (Array.isArray(v)) {
                if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) {
                  return `${formattedKey}: ${formatNestedValue(v)}`
                } else {
                  return `${formattedKey}: ${v.length > 0 ? v.join(', ') : '(empty)'}`
                }
              } else if (typeof v === 'object' && v !== null) {
                return `${formattedKey}: ${formatNestedValue(v)}`
              }
              const displayValue = (v === '' && (k === 'RuleName' || k === 'Name' || k === 'Description')) ? '(empty)' : (v || '')
              return `${formattedKey}: ${displayValue}`
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
              return `${formattedKey}: ${formatNestedValue(v)}`
            } else {
              return `${formattedKey}: ${v.join(', ')}`
            }
          } else if (typeof v === 'object' && v !== null) {
            return `${formattedKey}: ${formatNestedValue(v)}`
          }
          return `${formattedKey}: ${v}`
        })
        .join('; ')
    }
    return String(value)
  }

  // Render field value
  const renderFieldValue = (value) => {
    if (value === null || value === undefined) return '(empty)'
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        return formatNestedValue(value)
      } else {
        return value.map(v => {
          if (typeof v === 'object' && v !== null) {
            return formatNestedValue([v])
          }
          return String(v)
        }).join(', ')
      }
    } else if (typeof value === 'object' && value !== null) {
      return formatNestedValue(value)
    }
    return String(value || '')
  }

  // Render entity in HTML format - matches DiffView.jsx structure
  const renderEntityHtml = (entity, type) => {
    if (!entity) return ''

    // Special rendering for FirewallRule
    if (entity._entityType === 'FirewallRule') {
      let html = '<div style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">'
      
      // Basic Information
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Basic Information</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      html += renderFieldHtml('Name', entity.name)
      html += renderFieldHtml('Description', entity.description)
      html += renderFieldHtml('Status', entity.status, entity.status === 'Enable' ? 'green' : null)
      html += renderFieldHtml('Policy Type', entity.policyType)
      html += renderFieldHtml('IP Family', entity.ipFamily)
      html += renderFieldHtml('Position', entity.position)
      if (entity.after) html += renderFieldHtml('Positioned After', entity.after)
      html += '</div></div>'

      // Action & Traffic
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Action & Traffic Control</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      html += renderFieldHtml('Action', entity.action, entity.action === 'Accept' ? 'green' : entity.action === 'Deny' ? 'red' : null)
      html += renderFieldHtml('Log Traffic', entity.logTraffic)
      html += renderFieldHtml('Schedule', entity.schedule || 'All The Time')
      html += '</div></div>'

      // Source Configuration
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Source Configuration</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      html += renderFieldHtml('Source Zones', entity.sourceZones && entity.sourceZones.length > 0 ? entity.sourceZones : ['Any'])
      html += renderFieldHtml('Source Networks', entity.sourceNetworks && entity.sourceNetworks.length > 0 ? entity.sourceNetworks : ['Any'])
      html += '</div></div>'

      // Destination Configuration
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Destination Configuration</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      html += renderFieldHtml('Destination Zones', entity.destinationZones && entity.destinationZones.length > 0 ? entity.destinationZones : ['Any'])
      html += renderFieldHtml('Destination Networks', entity.destinationNetworks && entity.destinationNetworks.length > 0 ? entity.destinationNetworks : ['Any'])
      html += renderFieldHtml('Services/Ports', entity.services && entity.services.length > 0 ? entity.services : ['Any'])
      html += '</div></div>'

      // Security Features
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Security Features</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      html += renderFieldHtml('Web Filter', entity.webFilter || 'None')
      html += renderFieldHtml('Application Control', entity.applicationControl || 'None')
      html += renderFieldHtml('Intrusion Prevention', entity.intrusionPrevention || 'None')
      html += renderFieldHtml('Virus Scanning', entity.scanVirus || 'Disable')
      html += renderFieldHtml('Zero Day Protection', entity.zeroDayProtection || 'Disable')
      html += renderFieldHtml('Proxy Mode', entity.proxyMode || 'Disable')
      html += renderFieldHtml('HTTPS Decryption', entity.decryptHTTPS || 'Disable')
      html += '</div></div>'

      html += '</div>'
      return html
    }

    // Generic entity rendering
    const { _entityType, name, ...fields } = entity
    
    const priorityFields = ['Name', 'Description', 'Status', 'Type', 'IPAddress', 'MACAddress', 'FQDN', 'IPFamily', 'PolicyType']
    const allFieldKeys = Object.keys(fields).sort()
    const priorityFieldKeys = priorityFields.filter(k => fields.hasOwnProperty(k))
    const otherFieldKeys = allFieldKeys.filter(k => !priorityFields.includes(k))
    
    const basicFields = {}
    const otherFieldsObj = {}
    
    priorityFieldKeys.forEach(key => {
      basicFields[key] = fields[key]
    })
    
    otherFieldKeys.forEach(key => {
      otherFieldsObj[key] = fields[key]
    })

    let html = '<div style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">'

    // Basic Information
    if (Object.keys(basicFields).length > 0) {
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Basic Information</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      Object.entries(basicFields).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        const highlight = (key === 'Status' && value === 'Enable') ? 'green' : 
                         (key === 'Status' && value === 'Disable') ? 'red' : null
        html += renderFieldHtml(label, value, highlight)
      })
      html += '</div></div>'
    }

    // Additional Details
    if (Object.keys(otherFieldsObj).length > 0) {
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Additional Details</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      Object.entries(otherFieldsObj).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        html += renderFieldHtml(label, value, null)
      })
      html += '</div></div>'
    }

    html += '</div>'
    return html
  }

  // Render a single field
  const renderFieldHtml = (label, value, highlight = null) => {
    const displayValue = renderFieldValue(value)
    let color = '#374151' // gray-700
    if (highlight === 'green') color = '#15803d' // green-700
    if (highlight === 'red') color = '#b91c1c' // red-700

    return `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.375rem 0; border-bottom: 1px solid #f3f4f6;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #4b5563; width: 10rem; flex-shrink: 0;">${escapeHtml(label)}:</span>
        <span style="font-size: 0.875rem; flex: 1; color: ${color}; word-wrap: break-word; overflow-wrap: anywhere;">${escapeHtml(displayValue)}</span>
      </div>
    `
  }

  // Compare arrays helper
  const compareArrays = (oldArr, newArr) => {
    if (!Array.isArray(oldArr) && !Array.isArray(newArr)) return null
    const old = Array.isArray(oldArr) ? oldArr : []
    const new_ = Array.isArray(newArr) ? newArr : []
    
    const oldSet = new Set(old)
    const newSet = new Set(new_)
    
    return { 
      removed: old.filter(item => !newSet.has(item)),
      added: new_.filter(item => !oldSet.has(item)),
      unchanged: old.filter(item => newSet.has(item))
    }
  }

  // Render field with diff highlighting
  const renderFieldWithDiffHtml = (label, oldValue, newValue) => {
    let displayValue = ''
    const color = '#374151' // gray-700 - always use neutral gray, no highlighting
    
    // Check if both are arrays
    const isOldArray = Array.isArray(oldValue)
    const isNewArray = Array.isArray(newValue)
    
    if (isOldArray || isNewArray) {
      const oldArr = isOldArray ? oldValue : []
      const newArr = isNewArray ? newValue : []
      
      // Check if arrays contain objects
      const checkArray = newArr.length > 0 ? newArr : oldArr
      const containsObjects = checkArray.length > 0 && typeof checkArray[0] === 'object' && checkArray[0] !== null && !Array.isArray(checkArray[0])
      
      if (containsObjects) {
        // Array of objects - format the entire array, no highlighting
        const displayVal = newValue !== undefined ? newValue : oldValue
        displayValue = escapeHtml(formatNestedValue(displayVal))
      } else {
        // Simple array (primitives) - just show the new array values, no highlighting
        const value = newValue !== undefined ? newValue : oldValue
        displayValue = escapeHtml(renderFieldValue(value))
      }
    } else if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue) &&
               typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
      // Both are objects - format the entire object, no highlighting
      const displayVal = newValue !== undefined ? newValue : oldValue
      displayValue = escapeHtml(formatNestedValue(displayVal))
    } else {
      // Regular field (primitive values) - no highlighting
      const value = newValue !== undefined ? newValue : oldValue
      const displayVal = String(value || '')
      displayValue = escapeHtml(displayVal)
    }

    return `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.375rem 0; border-bottom: 1px solid #f3f4f6;">
        <span style="font-size: 0.75rem; font-weight: 600; color: #4b5563; width: 10rem; flex-shrink: 0;">${escapeHtml(label)}:</span>
        <span style="font-size: 0.875rem; flex: 1; color: ${color}; word-wrap: break-word; overflow-wrap: anywhere;">${displayValue || '<span style="color: #9ca3af; font-style: italic;">(empty)</span>'}</span>
      </div>
    `
  }

  // Render entity with diff comparison (for modified entities)
  const renderEntityWithDiffHtml = (oldEntity, newEntity) => {
    if (!oldEntity || !newEntity) return ''

    const allKeys = new Set([
      ...Object.keys(oldEntity).filter(k => k !== '_entityType' && k !== 'name'),
      ...Object.keys(newEntity).filter(k => k !== '_entityType' && k !== 'name')
    ])
    
    const priorityFields = ['Name', 'Description', 'Status', 'Type', 'IPAddress', 'MACAddress', 'FQDN', 'IPFamily', 'PolicyType']
    const allFieldKeys = Array.from(allKeys).sort()
    const priorityFieldKeys = priorityFields.filter(k => allKeys.has(k))
    const otherFieldKeys = allFieldKeys.filter(k => !priorityFields.includes(k))

    let html = '<div style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">'

    // Basic Information
    if (priorityFieldKeys.length > 0) {
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Basic Information</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      priorityFieldKeys.forEach(key => {
        const oldValue = oldEntity[key]
        const newValue = newEntity[key]
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        html += renderFieldWithDiffHtml(label, oldValue, newValue)
      })
      html += '</div></div>'
    }

    // Additional Details
    if (otherFieldKeys.length > 0) {
      html += '<div>'
      html += '<h4 style="font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Additional Details</h4>'
      html += '<div style="background-color: #f9fafb; border-radius: 0.375rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;">'
      otherFieldKeys.forEach(key => {
        const oldValue = oldEntity[key]
        const newValue = newEntity[key]
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        html += renderFieldWithDiffHtml(label, oldValue, newValue)
      })
      html += '</div></div>'
    }

    html += '</div>'
    return html
  }

  const generateSection = (tag, items) => {
    const hasChanges = items.added.length > 0 || items.removed.length > 0 || items.modified.length > 0
    if (!hasChanges) return ''

    const totalCount = items.added.length + items.removed.length + items.modified.length
    const tagId = tag.replace(/[^a-zA-Z0-9]/g, '_')

    let itemsHtml = ''

    // Removed items
    items.removed.forEach((item, idx) => {
      itemsHtml += generateDiffItem(item, 'removed', idx, tagId)
    })

    // Modified items
    items.modified.forEach((item, idx) => {
      itemsHtml += generateDiffItem(item, 'modified', idx, tagId)
    })

    // Added items
    items.added.forEach((item, idx) => {
      itemsHtml += generateDiffItem(item, 'added', idx, tagId)
    })

    return `
      <div class="diff-section" data-tag="${escapeHtml(tag)}" data-tag-id="${tagId}" data-removed-count="${items.removed.length}" data-modified-count="${items.modified.length}" data-added-count="${items.added.length}" style="margin-bottom: 1.5rem; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
        <button class="section-toggle" onclick="toggleSection('${tagId}')" style="width: 100%; padding: 1rem; background-color: #ffffff; border: none; border-bottom: 1px solid #e5e7eb; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="section-chevron" data-tag-id="${tagId}" style="color: #6b7280; font-size: 1rem; transition: transform 0.2s;">▼</span>
            <span style="color: #2563eb; font-size: 1.25rem;">📄</span>
            <span style="font-weight: 600; color: #111827; font-size: 1rem;">${escapeHtml(tag)}</span>
            <span style="color: #6b7280; font-size: 0.875rem;">(${totalCount} changes)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${items.removed.length > 0 ? `<span style="padding: 0.25rem 0.5rem; background-color: #fee2e2; color: #991b1b; font-size: 0.75rem; font-weight: 500; border-radius: 0.25rem;">-${items.removed.length}</span>` : ''}
            ${items.modified.length > 0 ? `<span style="padding: 0.25rem 0.5rem; background-color: #fef3c7; color: #854d0e; font-size: 0.75rem; font-weight: 500; border-radius: 0.25rem;">~${items.modified.length}</span>` : ''}
            ${items.added.length > 0 ? `<span style="padding: 0.25rem 0.5rem; background-color: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 500; border-radius: 0.25rem;">+${items.added.length}</span>` : ''}
          </div>
        </button>
        <div class="section-content" id="section-${tagId}" style="display: block;">
          ${itemsHtml}
        </div>
      </div>
    `
  }

  const generateDiffItem = (item, type, idx, tagId) => {
    const getBgColor = () => {
      switch (type) {
        case 'added':
          return { bg: '#f0fdf4', border: '#86efac', text: '#166534' }
        case 'removed':
          return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' }
        case 'modified':
          return { bg: '#fffbeb', border: '#fde047', text: '#854d0e' }
        default:
          return { bg: '#f9fafb', border: '#d1d5db', text: '#111827' }
      }
    }

    const colors = getBgColor()
    const icon = type === 'added' ? '+' : type === 'removed' ? '-' : '~'

    let contentHtml = ''

    // Parse entity
    let parsedEntity = null
    let parsedOldEntity = null
    let parsedNewEntity = null

    if (type === 'modified') {
      if (item.oldRawXml && item.newRawXml) {
        parsedOldEntity = parseEntityFromXml(item.oldRawXml, item.tag)
        parsedNewEntity = parseEntityFromXml(item.newRawXml, item.tag)
      }
    } else {
      if (item.rawXml) {
        parsedEntity = parseEntityFromXml(item.rawXml, item.tag)
      }
    }

    if (type === 'modified' && parsedOldEntity && parsedNewEntity) {
      // Side-by-side comparison for modified entities
      contentHtml = `
        <div style="background-color: #ffffff; border-top: 1px solid ${colors.border};">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem;">
            <div style="border-right: 1px solid #e5e7eb; padding-right: 1rem;">
              <div style="margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #fecaca;">
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #991b1b; text-transform: uppercase; margin: 0;">Old / Current</h3>
              </div>
              ${renderEntityHtml(parsedOldEntity, 'removed')}
            </div>
            <div style="padding-left: 1rem;">
              <div style="margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #bbf7d0;">
                <h3 style="font-size: 0.875rem; font-weight: 600; color: #166534; text-transform: uppercase; margin: 0;">New / Updated</h3>
              </div>
              ${renderEntityWithDiffHtml(parsedOldEntity, parsedNewEntity)}
            </div>
          </div>
        </div>
      `
    } else if ((type === 'added' || type === 'removed') && parsedEntity) {
      // Render parsed entity for added/removed
      const bgColor = type === 'removed' ? '#fef2f2' : '#f0fdf4'
      contentHtml = `
        <div style="background-color: ${bgColor}; border-top: 1px solid ${colors.border}; padding: 1rem;">
          ${renderEntityHtml(parsedEntity, type)}
        </div>
      `
    } else {
      // Fallback to raw XML if parsing fails
      contentHtml = `
        <div style="background-color: #ffffff; border-top: 1px solid ${colors.border}; padding: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 500; color: #6b7280; margin-bottom: 0.5rem;">XML Content:</div>
          <pre style="background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.75rem; line-height: 1.5; margin: 0; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.rawXml || '')}</pre>
        </div>
      `
    }

    const changeCount = type === 'modified' && item.changes ? ` (${item.changes.length} field${item.changes.length !== 1 ? 's' : ''} changed)` : ''

    const itemId = `${tagId}-${type}-${idx}`
    return `
      <div class="diff-item" data-change-type="${type}" data-tag="${escapeHtml(item.tag)}" data-item-id="${itemId}" style="border-left: 4px solid ${colors.border}; background-color: ${colors.bg};">
        <div style="padding: 1rem; background-color: #ffffff; border-bottom: 1px solid ${colors.border};">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-weight: 700; color: ${colors.text}; font-size: 1rem;">${icon}</span>
            <span style="font-weight: 600; color: #111827;">${escapeHtml(item.name || formatTagName(item.tag || '') || 'Unnamed')}</span>
            ${changeCount ? `<span style="font-size: 0.875rem; color: #6b7280;">${changeCount}</span>` : ''}
          </div>
        </div>
        ${contentHtml}
      </div>
    `
  }

  const sectionsHtml = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, items]) => generateSection(tag, items))
    .join('')

  // Get all tags for filter dropdown
  const allTags = Object.keys(grouped).sort()
  const tagOptionsHtml = allTags.map(tag => {
    const tagId = tag.replace(/[^a-zA-Z0-9]/g, '_')
    const items = grouped[tag]
    const tagCount = items.added.length + items.removed.length + items.modified.length
    return `<label class="tag-filter-option" style="display: flex; align-items: center; padding: 0.5rem 0.75rem; cursor: pointer;" data-tag="${escapeHtml(tag)}">
      <input type="checkbox" class="tag-checkbox" data-tag="${escapeHtml(tag)}" checked onchange="updateTagFilter()" style="margin-right: 0.5rem; width: 1rem; height: 1rem; cursor: pointer;">
      <span style="flex: 1; font-size: 0.875rem; color: #374151;">${escapeHtml(tag)}</span>
      <span style="font-size: 0.75rem; color: #6b7280;">(${tagCount})</span>
    </label>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuration Diff Report</title>
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
      padding: 2rem;
      line-height: 1.5;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background-color: #ffffff;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    .stat-box {
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid;
    }
    .stat-box.removed {
      background-color: #fef2f2;
      border-color: #fca5a5;
    }
    .stat-box.modified {
      background-color: #fffbeb;
      border-color: #fde047;
    }
    .stat-box.added {
      background-color: #f0fdf4;
      border-color: #86efac;
    }
    .stat-box.unchanged {
      background-color: #f9fafb;
      border-color: #d1d5db;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .filter-controls {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
    .tag-filter-container {
      position: relative;
      margin-bottom: 1rem;
    }
    .tag-filter-dropdown {
      position: relative;
      display: inline-block;
      width: 100%;
    }
    .tag-filter-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1rem;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #374151;
    }
    .tag-filter-button:hover {
      border-color: #9ca3af;
    }
    .tag-filter-button:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .tag-filter-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      max-height: 24rem;
      overflow: hidden;
      display: none;
      z-index: 50;
    }
    .tag-filter-menu.open {
      display: block;
    }
    .tag-filter-search {
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .tag-filter-search input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }
    .tag-filter-search input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .tag-filter-actions {
      padding: 0.375rem 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      gap: 0.5rem;
    }
    .tag-filter-actions button {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #2563eb;
      font-weight: 500;
    }
    .tag-filter-actions button:hover {
      background-color: #eff6ff;
      border-radius: 0.25rem;
    }
    .tag-filter-list {
      max-height: 16rem;
      overflow-y: auto;
    }
    .tag-filter-option:hover {
      background-color: #f9fafb;
    }
    .change-type-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .change-type-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .change-type-btn.active {
      color: white;
    }
    .change-type-btn:not(.active) {
      background-color: #f3f4f6;
      color: #374151;
    }
    .change-type-btn:not(.active):hover {
      background-color: #e5e7eb;
    }
    .change-type-btn.all.active {
      background-color: #2563eb;
    }
    .change-type-btn.removed.active {
      background-color: #dc2626;
    }
    .change-type-btn.modified.active {
      background-color: #ca8a04;
    }
    .change-type-btn.added.active {
      background-color: #16a34a;
    }
    .hidden {
      display: none !important;
    }
    .section-content.collapsed {
      display: none !important;
    }
    .section-chevron.rotated {
      transform: rotate(-90deg);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Configuration Differences</h1>
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; color: #6b7280; font-size: 0.875rem;">
        <span><strong>Old:</strong> ${escapeHtml(oldFileName || 'Current File')}</span>
        <span>→</span>
        <span><strong>New:</strong> ${escapeHtml(newFileName || 'New File')}</span>
      </div>
      <div class="summary">
        <div class="stat-box removed">
          <div class="stat-label" style="color: #991b1b;">Removed</div>
          <div class="stat-value" style="color: #991b1b;">${diffResults.summary.removed}</div>
        </div>
        <div class="stat-box modified">
          <div class="stat-label" style="color: #854d0e;">Modified</div>
          <div class="stat-value" style="color: #854d0e;">${diffResults.summary.modified}</div>
        </div>
        <div class="stat-box added">
          <div class="stat-label" style="color: #166534;">Added</div>
          <div class="stat-value" style="color: #166534;">${diffResults.summary.added}</div>
        </div>
        <div class="stat-box unchanged">
          <div class="stat-label" style="color: #374151;">Unchanged</div>
          <div class="stat-value" style="color: #374151;">${diffResults.summary.unchanged}</div>
        </div>
      </div>
      
      <div class="filter-controls">
        <!-- Entity Type Filter -->
        <div class="tag-filter-container">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.875rem; font-weight: 600; color: #374151;">Filter by Entity Type (XML Tags)</span>
            <span id="tag-filter-count" style="font-size: 0.75rem; color: #6b7280;">(${allTags.length} of ${allTags.length} selected)</span>
          </div>
          <div class="tag-filter-dropdown">
            <button class="tag-filter-button" onclick="toggleTagDropdown()" id="tag-filter-button">
              <span id="tag-filter-text">All tags selected</span>
              <span id="tag-filter-chevron" style="transition: transform 0.2s;">▼</span>
            </button>
            <div class="tag-filter-menu" id="tag-filter-menu">
              <div class="tag-filter-search" style="position: relative;">
                <input type="text" id="tag-search-input" placeholder="Search tags..." oninput="filterTagOptions()">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none;">🔍</span>
              </div>
              <div class="tag-filter-actions">
                <button onclick="selectAllTags()">Select All</button>
                <button onclick="deselectAllTags()">Deselect All</button>
              </div>
              <div class="tag-filter-list" id="tag-filter-list">
                ${tagOptionsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Change Type Filter -->
        <div style="margin-top: 1rem;">
          <div style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Filter by Change Type</div>
          <div class="change-type-filters">
            <button class="change-type-btn all active" onclick="setChangeTypeFilter('all')">All Changes</button>
            <button class="change-type-btn removed" onclick="setChangeTypeFilter('removed')">Removed (${diffResults.summary.removed})</button>
            <button class="change-type-btn modified" onclick="setChangeTypeFilter('modified')">Modified (${diffResults.summary.modified})</button>
            <button class="change-type-btn added" onclick="setChangeTypeFilter('added')">Added (${diffResults.summary.added})</button>
          </div>
        </div>
      </div>
    </div>
    
    <div id="diff-sections">
      ${sectionsHtml}
    </div>
    
    <div id="no-results" class="hidden" style="text-align: center; padding: 3rem; background-color: #ffffff; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
      <p style="color: #6b7280;">No changes found for the selected filters.</p>
    </div>
  </div>

  <script>
    let currentChangeTypeFilter = 'all';
    let selectedTags = new Set(${JSON.stringify(allTags)});
    let allTagsList = ${JSON.stringify(allTags)};

    function toggleTagDropdown() {
      const menu = document.getElementById('tag-filter-menu');
      const chevron = document.getElementById('tag-filter-chevron');
      menu.classList.toggle('open');
      chevron.style.transform = menu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    function filterTagOptions() {
      const searchInput = document.getElementById('tag-search-input');
      const query = searchInput.value.toLowerCase();
      const options = document.querySelectorAll('.tag-filter-option');
      
      options.forEach(option => {
        const tag = option.getAttribute('data-tag').toLowerCase();
        if (tag.includes(query)) {
          option.style.display = 'flex';
        } else {
          option.style.display = 'none';
        }
      });
    }

    function updateTagFilter() {
      const checkboxes = document.querySelectorAll('.tag-checkbox');
      selectedTags.clear();
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedTags.add(checkbox.getAttribute('data-tag'));
        }
      });
      updateTagFilterText();
      applyFilters();
    }

    function selectAllTags() {
      const visibleCheckboxes = Array.from(document.querySelectorAll('.tag-checkbox')).filter(cb => {
        const option = cb.closest('.tag-filter-option');
        return option && option.style.display !== 'none';
      });
      visibleCheckboxes.forEach(cb => {
        cb.checked = true;
        selectedTags.add(cb.getAttribute('data-tag'));
      });
      updateTagFilterText();
      applyFilters();
    }

    function deselectAllTags() {
      const checkboxes = document.querySelectorAll('.tag-checkbox');
      checkboxes.forEach(cb => cb.checked = false);
      selectedTags.clear();
      updateTagFilterText();
      applyFilters();
    }

    function updateTagFilterText() {
      const count = selectedTags.size;
      const total = allTagsList.length;
      const textEl = document.getElementById('tag-filter-text');
      const countEl = document.getElementById('tag-filter-count');
      
      if (count === 0) {
        textEl.textContent = 'No tags selected';
      } else if (count === total) {
        textEl.textContent = 'All tags selected';
      } else {
        textEl.textContent = count + ' tag' + (count !== 1 ? 's' : '') + ' selected';
      }
      countEl.textContent = '(' + count + ' of ' + total + ' selected)';
    }

    function setChangeTypeFilter(type) {
      currentChangeTypeFilter = type;
      document.querySelectorAll('.change-type-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector('.change-type-btn.' + type).classList.add('active');
      applyFilters();
    }

    function applyFilters() {
      const sections = document.querySelectorAll('.diff-section');
      const items = document.querySelectorAll('.diff-item');
      let visibleSections = 0;
      
      sections.forEach(section => {
        const tag = section.getAttribute('data-tag');
        const removedCount = parseInt(section.getAttribute('data-removed-count'));
        const modifiedCount = parseInt(section.getAttribute('data-modified-count'));
        const addedCount = parseInt(section.getAttribute('data-added-count'));
        
        // Check if tag is selected
        const tagSelected = selectedTags.has(tag);
        
        // Check if section has changes of the selected type
        let hasSelectedType = false;
        if (currentChangeTypeFilter === 'all') {
          hasSelectedType = true;
        } else if (currentChangeTypeFilter === 'removed' && removedCount > 0) {
          hasSelectedType = true;
        } else if (currentChangeTypeFilter === 'modified' && modifiedCount > 0) {
          hasSelectedType = true;
        } else if (currentChangeTypeFilter === 'added' && addedCount > 0) {
          hasSelectedType = true;
        }
        
        if (tagSelected && hasSelectedType) {
          section.style.display = 'block';
          visibleSections++;
          
          // Filter items within section
          const sectionItems = section.querySelectorAll('.diff-item');
          sectionItems.forEach(item => {
            const itemType = item.getAttribute('data-change-type');
            if (currentChangeTypeFilter === 'all' || itemType === currentChangeTypeFilter) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        } else {
          section.style.display = 'none';
        }
      });
      
      // Show/hide no results message
      const noResults = document.getElementById('no-results');
      if (visibleSections === 0) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
      }
    }

    function toggleSection(tagId) {
      const content = document.getElementById('section-' + tagId);
      const chevron = document.querySelector('.section-chevron[data-tag-id="' + tagId + '"]');
      
      if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        chevron.classList.remove('rotated');
      } else {
        content.classList.add('collapsed');
        chevron.classList.add('rotated');
      }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      const dropdown = document.getElementById('tag-filter-menu');
      const button = document.getElementById('tag-filter-button');
      if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.remove('open');
        document.getElementById('tag-filter-chevron').style.transform = 'rotate(0deg)';
      }
    });

    // Initialize filters
    applyFilters();
  </script>
</body>
</html>`

  return html
}
