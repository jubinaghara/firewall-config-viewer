import { Download } from 'lucide-react'
import { generateHTMLReport } from '../utils/htmlGenerator'
import theme from '../theme'

export default function ExportButton({ viewMode = 'table', data, sectionVisibility, onToggleSection }) {
  const handleDownload = () => {
    if (!data) return
    
    try {
      // Generate HTML with all sections visible by default (sectionVisibility will control display in the exported HTML)
      const htmlContent = generateHTMLReport(data, sectionVisibility || {})
      
      // Create and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `firewall-config-report-${new Date().toISOString().split('T')[0]}.html`
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
    <button
      onClick={handleDownload}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded transition-colors"
      style={{ 
        backgroundColor: theme.components.button.primary.bg,
        fontFamily: theme.typography.fontFamily.primary,
        border: 'none'
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = theme.components.button.primary.hover}
      onMouseLeave={(e) => e.target.style.backgroundColor = theme.components.button.primary.bg}
    >
      <Download className="w-4 h-4 mr-2" />
      Download as HTML
    </button>
  )
}

