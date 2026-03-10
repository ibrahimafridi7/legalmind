const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadFileWithProgress(opts: {
  file: File
  uploadUrl: string
  headers?: Record<string, string>
  onProgress?: (pct: number) => void
}): Promise<void> {
  // Uses XHR to report upload progress.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', opts.uploadUrl, true)
    if (opts.headers) {
      for (const [k, v] of Object.entries(opts.headers)) xhr.setRequestHeader(k, v)
    }
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return
      opts.onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))))
    xhr.onerror = () => reject(new Error('network error'))
    xhr.send(opts.file)
  })
}

export async function uploadFileInChunks(opts: {
  file: File
  chunkUploadUrl: string
  headers?: Record<string, string>
  onProgress?: (pct: number) => void
}): Promise<void> {
  const totalChunks = Math.ceil(opts.file.size / CHUNK_SIZE)
  let uploadedBytes = 0

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, opts.file.size)
    const chunk = opts.file.slice(start, end)

    const res = await fetch(
      `${opts.chunkUploadUrl}?chunkIndex=${chunkIndex}&totalChunks=${totalChunks}`,
      {
        method: 'PUT',
        headers: {
          ...(opts.headers ?? {}),
          'Content-Type': opts.file.type || 'application/octet-stream'
        },
        body: chunk
      }
    )
    if (!res.ok) throw new Error(`chunk upload failed (${res.status})`)
    uploadedBytes += chunk.size
    opts.onProgress?.(Math.round((uploadedBytes / opts.file.size) * 100))
  }
}

