/**
 * Utility functions to detect duplicate entities in configuration
 * Compares all fields except Name to identify redundant objects
 */

/**
 * Deep comparison of two values, handling arrays and objects
 */
function deepEqual(a, b) {
  if (a === b) return true
  
  if (a == null || b == null) return a === b
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return a === b
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((val, idx) => deepEqual(val, b[idx]))
  }
  
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  
  if (keysA.length !== keysB.length) return false
  
  return keysA.every(key => deepEqual(a[key], b[key]))
}

/**
 * Create a sort key for an object to enable consistent sorting
 */
function getObjectSortKey(obj) {
  if (typeof obj !== 'object' || obj === null) return String(obj)
  
  // For ServiceDetail objects, sort by DestinationPort, Protocol, SourcePort
  if (obj.DestinationPort !== undefined || obj.Protocol !== undefined) {
    return `${obj.Protocol || ''}_${obj.DestinationPort || ''}_${obj.SourcePort || ''}`
  }
  
  // For other objects, create a key from all sorted property values
  const keys = Object.keys(obj).sort()
  return keys.map(k => `${k}:${getObjectSortKey(obj[k])}`).join('|')
}

/**
 * Sort an array of objects for consistent comparison
 */
function sortArrayOfObjects(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return arr
  
  // Check if all items are objects
  if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    return [...arr].sort((a, b) => {
      const keyA = getObjectSortKey(a)
      const keyB = getObjectSortKey(b)
      return keyA.localeCompare(keyB)
    })
  }
  
  // For arrays of primitives or mixed types, sort normally
  return [...arr].sort()
}

/**
 * Recursively sort object keys for consistent JSON stringification
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item))
  }
  
  const sorted = {}
  Object.keys(obj).sort().forEach(key => {
    const value = obj[key]
    if (typeof value === 'object' && value !== null) {
      sorted[key] = sortObjectKeys(value)
    } else {
      sorted[key] = value
    }
  })
  
  return sorted
}

/**
 * Normalize a value for comparison (trim strings, handle empty strings, sort arrays)
 */
function normalizeValue(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  if (Array.isArray(value)) {
    const normalized = value.map(normalizeValue).filter(v => v != null)
    // Sort arrays of objects for consistent comparison
    if (normalized.length > 0 && normalized.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      return sortArrayOfObjects(normalized)
    }
    return normalized
  }
  if (typeof value === 'object' && value !== null) {
    const normalized = {}
    Object.keys(value).forEach(key => {
      let fieldValue = value[key]
      
      // Special handling for ServiceDetails.ServiceDetail array
      if (key === 'ServiceDetail' && Array.isArray(fieldValue)) {
        fieldValue = sortArrayOfObjects(fieldValue)
      }
      
      const normalizedVal = normalizeValue(fieldValue)
      if (normalizedVal != null) {
        normalized[key] = normalizedVal
      }
    })
    return Object.keys(normalized).length > 0 ? normalized : null
  }
  return value
}

/**
 * Get the type-defining field for an entity
 * This determines which entities should be compared together
 */
function getEntityTypeKey(entity, entityType) {
  if (!entity || !entity.fields) return 'default'
  
  // IPHost: group by HostType (IP, IPRange, System Host, Network, etc.)
  if (entityType === 'IPHost' && entity.fields.HostType) {
    return `HostType:${normalizeValue(entity.fields.HostType)}`
  }
  
  // Service: group by Type (IP, TCPorUDP, etc.)
  // Handle both 'Service' and 'Services' entity types (check both entityType and entity.tag)
  const isService = entityType === 'Service' || 
                    entityType === 'Services' ||
                    entity?.tag === 'Service' || 
                    entity?.tag === 'Services'
  if (isService && entity.fields?.Type) {
    return `Type:${normalizeValue(entity.fields.Type)}`
  }
  
  // FQDNHost: typically all have similar structure, but could have IPFamily
  if (entityType === 'FQDNHost') {
    const ipFamily = normalizeValue(entity.fields.IPFamily) || 'default'
    return `IPFamily:${ipFamily}`
  }
  
  // MACHost: could have IPFamily
  if (entityType === 'MACHost') {
    const ipFamily = normalizeValue(entity.fields.IPFamily) || 'default'
    return `IPFamily:${ipFamily}`
  }
  
  // Groups: typically have similar structure, but could check for Member vs Members
  if (entityType === 'IPHostGroup' || entityType === 'FQDNHostGroup' || entityType === 'ServiceGroup') {
    const ipFamily = normalizeValue(entity.fields.IPFamily) || 'default'
    return `IPFamily:${ipFamily}`
  }
  
  return 'default'
}

