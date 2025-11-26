/**
 * HTML Generator for Configuration Tree
 * 
 * Generates an interactive standalone HTML report showing entity reference tree
 */

import { convertToVisualizationTree } from './entityReferenceTree'

/**
 * Generate interactive HTML report for Configuration Tree
 * @param {Object} referenceTree - The reference tree data
 * @param {string} selectedEntity - Currently selected entity (optional)
 * @returns {string} - HTML content
 */
export function generateConfigTreeHTML(referenceTree, selectedEntity = null) {
  if (!referenceTree || Object.keys(referenceTree).length === 0) {
    return generateEmptyHTML()
  }

  // Serialize the reference tree data to embed in HTML
  const treeDataJson = JSON.stringify(referenceTree)

  // Get all entities sorted by tag name, then by entity name
  const allEntities = Object.keys(referenceTree).sort((a, b) => {
    const tagA = (referenceTree[a]?.primaryTag || 'Unknown').toLowerCase()
    const tagB = (referenceTree[b]?.primaryTag || 'Unknown').toLowerCase()
    
    if (tagA !== tagB) {
      return tagA.localeCompare(tagB)
    }
    
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  // Calculate statistics
  const totalReferences = Object.values(referenceTree).reduce((sum, e) => sum + (e.references?.length || 0), 0)
  const uniqueTags = new Set(Object.values(referenceTree).map(e => e.primaryTag)).size

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usage reference report</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8f9fa;
      color: #2C2D2E;
      line-height: 1.6;
    }
    .report-container {
      max-width: 1400px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0px 0px 6px 0px rgba(0, 0, 0, 0.1);
      border-radius: 0.75rem;
      overflow: hidden;
      margin-top: 2rem;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 2rem);
    }
    .report-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 2px solid #005BC8;
      margin-bottom: 1.5rem;
      flex-shrink: 0;
    }
    .report-header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .report-header p {
      font-size: 1rem;
      color: #4b5563;
      margin-top: 0.25rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .stat-box {
      background-color: #f9fafb;
      padding: 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }
    .stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.125rem;
    }
    .search-section {
      padding: 1rem 2rem;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    .search-container {
      position: relative;
      max-width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem;
      height: 1rem;
      color: #9ca3af;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      outline: none;
      border-color: #0049BD;
      box-shadow: 0 0 0 3px rgba(0, 73, 189, 0.1);
    }
    .report-content {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .entity-list {
      width: 33.333%;
      border-right: 1px solid #e5e7eb;
      overflow-y: auto;
      padding: 1rem;
      background-color: #f9fafb;
      flex-shrink: 0;
    }
    .entity-list h2 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #2C2D2E;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .entity-item {
      padding: 0.75rem;
      margin-bottom: 0.25rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s;
      border: 1px solid transparent;
    }
    .entity-item:hover {
      background-color: #f3f4f6;
    }
    .entity-item.selected {
      background-color: #E6F2FF;
      border-color: #0049BD;
      font-weight: 600;
    }
    .entity-item.hidden {
      display: none;
    }
    .entity-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }
    .entity-tag {
      font-size: 0.75rem;
      font-weight: 500;
      color: #777A7D;
    }
    .entity-separator {
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .entity-name {
      font-size: 0.875rem;
      color: #2C2D2E;
      font-weight: 500;
    }
    .entity-item.selected .entity-name {
      color: #0049BD;
    }
    .ref-badge {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background-color: #dbeafe;
      color: #1e40af;
      margin-left: auto;
    }
    .tree-view {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      min-height: 0;
    }
    .tree-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
      text-align: center;
    }
    .tree-placeholder.hidden {
      display: none;
    }
    .tree-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .tree-section:last-child {
      border-bottom: none;
    }
    .tree-section-header {
      margin-bottom: 1rem;
    }
    .tree-section-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #2C2D2E;
      margin-bottom: 0.25rem;
    }
    .tree-section-header p {
      font-size: 0.875rem;
      color: #6b7280;
    }
    .tree-node {
      margin-left: 1rem;
      margin-top: 0.5rem;
    }
    .parent-entity {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      margin-bottom: 0.25rem;
      border-radius: 0.375rem;
      background-color: #f9fafb;
    }
    .parent-entity-icon {
      width: 16px;
      height: 16px;
      color: #0049BD;
      flex-shrink: 0;
    }
    .parent-entity-tag {
      font-size: 0.875rem;
      font-weight: 500;
      color: #2C2D2E;
    }
    .parent-entity-name {
      font-size: 0.875rem;
      color: #4b5563;
    }
    .context-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem;
      margin-left: 1.5rem;
      margin-top: 0.25rem;
      font-size: 0.75rem;
    }
    .context-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #00A651;
      flex-shrink: 0;
    }
    .context-tag {
      color: #374151;
    }
    .context-element {
      color: #6b7280;
    }
    .entity-count {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.5rem;
    }
    .footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280;
      background-color: #f8f9fa;
      flex-shrink: 0;
    }
    @media print {
      .report-container {
        box-shadow: none;
        margin: 0;
        max-height: none;
      }
      .entity-list {
        max-height: none;
      }
      .tree-view {
        max-height: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.75rem; border-radius: 0.5rem; background-color: #005BC8; min-width: 48px; min-height: 48px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
            <svg width="28" height="28" viewBox="0 0 65 65" xmlns="http://www.w3.org/2000/svg" style="display: block;">
              <path fill="#fff" d="M.24,10.78v25.07c0,4.25,2.3,8.16,6.02,10.22l26.1,14.48.17.09,26.22-14.57c3.71-2.06,6.01-5.97,6.01-10.22V10.78H.24ZM42.23,40.48c-1.94,1.08-4.14,1.65-6.36,1.64l-24.2-.07,13.57-7.57c1.31-.73,2.79-1.12,4.29-1.12l25.62-.08-12.91,7.2ZM41.86,28.09c-1.31.73-2.79,1.12-4.29,1.12l-25.62.08,12.91-7.2c1.94-1.08,4.14-1.65,6.36-1.64l24.2.07-13.57,7.57Z"/>
            </svg>
          </div>
          <div>
            <h1>Usage reference report</h1>
            <p style="font-size: 1rem; color: #4b5563; margin-top: 0.25rem;">Entity Reference Documentation</p>
          </div>
        </div>
      </div>
      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Report Generated</div>
          <div class="stat-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Entities with References</div>
          <div class="stat-value">${allEntities.length.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total References</div>
          <div class="stat-value">${totalReferences.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Entity Types</div>
          <div class="stat-value">${uniqueTags}</div>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          id="searchInput" 
          placeholder="Search entity name or tag..."
        />
      </div>
      <div class="entity-count" id="entityCount">${allEntities.length} entities found</div>
    </div>

    <div class="report-content">
      <div class="entity-list">
        <h2>Entity List</h2>
        <div id="entityList">
          ${allEntities.map(entityName => {
            const entityData = referenceTree[entityName]
            const tagName = entityData?.primaryTag || 'Unknown'
            const refCount = entityData?.references?.length || 0
            return `
              <div class="entity-item" data-entity="${escapeHtml(entityName)}" data-tag="${escapeHtml(tagName)}">
                <div class="entity-header">
                  <span class="entity-tag">${escapeHtml(tagName)}</span>
                  <span class="entity-separator">›</span>
                  <span class="entity-name">${escapeHtml(entityName)}</span>
                  ${refCount > 0 ? `<span class="ref-badge">${refCount}</span>` : ''}
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
      
      <div class="tree-view">
        <div class="tree-placeholder" id="treePlaceholder">
          <div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; opacity: 0.5;">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <p style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem;">Select an entity to view its references</p>
            <p style="font-size: 0.875rem;">Choose an entity from the list to see where it's referenced in the configuration</p>
          </div>
        </div>
        <div id="treeContent" style="display: none;"></div>
      </div>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Sophos Ltd. All rights reserved.</p>
      <p style="margin-top: 0.5rem;">This interactive report shows where XML entity names are referenced throughout the firewall configuration.</p>
    </div>
  </div>

  <script>
    // Embed the reference tree data
    const referenceTreeData = ${treeDataJson};
    
    // Helper function to convert tree data to visualization tree
    function convertToVisualizationTree(entityReference) {
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
        const key = \`\${ref.parentEntityTag}:\${ref.parentEntityName}\`;
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
          name: \`\${ctx.contextTag} > \${ctx.referenceElement}\`,
          type: 'context',
          contextTag: ctx.contextTag,
          referenceElement: ctx.referenceElement,
          contextPath: ctx.contextPath
        }));
        
        return {
          name: \`\${group.parentEntityTag}: \${group.parentEntityName}\`,
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
    
    // Helper function to generate tree HTML
    function generateTreeHTML(treeData, entityName) {
      if (!treeData || !treeData.children || treeData.children.length === 0) {
        return \`
          <div class="tree-section">
            <div class="tree-section-header">
              <h3>\${escapeHtml(entityName)}</h3>
              <p>No references found</p>
            </div>
          </div>
        \`;
      }
      
      const parentEntitiesHtml = treeData.children.map(parentEntity => {
        const contextsHtml = parentEntity.children.map(ctx => \`
          <div class="context-item">
            <div class="context-dot"></div>
            <span class="context-tag">\${escapeHtml(ctx.contextTag)}</span>
            <span class="context-element">(\${escapeHtml(ctx.referenceElement)})</span>
          </div>
        \`).join('');
        
        return \`
          <div class="tree-node">
            <div class="parent-entity">
              <svg class="parent-entity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span class="parent-entity-tag">\${escapeHtml(parentEntity.parentEntityTag)}</span>
              <span class="parent-entity-name">\${escapeHtml(parentEntity.parentEntityName)}</span>
            </div>
            \${contextsHtml}
          </div>
        \`;
      }).join('');
      
      return \`
        <div class="tree-section">
          <div class="tree-section-header">
            <h3>\${escapeHtml(entityName)}</h3>
            <p>Referenced in \${treeData.children.length} \${treeData.children.length === 1 ? 'entity' : 'entities'}</p>
          </div>
          \${parentEntitiesHtml}
        </div>
      \`;
    }
    
    // Escape HTML
    function escapeHtml(text) {
      if (text == null) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const entityList = document.getElementById('entityList');
    const entityCount = document.getElementById('entityCount');
    const entityItems = entityList.querySelectorAll('.entity-item');
    
    searchInput.addEventListener('input', function(e) {
      const term = e.target.value.toLowerCase().trim();
      let visibleCount = 0;
      
      entityItems.forEach(item => {
        const entityName = item.getAttribute('data-entity').toLowerCase();
        const tagName = item.getAttribute('data-tag').toLowerCase();
        
        if (!term || entityName.includes(term) || tagName.includes(term)) {
          item.classList.remove('hidden');
          visibleCount++;
        } else {
          item.classList.add('hidden');
        }
      });
      
      entityCount.textContent = \`\${visibleCount} \${visibleCount === 1 ? 'entity' : 'entities'} found\`;
    });
    
    // Entity selection functionality
    let selectedEntity = null;
    
    entityItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove previous selection
        entityItems.forEach(i => i.classList.remove('selected'));
        
        // Add selection to clicked item
        this.classList.add('selected');
        
        // Get entity name
        const entityName = this.getAttribute('data-entity');
        selectedEntity = entityName;
        
        // Show tree for selected entity
        showEntityTree(entityName);
      });
    });
    
    // Show tree for selected entity
    function showEntityTree(entityName) {
      const treePlaceholder = document.getElementById('treePlaceholder');
      const treeContent = document.getElementById('treeContent');
      
      if (!referenceTreeData[entityName]) {
        treePlaceholder.classList.remove('hidden');
        treeContent.style.display = 'none';
        return;
      }
      
      const treeData = convertToVisualizationTree(referenceTreeData[entityName]);
      const treeHTML = generateTreeHTML(treeData, entityName);
      
      treeContent.innerHTML = treeHTML;
      treePlaceholder.classList.add('hidden');
      treeContent.style.display = 'block';
      
      // Scroll to top of tree view
      treeContent.scrollTop = 0;
    }
    
    // Auto-select first entity if provided
    ${selectedEntity && referenceTree[selectedEntity] ? `
      setTimeout(() => {
        const firstItem = document.querySelector(\`[data-entity="${escapeHtml(selectedEntity)}"]\`);
        if (firstItem) {
          firstItem.click();
        }
      }, 100);
    ` : ''}
  </script>
</body>
</html>`

  return html
}

/**
 * Generate empty HTML when no data
 */
function generateEmptyHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usage reference report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8f9fa;
      color: #6b7280;
    }
    .empty-message {
      text-align: center;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div class="empty-message">
    <h1>No usage refreence data</h1>
    <p>No entities with references found in the configuration.</p>
  </div>
</body>
</html>`
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (text == null) return ''
  // Simple HTML escaping for browser context
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, m => map[m])
}
