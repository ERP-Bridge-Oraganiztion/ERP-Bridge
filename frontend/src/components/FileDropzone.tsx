import { type ChangeEvent, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/cn'

export function FileDropzone({
  onFileSelected,
  accept = '.csv',
  hint = 'CSV file, up to 50MB',
}: {
  onFileSelected: (file: File) => void
  accept?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelected(file)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center transition-colors',
        dragActive ? 'border-ink bg-graphite-50' : 'border-graphite-300 hover:border-ink'
      )}
    >
      <UploadCloud size={22} className="text-graphite-500" />
      <p className="text-sm text-ink">
        {fileName ? <span className="font-medium">{fileName}</span> : 'Click to browse or drag a file here'}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
    </div>
  )
}
