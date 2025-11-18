/**
 * XML Diff Utility - Compare two XML files and generate diff data
 */
import { formatTagName } from './xmlParser'

/**
 * Normalize XML string for comparison (remove whitespace differences, normalize attributes)
 */
function normalizeXML(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  
  // Check for parsing errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent)
  }
  
  return doc
}

/**
 * Create a simple normalized key from entity content (for entities without Name/transactionId)
 */
function createContentKey(entity) {
  const parts = []
  
  // Collect attributes (sorted, excluding transactionid)
  const attrs = []
  Array.from(entity.attributes).forEach(attr => {
    if (attr.name !== 'transactionid') {
      attrs.push(`${attr.name}=${attr.value}`)
    }
  })
  attrs.sort()
  if (attrs.length > 0) {
    parts.push(`attrs:${attrs.join(',')}`)
  }
  
  // Collect child tag names and their text content (sorted)
  const childData = []
  Array.from(entity.children).forEach(child => {
    const childTag = child.tagName
    const text = child.textContent.trim()
    if (text) {
      childData.push(`${childTag}:${text}`)
    } else {
      childData.push(childTag)
    }
  })
  childData.sort()
  if (childData.length > 0) {
    parts.push(`children:${childData.join(',')}`)
  }
  
  return parts.join('|')
}

/**
 * Get a unique identifier for an entity (prefer Name + transactionid, fallback to normalized content)
 */
function getEntityKey(entity) {
  const name = entity.querySelector('Name')?.textContent.trim() || ''
  const transactionId = entity.getAttribute('transactionid') || ''
  const tagName = entity.tagName
  
  // Use tag + transactionId + name as key
  if (transactionId && name) {
    return `${tagName}|${transactionId}|${name}`
  }
  if (name) {
    return `${tagName}|${name}`
  }
  if (transactionId) {
    return `${tagName}|${transactionId}`
  }
  
  // Fallback for entities without Name or transactionId (like WebFilterSettings)
  // Use normalized content to create stable key regardless of attribute/child order
  const contentKey = createContentKey(entity)
  // Use first 150 chars for uniqueness (long enough to distinguish entities)
  const keySuffix = contentKey.length > 150 ? contentKey.substring(0, 150) : contentKey
  return `${tagName}|${keySuffix}`
}

/**
 * Get all direct children with a given tag name, handling arrays
 */
function getAllChildrenByTag(parent, tagName) {
  return Array.from(parent.children).filter(child => child.tagName === tagName)
}

/**
 * Normalize array values for comparison (sort to make order-independent)
 */
function normalizeArrayValue(elements) {
  if (elements.length === 0) return []
  
  // If elements have no children, treat as simple text values
  if (elements.every(el => el.children.length === 0)) {
    return elements.map(el => el.textContent.trim()).sort()
  }
  
  // If elements have children, serialize each element recursively
  return elements.map(el => {
    // Group children by tag name (handles cases like FQDNHostList > FQDNHost)
    const childGroups = {}
    Array.from(el.children).forEach(child => {
      const childTag = child.tagName
      if (!childGroups[childTag]) {
        childGroups[childTag] = []
      }
      childGroups[childTag].push(child)
    })
    
    // Process each child group
    const normalized = {}
    Object.keys(childGroups).sort().forEach(tag => {
      const children = childGroups[tag]
      
      if (children.length === 1) {
        const child = children[0]
        // Single element - check if it's a container with array-like children
        if (child.children.length === 0) {
          // Simple text value
          normalized[tag] = child.textContent.trim()
        } else {
          // Has children - check if all children have the same tag (array pattern)
          const grandchildTags = Array.from(child.children).map(c => c.tagName)
          const uniqueGrandchildTags = [...new Set(grandchildTags)]
          
          if (uniqueGrandchildTags.length === 1) {
            // All grandchildren have same tag - extract and sort them
            const grandchildren = Array.from(child.children)
            if (grandchildren.every(gc => gc.children.length === 0)) {
              // All grandchildren are simple text values - sort them
              normalized[tag] = grandchildren.map(gc => gc.textContent.trim()).sort()
            } else {
              // Grandchildren have nested structures - recursively normalize
              normalized[tag] = normalizeArrayValue(grandchildren)
            }
          } else {
            // Mixed grandchildren - recursively normalize the container
            normalized[tag] = normalizeArrayValue([child])
          }
        }
      } else {
        // Multiple elements with same tag
        if (children.every(c => c.children.length === 0)) {
          // Array of simple values (like FQDNHost elements)
          normalized[tag] = children.map(c => c.textContent.trim()).sort()
        } else {
          // Complex nested structure - recursively normalize
          normalized[tag] = normalizeArrayValue(children)
        }
      }
    })
    
    return JSON.stringify(normalized)
  }).sort()
}

