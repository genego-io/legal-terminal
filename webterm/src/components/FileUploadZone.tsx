/**
 * FileUploadZone — drag-and-drop or click-to-browse file/folder picker.
 *
 * Calls onFiles(files) with a list of {name, size, type, text?} objects.
 * The `text` field is populated only for text/* and application/json files.
 */

import React, { useRef, useState, type DragEvent } from 'react'

export interface UploadedFile {
  name: string
  size: number
  type: string
  text?: string     // populated for text-readable files
  path?: string     // File.webkitRelativePath — set when from folder picker
}

interface Props {
  onFiles(files: UploadedFile[]): void
  /** Allow picking a whole folder instead of individual files */
  allowFolder?: boolean
  /** Accept filter, e.g. ".pdf,.docx" — defaults to all */
  accept?: string
  className?: string
  style?: React.CSSProperties
}

async function readFile(f: File): Promise<UploadedFile> {
  const out: UploadedFile = {
    name: f.name,
    size: f.size,
    type: f.type,
    path: f.webkitRelativePath || undefined,
  }
  if (f.type.startsWith('text/') || f.type === 'application/json' || f.name.endsWith('.md') || f.name.endsWith('.txt')) {
    try { out.text = await f.text() } catch { /* binary or large */ }
  }
  return out
}

export function FileUploadZone({ onFiles, allowFolder, accept, className, style: styleProp }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const dirRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handle(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const results = await Promise.all(Array.from(fileList).map(readFile))
    onFiles(results)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handle(e.dataTransfer.files)
  }

  return (
    <div
      className={className}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{
        border: `1px dashed ${dragOver ? 'var(--accent)' : 'var(--border-bright)'}`,
        background: dragOver ? 'var(--accent-faint)' : 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        ...styleProp,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, minWidth: 140 }}>
        {dragOver ? 'Drop files here' : 'Drag & drop files here, or:'}
      </span>

      {/* File picker */}
      <button
        className="btn"
        onClick={() => fileRef.current?.click()}
        style={{ fontSize: 10, padding: '3px 10px' }}
      >
        Browse file(s)
      </button>

      {allowFolder && (
        <button
          className="btn"
          onClick={() => dirRef.current?.click()}
          style={{ fontSize: 10, padding: '3px 10px' }}
        >
          Select folder
        </button>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => handle(e.target.files)}
      />
      <input
        ref={dirRef}
        type="file"
        multiple
        /* @ts-expect-error — non-standard but widely supported */
        webkitdirectory="true"
        style={{ display: 'none' }}
        onChange={e => handle(e.target.files)}
      />
    </div>
  )
}
