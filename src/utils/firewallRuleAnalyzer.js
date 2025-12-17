/**
 * Firewall Rule Analyzer
 * 
 * Detects duplicate and shadowed firewall rules in Sophos firewall configurations.
 * 
 * A rule is duplicate if all these match exactly:
 * - Action
 * - SourceZones (or implicit "Any" when missing)
 * - DestinationZones (or implicit "Any" when missing)
 * - Schedule
 * - Services (or implicit "Any" when missing)
 * - SourceNetworks (or implicit "Any" when missing)
 * - DestinationNetworks (or implicit "Any" when missing)
 * - Security profile settings (IPS, Web, App, AV, etc.)
 * - Misc flags (like SkipLocalDestined, ScanFTP, etc.)
 * 
 * A rule is shadowed when:
 * - A previous rule has broader or equal conditions
 * - That previous rule has the same Action
 * - Therefore the later rule will never be used
 */

/**
 * Normalize a value to handle empty/whitespace as "Any"
 */
function normalizeToAny(value) {
  if (value == null) return ['Any']
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? ['Any'] : [trimmed]
  }
  if (Array.isArray(value)) {
    const normalized = value
      .map(v => typeof v === 'string' ? v.trim() : String(v).trim())
      .filter(v => v !== '')
    return normalized.length === 0 ? ['Any'] : normalized
  }
  return [String(value).trim()] || ['Any']
}

/**
 * Extract array from nested object structure
 * Handles: { Zone: ['Red', 'LAN'] } or ['Red', 'LAN'] or 'Red'
 */
function extractArray(value) {
  if (value == null) return ['Any']
  
  // If it's already an array
  if (Array.isArray(value)) {
    const normalized = value
      .map(v => typeof v === 'string' ? v.trim() : String(v).trim())
      .filter(v => v !== '')
    return normalized.length === 0 ? ['Any'] : normalized
  }
  
  // If it's an object, try to find common array keys
  if (typeof value === 'object') {
    // Check for common nested structures
    if (value.Zone) {
      return extractArray(value.Zone)
    }
    if (value.Network) {
      return extractArray(value.Network)
    }
    if (value.Service) {
      return extractArray(value.Service)
    }
    if (value.Interface) {
      return extractArray(value.Interface)
    }
    // If object has array-like values, extract them
    const values = Object.values(value)
    if (values.length > 0 && Array.isArray(values[0])) {
      return extractArray(values[0])
    }
    // If object has a single string value, extract it
    if (values.length === 1 && typeof values[0] === 'string') {
      return extractArray(values[0])
    }
  }
  
  // If it's a string
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? ['Any'] : [trimmed]
  }
  
  return ['Any']
}

/**
 * Normalize networks - missing means "Any"
 * If SourceNetworks or DestinationNetworks node is missing, treat it as ["Any"]
 */
function normalizeNetworks(policy, networkType) {
  const networks = policy[networkType]
  if (!networks) return ['Any']
  const extracted = extractArray(networks)
  // If extractArray returns empty array or null, treat as "Any"
  if (!extracted || extracted.length === 0) return ['Any']
  return extracted
}

/**
 * Normalize zones - missing means "Any"
 * If SourceZones or DestinationZones node is missing, treat it as ["Any"]
 */
function normalizeZones(policy, zoneType) {
  const zones = policy[zoneType]
  if (!zones) return ['Any']
  const extracted = extractArray(zones)
  // If extractArray returns empty array or null, treat as "Any"
  if (!extracted || extracted.length === 0) return ['Any']
  return extracted
}

/**
 * Normalize services - missing means "Any"
 * If Services node is missing, treat it as ["Any"]
 */
function normalizeServices(policy) {
  const services = policy.Services
  if (!services) return ['Any']
  const extracted = extractArray(services)
  // If extractArray returns empty array or null, treat as "Any"
  if (!extracted || extracted.length === 0) return ['Any']
  return extracted
}

/**
 * Normalize a single value (string or number)
 */
function normalizeValue(value) {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return value
}

/**
 * Compare two arrays ignoring order
 * Returns true if arrays contain the same elements (as sets)
 */
