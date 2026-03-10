import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onFilesAccepted: (files: File[]) => void
}

export const UploadDropzone = ({ onFilesAccepted }: Props) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAccepted(acceptedFiles)
    },
    [onFilesAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf']
    }
  })

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center text-sm ${
        isDragActive ? 'border-brand-action bg-slate-800' : 'border-slate-700 bg-brand-surface'
      }`}
    >
      <input {...getInputProps()} />
      <p className="mb-1 font-medium text-slate-100">Drop legal PDFs here, or click to browse</p>
      <p className="text-xs text-brand-muted">We support large files via secure chunked uploads.</p>
    </div>
  )
}