/**
 * Extract comparison key from entity (all fields except Name)
 * Special handling for ServiceDetails to ensure proper comparison
 */
function getComparisonKey(entity) {
  if (!entity || !entity.fields) return null
  
  const { Name, ...otherFields } = entity.fields
  const normalized = {}
  
  Object.keys(otherFields).forEach(key => {
    let fieldValue = otherFields[key]
    
    // Special handling for ServiceDetails - ensure ServiceDetail array is properly sorted
    if (key === 'ServiceDetails' && typeof fieldValue === 'object' && fieldValue !== null) {
      if (fieldValue.ServiceDetail && Array.isArray(fieldValue.ServiceDetail)) {
        // Sort ServiceDetail array for consistent comparison
        fieldValue = {
          ...fieldValue,
          ServiceDetail: sortArrayOfObjects(fieldValue.ServiceDetail)
        }
      }
      // Also handle if ServiceDetail is directly an array (alternative structure)
      else if (Array.isArray(fieldValue.ServiceDetail)) {
        fieldValue = {
          ...fieldValue,
          ServiceDetail: sortArrayOfObjects(fieldValue.ServiceDetail)
        }
      }
    }
    
    const normalizedVal = normalizeValue(fieldValue)
    if (normalizedVal != null) {
      normalized[key] = normalizedVal
    }
  })
  
  return Object.keys(normalized).length > 0 ? normalized : null
}

/**
 * Find duplicate entities in an array
 * Returns groups of entities that have the same values (except Name)
 * Groups entities by their type-defining field first for accurate comparison
 */
export function findDuplicates(entities, entityType) {
  if (!entities || entities.length === 0) return []
  
  // Filter out entities that should be ignored, preserving original indices
  const filteredEntitiesWithIndices = []
  entities.forEach((entity, originalIndex) => {
    // For IPHost, ignore System Host types
    if (entityType === 'IPHost') {
      const hostType = entity.fields?.HostType
      if (hostType === 'System Host' || hostType === 'SystemHost') {
        return // Skip this entity
      }
    }
    filteredEntitiesWithIndices.push({ entity, originalIndex })
  })
  
  if (filteredEntitiesWithIndices.length === 0) return []
  
  // First, group entities by their type-defining field (e.g., HostType for IPHost)
  const entitiesByType = new Map()
  
  filteredEntitiesWithIndices.forEach(({ entity, originalIndex }) => {
    const typeKey = getEntityTypeKey(entity, entityType)
    if (!entitiesByType.has(typeKey)) {
      entitiesByType.set(typeKey, [])
    }
    entitiesByType.get(typeKey).push({ entity, index: originalIndex })
  })
  
  // Now find duplicates within each type group
  const allDuplicateGroups = []
  
  entitiesByType.forEach((typeEntities, typeKey) => {
    const duplicateGroups = []
    const seen = new Map()
    
    typeEntities.forEach(({ entity, index }) => {
      const comparisonKey = getComparisonKey(entity)
      
      // Skip entities with no meaningful fields (only Name)
      if (!comparisonKey || Object.keys(comparisonKey).length === 0) {
        return
      }
      
      // Create a string key for comparison (include type key to ensure same type)
      // Sort object keys for consistent JSON stringification
      const sortedKey = sortObjectKeys(comparisonKey)
      const keyString = `${typeKey}|${JSON.stringify(sortedKey)}`
      
      if (seen.has(keyString)) {
        const groupIndex = seen.get(keyString)
        duplicateGroups[groupIndex].entities.push({
          ...entity,
          index,
          entityType,
          typeKey // Store the type key for reference
        })
      } else {
        const groupIndex = duplicateGroups.length
        seen.set(keyString, groupIndex)
        duplicateGroups.push({
          key: comparisonKey,
          keyString,
          typeKey, // Store the type key for reference
          entities: [{
            ...entity,
            index,
            entityType,
            typeKey
          }]
        })
      }
    })
    
    // Filter to only return groups with 2+ entities (actual duplicates)
    const validGroups = duplicateGroups.filter(group => group.entities.length > 1)
    allDuplicateGroups.push(...validGroups)
  })
  
  return allDuplicateGroups
}