/**
 * Serialize entity to a normalized string for comparison
 */
function serializeEntity(entity) {
  // Create a normalized version by sorting attributes and children
  const normalized = {
    tag: entity.tagName,
    attributes: {},
    fields: {}
  }
  
  // Collect attributes (sorted)
  const attrs = {}
  Array.from(entity.attributes).forEach(attr => {
    // Skip transactionid for comparison as it may change
    if (attr.name !== 'transactionid') {
      attrs[attr.name] = attr.value
    }
  })
  normalized.attributes = attrs
  
  // Group children by tag name to handle arrays
  const fieldGroups = {}
  Array.from(entity.children).forEach(child => {
    const tag = child.tagName
    if (!fieldGroups[tag]) {
      fieldGroups[tag] = []
    }
    fieldGroups[tag].push(child)
  })
  
  // Process each field group
  Object.keys(fieldGroups).sort().forEach(tag => {
    const elements = fieldGroups[tag]
    
    if (elements.length === 1) {
      const element = elements[0]
      
      // If element has no children, it's a simple text value
      if (element.children.length === 0) {
        normalized.fields[tag] = element.textContent.trim()
      } else {
        // Element has children - check if it's a container with array-like children
        const childTags = Array.from(element.children).map(c => c.tagName)
        const uniqueChildTags = [...new Set(childTags)]
        
        // If all children have the same tag, treat as an array
        if (uniqueChildTags.length === 1) {
          const children = Array.from(element.children)
          if (children.every(c => c.children.length === 0)) {
            // All children are simple text values - return sorted array
            normalized.fields[tag] = children.map(c => c.textContent.trim()).sort()
          } else {
            // Children have nested structures - normalize recursively
            normalized.fields[tag] = normalizeArrayValue(children)
          }
        } else {
          // Mixed child types - normalize as nested structure
          normalized.fields[tag] = normalizeArrayValue([element])
        }
      }
    } else {
      // Multiple elements with same tag - array field
      // Normalize to sorted array for order-independent comparison
      normalized.fields[tag] = normalizeArrayValue(elements)
    }
  })
  
  return JSON.stringify(normalized)
}

/**
 * Get field value for comparison (handles arrays)
 */
function getFieldValue(entity, fieldName) {
  const elements = getAllChildrenByTag(entity, fieldName)
  
  if (elements.length === 0) {
    return null
  }
  
  if (elements.length === 1) {
    const element = elements[0]
    
    // If element has no children, it's a simple text value
    if (element.children.length === 0) {
      return element.textContent.trim()
    }
    
    // Element has children - check if it's a container with array-like children
    // (e.g., FQDNHostList containing multiple FQDNHost elements)
    const childTags = Array.from(element.children).map(c => c.tagName)
    const uniqueChildTags = [...new Set(childTags)]
    
    // If all children have the same tag, treat as an array
    if (uniqueChildTags.length === 1) {
      const childTag = uniqueChildTags[0]
      const children = Array.from(element.children)
      
      if (children.every(c => c.children.length === 0)) {
        // All children are simple text values - return sorted array
        return children.map(c => c.textContent.trim()).sort()
      } else {
        // Children have nested structures - normalize recursively
        return normalizeArrayValue(children)
      }
    } else {
      // Mixed child types - normalize as nested structure
      return normalizeArrayValue([element])
    }
  }
  
  // Multiple elements with same tag - array field
  // Normalize to sorted array for order-independent comparison
  return normalizeArrayValue(elements)
}

