/**
 * Parse XML string and extract FirewallRule entities
 */
export function parseEntitiesXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  const config = xmlDoc.querySelector('Configuration');
  if (!config) {
    throw new Error('No Configuration element found in XML');
  }

  const apiVersion = config.getAttribute('APIVersion') || '';
  const isWifi6 = config.getAttribute('IS_WIFI6') || '0';
  const ipsCatVer = config.getAttribute('IPS_CAT_VER') || '';

  // Extract all FirewallRules
  const firewallRules = Array.from(xmlDoc.querySelectorAll('FirewallRule')).map((rule, index) => {
    return parseFirewallRule(rule, index);
  });

  // Extract FirewallRuleGroups
  const firewallRuleGroups = Array.from(xmlDoc.querySelectorAll('FirewallRuleGroup')).map((group) => {
    return parseFirewallRuleGroup(group);
  });

  // Extract other entity types (best-effort, flexible parsing)
  // Restrict to leaf entity nodes and filter by required child fields to avoid container matches/duplicates
  const ipHosts = parseEntitiesByTags(xmlDoc, ['IPHost'], 'IPHost', null)
  const fqdnHosts = parseEntitiesByTags(xmlDoc, ['FQDNHost'], 'FQDNHost', null)
  const macHosts = parseEntitiesByTags(xmlDoc, ['MACHost'], 'MACHost', null)
  // Services sometimes appear as <Service> (singular) or nested under collections; we only take leaf <Service> nodes
  const services = parseEntitiesByTags(xmlDoc, ['Service'], 'Service', null)
  // Groups can appear under various tags; support common ones
  const groups = parseEntitiesByTags(xmlDoc, ['Group'], 'Group', null)
  const fqdnHostGroups = parseEntitiesByTags(xmlDoc, ['FQDNHostGroup'], 'FQDNHostGroup', null)
  const ipHostGroups = parseEntitiesByTags(xmlDoc, ['IPHostGroup'], 'IPHostGroup', null)
  const serviceGroups = parseEntitiesByTags(xmlDoc, ['ServiceGroup'], 'ServiceGroup', null)

  // Build a dynamic map of entities by parent tag (catch-all)
  // Updated to include VLAN and Alias in known tags so they're not double-processed
  const knownTags = new Set([
    'FirewallRule', 'FirewallRuleGroup',
    'IPHost', 'FQDNHost', 'MACHost', 'Service', 'Services', 'Group',
    'FQDNHostGroup', 'IPHostGroup', 'ServiceGroup',
    'VLAN', 'Alias' // Add these to known tags to prevent double processing
  ])
  
  // Exclude root/container tags
  const excludedTags = new Set(['Configuration', 'Entities', 'Root', 'Entity'])

  const entitiesByTag = {}
  // Heuristic: any element with a <Name> child or transactionid is considered an entity
  // This catches ALL entity types dynamically
  Array.from(xmlDoc.querySelectorAll('*'))
    .forEach((el) => {
      const tag = el.tagName
      if (knownTags.has(tag) || excludedTags.has(tag)) return
      
      // Skip if parent is Configuration or Entities (root level containers)
      const parent = el.parentElement
      if (!parent || parent.tagName === 'Configuration' || parent.tagName === 'Entities') {
        // Only include if it has transactionid and is at root level
        if (!el.hasAttribute('transactionid')) return
      }
      
      // Consider only leaf-like items (not the XML root or large containers)
      const hasName = !!el.querySelector(':scope > Name')
      const hasTx = el.hasAttribute('transactionid')
      if (!hasName && !hasTx) return
      
      // Avoid adding parents that simply wrap known tags
      const directKnownChild = Array.from(el.children).some(c => knownTags.has(c.tagName))
      if (directKnownChild) return
      
      if (!entitiesByTag[tag]) entitiesByTag[tag] = []
    })

  // Process all discovered entity tags
  Object.keys(entitiesByTag).forEach((tag) => {
    entitiesByTag[tag] = Array.from(xmlDoc.querySelectorAll(tag))
      .filter(el => {
        // Skip container elements - if element has direct children with same tag, it's likely a container
        const hasSameTagChildren = Array.from(el.children).some(child => child.tagName === tag)
        if (hasSameTagChildren) return false
        
        // Skip if parent element has the same tag (we're inside a container)
        const parent = el.parentElement
        if (parent && parent.tagName === tag) return false
        
        // Must have either transactionid OR a Name child with actual content
        const hasTransactionId = el.hasAttribute('transactionid')
        const nameEl = el.querySelector(':scope > Name')
        const hasName = nameEl && nameEl.textContent.trim().length > 0
        
        // Must have at least one of these to be a valid entity
        if (!hasTransactionId && !hasName) return false
        
        // Additional check: must have some meaningful content (not just empty wrapper)
        // Check if element has any non-empty child elements or text content
        const hasContent = Array.from(el.children).length > 0 || 
                          (el.textContent && el.textContent.trim().length > 0)
        return hasContent
      })
      .map((el, idx) => baseParseEntity(el, idx, tag))
      .filter(ent => {
        // Final validation: must have meaningful data
        const hasName = ent.name && ent.name.length > 0 && ent.name !== formatTagName(tag)
        const hasFields = Object.keys(ent.fields || {}).length > 0
        const hasTransactionId = ent.transactionId && ent.transactionId.length > 0
        
        // Must have at least name (that's not just the formatted tag) OR fields OR transactionid
        return (hasName || hasFields || hasTransactionId) && 
               // Ensure fields aren't all empty
               (!hasFields || Object.values(ent.fields).some(v => {
                 if (typeof v === 'string') return v.trim().length > 0
                 if (Array.isArray(v)) return v.length > 0 && v.some(item => 
                   typeof item === 'string' ? item.trim().length > 0 : item != null
                 )
                 return v != null
               }))
      })
  })

  // Special handling: Extract VLAN and Alias with Interface relationships
  const vlans = Array.from(xmlDoc.querySelectorAll('VLAN'))
    .map((el, idx) => {
      const entity = baseParseEntity(el, idx, 'VLAN')
      const interfaceField = el.querySelector('Interface')
      entity.interface = interfaceField ? interfaceField.textContent.trim() : null
      entity.zone = el.querySelector('Zone') ? el.querySelector('Zone').textContent.trim() : null
      return entity
    })
    .filter(ent => ent.name || Object.keys(ent.fields || {}).length > 0)

  const aliases = Array.from(xmlDoc.querySelectorAll('Alias'))
    .map((el, idx) => {
      const entity = baseParseEntity(el, idx, 'Alias')
      const interfaceField = el.querySelector('Interface')
      entity.interface = interfaceField ? interfaceField.textContent.trim() : null
      return entity
    })
    .filter(ent => ent.name || Object.keys(ent.fields || {}).length > 0)

  // Group VLAN and Alias by Interface
  const portsWithEntities = {}
  
  // Add VLANs to their interfaces
  vlans.forEach(vlan => {
    const interfaceName = vlan.interface || 'Unknown'
    if (!portsWithEntities[interfaceName]) {
      portsWithEntities[interfaceName] = { vlans: [], aliases: [] }
    }
    portsWithEntities[interfaceName].vlans.push(vlan)
  })

  // Add Aliases to their interfaces
  aliases.forEach(alias => {
    const interfaceName = alias.interface || 'Unknown'
    if (!portsWithEntities[interfaceName]) {
      portsWithEntities[interfaceName] = { vlans: [], aliases: [] }
    }
    portsWithEntities[interfaceName].aliases.push(alias)
  })

  // Add VLANs and Aliases to entitiesByTag for backward compatibility
  if (vlans.length > 0) {
    entitiesByTag['VLAN'] = vlans
  }
  if (aliases.length > 0) {
    entitiesByTag['Alias'] = aliases
  }

  // Special handling: Extract LAG with MemberInterface relationships
  const lags = Array.from(xmlDoc.querySelectorAll('LAG'))
    .map((el, idx) => {
      const entity = baseParseEntity(el, idx, 'LAG')
      // Extract member interfaces from MemberInterface.Interface (can be array or single)
      const memberInterfaceField = entity.fields?.MemberInterface
      let memberInterfaces = []
      if (memberInterfaceField) {
        if (typeof memberInterfaceField === 'object' && memberInterfaceField.Interface) {
          // Could be array or single value
          memberInterfaces = Array.isArray(memberInterfaceField.Interface) 
            ? memberInterfaceField.Interface 
            : [memberInterfaceField.Interface]
        } else if (typeof memberInterfaceField === 'string') {
          memberInterfaces = [memberInterfaceField]
        }
      }
      // Also try direct XML query as fallback
      if (memberInterfaces.length === 0) {
        const interfaceElements = el.querySelectorAll('MemberInterface > Interface')
        memberInterfaces = Array.from(interfaceElements).map(i => i.textContent.trim()).filter(Boolean)
      }
      entity.memberInterfaces = memberInterfaces
      return entity
    })
    .filter(ent => ent.name || Object.keys(ent.fields || {}).length > 0)

  // Group Interface entities by their parent LAG
  const lagsWithMembers = {}
  const interfaceToLAG = new Map() // Map interface name to LAG name
  
  // Build map of interfaces to their parent LAG
  lags.forEach(lag => {
    const lagName = lag.name || lag.fields?.Name || ''
    if (!lagName) return
    
    if (!lagsWithMembers[lagName]) {
      lagsWithMembers[lagName] = { lag, members: [] }
    }
    
    // Track which interfaces belong to this LAG
    lag.memberInterfaces.forEach(interfaceName => {
      interfaceToLAG.set(interfaceName, lagName)
    })
  })
  
  // Add Interface entities to their parent LAG
  const interfaceEntities = entitiesByTag['Interface'] || []
  interfaceEntities.forEach(intf => {
    const interfaceName = intf.name || intf.fields?.Name || ''
    if (interfaceName && interfaceToLAG.has(interfaceName)) {
      const lagName = interfaceToLAG.get(interfaceName)
      if (lagsWithMembers[lagName]) {
        lagsWithMembers[lagName].members.push(intf)
      }
    }
  })

  // Add LAGs to entitiesByTag for backward compatibility
  if (lags.length > 0) {
    entitiesByTag['LAG'] = lags
  }

  // Special handling: Extract VPNIPSecConnection with multiple Configuration children
  const vpnConnections = []
  Array.from(xmlDoc.querySelectorAll('VPNIPSecConnection')).forEach((vpnEl, vpnIdx) => {
    const transactionId = vpnEl.getAttribute('transactionid') || ''
    // Extract each Configuration as a separate connection
    const configurations = Array.from(vpnEl.querySelectorAll('Configuration'))
    configurations.forEach((configEl, configIdx) => {
      const entity = baseParseEntity(configEl, vpnConnections.length, 'VPNIPSecConnection')
      entity.transactionId = transactionId // Use parent transaction ID
      entity.configIndex = configIdx
      vpnConnections.push(entity)
    })
  })

  // Add VPN connections to entitiesByTag
  if (vpnConnections.length > 0) {
    entitiesByTag['VPNIPSecConnection'] = vpnConnections
  }

  return {
    metadata: {
      apiVersion,
      isWifi6,
      ipsCatVer,
    },
    firewallRules,
    firewallRuleGroups,
    ipHosts,
    fqdnHosts,
    macHosts,
    services,
    groups,
    fqdnHostGroups,
    ipHostGroups,
    serviceGroups,
    entitiesByTag,
    portsWithEntities, // New: grouped structure for VLAN/Alias by Interface
    lagsWithMembers, // New: grouped structure for LAG with member Interfaces
    vlans,
    aliases,
  };
}