/**
 * Extract member array from a group entity (HostList.Host, Member, etc.)
 */
function getMemberArray(entity) {
  if (!entity || !entity.fields) return null
  
  // IPHostGroup: HostList.Host
  if (entity.fields.HostList) {
    if (Array.isArray(entity.fields.HostList)) {
      return entity.fields.HostList
    }
    if (entity.fields.HostList.Host) {
      return Array.isArray(entity.fields.HostList.Host) 
        ? entity.fields.HostList.Host 
        : [entity.fields.HostList.Host]
    }
  }
  
  // FQDNHostGroup: FQDNHostList.FQDNHost
  if (entity.fields.FQDNHostList) {
    if (Array.isArray(entity.fields.FQDNHostList)) {
      return entity.fields.FQDNHostList
    }
    if (entity.fields.FQDNHostList.FQDNHost) {
      return Array.isArray(entity.fields.FQDNHostList.FQDNHost)
        ? entity.fields.FQDNHostList.FQDNHost
        : [entity.fields.FQDNHostList.FQDNHost]
    }
  }
  
  // ServiceGroup: Member
  if (entity.fields.Member) {
    return Array.isArray(entity.fields.Member)
      ? entity.fields.Member
      : [entity.fields.Member]
  }
  
  // Generic: Member or Members
  if (entity.fields.Members) {
    return Array.isArray(entity.fields.Members)
      ? entity.fields.Members
      : [entity.fields.Members]
  }
  
  return null
}

/**
 * Find partial duplicates in groups (where some array items overlap)
 */
function findPartialDuplicates(entities, entityType) {
  if (!entities || entities.length === 0) return []
  
  const partialDuplicateGroups = []
  const processed = new Set()
  
  // Compare all pairs of entities
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i]
      const entity2 = entities[j]
      
      const pairKey = `${i}-${j}`
      if (processed.has(pairKey)) continue
      
      const members1 = getMemberArray(entity1)
      const members2 = getMemberArray(entity2)
      
      // Skip if either doesn't have members
      if (!members1 || !members2 || members1.length === 0 || members2.length === 0) {
        continue
      }
      
      // Normalize members (trim strings, handle objects)
      const normalized1 = members1.map(m => {
        if (typeof m === 'string') return m.trim()
        if (typeof m === 'object' && m !== null) {
          // Handle objects like { Host: "value" }
          return Object.values(m).map(v => typeof v === 'string' ? v.trim() : String(v)).join('|')
        }
        return String(m).trim()
      }).filter(m => m)
      
      const normalized2 = members2.map(m => {
        if (typeof m === 'string') return m.trim()
        if (typeof m === 'object' && m !== null) {
          return Object.values(m).map(v => typeof v === 'string' ? v.trim() : String(v)).join('|')
        }
        return String(m).trim()
      }).filter(m => m)
      
      // Find common members
      const set1 = new Set(normalized1)
      const set2 = new Set(normalized2)
      const common = normalized1.filter(m => set2.has(m))
      
      // If there are common members but arrays are not identical, it's a partial duplicate
      if (common.length > 0 && (normalized1.length !== normalized2.length || common.length !== normalized1.length)) {
        // Check if this pair already belongs to an existing group
        let foundGroup = null
        for (const group of partialDuplicateGroups) {
          const groupEntities = group.entities.map(e => e.name || e.fields?.Name)
          if (groupEntities.includes(entity1.name || entity1.fields?.Name) || 
              groupEntities.includes(entity2.name || entity2.fields?.Name)) {
            foundGroup = group
            break
          }
        }
        
        if (foundGroup) {
          // Add to existing group if not already present
          if (!foundGroup.entities.find(e => (e.name || e.fields?.Name) === (entity1.name || entity1.fields?.Name))) {
            foundGroup.entities.push({
              ...entity1,
              index: i,
              entityType,
              commonMembers: common,
              allMembers: normalized1,
              uniqueMembers: normalized1.filter(m => !set2.has(m))
            })
          }
          if (!foundGroup.entities.find(e => (e.name || e.fields?.Name) === (entity2.name || entity2.fields?.Name))) {
            foundGroup.entities.push({
              ...entity2,
              index: j,
              entityType,
              commonMembers: common,
              allMembers: normalized2,
              uniqueMembers: normalized2.filter(m => !set1.has(m))
            })
          }
        } else {
          // Create new group
          partialDuplicateGroups.push({
            isPartial: true,
            commonMembers: common,
            entities: [
              {
                ...entity1,
                index: i,
                entityType,
                commonMembers: common,
                allMembers: normalized1,
                uniqueMembers: normalized1.filter(m => !set2.has(m))
              },
              {
                ...entity2,
                index: j,
                entityType,
                commonMembers: common,
                allMembers: normalized2,
                uniqueMembers: normalized2.filter(m => !set1.has(m))
              }
            ]
          })
        }
        
        processed.add(pairKey)
      }
    }
  }
  
  return partialDuplicateGroups
}

