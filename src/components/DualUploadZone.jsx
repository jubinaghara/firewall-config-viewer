import { useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, X, Home } from 'lucide-react'
import theme from '../theme'

export default function DualUploadZone({ onFilesUpload, loading, error, onHomeClick }) {
  const oldFileInputRef = useRef(null)
  const newFileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [oldFile, setOldFile] = useState(null)
  const [newFile, setNewFile] = useState(null)
  const [oldFileContent, setOldFileContent] = useState(null)
  const [newFileContent, setNewFileContent] = useState(null)
  
  const triggerCompare = (oldContent, newContent, oldFileObj, newFileObj) => {
    if (oldContent && newContent) {
      onFilesUpload(oldContent, newContent, oldFileObj, newFileObj)
    }
  }

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

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xml'))
    if (files.length === 0) {
      alert('Please drop XML files')
      return
    }
    if (files.length === 1) {
      // If only one file, ask which one it is
      const isOld = window.confirm('Is this the OLD/Current file? Click OK for Old, Cancel for New.')
      if (isOld) {
        await processFile(files[0], 'old')
      } else {
        await processFile(files[0], 'new')
      }
    } else if (files.length >= 2) {
      // First file is old, second is new
      await processFile(files[0], 'old')
      await processFile(files[1], 'new')
    }
  }

  const handleFileSelect = async (e, type) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0], type)
    }
  }

  const processFile = async (file, type) => {
    if (!file.name.endsWith('.xml')) {
      alert('Please select an Entities.xml file.')
      return
    }
    
    try {
      const text = await file.text()
      if (type === 'old') {
        setOldFile(file)
        setOldFileContent(text)
        // Check if new file is already loaded
        if (newFileContent && newFile) {
          triggerCompare(text, newFileContent, file, newFile)
        }
      } else {
        setNewFile(file)
        setNewFileContent(text)
        // Check if old file is already loaded
        if (oldFileContent && oldFile) {
          triggerCompare(oldFileContent, text, oldFile, file)
        }
      }
    } catch (err) {
      alert(`Error reading file: ${err.message}`)
    }
  }

  const handleClick = (type) => {
    if (type === 'old') {
      oldFileInputRef.current?.click()
    } else {
      newFileInputRef.current?.click()
    }
  }

  const clearFile = (type) => {
    if (type === 'old') {
      setOldFile(null)
      setOldFileContent(null)
      if (oldFileInputRef.current) {
        oldFileInputRef.current.value = ''
      }
    } else {
      setNewFile(null)
      setNewFileContent(null)
      if (newFileInputRef.current) {
        newFileInputRef.current.value = ''
      }
    }
  }

  const handleCompare = () => {
    if (oldFileContent && newFileContent && oldFile && newFile) {
      triggerCompare(oldFileContent, newFileContent, oldFile, newFile)
    } else {
      alert('Please upload both files before comparing.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Compare two XML Configurations
          </h2>
          <p className="text-gray-600">
            Upload two Entities.xml files, for example, your previous and current configuration files, to see what has changed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Old File Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(false)
              const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xml'))
              if (files.length > 0) {
                processFile(files[0], 'old')
              }
            }}
            onClick={() => handleClick('old')}
            className={`
              p-8 border-2 border-dashed rounded-2xl
              transition-all cursor-pointer
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : oldFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              ref={oldFileInputRef}
              type="file"
              accept=".xml"
              onChange={(e) => handleFileSelect(e, 'old')}
              className="hidden"
            />

            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full
                ${oldFile ? 'bg-green-100' : dragActive ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-10 h-10 ${oldFile ? 'text-green-600' : dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Previous file
                </h3>
                {oldFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{oldFile.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile('old')
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Click or drag to upload
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* New File Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(false)
              const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xml'))
              if (files.length > 0) {
                processFile(files[0], 'new')
              }
            }}
            onClick={() => handleClick('new')}
            className={`
              p-8 border-2 border-dashed rounded-2xl
              transition-all cursor-pointer
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : newFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              ref={newFileInputRef}
              type="file"
              accept=".xml"
              onChange={(e) => handleFileSelect(e, 'new')}
              className="hidden"
            />

            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full
                ${newFile ? 'bg-green-100' : dragActive ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-10 h-10 ${newFile ? 'text-green-600' : dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Current file
                </h3>
                {newFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{newFile.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile('new')
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Click or drag to upload
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compare Button */}
        {oldFileContent && newFileContent && (
          <div className="text-center">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Comparing...' : 'Compare Files'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {onHomeClick && (
          <div className="mt-8 text-center">
            <button
              onClick={onHomeClick}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:underline mx-auto"
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
    </div>
  )
}

