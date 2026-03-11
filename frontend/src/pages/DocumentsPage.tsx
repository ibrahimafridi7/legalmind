import { Sidebar } from '../components/organisms/Sidebar'
import { FileUploadManager } from '../components/organisms/FileUploadManager'
import { useDocumentStatusStream } from '../queries/documentQueries'

export const DocumentsPage = () => {
  useDocumentStatusStream(true)
  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main">
        <h1 className="page-title">Documents</h1>
        <FileUploadManager />
      </main>
    </div>
  )
}

