import { useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, Home } from 'lucide-react'
import theme from '../theme'

export default function UploadZone({ onFileUpload, loading, error, onHomeClick }) {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file) => {
    if (file.name.endsWith('.xml')) {
      const text = await file.text()
      onFileUpload(text)
    } else {
      alert('Please select an Entities.xml file. For ZIP files, please extract and select the XML file directly.')
      return
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl
          transition-all cursor-pointer
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full
            ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-12 h-12 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Upload firewall configuration
            </h2>
            <p className="text-gray-600 mb-4">
              Drag and drop the <strong>Entities.xml</strong> file,
              <br />
              or click to select the file.
            </p>
            <p className="text-gray-500 m-4">
              The file is in the API-xxx folder that’s downloaded when you export a configuration from <span className="font-bold">Backup and firmware &gt; Import-export</span>.
            </p>
  
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Parsing configuration...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

    

      {onHomeClick && (
        <div className="mt-6 text-center">
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
            style={{
              color: theme.components.landingCard.linkColor,
              fontFamily: theme.typography.fontFamily.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
    </div>
  )
}