import { Worker, Viewer } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'
import { useUIStore } from '../../store/uiStore'

export const PDFViewerPanel = () => {
  const { selectedPdfUrl, activePdfPage } = useUIStore()

  if (!selectedPdfUrl) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded border border-slate-700 bg-slate-900/50 px-4 text-center text-sm text-brand-muted">
        Select a citation to open the document PDF and jump to that page.
      </div>
    )
  }

  const initialPage = Math.max(0, activePdfPage - 1)

  return (
    <div className="h-full min-h-[260px] overflow-auto rounded border border-slate-700 bg-slate-900 flex-1">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          key={`${selectedPdfUrl}-${activePdfPage}`}
          fileUrl={selectedPdfUrl}
          defaultScale={1.1}
          initialPage={initialPage}
        />
      </Worker>
    </div>
  )
}