/**
 * Parse a single FirewallRule element
 */
function parseFirewallRule(ruleElement, index) {
  const transactionId = ruleElement.getAttribute('transactionid') || '';
  
  const getText = (tagName) => {
    const el = ruleElement.querySelector(tagName);
    return el ? el.textContent.trim() : '';
  };

  const getNestedObject = (tagName) => {
    const parent = ruleElement.querySelector(tagName);
    if (!parent) return null;
    
    const obj = {};
    const processedTags = new Set();
    
    Array.from(parent.children).forEach(child => {
      const tag = child.tagName;
      
      // Skip if we've already processed this tag (handles arrays)
      if (processedTags.has(tag)) return;
      
      // Check if there are multiple siblings with the same tag (array pattern)
      const siblings = Array.from(parent.children).filter(c => c.tagName === tag);
      
      if (siblings.length > 1) {
        // Multiple siblings = array
        obj[tag] = siblings.map(s => {
          if (s.children.length === 0) {
            return s.textContent.trim();
          }
          // Nested children - check if they're all the same tag
          const nested = Array.from(s.children);
          if (nested.length > 0 && nested.every(n => n.tagName === nested[0].tagName && n.children.length === 0)) {
            return nested.map(n => n.textContent.trim());
          }
          return parseObject(s);
        });
        processedTags.add(tag);
      } else {
        // Single element
        if (child.children.length === 0) {
          obj[tag] = child.textContent.trim();
        } else {
          // Has children - check if it's an array of same tags
          const children = Array.from(child.children);
          const firstTag = children[0]?.tagName;
          
          if (firstTag && children.length > 0 && children.every(c => c.tagName === firstTag && c.children.length === 0)) {
            obj[tag] = children.map(c => c.textContent.trim());
          } else {
            // Complex nested object
            const nestedObj = {};
            children.forEach(grandchild => {
              if (grandchild.children.length === 0) {
                nestedObj[grandchild.tagName] = grandchild.textContent.trim();
              } else {
                nestedObj[grandchild.tagName] = parseObject(grandchild);
              }
            });
            obj[tag] = nestedObj;
          }
        }
        processedTags.add(tag);
      }
    });
    return obj;
  };

  const parseObject = (element) => {
    const obj = {};
    Array.from(element.children).forEach(child => {
      if (child.children.length === 0) {
        obj[child.tagName] = child.textContent.trim();
      } else {
        const children = Array.from(child.children);
        const firstTag = children[0]?.tagName;
        if (firstTag && children.every(c => c.tagName === firstTag && c.children.length === 0)) {
          obj[child.tagName] = children.map(c => c.textContent.trim());
        } else {
          obj[child.tagName] = parseObject(child);
        }
      }
    });
    return obj;
  };

  const rule = {
    id: index,
    transactionId,
    name: getText('Name'),
    description: getText('Description'),
    ipFamily: getText('IPFamily'),
    status: getText('Status'),
    position: getText('Position'),
    policyType: getText('PolicyType'),
    after: (() => {
      const afterEl = ruleElement.querySelector('After > Name');
      return afterEl ? afterEl.textContent.trim() : '';
    })(),
    networkPolicy: getNestedObject('NetworkPolicy'),
    userPolicy: getNestedObject('UserPolicy'),
    rawXml: ruleElement.outerHTML,
  };

  return rule;
}