function arraysEqualIgnoreOrder(arr1, arr2) {
  if (arr1.length !== arr2.length) return false
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)
  if (set1.size !== set2.size) return false
  for (const item of set1) {
    if (!set2.has(item)) return false
  }
  return true
}

/**
 * Check if array1 contains all elements of array2 (subset check)
 */
function arrayContainsAll(arr1, arr2) {
  // If arr1 contains "Any", it contains everything
  if (arr1.includes('Any')) return true
  
  const set1 = new Set(arr1)
  return arr2.every(item => set1.has(item))
}

/**
 * Normalize a firewall rule for comparison
 */
function normalizeRule(rule) {
  const policy = rule.networkPolicy || rule.userPolicy || {}
  
  return {
    action: normalizeValue(policy.Action),
    sourceZones: normalizeZones(policy, 'SourceZones'),
    destinationZones: normalizeZones(policy, 'DestinationZones'),
    schedule: normalizeValue(policy.Schedule),
    services: normalizeServices(policy),
    sourceNetworks: normalizeNetworks(policy, 'SourceNetworks'),
    destinationNetworks: normalizeNetworks(policy, 'DestinationNetworks'),
    
    // Security profiles
    webFilter: normalizeValue(policy.WebFilter),
    applicationControl: normalizeValue(policy.ApplicationControl),
    intrusionPrevention: normalizeValue(policy.IntrusionPrevention),
    scanVirus: normalizeValue(policy.ScanVirus),
    zeroDayProtection: normalizeValue(policy.ZeroDayProtection),
    proxyMode: normalizeValue(policy.ProxyMode),
    decryptHTTPS: normalizeValue(policy.DecryptHTTPS),
    
    // Misc flags
    logTraffic: normalizeValue(policy.LogTraffic),
    skipLocalDestined: normalizeValue(policy.SkipLocalDestined),
    scanFTP: normalizeValue(policy.ScanFTP),
    blockQuickQuic: normalizeValue(policy.BlockQuickQuic),
    dscpMarking: normalizeValue(policy.DSCPMarking),
    trafficShapingPolicy: normalizeValue(policy.TrafficShappingPolicy), // Note: typo in XML
  }
}

/**
 * Check if two rules are duplicates
 * All fields must match exactly
 */
export function isDuplicate(ruleA, ruleB) {
  const normA = normalizeRule(ruleA)
  const normB = normalizeRule(ruleB)
  
  // Action must match
  if (normA.action !== normB.action) return false
  
  // Zones must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) return false
  
  // Schedule must match
  if (normA.schedule !== normB.schedule) return false
  
  // Services must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) return false
  
  // Networks must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) return false
  
  // Security profiles must match
  if (normA.webFilter !== normB.webFilter) return false
  if (normA.applicationControl !== normB.applicationControl) return false
  if (normA.intrusionPrevention !== normB.intrusionPrevention) return false
  if (normA.scanVirus !== normB.scanVirus) return false
  if (normA.zeroDayProtection !== normB.zeroDayProtection) return false
  if (normA.proxyMode !== normB.proxyMode) return false
  if (normA.decryptHTTPS !== normB.decryptHTTPS) return false
  
  // Misc flags must match
  if (normA.logTraffic !== normB.logTraffic) return false
  if (normA.skipLocalDestined !== normB.skipLocalDestined) return false
  if (normA.scanFTP !== normB.scanFTP) return false
  if (normA.blockQuickQuic !== normB.blockQuickQuic) return false
  if (normA.dscpMarking !== normB.dscpMarking) return false
  if (normA.trafficShapingPolicy !== normB.trafficShapingPolicy) return false
  
  return true
}

/**
 * Check if ruleB is shadowed by ruleA
 * ruleA must have broader or equal conditions and same action
 * ruleA comes before ruleB in the rule list
 */
