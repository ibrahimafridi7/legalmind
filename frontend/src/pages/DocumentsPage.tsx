import { Sidebar } from '../components/organisms/Sidebar'
import { FileUploadManager } from '../components/organisms/FileUploadManager'

export const DocumentsPage = () => {
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