/**
 * Compare two field values (handles arrays)
 */
function compareFieldValues(oldValue, newValue) {
  // Both null/empty
  if ((oldValue === null || oldValue === undefined || (Array.isArray(oldValue) && oldValue.length === 0)) &&
      (newValue === null || newValue === undefined || (Array.isArray(newValue) && newValue.length === 0))) {
    return true
  }
  
  // One is null, other is not
  if (oldValue === null || oldValue === undefined || (Array.isArray(oldValue) && oldValue.length === 0)) {
    return false
  }
  if (newValue === null || newValue === undefined || (Array.isArray(newValue) && newValue.length === 0)) {
    return false
  }
  
  // Compare arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false
    }
    // Arrays are already sorted, so we can compare directly
    return JSON.stringify(oldValue) === JSON.stringify(newValue)
  }
  
  // Compare primitive values
  return oldValue === newValue
}

/**
 * Format field value for display
 */
function formatFieldValueForDisplay(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}

/**
 * Compare two entities and return diff information
 */
function compareEntities(oldEntity, newEntity) {
  const oldSerialized = serializeEntity(oldEntity)
  const newSerialized = serializeEntity(newEntity)
  
  if (oldSerialized === newSerialized) {
    return { type: 'unchanged', entity: oldEntity }
  }
  
  // Compare field by field
  const changes = []
  const allFields = new Set()
  
  // Collect all field names from both entities
  Array.from(oldEntity.children).forEach(child => allFields.add(child.tagName))
  Array.from(newEntity.children).forEach(child => allFields.add(child.tagName))
  
  allFields.forEach(fieldName => {
    const oldValue = getFieldValue(oldEntity, fieldName)
    const newValue = getFieldValue(newEntity, fieldName)
    
    if (!compareFieldValues(oldValue, newValue)) {
      // Values are different
      const oldDisplay = formatFieldValueForDisplay(oldValue)
      const newDisplay = formatFieldValueForDisplay(newValue)
      
      if (oldValue === null || (Array.isArray(oldValue) && oldValue.length === 0)) {
        changes.push({ field: fieldName, type: 'added', oldValue: null, newValue: newDisplay })
      } else if (newValue === null || (Array.isArray(newValue) && newValue.length === 0)) {
        changes.push({ field: fieldName, type: 'removed', oldValue: oldDisplay, newValue: null })
      } else {
        changes.push({ field: fieldName, type: 'modified', oldValue: oldDisplay, newValue: newDisplay })
      }
    }
  })
  
  // Compare attributes
  const oldAttrs = {}
  const newAttrs = {}
  Array.from(oldEntity.attributes).forEach(attr => {
    if (attr.name !== 'transactionid') {
      oldAttrs[attr.name] = attr.value
    }
  })
  Array.from(newEntity.attributes).forEach(attr => {
    if (attr.name !== 'transactionid') {
      newAttrs[attr.name] = attr.value
    }
  })
  
  Object.keys({ ...oldAttrs, ...newAttrs }).forEach(attrName => {
    if (oldAttrs[attrName] !== newAttrs[attrName]) {
      changes.push({
        field: `@${attrName}`,
        type: oldAttrs[attrName] === undefined ? 'added' : newAttrs[attrName] === undefined ? 'removed' : 'modified',
        oldValue: oldAttrs[attrName] || null,
        newValue: newAttrs[attrName] || null
      })
    }
  })
  
  return {
    type: changes.length > 0 ? 'modified' : 'unchanged',
    entity: newEntity,
    changes
  }
}

/**
 * Compare two XML documents and generate diff
 */