export function isShadow(ruleA, ruleB) {
  const normA = normalizeRule(ruleA)
  const normB = normalizeRule(ruleB)
  
  // Actions must match for shadowing
  if (normA.action !== normB.action) return false
  
  const reasons = []
  
  // Check if ruleA's source zones contain all of ruleB's source zones
  // If ruleA has "Any", it covers everything
  if (!arrayContainsAll(normA.sourceZones, normB.sourceZones)) {
    return false // ruleA doesn't cover ruleB's source zones
  }
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) {
    reasons.push('source zones')
  }
  
  // Check if ruleA's destination zones contain all of ruleB's destination zones
  if (!arrayContainsAll(normA.destinationZones, normB.destinationZones)) {
    return false // ruleA doesn't cover ruleB's destination zones
  }
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) {
    reasons.push('destination zones')
  }
  
  // Check services - ruleA must contain all of ruleB's services
  if (!arrayContainsAll(normA.services, normB.services)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) {
    reasons.push('services')
  }
  
  // Check source networks - ruleA must contain all of ruleB's source networks
  if (!arrayContainsAll(normA.sourceNetworks, normB.sourceNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) {
    reasons.push('source networks')
  }
  
  // Check destination networks - ruleA must contain all of ruleB's destination networks
  if (!arrayContainsAll(normA.destinationNetworks, normB.destinationNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) {
    reasons.push('destination networks')
  }
  
  // Schedule must match or ruleA must be more permissive
  // For now, we require exact match (can be enhanced later)
  if (normA.schedule !== normB.schedule) {
    return false
  }
  
  // Security profiles must match or ruleA must be more permissive
  // For now, we require exact match (can be enhanced later)
  if (normA.webFilter !== normB.webFilter) return false
  if (normA.applicationControl !== normB.applicationControl) return false
  if (normA.intrusionPrevention !== normB.intrusionPrevention) return false
  if (normA.scanVirus !== normB.scanVirus) return false
  if (normA.zeroDayProtection !== normB.zeroDayProtection) return false
  if (normA.proxyMode !== normB.proxyMode) return false
  if (normA.decryptHTTPS !== normB.decryptHTTPS) return false
  
  // Misc flags must match
  if (normA.logTraffic !== normB.logTraffic) return false
  if (normA.skipLocalDestined !== normB.skipLocalDestined) return false
  if (normA.scanFTP !== normB.scanFTP) return false
  if (normA.blockQuickQuic !== normB.blockQuickQuic) return false
  if (normA.dscpMarking !== normB.dscpMarking) return false
  if (normA.trafficShapingPolicy !== normB.trafficShapingPolicy) return false
  
  // If we get here, ruleA shadows ruleB
  // If reasons is empty, they're equal (which is also shadowing, but should be caught as duplicate)
  return {
    isShadowed: true,
    reason: reasons.length > 0 
      ? `broader match on ${reasons.join(', ')}`
      : 'identical conditions (duplicate)'
  }
}

/**
 * Analyze firewall rules for duplicates and shadowed rules
 * Returns an array of issues found
 */
export function analyzeFirewallRules(rules) {
  if (!rules || rules.length === 0) return []
  
  const issues = []
  const duplicateGroups = new Map() // Map of comparison key to first rule ID
  
  // First pass: find duplicates
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (!rule.networkPolicy && !rule.userPolicy) continue
    
    // Check against all previous rules
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      if (!prevRule.networkPolicy && !prevRule.userPolicy) continue
      
      if (isDuplicate(prevRule, rule)) {
        // Check if we've already marked this as a duplicate group
        const key = `${prevRule.id}`
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, prevRule.id)
        }
        issues.push({
          rule_id: rule.id,
          type: 'duplicate',
          of: duplicateGroups.get(key)
        })
        break // Only mark once per rule
      }
    }
  }
  
  // Second pass: find shadowed rules
  // Only check rules that aren't already marked as duplicates
  const duplicateRuleIds = new Set(issues.filter(i => i.type === 'duplicate').map(i => i.rule_id))
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (!rule.networkPolicy && !rule.userPolicy) continue
    if (duplicateRuleIds.has(rule.id)) continue // Skip duplicates
    
    // Check against all previous rules
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      if (!prevRule.networkPolicy && !prevRule.userPolicy) continue
      if (duplicateRuleIds.has(prevRule.id)) continue // Skip duplicates
      
      const shadowResult = isShadow(prevRule, rule)
      if (shadowResult && shadowResult.isShadowed) {
        issues.push({
          rule_id: rule.id,
          type: 'shadow',
          by: prevRule.id,
          reason: shadowResult.reason
        })
        break // Only mark once per rule
      }
    }
  }
  
  return issues
}

// ============================================================================
// NAT Rule Analysis
// ============================================================================

