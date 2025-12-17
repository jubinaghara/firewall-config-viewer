import { useState, useEffect } from 'react'
import { Zap, X, Lock, FileText, GitCompare, Network, Search } from 'lucide-react'
import UploadZone from './components/UploadZone'
import DualUploadZone from './components/DualUploadZone'
import ReportView from './components/ReportView'
import DiffView from './components/DiffView'
import ExportButton from './components/ExportButton'
import ConfigurationTree from './components/ConfigurationTree'
import ConfigurationAnalyzer from './components/ConfigurationAnalyzer'
import { parseEntitiesXML } from './utils/xmlParser'
import { compareXMLFiles } from './utils/xmlDiff'
import { getThemeStyles, combineStyles } from './utils/themeUtils'
import theme from './theme'

// Sophos logo - using icon from public folder
// In production with Electron, use relative path from base
// In development, use absolute path for Vite dev server
const getSophosLogoUrl = () => {
  if (import.meta.env.PROD) {
    // Production: Vite base is './', so public files are at root
    // Vite copies public folder files to dist root during build
    return './sophos-icon-white.svg'
  }
  // Development: absolute path works with Vite dev server
  return '/sophos-icon-white.svg'
}

const sophosLogoUrl = getSophosLogoUrl()

function App() {
  const [mode, setMode] = useState(null) // null = home, 'report' = report mode, 'diff' = diff mode
  const [parsedData, setParsedData] = useState(null)
  const [diffResults, setDiffResults] = useState(null)
  const [oldFileName, setOldFileName] = useState(null)
  const [newFileName, setNewFileName] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [xmlContent, setXmlContent] = useState(null) // Store raw XML for Configuration Tree
  const [showConfigTree, setShowConfigTree] = useState(false) // Toggle for Configuration Tree view
  const [configTreeLoading, setConfigTreeLoading] = useState(false) // Loading state for Configuration Tree
  const [showConfigAnalyzer, setShowConfigAnalyzer] = useState(false) // Toggle for Configuration Analyzer view
  const [configAnalyzerLoading, setConfigAnalyzerLoading] = useState(false) // Loading state for Configuration Analyzer
  
  // Privacy notice state - check if user has dismissed it
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(() => {
    const dismissed = localStorage.getItem('privacy-notice-dismissed')
    return dismissed !== 'true'
  })
  
  const dismissPrivacyNotice = () => {
    setShowPrivacyNotice(false)
    localStorage.setItem('privacy-notice-dismissed', 'true')
  }
  
  // Initialize section visibility - all selected by default
  const getDefaultSectionVisibility = (data) => {
    if (!data) return {}
    
    const sections = {
      executiveSummary: true,
      firewallRules: true,
      ipHosts: true,
      fqdnHosts: true,
      macHosts: true,
      services: true,
      groups: true,
      fqdnHostGroups: true,
      ipHostGroups: true,
      serviceGroups: true,
      portsWithVlans: true,
    }
    
    // Add grouped section keys that are used in ReportView sidebar
    if (data.ipHosts?.length || data.fqdnHosts?.length || data.macHosts?.length) {
      sections.referencedObjects = true
    }
    
    if (data.fqdnHostGroups?.length || data.ipHostGroups?.length || data.serviceGroups?.length || data.groups?.length || data.entitiesByTag?.CountryGroup?.length) {
      sections['groups-section'] = true
      if (data.entitiesByTag?.CountryGroup?.length) {
        sections.countryGroups = true
      }
    }
    
    if (data.sslTlsInspectionRules?.length) {
      sections.sslTlsInspectionRules = true
    }
    
    if (data.entitiesByTag?.NATRule?.length) {
      sections.NATRule = true
    }
    
    // Security policies grouped section
    if (data.entitiesByTag?.WebFilterPolicy || data.entitiesByTag?.Schedule || 
        data.entitiesByTag?.Country || data.entitiesByTag?.IPSPolicy ||
        data.entitiesByTag?.IntrusionPrevention || data.entitiesByTag?.VirusScanning ||
        data.entitiesByTag?.WebFilter) {
      sections['security-policies'] = true
    }
    
    // Certificates grouped section
    if (data.entitiesByTag?.CertificateAuthority || data.entitiesByTag?.SelfSignedCertificate ||
        data.entitiesByTag?.Certificate) {
      sections.certificates = true
    }
    
    // Network config grouped section
    if (data.entitiesByTag?.Zone || data.entitiesByTag?.Network || 
        data.entitiesByTag?.REDDevice || data.entitiesByTag?.WirelessAccessPoint) {
      sections['network-config'] = true
    }
    
    // Add dynamic entities
    if (data.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => {
        sections[tag] = true
      })
    }
    
    return sections
  }
  
  const [sectionVisibility, setSectionVisibility] = useState({})
  const [isSelectionLoading, setIsSelectionLoading] = useState(false)
  
  // Update section visibility when data changes
  useEffect(() => {
    if (parsedData) {
      const defaultVis = getDefaultSectionVisibility(parsedData)
      setSectionVisibility(prev => {
        // Merge with existing, keeping user selections where possible
        const merged = { ...defaultVis }
        Object.keys(prev).forEach(key => {
          if (defaultVis.hasOwnProperty(key)) {
            merged[key] = prev[key]
          }
        })
        return merged
      })
    }
  }, [parsedData])
  
  // Helper function to get ALL possible section keys from data
  const getAllSectionKeys = (data) => {
    if (!data) return []
    const keys = new Set()
    
    // Default sections
    const defaultSections = getDefaultSectionVisibility(data)
    Object.keys(defaultSections).forEach(key => keys.add(key))
    
    // Grouped sections (from ReportView logic)
    if (data.ipHosts?.length || data.fqdnHosts?.length || data.macHosts?.length) {
      keys.add('referencedObjects')
      keys.add('ipHosts')
      keys.add('fqdnHosts')
      keys.add('macHosts')
    }
    
    if (data.fqdnHostGroups?.length || data.ipHostGroups?.length || data.serviceGroups?.length || data.groups?.length || data.entitiesByTag?.CountryGroup?.length) {
      keys.add('groups-section')
      keys.add('fqdnHostGroups')
      keys.add('ipHostGroups')
      keys.add('serviceGroups')
      keys.add('groups')
      if (data.entitiesByTag?.CountryGroup?.length) {
        keys.add('countryGroups')
      }
    }
    
    if (data.services?.length) {
      keys.add('services')
    }
    
    if (data.sslTlsInspectionRules?.length) {
      keys.add('sslTlsInspectionRules')
    }
    
    if (data.entitiesByTag?.NATRule?.length) {
      keys.add('NATRule')
    }
    
    // Security policies grouped section
    if (data.entitiesByTag?.WebFilterPolicy || data.entitiesByTag?.Schedule || 
        data.entitiesByTag?.Country || data.entitiesByTag?.IPSPolicy ||
        data.entitiesByTag?.IntrusionPrevention || data.entitiesByTag?.VirusScanning ||
        data.entitiesByTag?.WebFilter) {
      keys.add('security-policies')
    }
    
    // Certificates grouped section
    if (data.entitiesByTag?.CertificateAuthority || data.entitiesByTag?.SelfSignedCertificate ||
        data.entitiesByTag?.Certificate) {
      keys.add('certificates')
    }
    
    // Network config grouped section
    if (data.entitiesByTag?.Zone || data.entitiesByTag?.Network || 
        data.entitiesByTag?.REDDevice || data.entitiesByTag?.WirelessAccessPoint) {
      keys.add('network-config')
    }
    
    // Interfaces & Network
    if (data.entitiesByTag?.Interface || data.portsWithEntities || 
        data.lagsWithMembers || data.entitiesByTag?.WirelessNetwork) {
      keys.add('portsWithVlans')
    }
    
    // All dynamic entity tags
    if (data.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => keys.add(tag))
    }
    
    return Array.from(keys)
  }

  const handleFileUpload = async (xmlContentString) => {
    setLoading(true)
    setError(null)
    try {
      const data = parseEntitiesXML(xmlContentString)
      setParsedData(data)
      setXmlContent(xmlContentString) // Store raw XML for Configuration Tree
      setMode('report')
    } catch (err) {
      setError(err.message || 'Failed to parse XML file')
      setParsedData(null)
      setXmlContent(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDiffUpload = async (oldXML, newXML, oldFile, newFile) => {
    setLoading(true)
    setError(null)
    try {
      const diff = compareXMLFiles(oldXML, newXML)
      setDiffResults(diff)
      setOldFileName(oldFile?.name || 'Current File')
      setNewFileName(newFile?.name || 'New File')
      setMode('diff')
    } catch (err) {
      setError(err.message || 'Failed to compare XML files')
      setDiffResults(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMode(null)
    setParsedData(null)
    setDiffResults(null)
    setOldFileName(null)
    setNewFileName(null)
    setError(null)
    setSectionVisibility({})
    setXmlContent(null)
    setShowConfigTree(false)
    setShowConfigAnalyzer(false)
  }

  // Get all rules for report view (no filtering)
  const filteredRules = parsedData?.firewallRules || []
  
  // Toggle section visibility
  const toggleSection = (sectionKey) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }
  
  // Select all sections
  const selectAllSections = () => {
    if (!parsedData) return
    setIsSelectionLoading(true)
    
    // Use setTimeout to allow UI to update and show loading
    setTimeout(() => {
      const allSectionKeys = getAllSectionKeys(parsedData)
      const allSelected = {}
      
      // Set all sections to true
      allSectionKeys.forEach(key => {
        allSelected[key] = true
      })
      
      setSectionVisibility(allSelected)
      
      // Hide loading after a short delay
      setTimeout(() => {
        setIsSelectionLoading(false)
      }, 100)
    }, 50)
  }
  
  // Deselect all sections
  const deselectAllSections = () => {
    if (!parsedData) return
    setIsSelectionLoading(true)
    
    // Use setTimeout to allow UI to update and show loading
    setTimeout(() => {
      setSectionVisibility(prev => {
        const allSectionKeys = getAllSectionKeys(parsedData)
        const allDeselected = {}
        
        // Set ALL sections to false explicitly
        allSectionKeys.forEach(key => {
          allDeselected[key] = false
        })
        
        // CRITICAL: Always set certificate types to false explicitly (certificates checkbox visibility depends on these)
        // These must be false for the certificates checkbox to show as unchecked
        allDeselected.CertificateAuthority = false
        allDeselected.SelfSignedCertificate = false
        allDeselected.Certificate = false
        allDeselected.certificates = false // Also set the group key
        
        // CRITICAL: Always set SSL/TLS Inspection Rules and Country Groups to false explicitly
        allDeselected.sslTlsInspectionRules = false
        allDeselected.countryGroups = false
        
        // Also ensure any keys that might exist in current visibility are set to false
        Object.keys(prev).forEach(key => {
          if (!allDeselected.hasOwnProperty(key)) {
            allDeselected[key] = false
          }
        })
        
        return allDeselected
      })
      
      // Hide loading after a short delay
      setTimeout(() => {
        setIsSelectionLoading(false)
      }, 100)
    }, 50)
  }

  return (
    <div className="min-h-screen" style={{
      ...getThemeStyles({ backgroundColor: 'colors.background.secondary' }),
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Privacy Notice Banner */}
      {showPrivacyNotice && (
        <div style={combineStyles(
          { backgroundColor: 'colors.privacy.bg', borderBottom: 'colors.privacy.border' },
          { borderBottomWidth: '1px', boxShadow: theme.shadows.sm }
        )} className="border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.colors.privacy.icon }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.colors.privacy.text.primary }}>
                    100% local processing. Your data stays private.
                  </p>
                  <p className="text-xs mt-1" style={{ color: theme.colors.privacy.text.primary }}>
                  All file parsing, analysis, and report generation happen on your endpoint.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPrivacyNotice}
                className="flex-shrink-0 transition-colors"
                style={{ color: theme.colors.privacy.icon }}
                onMouseEnter={(e) => e.target.style.color = theme.colors.privacy.text.primary}
                onMouseLeave={(e) => e.target.style.color = theme.colors.privacy.icon}
                aria-label="Dismiss privacy notice"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="shadow-sm" style={combineStyles(
        { backgroundColor: 'components.header.bg', borderBottom: 'components.header.border' },
        { borderBottomWidth: '1px' }
      )}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleReset}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleReset()
                }
              }}
            >
              <img 
                src={sophosLogoUrl} 
                alt="Sophos" 
                className="h-7 w-auto sophos-logo-img"
                style={{ maxHeight: '32px' }}
                onError={(e) => {
                  const img = e.target
                  const currentSrc = img.getAttribute('src') || img.src
                  
                  // Try fallback paths in production
                  if (import.meta.env.PROD) {
                    if (currentSrc === './sophos-icon-white.svg' || currentSrc.endsWith('sophos-icon-white.svg')) {
                      // Try public folder path
                      img.src = './public/sophos-icon-white.svg'
                      return
                    }
                    if (currentSrc.includes('public/sophos-icon-white.svg')) {
                      // Try without ./ prefix
                      img.src = 'sophos-icon-white.svg'
                      return
                    }
                  }
                  
                  // All paths failed, show bolt icon
                  console.error('Failed to load Sophos logo from all paths. Tried:', currentSrc)
                  img.style.display = 'none'
                  const fallback = img.nextElementSibling
                  if (fallback && fallback.classList.contains('sophos-logo-fallback')) {
                    fallback.style.display = 'block'
                  }
                }}
                onLoad={() => {
                  // Hide fallback if image loads successfully
                  const fallback = document.querySelector('.sophos-logo-fallback')
                  if (fallback) {
                    fallback.style.display = 'none'
                  }
                }}
              />
              <Zap className="w-7 h-7 sophos-logo-fallback" style={{ display: 'none', color: theme.components.header.text }} />
              <div>
                <h1 className="text-xl font-semibold" style={combineStyles(
                  { color: 'components.header.text', fontFamily: 'typography.fontFamily.primary' }
                )}>
                  Sophos Firewall Config Viewer v1.0
                </h1>
              </div>
            </div>
            {(parsedData || diffResults) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={combineStyles(
                    { 
                      color: 'components.button.secondary.text',
                      backgroundColor: 'components.button.secondary.bg',
                      fontFamily: 'typography.fontFamily.primary',
                      border: 'none'
                    }
                  )}
                  onMouseEnter={(e) => e.target.style.backgroundColor = theme.components.button.secondary.hover}
                  onMouseLeave={(e) => e.target.style.backgroundColor = theme.components.button.secondary.bg}
                >
                  {mode === 'diff' ? 'New Comparison' : 'Upload New'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8" style={{ flex: 1 }}>
        {mode === null && (
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16 mt-8">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="p-3 rounded-full" style={{ background: theme.colors.primary.gradient }}>
                  <Search className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4" style={combineStyles(
                { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary', letterSpacing: 'typography.letterSpacing.tight' }
              )}>
                Sophos Firewall Configuration Viewer
              </h1>
              <p className="text-xl mb-2 max-w-3xl mx-auto" style={combineStyles(
                { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
              )}>
                View and compare your firewall configurations with this powerful, privacy-first app. The report is clear, human-readable, and easy to export.
              </p>
            </div>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Generate Report Option */}
              <div
                onClick={() => setMode('report')}
                className="group relative bg-white rounded-xl transition-all duration-300 cursor-pointer"
                style={{ 
                  transform: 'translateY(0)',
                  border: theme.components.landingCard.border,
                  boxShadow: theme.components.landingCard.shadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="p-10">
                  <div className="flex flex-col items-start">
                    <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: theme.colors.primary.light }}>
                      <FileText className="w-10 h-10" style={{ color: theme.colors.primary.main }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={combineStyles(
                      { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                      Configuration report
                    </h3>
                    <p className="mb-6 leading-relaxed" style={combineStyles(
                      { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                      Upload a single Entities.xml configuration file. Generate a comprehensive list of the configurations it contains, such as firewall rules, hosts and services, and network modules.
                      <span><br />
                        </span>
                        <span><br />
                        </span>
                    </p>
                    <div className="flex items-center text-sm font-semibold" style={{
                      color: theme.components.landingCard.linkColor,
                      fontFamily: theme.typography.fontFamily.primary
                    }}>
                      <span>Get Started</span>
                      <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Diff View Option */}
              <div
                onClick={() => setMode('diff')}
                className="group relative bg-white rounded-xl transition-all duration-300 cursor-pointer"
                style={{ 
                  transform: 'translateY(0)',
                  border: theme.components.landingCard.border,
                  boxShadow: theme.components.landingCard.shadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="p-10">
                  <div className="flex flex-col items-start">
                    <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: theme.colors.secondary.light }}>
                      <GitCompare className="w-10 h-10" style={{ color: theme.colors.secondary.main }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={combineStyles(
                      { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                      Compare configurations
                    </h3>
                    <p className="mb-6 leading-relaxed" style={combineStyles(
                      { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                       Upload the Entities.xml files of two configurations.

                      Generate a comparative report of the configurations they contain, such as firewall rules, hosts and services, and network modules. 
                      The generated format highlights the differences. 

                    </p>
                    <div className="flex items-center text-sm font-semibold" style={{
                      color: theme.components.landingCard.linkColor,
                      fontFamily: theme.typography.fontFamily.primary
                    }}>
                      <span>Get Started</span>
                      <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-16 pt-12 border-t border-gray-200">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-3" style={combineStyles(
                  { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                )}>
                  About This Tool
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.light }}>
                    <Lock className="w-8 h-8" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={combineStyles(
                    { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    100% Private
                  </h3>
                  <p className="text-sm" style={combineStyles(
                    { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    All processing happens locally in your endpoint. 
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.light }}>
                    <Zap className="w-8 h-8" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={combineStyles(
                    { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Enterprise-ready
                  </h3>
                  <p className="text-sm" style={combineStyles(
                    { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Built for Sophos Firewall administrators who need powerful and reliable configuration analysis.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.light }}>
                    <FileText className="w-8 h-8" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={combineStyles(
                    { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Export and share
                  </h3>
                  <p className="text-sm" style={combineStyles(
                    { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Export the reports as HTML files. You can easily save or share them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'report' && !parsedData && (
          <div className="max-w-4xl mx-auto">
            <UploadZone onFileUpload={handleFileUpload} loading={loading} error={error} onHomeClick={handleReset} />
          </div>
        )}

        {mode === 'report' && parsedData && !showConfigTree && !showConfigAnalyzer && (
          <div className="bg-white p-8 print:p-4" style={combineStyles(
            { boxShadow: 'shadows.md', borderRadius: 'borderRadius.md' }
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Configuration Report</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfigTreeLoading(true)
                    setShowConfigTree(true)
                  }}
                  disabled={configTreeLoading}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={combineStyles(
                    {
                      color: theme.components.button.secondary.text,
                      backgroundColor: theme.components.button.secondary.bg,
                      fontFamily: theme.typography.fontFamily.primary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      boxShadow: theme.shadows.sm,
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!configTreeLoading) {
                      e.target.style.backgroundColor = theme.components.button.secondary.hover
                      e.target.style.color = theme.components.button.secondary.text
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!configTreeLoading) {
                      e.target.style.backgroundColor = theme.components.button.secondary.bg
                      e.target.style.color = theme.components.button.secondary.text
                    }
                  }}
                >
                  {configTreeLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Network className="w-4 h-4" />
                      Usage reference
                    </>
                  )}
                </button>
                {/*
                <button
                  onClick={() => {
                    setConfigAnalyzerLoading(true)
                    setShowConfigAnalyzer(true)
                    // Loading will be handled by ConfigurationAnalyzer component
                  }}
                  disabled={configAnalyzerLoading}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={combineStyles(
                    { 
                      color: 'components.button.secondary.text',
                      backgroundColor: 'components.button.secondary.bg',
                      fontFamily: 'typography.fontFamily.primary',
                      border: `1px solid ${theme.colors.border.medium}`
                    }
                  )}
                  onMouseEnter={(e) => {
                    if (!configAnalyzerLoading) {
                      e.target.style.backgroundColor = theme.components.button.secondary.hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!configAnalyzerLoading) {
                      e.target.style.backgroundColor = theme.components.button.secondary.bg
                    }
                  }}
                >
                  {configAnalyzerLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Configuration Analyzer
                    </>
                  )}
                </button>
                */}
                <ExportButton 
                  viewMode="report" 
                  data={parsedData}
                  sectionVisibility={sectionVisibility}
                  onToggleSection={toggleSection}
                />
              </div>
            </div>
            <ReportView 
              data={parsedData} 
              filteredRules={filteredRules} 
              sectionVisibility={sectionVisibility}
              onToggleSection={toggleSection}
              onSelectAll={selectAllSections}
              onDeselectAll={deselectAllSections}
              isSelectionLoading={isSelectionLoading}
            />
          </div>
        )}

        {mode === 'report' && parsedData && showConfigTree && (
          <div className="max-w-7xl mx-auto">
            <ConfigurationTree 
              xmlContent={xmlContent}
              onClose={() => {
                setShowConfigTree(false)
                setConfigTreeLoading(false)
              }}
              onLoadingChange={setConfigTreeLoading}
            />
          </div>
        )}

        {mode === 'report' && parsedData && showConfigAnalyzer && (
          <div className="max-w-7xl mx-auto">
            <ConfigurationAnalyzer 
              parsedData={parsedData}
              onClose={() => {
                setShowConfigAnalyzer(false)
                setConfigAnalyzerLoading(false)
              }}
              onLoadingChange={setConfigAnalyzerLoading}
            />
          </div>
        )}

        {mode === 'diff' && !diffResults && (
          <div className="max-w-6xl mx-auto">
            <DualUploadZone 
              onFilesUpload={async (oldXML, newXML, oldFile, newFile) => {
                await handleDiffUpload(oldXML, newXML, oldFile, newFile)
              }} 
              loading={loading} 
              error={error}
              onHomeClick={handleReset}
            />
          </div>
        )}

        {mode === 'diff' && diffResults && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-8" style={combineStyles(
              { boxShadow: 'shadows.md', borderRadius: 'borderRadius.md' }
            )}>
              <DiffView 
                diffResults={diffResults}
                oldFileName={oldFileName}
                newFileName={newFileName}
                onHomeClick={handleReset}
              />
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="nav-bottom" style={{
        backgroundColor: theme.components.footer.bg,
        borderTop: `1px solid ${theme.colors.border.light}`,
        padding: '1rem 0',
        marginTop: 'auto'
      }}>
        <div className="nav-bottom-text" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <p style={{
            color: theme.components.footer.text,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.primary,
            margin: 0
          }}>
            ©&nbsp;1997-{new Date().getFullYear()}&nbsp;
            <span>Sophos Ltd. All rights reserved.</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
