import { UploadDropzone } from '../molecules/UploadDropzone'
import { canUpload } from '../../lib/rbac'
import { useSessionStore } from '../../store/sessionStore'

export const FileUploadManager = () => {
  const { user } = useSessionStore()

  if (!user || !canUpload(user.role)) return null

  return (
    <div className="space-y-4">
      <UploadDropzone onFilesAccepted={(files) => console.log('TODO upload', files)} />
      <p className="text-xs text-brand-muted">
        Your files are uploaded directly to secure object storage using presigned URLs. The backend never proxies raw
        PDF bytes.
      </p>
    </div>
  )
}