/**
 * Normalize a NAT rule for comparison
 */
function normalizeNATRule(rule) {
  const fields = rule.fields || {}
  
  // Helper to extract array from OriginalSourceNetworks, OriginalDestinationNetworks, etc.
  // Returns empty array if field is missing or empty (not ['Any'])
  const getArrayField = (fieldName, childTag = 'Network') => {
    const field = fields[fieldName]
    if (!field) return []
    const extracted = extractArray(field)
    // If extractArray returns ['Any'], it means the field was empty/missing, so return []
    if (extracted && extracted.length === 1 && extracted[0] === 'Any') return []
    return extracted && extracted.length > 0 ? extracted : []
  }
  
  // Helper to extract array from OriginalServices
  // Returns empty array if field is missing or empty (not ['Any'])
  const getServicesArray = (fieldName) => {
    const field = fields[fieldName]
    if (!field) return []
    const extracted = extractArray(field)
    // If extractArray returns ['Any'], it means the field was empty/missing, so return []
    if (extracted && extracted.length === 1 && extracted[0] === 'Any') return []
    return extracted && extracted.length > 0 ? extracted : []
  }
  
  // Helper to extract array from InboundInterfaces
  // Returns empty array if field is missing or empty (not ['Any'])
  const getInterfacesArray = (fieldName) => {
    const field = fields[fieldName]
    if (!field) return []
    const extracted = extractArray(field)
    // If extractArray returns ['Any'], it means the field was empty/missing, so return []
    if (extracted && extracted.length === 1 && extracted[0] === 'Any') return []
    return extracted && extracted.length > 0 ? extracted : []
  }
  
  // Helper to get After field (can be object with Name property or string)
  const getAfterValue = () => {
    const after = fields.After
    if (!after) return null
    if (typeof after === 'object' && after.Name) {
      return normalizeValue(after.Name)
    }
    return normalizeValue(after)
  }
  
  return {
    // Basic fields
    ipFamily: normalizeValue(fields.IPFamily),
    status: normalizeValue(fields.Status || fields.Enable),
    position: normalizeValue(fields.Position),
    linkedFirewallrule: normalizeValue(fields.LinkedFirewallrule),
    after: getAfterValue(),
    
    // NAT-specific fields
    action: normalizeValue(fields.Action),
    natType: normalizeValue(fields.NATType || fields.Type),
    natMethod: normalizeValue(fields.NATMethod),
    healthCheck: normalizeValue(fields.HealthCheck),
    overrideInterfaceNATPolicy: normalizeValue(fields.OverrideInterfaceNATPolicy),
    
    // Zones
    sourceZones: normalizeZones(fields, 'SourceZones'),
    destinationZones: normalizeZones(fields, 'DestinationZones'),
    
    // Networks
    sourceNetworks: normalizeNetworks(fields, 'SourceNetworks'),
    destinationNetworks: normalizeNetworks(fields, 'DestinationNetworks'),
    originalSourceNetworks: getArrayField('OriginalSourceNetworks', 'Network'),
    originalDestinationNetworks: getArrayField('OriginalDestinationNetworks', 'Network'),
    
    // Services
    services: normalizeServices(fields),
    originalServices: getServicesArray('OriginalServices'),
    
    // NAT translation fields
    originalSource: normalizeValue(fields.OriginalSource),
    translatedSource: normalizeValue(fields.TranslatedSource),
    originalDestination: normalizeValue(fields.OriginalDestination),
    translatedDestination: normalizeValue(fields.TranslatedDestination),
    originalService: normalizeValue(fields.OriginalService),
    translatedService: normalizeValue(fields.TranslatedService),
    
    // Interfaces
    inboundInterfaces: getInterfacesArray('InboundInterfaces'),
    
    // Other fields
    schedule: normalizeValue(fields.Schedule),
    logTraffic: normalizeValue(fields.LogTraffic),
  }
}

/**
 * Check if two NAT rules are duplicates
 * All fields must match exactly
 */
