'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onUploadComplete: (assetId: string, imageUrl: string) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
}

export function FileUploader({ onUploadComplete, disabled }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setUploading(true)
      setUploadError(null)
      setUploadProgress(0)

      // Create preview URL
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Get presigned upload URL
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.message || 'Failed to get upload URL')
      }

      const { uploadUrl, assetId } = await uploadResponse.json()

      // Upload file to Supabase Storage with progress tracking
      const xhr = new XMLHttpRequest()

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            toast({
              title: 'Upload successful!',
              description: 'Your image is ready for processing.'
            })

            onUploadComplete(assetId, preview) // Use preview URL for immediate display
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: disabled || uploading
  })

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setUploadError(null)
    setUploadProgress(0)
  }

  const fileRejectionError = fileRejections[0]?.errors[0]

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          'hover:border-brand-soft-blue hover:bg-brand-soft-blue/5',
          isDragActive && 'border-brand-soft-blue bg-brand-soft-blue/10',
          (disabled || uploading) && 'cursor-not-allowed opacity-50',
          previewUrl && 'border-green-300 bg-green-50'
        )}
        data-testid="file-upload-dropzone"
      >
        <input {...getInputProps()} data-testid="file-upload-input" />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-w-48 max-h-48 object-contain rounded-lg mx-auto"
                data-testid="upload-preview"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  clearPreview()
                }}
                data-testid="clear-preview"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-green-600 font-medium">
              ✓ Image ready for processing
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              {uploading ? (
                <ImageIcon className="w-full h-full" />
              ) : (
                <Upload className="w-full h-full" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700">
                {uploading
                  ? 'Uploading your image...'
                  : isDragActive
                  ? 'Drop your image here'
                  : 'Drag & drop an image, or click to browse'
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG, or WebP • Max 10MB
              </p>
            </div>

            {!uploading && (
              <Button variant="outline" className="mt-4">
                Browse Files
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-gray-600">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {/* Error Messages */}
      {(uploadError || fileRejectionError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError ||
             (fileRejectionError?.code === 'file-too-large' ? 'File too large. Please choose an image under 10MB.' :
              fileRejectionError?.code === 'file-invalid-type' ? 'Invalid file type. Please choose a JPG, PNG, or WebP image.' :
              fileRejectionError?.message || 'Upload failed')}
          </AlertDescription>
        </Alert>
      )}

    </div>
  )
}