import { UploadDropzone } from '../molecules/UploadDropzone'
import { canUpload } from '../../lib/rbac'
import { useSessionStore } from '../../store/sessionStore'
import { usePresignUpload, useDocuments } from '../../queries/documentQueries'
import { uploadFileInChunks, uploadFileWithProgress } from '../../lib/chunkedUpload'
import api from '../../lib/api'
import { useState } from 'react'
import { FileCard } from '../molecules/FileCard'
import { toast } from 'sonner'

export const FileUploadManager = () => {
  const { user } = useSessionStore()
  const presign = usePresignUpload()
  const docs = useDocuments()
  const [progress, setProgress] = useState<Record<string, number>>({})

  if (!user || !canUpload(user.role)) return null

  return (
    <div className="space-y-4">
      <UploadDropzone
        onFilesAccepted={async (files) => {
          for (const file of files) {
            let presigned: Awaited<ReturnType<typeof presign.mutateAsync>>
            try {
              presigned = await presign.mutateAsync({
                filename: file.name,
                contentType: file.type || 'application/pdf',
                sizeBytes: file.size
              })
            } catch {
              toast.error('Unable to start upload')
              continue
            }

            setProgress((p) => ({ ...p, [presigned.documentId]: 0 }))

            const isS3Upload = Boolean(presigned.uploadCompleteEndpoint)
            // S3: single PUT only. Local: chunk for large files.
            const useChunks = !isS3Upload && file.size > 8 * 1024 * 1024
            try {
              if (useChunks) {
                await uploadFileInChunks({
                  file,
                  chunkUploadUrl: `${presigned.uploadUrl}/chunk`,
                  headers: presigned.headers,
                  onProgress: (pct) => setProgress((p) => ({ ...p, [presigned.documentId]: pct }))
                })
              } else {
                await uploadFileWithProgress({
                  file,
                  uploadUrl: presigned.uploadUrl,
                  headers: presigned.headers,
                  onProgress: (pct) => setProgress((p) => ({ ...p, [presigned.documentId]: pct }))
                })
              }
              if (presigned.uploadCompleteEndpoint) {
                await api.post(presigned.uploadCompleteEndpoint)
              }
              toast.success('Upload complete')
            } catch {
              toast.error('Upload failed')
            }
          }
        }}
      />

      <div className="space-y-2">
        {(docs.data ?? []).map((d) => (
          <div key={d.id}>
            <FileCard doc={d} />
            {typeof progress[d.id] === 'number' && d.status !== 'ready' && (
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-brand-action"
                  style={{ width: `${progress[d.id]}%` }}
                />
              </div>
            )}
            {d.status === 'indexing' && <div className="mt-1 text-xs text-brand-muted">Indexing…</div>}
          </div>
        ))}
        {docs.isLoading && <div className="text-xs text-brand-muted">Loading documents…</div>}
      </div>
    </div>
  )
}