export function isDuplicateNAT(ruleA, ruleB) {
  const normA = normalizeNATRule(ruleA)
  const normB = normalizeNATRule(ruleB)
  
  // Basic fields must match
  if (normA.ipFamily !== normB.ipFamily) return false
  if (normA.status !== normB.status) return false
  if (normA.position !== normB.position) return false
  if (normA.linkedFirewallrule !== normB.linkedFirewallrule) return false
  if (normA.after !== normB.after) return false
  
  // NAT-specific fields must match
  if (normA.action !== normB.action) return false
  if (normA.natType !== normB.natType) return false
  if (normA.natMethod !== normB.natMethod) return false
  if (normA.healthCheck !== normB.healthCheck) return false
  if (normA.overrideInterfaceNATPolicy !== normB.overrideInterfaceNATPolicy) return false
  
  // Zones must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) return false
  
  // Networks must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) return false
  if (!arraysEqualIgnoreOrder(normA.originalSourceNetworks, normB.originalSourceNetworks)) return false
  if (!arraysEqualIgnoreOrder(normA.originalDestinationNetworks, normB.originalDestinationNetworks)) return false
  
  // Services must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) return false
  if (!arraysEqualIgnoreOrder(normA.originalServices, normB.originalServices)) return false
  
  // NAT translation fields must match
  if (normA.originalSource !== normB.originalSource) return false
  if (normA.translatedSource !== normB.translatedSource) return false
  if (normA.originalDestination !== normB.originalDestination) return false
  if (normA.translatedDestination !== normB.translatedDestination) return false
  if (normA.originalService !== normB.originalService) return false
  if (normA.translatedService !== normB.translatedService) return false
  
  // Interfaces must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.inboundInterfaces, normB.inboundInterfaces)) return false
  
  // Other fields must match
  if (normA.schedule !== normB.schedule) return false
  if (normA.logTraffic !== normB.logTraffic) return false
  
  return true
}

/**
 * Check if NAT ruleB is shadowed by NAT ruleA
 */
export function isShadowNAT(ruleA, ruleB) {
  const normA = normalizeNATRule(ruleA)
  const normB = normalizeNATRule(ruleB)
  
  // Actions must match for shadowing
  if (normA.action !== normB.action) return false
  
  // NATType must match
  if (normA.natType !== normB.natType) return false
  
  const reasons = []
  
  // Check if ruleA's source zones contain all of ruleB's source zones
  if (!arrayContainsAll(normA.sourceZones, normB.sourceZones)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) {
    reasons.push('source zones')
  }
  
  // Check if ruleA's destination zones contain all of ruleB's destination zones
  if (!arrayContainsAll(normA.destinationZones, normB.destinationZones)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) {
    reasons.push('destination zones')
  }
  
  // Check services
  if (!arrayContainsAll(normA.services, normB.services)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) {
    reasons.push('services')
  }
  
  // Check source networks
  if (!arrayContainsAll(normA.sourceNetworks, normB.sourceNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) {
    reasons.push('source networks')
  }
  
  // Check destination networks
  if (!arrayContainsAll(normA.destinationNetworks, normB.destinationNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) {
    reasons.push('destination networks')
  }
  
  // Schedule must match
  if (normA.schedule !== normB.schedule) {
    return false
  }
  
  // NAT-specific fields must match exactly
  if (normA.originalSource !== normB.originalSource) return false
  if (normA.translatedSource !== normB.translatedSource) return false
  if (normA.originalDestination !== normB.originalDestination) return false
  if (normA.translatedDestination !== normB.translatedDestination) return false
  if (normA.originalService !== normB.originalService) return false
  if (normA.translatedService !== normB.translatedService) return false
  
  // Misc flags must match
  if (normA.logTraffic !== normB.logTraffic) return false
  
  return {
    isShadowed: true,
    reason: reasons.length > 0 
      ? `broader match on ${reasons.join(', ')}`
      : 'identical conditions (duplicate)'
  }
}

/**
 * Analyze NAT rules for duplicates and shadowed rules
 */
export function analyzeNATRules(rules) {
  if (!rules || rules.length === 0) return []
  
  const issues = []
  const duplicateGroups = new Map()
  
  // First pass: find duplicates
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (!rule.fields) continue
    
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      if (!prevRule.fields) continue
      
      if (isDuplicateNAT(prevRule, rule)) {
        const key = `${prevRule.transactionId || prevRule.id || j}`
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, j)
        }
        issues.push({
          rule_id: i,
          type: 'duplicate',
          of: duplicateGroups.get(key)
        })
        break
      }
    }
  }
  
  // Second pass: find shadowed rules
  const duplicateRuleIds = new Set(issues.filter(i => i.type === 'duplicate').map(i => i.rule_id))
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (!rule.fields) continue
    if (duplicateRuleIds.has(i)) continue
    
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      if (!prevRule.fields) continue
      if (duplicateRuleIds.has(j)) continue
      
      const shadowResult = isShadowNAT(prevRule, rule)
      if (shadowResult && shadowResult.isShadowed) {
        issues.push({
          rule_id: i,
          type: 'shadow',
          by: j,
          reason: shadowResult.reason
        })
        break
      }
    }
  }
  
  return issues
}

