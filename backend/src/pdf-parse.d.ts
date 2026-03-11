declare module 'pdf-parse' {
  type PageRender = (pageData: { getTextContent: (opts?: unknown) => Promise<{ items: Array<{ str?: string }> }> }) => Promise<string>
  type Options = { pagerender?: PageRender }
  function pdfParse(buffer: Buffer, options?: Options): Promise<{ text: string; numpages?: number; info?: unknown }>
  export default pdfParse
}
