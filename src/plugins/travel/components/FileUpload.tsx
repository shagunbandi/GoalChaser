import { useState, useRef } from 'react'
import type { TravelFile } from '../types'

interface FileUploadProps {
  travelId: string
  userId: string
  goalId: string
  files: TravelFile[]
  onFilesChange: (files: TravelFile[]) => Promise<void>
}

export function FileUpload({
  travelId,
  userId,
  goalId,
  files,
  onFilesChange,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const file = selectedFiles[0] // Single file for now

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('goalId', goalId)
      formData.append('travelId', travelId)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.success && data.file) {
        // Add new file to the list
        const updatedFiles = [...files, data.file]
        await onFilesChange(updatedFiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (file: TravelFile) => {
    try {
      const response = await fetch(
        `/api/storage/delete?path=${encodeURIComponent(file.storagePath)}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      // Remove file from list
      const updatedFiles = files.filter((f) => f.id !== file.id)
      await onFilesChange(updatedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    return '📎'
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="
                flex items-center justify-between gap-3
                px-3 py-2 rounded-lg
                bg-white/5 border border-white/10
                hover:bg-white/[0.07] transition-all
              "
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base shrink-0">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/80 hover:text-white hover:underline truncate block"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-white/40">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file)}
                className="
                  p-1.5 rounded-lg
                  text-white/40 hover:text-red-400 hover:bg-red-500/10
                  transition-all shrink-0
                "
                title="Delete file"
              >
                <span className="text-sm">🗑️</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button - Minimal style */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="
          text-xs text-white/50 hover:text-white/80
          transition-colors flex items-center gap-1.5
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isUploading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <span>📎</span>
            <span>Add attachment</span>
          </>
        )}
      </button>
    </div>
  )
}