// ============================================================================
// SSL/TLS Inspection Rule Analysis
// ============================================================================

/**
 * Normalize an SSL/TLS inspection rule for comparison
 */
function normalizeSSLTLSRule(rule) {
  // Helper to extract array from nested structure (for zones, networks, services)
  const getArrayFromNested = (fieldName, childKey) => {
    const field = rule[fieldName]
    if (!field) return ['Any']
    if (typeof field === 'object' && childKey && field[childKey]) {
      return extractArray(field[childKey])
    }
    return extractArray(field)
  }
  
  // Helper to extract Identity Members
  const getIdentityMembers = () => {
    const identity = rule.identity
    if (!identity) return ['Any']
    if (typeof identity === 'object' && identity.Members) {
      return extractArray(identity.Members)
    }
    return extractArray(identity)
  }
  
  // Helper to extract Websites Activity array (each Activity has Name and Type)
  const getWebsitesActivities = () => {
    const websites = rule.websites
    if (!websites) return []
    
    // If it's an object with Activity array
    if (typeof websites === 'object' && websites.Activity) {
      const activities = Array.isArray(websites.Activity) ? websites.Activity : [websites.Activity]
      return activities.map(activity => {
        if (typeof activity === 'object') {
          // Create a normalized string with Name and Type
          const name = activity.Name || ''
          const type = activity.Type || ''
          return `${name}|${type}`.trim()
        }
        return String(activity).trim()
      }).filter(a => a !== '' && a !== '|')
    }
    
    // Fallback to extractArray
    const extracted = extractArray(websites)
    // If extractArray returns ['Any'], return empty array for websites
    if (extracted && extracted.length === 1 && extracted[0] === 'Any') return []
    return extracted || []
  }
  
  // Helper to get MoveTo Name
  const getMoveToName = () => {
    const moveTo = rule.moveTo
    if (!moveTo) return null
    if (typeof moveTo === 'object' && moveTo.Name) {
      return normalizeValue(moveTo.Name)
    }
    return normalizeValue(moveTo)
  }
  
  return {
    // Basic fields
    name: normalizeValue(rule.name),
    isDefault: normalizeValue(rule.isDefault),
    description: normalizeValue(rule.description),
    enable: normalizeValue(rule.enable),
    moveToName: getMoveToName(),
    
    // SSL/TLS specific fields
    decryptAction: normalizeValue(rule.decryptAction),
    decryptionProfile: normalizeValue(rule.decryptionProfile),
    logConnections: normalizeValue(rule.logConnections),
    
    // Zones
    sourceZones: getArrayFromNested('sourceZones', 'Zone'),
    destinationZones: getArrayFromNested('destinationZones', 'Zone'),
    
    // Networks
    sourceNetworks: getArrayFromNested('sourceNetworks', 'Network'),
    destinationNetworks: getArrayFromNested('destinationNetworks', 'Network'),
    
    // Services
    services: getArrayFromNested('services', 'Service'),
    
    // Identity
    identity: getIdentityMembers(),
    
    // Websites (normalized as "Name|Type" strings for comparison)
    websites: getWebsitesActivities(),
  }
}

/**
 * Check if two SSL/TLS rules are duplicates
 * All fields must match exactly
 */
