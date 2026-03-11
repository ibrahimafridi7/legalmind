import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { App } from './App'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster, toast } from 'sonner'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#94a3b8' }}>{String((error as any)?.message ?? error)}</pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              toast('Resetting…')
              resetErrorBoundary()
            }}
          >
            Reset Chat
          </button>
        </div>
      )}
    >
      <Toaster richColors theme="dark" />
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