export function compareXMLFiles(oldXML, newXML) {
  const oldDoc = normalizeXML(oldXML)
  const newDoc = normalizeXML(newXML)
  
  // Extract all entities from both documents
  const oldEntities = new Map()
  const newEntities = new Map()
  
  // Get all direct children of Configuration (root level entities)
  const configOld = oldDoc.querySelector('Configuration')
  const configNew = newDoc.querySelector('Configuration')
  
  if (!configOld || !configNew) {
    throw new Error('No Configuration element found in XML')
  }
  
  // Collect all entities from old document
  Array.from(configOld.children).forEach(entity => {
    const key = getEntityKey(entity)
    if (!oldEntities.has(key)) {
      oldEntities.set(key, entity)
    }
  })
  
  // Collect all entities from new document
  Array.from(configNew.children).forEach(entity => {
    const key = getEntityKey(entity)
    if (!newEntities.has(key)) {
      newEntities.set(key, entity)
    }
  })
  
  // Build diff results
  const results = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
    summary: {
      totalOld: oldEntities.size,
      totalNew: newEntities.size,
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    }
  }
  
  // Find added entities (in new but not in old)
  newEntities.forEach((newEntity, key) => {
    if (!oldEntities.has(key)) {
      const tag = newEntity.tagName
      const name = newEntity.querySelector('Name')?.textContent.trim() || formatTagName(tag) || 'Unnamed'
      results.added.push({
        key,
        tag,
        name,
        entity: newEntity,
        rawXml: newEntity.outerHTML
      })
      results.summary.added++
    }
  })
  
  // Find removed entities (in old but not in new)
  oldEntities.forEach((oldEntity, key) => {
    if (!newEntities.has(key)) {
      const tag = oldEntity.tagName
      const name = oldEntity.querySelector('Name')?.textContent.trim() || formatTagName(tag) || 'Unnamed'
      results.removed.push({
        key,
        tag,
        name,
        entity: oldEntity,
        rawXml: oldEntity.outerHTML
      })
      results.summary.removed++
    }
  })
  
  // Find modified and unchanged entities
  oldEntities.forEach((oldEntity, key) => {
    if (newEntities.has(key)) {
      const newEntity = newEntities.get(key)
      const diff = compareEntities(oldEntity, newEntity)
      
      const tag = newEntity.tagName
      const name = newEntity.querySelector('Name')?.textContent.trim() || oldEntity.querySelector('Name')?.textContent.trim() || formatTagName(tag) || 'Unnamed'
      
      const result = {
        key,
        tag,
        name,
        oldEntity,
        newEntity,
        oldRawXml: oldEntity.outerHTML,
        newRawXml: newEntity.outerHTML
      }
      
      if (diff.type === 'modified') {
        result.changes = diff.changes
        results.modified.push(result)
        results.summary.modified++
      } else {
        results.unchanged.push(result)
        results.summary.unchanged++
      }
    }
  })
  
  // Sort results by tag name, then by name
  const sortFn = (a, b) => {
    if (a.tag !== b.tag) return a.tag.localeCompare(b.tag)
    return a.name.localeCompare(b.name)
  }
  
  results.added.sort(sortFn)
  results.removed.sort(sortFn)
  results.modified.sort(sortFn)
  results.unchanged.sort(sortFn)
  
  return results
}

/**
 * Group diff results by entity type
 */
export function groupDiffByType(diffResults) {
  const grouped = {}
  
  const addToGroup = (item, type) => {
    if (!grouped[item.tag]) {
      grouped[item.tag] = {
        tag: item.tag,
        added: [],
        removed: [],
        modified: [],
        unchanged: []
      }
    }
    grouped[item.tag][type].push(item)
  }
  
  diffResults.added.forEach(item => addToGroup(item, 'added'))
  diffResults.removed.forEach(item => addToGroup(item, 'removed'))
  diffResults.modified.forEach(item => addToGroup(item, 'modified'))
  diffResults.unchanged.forEach(item => addToGroup(item, 'unchanged'))
  
  return grouped
}

