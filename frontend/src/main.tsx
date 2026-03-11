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
        <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark p-6">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-brand-surface p-6 shadow-xl">
            <h1 className="text-lg font-semibold text-slate-100">Something went wrong</h1>
            <p className="mt-2 text-sm text-brand-muted">
              {String((error as Error)?.message ?? error)}
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4 w-full"
              onClick={() => {
                toast.info('Resetting…')
                resetErrorBoundary()
              }}
            >
              Reset Chat
            </button>
          </div>
        </div>
      )}
    >
      <Toaster richColors theme="dark" />
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

