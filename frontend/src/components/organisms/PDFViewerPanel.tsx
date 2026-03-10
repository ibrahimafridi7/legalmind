import { Worker, Viewer } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'
import { useUIStore } from '../../store/uiStore'

interface Props {
  fileUrl?: string
}

export const PDFViewerPanel = ({ fileUrl }: Props) => {
  const { activePdfPage } = useUIStore()

  if (!fileUrl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-brand-muted">
        Select a citation or document to open the PDF.
      </div>
    )
  }

  return (
    <div className="h-full bg-slate-900">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer fileUrl={fileUrl} defaultScale={1.1} initialPage={activePdfPage - 1} />
      </Worker>
    </div>
  )
}

