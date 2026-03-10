import { Sidebar } from '../components/organisms/Sidebar'
import { FileUploadManager } from '../components/organisms/FileUploadManager'

export const DocumentsPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-4 bg-brand-dark px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-100">Documents</h1>
        <FileUploadManager />
      </main>
    </div>
  )
}

