/**
 * Entity Reference Tree Builder
 * 
 * This module analyzes XML entities and builds a tree structure showing
 * where each entity name is referenced throughout the configuration.
 */

/**
 * Helper to yield control back to the browser to prevent "page not responding"
 * Uses requestIdleCallback when available, falls back to setTimeout
 */
function yieldToMain() {
  return new Promise(resolve => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(resolve, { timeout: 50 })
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/**
 * Build a reference tree for all entities in the XML (ASYNC version with progress)
 * This version yields control periodically to prevent browser freeze
 * @param {string} xmlString - The XML content as a string
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Map of entity names to their reference trees
 */
export async function buildEntityReferenceTreeAsync(xmlString, onProgress = () => {}) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  onProgress(5) // Parsing complete

  // Step 1: Extract all entities with Name tags
  const entities = extractAllEntities(xmlDoc);
  onProgress(15) // Extraction complete
  
  // Step 2: Build a map of entity names to their definitions
  const entityMap = new Map();
  entities.forEach(entity => {
    if (entity.name && entity.name.trim()) {
      const name = entity.name.trim();
      if (!entityMap.has(name)) {
        entityMap.set(name, []);
      }
      entityMap.get(name).push(entity);
    }
  });

  onProgress(20) // Entity map built

  // Step 3: Pre-build text node index for faster lookups (the key optimization)
  const textNodeIndex = buildTextNodeIndex(xmlDoc);
  onProgress(35) // Text index built

  // Step 4: For each entity name, find all references (with chunking)
  const referenceTree = {};
  const entityNames = Array.from(entityMap.keys());
  const totalEntities = entityNames.length;
  const CHUNK_SIZE = 50; // Process 50 entities before yielding
  
  for (let i = 0; i < totalEntities; i++) {
    const entityName = entityNames[i];
    const entityDefs = entityMap.get(entityName);
    
    // Use optimized lookup with pre-built index
    const references = findEntityReferencesOptimized(entityName, textNodeIndex, entityMap);
    
    // Get the primary tag (most common tag for this entity name)
    const primaryTag = entityDefs.length > 0 ? entityDefs[0].tag : 'Unknown';
    
    // Only include entities that have one or more references
    if (references.length > 0) {
      referenceTree[entityName] = {
        entityName,
        primaryTag,
        definitions: entityDefs,
        references: references
      };
    }
    
    // Yield control every CHUNK_SIZE entities to keep UI responsive
    if (i > 0 && i % CHUNK_SIZE === 0) {
      const progress = 35 + Math.floor((i / totalEntities) * 60);
      onProgress(Math.min(progress, 95));
      await yieldToMain();
    }
  }
  
  onProgress(100);
  return referenceTree;
}

/**
 * Build an index of all text nodes for faster entity lookups
 * This avoids walking the tree multiple times
 * @param {Document} xmlDoc - The parsed XML document
 * @returns {Map} - Map of text content to array of parent elements
 */
function buildTextNodeIndex(xmlDoc) {
  const textNodeIndex = new Map();
  
  const walker = xmlDoc.createTreeWalker(
    xmlDoc,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const textContent = node.textContent.trim();
    if (textContent) {
      if (!textNodeIndex.has(textContent)) {
        textNodeIndex.set(textContent, []);
      }
      textNodeIndex.get(textContent).push(node.parentElement);
    }
  }
  
  return textNodeIndex;
}

/**
 * Find entity references using pre-built text node index (optimized)
 * @param {string} entityName - The entity name to search for
 * @param {Map} textNodeIndex - Pre-built index of text nodes
 * @param {Map} entityMap - Map of all entity names to their definitions
 * @returns {Array} - Array of reference objects
 */
function findEntityReferencesOptimized(entityName, textNodeIndex, entityMap) {
  const references = [];
  const seen = new Set();
  
  const referenceTags = [
    'Network', 'Zone', 'Service', 'Group', 'Member', 'Members',
    'Interface', 'VLAN', 'Alias', 'Schedule', 'WebFilter',
    'ApplicationControl', 'IntrusionPrevention', 'Country',
    'Application', 'Activity', 'Category', 'Identity',
    'SourceNetwork', 'DestinationNetwork', 'SourceZone', 'DestinationZone',
    'SourceService', 'DestinationService', 'FQDN', 'IPAddress',
    'MACAddress', 'Host', 'HostGroup', 'ServiceGroup',
    'CertificateAuthority', 'Certificate', 'After', 'Before',
    'MoveTo', 'DecryptionProfile', 'IPFamily',
    'User', 'DisableUser', 'AllowedUser', 'AuthenticationServer',
    'SDWANProfileName', 'LinkSelection'
  ];
  
  // Get matching parent elements from index
  const matchingElements = textNodeIndex.get(entityName) || [];
  
  for (const parentElement of matchingElements) {
    if (!parentElement) continue;
    
    // Skip if this is the Name element of the entity itself
    if (parentElement.tagName === 'Name') {
      const grandParent = parentElement.parentElement;
      if (grandParent) {
        const entityNameEl = grandParent.querySelector(':scope > Name');
        if (entityNameEl && entityNameEl.textContent.trim() === entityName) {
          continue;
        }
      }
    }
    
    // Check if parent element is a reference tag
    if (referenceTags.includes(parentElement.tagName)) {
      const parentEntity = findParentEntity(parentElement);
      if (parentEntity && parentEntity.name !== entityName) {
        const context = findReferenceContext(parentElement);
        
        const refKey = `${parentEntity.tag}|${parentEntity.name}|${context.tag}|${parentElement.tagName}`;
        if (!seen.has(refKey)) {
          seen.add(refKey);
          references.push({
            parentEntityName: parentEntity.name,
            parentEntityTag: parentEntity.tag,
            parentTransactionId: parentEntity.transactionId,
            contextTag: context.tag,
            contextPath: context.path,
            referenceElement: parentElement.tagName,
            fullPath: buildFullPath(parentElement)
          });
        }
      }
    }
  }
  
  return references;
}

/**
 * Build a reference tree for all entities in the XML (SYNC version - legacy)
 * @param {string} xmlString - The XML content as a string
 * @returns {Object} - Map of entity names to their reference trees
 * @deprecated Use buildEntityReferenceTreeAsync for large files
 */
export function buildEntityReferenceTree(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  // Step 1: Extract all entities with Name tags
  const entities = extractAllEntities(xmlDoc);
  
  // Step 2: Build a map of entity names to their definitions
  const entityMap = new Map();
  entities.forEach(entity => {
    if (entity.name && entity.name.trim()) {
      const name = entity.name.trim();
      if (!entityMap.has(name)) {
        entityMap.set(name, []);
      }
      entityMap.get(name).push(entity);
    }
  });

  // Step 3: Build text node index once
  const textNodeIndex = buildTextNodeIndex(xmlDoc);

  // Step 4: For each entity name, find all references using optimized lookup
  const referenceTree = {};
  
  entityMap.forEach((entityDefs, entityName) => {
    const references = findEntityReferencesOptimized(entityName, textNodeIndex, entityMap);
    const primaryTag = entityDefs.length > 0 ? entityDefs[0].tag : 'Unknown';
    
    if (references.length > 0) {
      referenceTree[entityName] = {
        entityName,
        primaryTag,
        definitions: entityDefs,
        references: references
      };
    }
  });
  
  return referenceTree;
}

/**
 * Extract all entities from the XML that have a Name tag
 * @param {Document} xmlDoc - The parsed XML document
 * @returns {Array} - Array of entity objects
 */
function extractAllEntities(xmlDoc) {
  const entities = [];
  
  // Find all elements that have a direct child <Name> tag
  const allElements = xmlDoc.querySelectorAll('*');
  
  allElements.forEach(element => {
    // Skip root/container elements
    if (element.tagName === 'Configuration' || 
        element.tagName === 'Entities' || 
        element.tagName === 'Root') {
      return;
    }
    
    // Check if this element has a Name child
    const nameElement = element.querySelector(':scope > Name');
    if (!nameElement || !nameElement.textContent.trim()) {
      return;
    }
    
    const name = nameElement.textContent.trim();
    const tagName = element.tagName;
    const transactionId = element.getAttribute('transactionid') || '';
    
    // Get parent entity name if it exists
    let parentEntityName = null;
    let parentEntityTag = null;
    const parent = element.parentElement;
    if (parent && parent.tagName !== 'Configuration' && parent.tagName !== 'Entities') {
      const parentNameEl = parent.querySelector(':scope > Name');
      if (parentNameEl && parentNameEl.textContent.trim()) {
        parentEntityName = parentNameEl.textContent.trim();
        parentEntityTag = parent.tagName;
      }
    }
    
    entities.push({
      name,
      tag: tagName,
      transactionId,
      parentEntityName,
      parentEntityTag,
      element
    });
  });
  
  return entities;
}

/**
 * Find all references to a given entity name in the XML
 * @param {Document} xmlDoc - The parsed XML document
 * @param {string} entityName - The entity name to search for
 * @param {Map} entityMap - Map of all entity names to their definitions
 * @returns {Array} - Array of reference objects
 */
function findEntityReferences(xmlDoc, entityName, entityMap) {
  const references = [];
  const seen = new Set(); // Track seen references to avoid duplicates
  
  // Common tag names that can contain entity references
  // These are tags that typically contain entity names as their text content
  const referenceTags = [
    'Network', 'Zone', 'Service', 'Group', 'Member', 'Members',
    'Interface', 'VLAN', 'Alias', 'Schedule', 'WebFilter',
    'ApplicationControl', 'IntrusionPrevention', 'Country',
    'Application', 'Activity', 'Category', 'Identity',
    'SourceNetwork', 'DestinationNetwork', 'SourceZone', 'DestinationZone',
    'SourceService', 'DestinationService', 'FQDN', 'IPAddress',
    'MACAddress', 'Host', 'HostGroup', 'ServiceGroup',
    'CertificateAuthority', 'Certificate', 'After', 'Before',
    'MoveTo', 'DecryptionProfile', 'IPFamily',
    'User', 'DisableUser', 'AllowedUser', 'AuthenticationServer',
    'SDWANProfileName', 'LinkSelection'
  ];
  
  // Get all elements that have text content matching the entity name
  // Use TreeWalker to find all text nodes that match, then get their parent elements
  const walker = xmlDoc.createTreeWalker(
    xmlDoc,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const textContent = node.textContent.trim();
    if (textContent === entityName) {
      const parentElement = node.parentElement;
      if (!parentElement) continue;
      
      // Skip if this is the Name element of the entity itself
      if (parentElement.tagName === 'Name') {
        const grandParent = parentElement.parentElement;
        if (grandParent) {
          const entityNameEl = grandParent.querySelector(':scope > Name');
          if (entityNameEl && entityNameEl.textContent.trim() === entityName) {
            continue; // This is the entity definition itself, skip it
          }
        }
      }
      
      // Check if parent element is a reference tag
      if (referenceTags.includes(parentElement.tagName)) {
        const parentEntity = findParentEntity(parentElement);
        if (parentEntity && parentEntity.name !== entityName) {
          const context = findReferenceContext(parentElement);
          
          // Create unique key for this reference
          const refKey = `${parentEntity.tag}|${parentEntity.name}|${context.tag}|${parentElement.tagName}`;
          if (!seen.has(refKey)) {
            seen.add(refKey);
            references.push({
              parentEntityName: parentEntity.name,
              parentEntityTag: parentEntity.tag,
              parentTransactionId: parentEntity.transactionId,
              contextTag: context.tag,
              contextPath: context.path,
              referenceElement: parentElement.tagName,
              fullPath: buildFullPath(parentElement)
            });
          }
        }
      }
    }
  }
  
  return references;
}

/**
 * Find the parent entity that contains a given element
 * @param {Element} element - The XML element
 * @returns {Object|null} - Parent entity info or null
 */
function findParentEntity(element) {
  let current = element.parentElement;
  
  while (current) {
    // Skip container elements
    if (current.tagName === 'Configuration' || 
        current.tagName === 'Entities' || 
        current.tagName === 'Root') {
      break;
    }
    
    // Check if this element has a Name child (it's an entity)
    const nameEl = current.querySelector(':scope > Name');
    if (nameEl && nameEl.textContent.trim()) {
      return {
        name: nameEl.textContent.trim(),
        tag: current.tagName,
        transactionId: current.getAttribute('transactionid') || '',
        element: current
      };
    }
    
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Find the context (parent tag) where a reference appears
 * @param {Element} element - The reference element
 * @returns {Object} - Context information
 */
function findReferenceContext(element) {
  let current = element.parentElement;
  const path = [element.tagName];
  
  // Build path up to the parent entity
  while (current) {
    if (current.tagName === 'Configuration' || 
        current.tagName === 'Entities') {
      break;
    }
    
    const nameEl = current.querySelector(':scope > Name');
    if (nameEl && nameEl.textContent.trim()) {
      // This is the parent entity, stop here
      break;
    }
    
    path.unshift(current.tagName);
    current = current.parentElement;
  }
  
  return {
    tag: path.length > 1 ? path[path.length - 2] : element.tagName,
    path: path.join(' > ')
  };
}

/**
 * Build a full path string for an element
 * @param {Element} element - The XML element
 * @returns {string} - Full path string
 */
function buildFullPath(element) {
  const path = [];
  let current = element;
  
  while (current && current.tagName !== 'Configuration') {
    path.unshift(current.tagName);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Get reference tree for a specific entity name
 * @param {Object} referenceTree - The full reference tree
 * @param {string} entityName - The entity name to get tree for
 * @returns {Object|null} - The reference tree for the entity or null
 */
export function getEntityReferenceTree(referenceTree, entityName) {
  return referenceTree[entityName] || null;
}

/**
 * Convert reference tree to a hierarchical tree structure for visualization
 * @param {Object} entityReference - The reference data for an entity
 * @returns {Object} - Tree structure for visualization
 */
export function convertToVisualizationTree(entityReference) {
  if (!entityReference || !entityReference.references || entityReference.references.length === 0) {
    return {
      name: entityReference?.entityName || 'Unknown',
      type: 'entity',
      children: []
    };
  }
  
  // Group references by parent entity
  const groupedByParent = {};
  entityReference.references.forEach(ref => {
    const key = `${ref.parentEntityTag}:${ref.parentEntityName}`;
    if (!groupedByParent[key]) {
      groupedByParent[key] = {
        parentEntityName: ref.parentEntityName,
        parentEntityTag: ref.parentEntityTag,
        parentTransactionId: ref.parentTransactionId,
        contexts: []
      };
    }
    groupedByParent[key].contexts.push({
      contextTag: ref.contextTag,
      contextPath: ref.contextPath,
      referenceElement: ref.referenceElement
    });
  });
  
  // Build tree structure
  const children = Object.values(groupedByParent).map(group => {
    const contextChildren = group.contexts.map(ctx => ({
      name: `${ctx.contextTag} > ${ctx.referenceElement}`,
      type: 'context',
      contextTag: ctx.contextTag,
      referenceElement: ctx.referenceElement,
      contextPath: ctx.contextPath
    }));
    
    return {
      name: `${group.parentEntityTag}: ${group.parentEntityName}`,
      type: 'parent-entity',
      parentEntityName: group.parentEntityName,
      parentEntityTag: group.parentEntityTag,
      parentTransactionId: group.parentTransactionId,
      children: contextChildren
    };
  });
  
  return {
    name: entityReference.entityName,
    type: 'entity',
    children: children
  };
}