/**
 * Parse a FirewallRuleGroup element
 */
function parseFirewallRuleGroup(groupElement) {
  const transactionId = groupElement.getAttribute('transactionid') || '';
  
  const name = groupElement.querySelector('Name')?.textContent.trim() || '';
  const description = groupElement.querySelector('Description')?.textContent.trim() || '';
  
  const securityPolicyList = Array.from(
    groupElement.querySelectorAll('SecurityPolicyList > SecurityPolicy')
  ).map(el => el.textContent.trim());

  const policyType = groupElement.querySelector('Policytype')?.textContent.trim() || '';

  return {
    transactionId,
    name,
    description,
    securityPolicyList,
    policyType,
  };
}

/**
 * Parse generic entities by tag name. Captures Name and all direct child fields.
 */
function baseParseEntity(el, idx, tagName) {
  let name = el.querySelector('Name')?.textContent.trim() || ''
  // If no name found, use formatted tag name as fallback
  if (!name) {
    name = formatTagName(tagName)
  }
  const transactionId = el.getAttribute('transactionid') || ''

  const fields = {}
  Array.from(el.children).forEach(child => {
    const key = child.tagName
    if (child.children.length === 0) {
      // Simple text node
      fields[key] = child.textContent.trim()
    } else {
      // Has children - use smart nested parsing
      fields[key] = parseNestedSmart(child)
    }
  })

  return {
    id: idx,
    tag: tagName,
    name,
    transactionId,
    fields,
    rawXml: el.outerHTML,
  }
}

