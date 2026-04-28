'use client'

import { getDictionary, translate, type Locale } from '@/lib/i18n'
import { Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'

type PhotoUploadProps = {
  onPhotosChange: (urls: string[]) => void
  maxFiles?: number
  locale: Locale
}

export function PhotoUpload({ onPhotosChange, maxFiles = 5, locale }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = getDictionary(locale)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const remaining = maxFiles - previews.length

      if (files.length > remaining) {
        setError(translate(t.photoUpload.uploadLimit, { maxFiles, remaining }))
        return
      }

      const newPreviews = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setPreviews((prev) => [...prev, ...newPreviews])
      setError(null)
      e.target.value = '' // Reset input
    },
    [previews.length, maxFiles],
  )

  const removePreview = useCallback((index: number) => {
    setPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev[index].preview)
      return updated
    })
  }, [])

  const uploadPhotos = useCallback(async () => {
    if (previews.length === 0) {
      setError(t.photoUpload.pleaseSelect)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      previews.forEach((p, idx) => {
        formData.append(`photo-${idx}`, p.file)
      })

      const response = await fetch('/api/upload-venue-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t.photoUpload.uploadFailed)
      }

      const { urls } = await response.json()
      onPhotosChange(urls)
      setPreviews([]) // Clear previews after successful upload
    } catch (err) {
      setError(err instanceof Error ? err.message : t.photoUpload.unknownError)
    } finally {
      setUploading(false)
    }
  }, [previews, onPhotosChange, t])

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <h2 className="text-lg font-semibold text-slate-900">{t.photoUpload.title}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {translate(t.photoUpload.description, { maxFiles })}
      </p>

      {/* File Input */}
      <div className="mt-4">
        <label
          htmlFor="photo-input"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 transition hover:border-violet-400 hover:bg-violet-50"
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-900">{t.photoUpload.clickToUpload}</p>
          <p className="text-xs text-slate-500">{t.photoUpload.dragAndDrop}</p>
          <input
            id="photo-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || previews.length >= maxFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-slate-600">
            {translate(t.photoUpload.selectedTemplate, { count: previews.length })}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {previews.map((p, idx) => (
              <div key={idx} className="relative">
                <img
                  src={p.preview}
                  alt={`Preview ${idx + 1}`}
                  className="h-24 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePreview(idx)}
                  disabled={uploading}
                  className="absolute top-1 right-1 rounded-full bg-rose-500 p-1 text-white transition hover:bg-rose-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {previews.length > 0 && (
        <button
          type="button"
          onClick={uploadPhotos}
          disabled={uploading}
          className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {uploading ? t.photoUpload.uploading : t.photoUpload.upload}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Success Message */}
      {/* This would be handled by parent form submission feedback */}
    </section>
  )
}