/**
 * Analyze all entity types for duplicates
 */
export function analyzeDuplicates(parsedData) {
  const results = {
    ipHosts: [],
    fqdnHosts: [],
    macHosts: [],
    services: [],
    ipHostGroups: [],
    fqdnHostGroups: [],
    serviceGroups: []
  }
  
  if (parsedData.ipHosts) {
    results.ipHosts = findDuplicates(parsedData.ipHosts, 'IPHost')
  }
  
  if (parsedData.fqdnHosts) {
    results.fqdnHosts = findDuplicates(parsedData.fqdnHosts, 'FQDNHost')
  }
  
  if (parsedData.macHosts) {
    results.macHosts = findDuplicates(parsedData.macHosts, 'MACHost')
  }
  
  if (parsedData.services) {
    results.services = findDuplicates(parsedData.services, 'Service')
  }
  
  if (parsedData.ipHostGroups) {
    // Find both exact duplicates and partial duplicates
    const exact = findDuplicates(parsedData.ipHostGroups, 'IPHostGroup')
    const partial = findPartialDuplicates(parsedData.ipHostGroups, 'IPHostGroup')
    // Combine, but prefer exact duplicates (if a group is in both, keep only exact)
    const exactNames = new Set(exact.flatMap(g => g.entities.map(e => e.name || e.fields?.Name)))
    const filteredPartial = partial.filter(g => 
      !g.entities.some(e => exactNames.has(e.name || e.fields?.Name))
    )
    results.ipHostGroups = [...exact, ...filteredPartial]
  }
  
  if (parsedData.fqdnHostGroups) {
    const exact = findDuplicates(parsedData.fqdnHostGroups, 'FQDNHostGroup')
    const partial = findPartialDuplicates(parsedData.fqdnHostGroups, 'FQDNHostGroup')
    const exactNames = new Set(exact.flatMap(g => g.entities.map(e => e.name || e.fields?.Name)))
    const filteredPartial = partial.filter(g => 
      !g.entities.some(e => exactNames.has(e.name || e.fields?.Name))
    )
    results.fqdnHostGroups = [...exact, ...filteredPartial]
  }
  
  if (parsedData.serviceGroups) {
    const exact = findDuplicates(parsedData.serviceGroups, 'ServiceGroup')
    const partial = findPartialDuplicates(parsedData.serviceGroups, 'ServiceGroup')
    const exactNames = new Set(exact.flatMap(g => g.entities.map(e => e.name || e.fields?.Name)))
    const filteredPartial = partial.filter(g => 
      !g.entities.some(e => exactNames.has(e.name || e.fields?.Name))
    )
    results.serviceGroups = [...exact, ...filteredPartial]
  }
  
  return results
}

/**
 * Get total count of duplicate groups
 */
export function getTotalDuplicateCount(duplicateResults) {
  return Object.values(duplicateResults).reduce((sum, groups) => sum + groups.length, 0)
}

/**
 * Get total count of duplicate entities
 */
export function getTotalDuplicateEntityCount(duplicateResults) {
  return Object.values(duplicateResults).reduce((sum, groups) => {
    return sum + groups.reduce((groupSum, group) => groupSum + group.entities.length, 0)
  }, 0)
}