function parseGenericEntities(xmlDoc, tagName) {
  return Array.from(xmlDoc.querySelectorAll(tagName)).map((el, idx) => baseParseEntity(el, idx, tagName))
}

function parseEntitiesByTags(xmlDoc, tagNames, canonicalTag, requiredChildTag) {
  const results = []
  const seen = new Set()
  tagNames.forEach(selector => {
    const nodes = Array.from(xmlDoc.querySelectorAll(selector))
    nodes.forEach((el) => {
      // Skip container elements - if element has direct children with same tag, it's likely a container
      const hasSameTagChildren = Array.from(el.children).some(child => child.tagName === selector)
      if (hasSameTagChildren) return
      
      // Skip if parent element has the same tag (we're inside a container)
      const parent = el.parentElement
      if (parent && parent.tagName === selector) return
      
      // Filter out container elements by requiring a specific child if provided
      if (requiredChildTag && !el.querySelector(requiredChildTag)) return
      
      // Must have either transactionid OR a Name child with actual content
      const hasTransactionId = el.hasAttribute('transactionid')
      const nameEl = el.querySelector(':scope > Name')
      const hasName = nameEl && nameEl.textContent.trim().length > 0
      
      // Must have at least one of these to be a valid entity
      if (!hasTransactionId && !hasName) return
      
      // Additional check: must have some meaningful content
      const hasContent = Array.from(el.children).length > 0 || 
                        (el.textContent && el.textContent.trim().length > 0)
      if (!hasContent) return
      
      const entity = baseParseEntity(el, results.length, canonicalTag)
      
      // Enhanced validation: must have meaningful data
      const hasValidName = entity.name && entity.name.length > 0 && entity.name !== formatTagName(canonicalTag)
      const hasFields = Object.keys(entity.fields || {}).length > 0
      const hasValidTransactionId = entity.transactionId && entity.transactionId.length > 0
      
      // Must have at least name (that's not just the formatted tag) OR fields OR transactionid
      const hasData = hasValidName || hasFields || hasValidTransactionId
      if (!hasData) return
      
      // Ensure fields aren't all empty
      if (hasFields) {
        const hasNonEmptyFields = Object.values(entity.fields).some(v => {
          if (typeof v === 'string') return v.trim().length > 0
          if (Array.isArray(v)) return v.length > 0 && v.some(item => 
            typeof item === 'string' ? item.trim().length > 0 : item != null
          )
          if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0
          return v != null
        })
        if (!hasNonEmptyFields) return
      }
      
      // Deduplicate by transactionId+name+tag if available, else by rawXml hash
      const key = `${canonicalTag}|${entity.transactionId}|${entity.name}` || entity.rawXml
      if (seen.has(key)) return
      seen.add(key)
      results.push(entity)
    })
  })
  return results
}

