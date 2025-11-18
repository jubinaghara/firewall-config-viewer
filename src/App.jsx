import { useState, useEffect } from 'react'
import { Shield, X, Lock, FileText, GitCompare } from 'lucide-react'
import UploadZone from './components/UploadZone'
import DualUploadZone from './components/DualUploadZone'
import ReportView from './components/ReportView'
import DiffView from './components/DiffView'
import ExportButton from './components/ExportButton'
import { parseEntitiesXML } from './utils/xmlParser'
import { compareXMLFiles } from './utils/xmlDiff'
import { getThemeStyles, combineStyles } from './utils/themeUtils'
import theme from './theme'

// Sophos logo - using icon from public folder
const sophosLogoUrl = '/sophos-icon-white.svg'

function App() {
  const [mode, setMode] = useState(null) // null = home, 'report' = report mode, 'diff' = diff mode
  const [parsedData, setParsedData] = useState(null)
  const [diffResults, setDiffResults] = useState(null)
  const [oldFileName, setOldFileName] = useState(null)
  const [newFileName, setNewFileName] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
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
    
    // Add dynamic entities
    if (data.entitiesByTag) {
      Object.keys(data.entitiesByTag).forEach(tag => {
        sections[tag] = true
      })
    }
    
    return sections
  }
  
  const [sectionVisibility, setSectionVisibility] = useState({})
  
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

  const handleFileUpload = async (xmlContent) => {
    setLoading(true)
    setError(null)
    try {
      const data = parseEntitiesXML(xmlContent)
      setParsedData(data)
      setMode('report')
    } catch (err) {
      setError(err.message || 'Failed to parse XML file')
      setParsedData(null)
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
    const allSections = getDefaultSectionVisibility(parsedData)
    const allSelected = {}
    Object.keys(allSections).forEach(key => {
      allSelected[key] = true
    })
    setSectionVisibility(allSelected)
  }
  
  // Deselect all sections
  const deselectAllSections = () => {
    if (!parsedData) return
    const allSections = getDefaultSectionVisibility(parsedData)
    const allDeselected = {}
    Object.keys(allSections).forEach(key => {
      allDeselected[key] = false
    })
    setSectionVisibility(allDeselected)
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
                    100% Local Processing - Your Data Stays Private
                  </p>
                  <p className="text-xs mt-1" style={{ color: theme.colors.privacy.text.secondary }}>
                    All file parsing, analysis, and report generation happens entirely in your browser. 
                    Your configuration files are never uploaded to any server, even if this application is hosted in the cloud. 
                    Your data remains completely private and secure on your device.
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
                className="h-7 w-auto"
                style={{ maxHeight: '32px' }}
                onError={(e) => {
                  // Fallback to Shield icon if logo not found
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'block'
                }}
              />
              <Shield className="w-7 h-7" style={{ display: 'none', color: theme.components.header.text }} />
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
                  <Shield className="w-10 h-10 text-white" />
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
                Convert XML to readable reports and compare configuration changes
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
                      Configuration Report
                    </h3>
                    <p className="mb-6 leading-relaxed" style={combineStyles(
                      { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                      Upload a single XML configuration file to generate a comprehensive, detailed report. 
                      Analyze firewall rules, hosts, services, and network entities with an intuitive, 
                      exportable report format.
                    </p>
                    <div className="flex items-center text-sm font-semibold" style={combineStyles(
                      { color: theme.components.landingCard.linkColor, fontFamily: 'typography.fontFamily.primary' }
                    )}>
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
                      Compare Configurations
                    </h3>
                    <p className="mb-6 leading-relaxed" style={combineStyles(
                      { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                    )}>
                      Upload two XML configuration files to perform a side-by-side comparison. 
                      Identify changes, additions, and deletions with a GitHub-style diff view 
                      that highlights exactly what changed between versions.
                    </p>
                    <div className="flex items-center text-sm font-semibold" style={combineStyles(
                      { color: theme.components.landingCard.linkColor, fontFamily: 'typography.fontFamily.primary' }
                    )}>
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
                  Why Choose This Tool
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
                    All processing happens locally in your client. Your configuration files never leave your device.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.light }}>
                    <Shield className="w-8 h-8" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={combineStyles(
                    { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Enterprise Ready
                  </h3>
                  <p className="text-sm" style={combineStyles(
                    { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Built for Sophos Firewall administrators who need powerful, reliable configuration analysis tools.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.light }}>
                    <FileText className="w-8 h-8" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={combineStyles(
                    { color: 'colors.text.heading', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Export & Share
                  </h3>
                  <p className="text-sm" style={combineStyles(
                    { color: 'colors.text.secondary', fontFamily: 'typography.fontFamily.primary' }
                  )}>
                    Export reports and comparisons as HTML files for easy sharing and documentation.
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

        {mode === 'report' && parsedData && (
          <div className="bg-white p-8 print:p-4" style={combineStyles(
            { boxShadow: 'shadows.md', borderRadius: 'borderRadius.md' }
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Configuration Report</h2>
              <ExportButton 
                viewMode="report" 
                data={parsedData}
                sectionVisibility={sectionVisibility}
                onToggleSection={toggleSection}
              />
            </div>
            <ReportView 
              data={parsedData} 
              filteredRules={filteredRules} 
              sectionVisibility={sectionVisibility}
              onToggleSection={toggleSection}
              onSelectAll={selectAllSections}
              onDeselectAll={deselectAllSections}
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