export function isDuplicateSSLTLS(ruleA, ruleB) {
  const normA = normalizeSSLTLSRule(ruleA)
  const normB = normalizeSSLTLSRule(ruleB)
  
  // Basic fields must match
  if (normA.name !== normB.name) return false
  if (normA.isDefault !== normB.isDefault) return false
  if (normA.description !== normB.description) return false
  if (normA.enable !== normB.enable) return false
  if (normA.moveToName !== normB.moveToName) return false
  
  // SSL/TLS specific fields must match
  if (normA.decryptAction !== normB.decryptAction) return false
  if (normA.decryptionProfile !== normB.decryptionProfile) return false
  if (normA.logConnections !== normB.logConnections) return false
  
  // Zones must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) return false
  
  // Networks must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) return false
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) return false
  
  // Services must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) return false
  
  // Identity must match (order-independent)
  if (!arraysEqualIgnoreOrder(normA.identity, normB.identity)) return false
  
  // Websites must match (order-independent) - compared as "Name|Type" strings
  if (!arraysEqualIgnoreOrder(normA.websites, normB.websites)) return false
  
  return true
}

/**
 * Check if SSL/TLS ruleB is shadowed by SSL/TLS ruleA
 */
export function isShadowSSLTLS(ruleA, ruleB) {
  const normA = normalizeSSLTLSRule(ruleA)
  const normB = normalizeSSLTLSRule(ruleB)
  
  // DecryptAction must match for shadowing
  if (normA.decryptAction !== normB.decryptAction) return false
  
  const reasons = []
  
  // Check if ruleA's source zones contain all of ruleB's source zones
  if (!arrayContainsAll(normA.sourceZones, normB.sourceZones)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.sourceZones, normB.sourceZones)) {
    reasons.push('source zones')
  }
  
  // Check if ruleA's destination zones contain all of ruleB's destination zones
  if (!arrayContainsAll(normA.destinationZones, normB.destinationZones)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.destinationZones, normB.destinationZones)) {
    reasons.push('destination zones')
  }
  
  // Check services
  if (!arrayContainsAll(normA.services, normB.services)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.services, normB.services)) {
    reasons.push('services')
  }
  
  // Check source networks
  if (!arrayContainsAll(normA.sourceNetworks, normB.sourceNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.sourceNetworks, normB.sourceNetworks)) {
    reasons.push('source networks')
  }
  
  // Check destination networks
  if (!arrayContainsAll(normA.destinationNetworks, normB.destinationNetworks)) {
    return false
  }
  if (!arraysEqualIgnoreOrder(normA.destinationNetworks, normB.destinationNetworks)) {
    reasons.push('destination networks')
  }
  
  // Identity must match exactly (can be enhanced later)
  if (!arraysEqualIgnoreOrder(normA.identity, normB.identity)) {
    return false
  }
  
  // Websites must match exactly (can be enhanced later)
  if (!arraysEqualIgnoreOrder(normA.websites, normB.websites)) {
    return false
  }
  
  // Other fields must match
  if (normA.decryptionProfile !== normB.decryptionProfile) return false
  if (normA.logConnections !== normB.logConnections) return false
  
  return {
    isShadowed: true,
    reason: reasons.length > 0 
      ? `broader match on ${reasons.join(', ')}`
      : 'identical conditions (duplicate)'
  }
}

/**
 * Analyze SSL/TLS inspection rules for duplicates and shadowed rules
 */
export function analyzeSSLTLSRules(rules) {
  if (!rules || rules.length === 0) return []
  
  const issues = []
  const duplicateGroups = new Map()
  
  // First pass: find duplicates
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      
      if (isDuplicateSSLTLS(prevRule, rule)) {
        const key = `${prevRule.id || j}`
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, j)
        }
        issues.push({
          rule_id: i,
          type: 'duplicate',
          of: duplicateGroups.get(key)
        })
        break
      }
    }
  }
  
  // Second pass: find shadowed rules
  const duplicateRuleIds = new Set(issues.filter(i => i.type === 'duplicate').map(i => i.rule_id))
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    if (duplicateRuleIds.has(i)) continue
    
    for (let j = 0; j < i; j++) {
      const prevRule = rules[j]
      if (duplicateRuleIds.has(j)) continue
      
      const shadowResult = isShadowSSLTLS(prevRule, rule)
      if (shadowResult && shadowResult.isShadowed) {
        issues.push({
          rule_id: i,
          type: 'shadow',
          by: j,
          reason: shadowResult.reason
        })
        break
      }
    }
  }
  
  return issues
}