// Export formatTagName for use in other modules
export function formatTagName(tagName) {
  if (!tagName) return ''
  // Insert space before capital letters (but not the first one)
  return tagName.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals like "SMTPSSettings"
    .trim()
}

function parseNestedSmart(element) {
  const children = Array.from(element.children)
  if (children.length === 0) {
    return element.textContent.trim()
  }

  // Check if all children have the same tag name (array pattern like <FQDN>value1</FQDN><FQDN>value2</FQDN>)
  const firstTag = children[0]?.tagName
  if (firstTag && children.length > 1 && children.every(c => c.tagName === firstTag)) {
    // All same tag = array of values
    return children.map(c => {
      if (c.children.length === 0) {
        return c.textContent.trim()
      }
      // Each item might have nested structure
      return parseNestedSmart(c)
    })
  }

  // Different tags or single child = object
  const obj = {}
  const processedTags = new Set()

  children.forEach(child => {
    const tag = child.tagName
    // If we've seen this tag before and haven't built an array yet, convert to array
    if (processedTags.has(tag)) {
      const existing = obj[tag]
      if (!Array.isArray(existing)) {
        obj[tag] = [existing]
      }
      obj[tag].push(child.children.length === 0 ? child.textContent.trim() : parseNestedSmart(child))
    } else {
      processedTags.add(tag)
      obj[tag] = child.children.length === 0 ? child.textContent.trim() : parseNestedSmart(child)
    }
  })

  return obj
}

/**
 * Convert parsed data to flat structure for table display
 */
export function flattenFirewallRule(rule) {
  const policy = rule.networkPolicy || rule.userPolicy || {};
  
  // Helper to extract array values from policy
  const getArrayValue = (key, subKey) => {
    const value = policy[key];
    if (!value) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value[subKey]) {
      return Array.isArray(value[subKey]) ? value[subKey].join(', ') : value[subKey];
    }
    return '';
  };

  const flattened = {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    status: rule.status,
    ipFamily: rule.ipFamily,
    policyType: rule.policyType,
    position: rule.position,
    after: rule.after,
    action: policy.Action || '',
    logTraffic: policy.LogTraffic || '',
    sourceZones: getArrayValue('SourceZones', 'Zone'),
    destinationZones: getArrayValue('DestinationZones', 'Zone'),
    schedule: policy.Schedule || '',
    sourceNetworks: getArrayValue('SourceNetworks', 'Network'),
    destinationNetworks: getArrayValue('DestinationNetworks', 'Network'),
    services: getArrayValue('Services', 'Service'),
    webFilter: policy.WebFilter || '',
    applicationControl: policy.ApplicationControl || '',
    intrusionPrevention: policy.IntrusionPrevention || '',
    scanVirus: policy.ScanVirus || '',
    zeroDayProtection: policy.ZeroDayProtection || '',
    proxyMode: policy.ProxyMode || '',
    decryptHTTPS: policy.DecryptHTTPS || '',
  };

  // Add identity if it's a UserPolicy
  if (rule.userPolicy && rule.userPolicy.Identity) {
    const identity = rule.userPolicy.Identity;
    // Handle both cases: Identity as direct array or Identity.Member structure
    if (Array.isArray(identity)) {
      // Identity is parsed as direct array: ['Open Group', 'Clientless Open Group', ...]
      flattened.identity = identity.join(', ');
    } else if (identity.Member) {
      // Identity is parsed as object with Member property
      flattened.identity = Array.isArray(identity.Member) 
        ? identity.Member.join(', ')
        : (identity.Member || '');
    } else if (typeof identity === 'string') {
      // Identity is a single string value
      flattened.identity = identity;
    }
  }

  return flattened;
}