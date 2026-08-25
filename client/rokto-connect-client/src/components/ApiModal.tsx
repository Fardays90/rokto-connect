interface Props {
  open: boolean
  loading?: boolean
  success?: boolean
  error?: string | null
  title?: string
  onClose?: () => void
}

export default function ApiModal({ open, loading, success, error, title, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-xl border border-[color:var(--rc-line)] bg-[color:var(--rc-ink)] p-6 text-[color:var(--rc-bone)] shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--rc-display)' }}>{title || 'Status'}</h3>
          <button onClick={onClose} className="text-[color:var(--rc-bone)]/50 hover:text-[color:var(--rc-bone)]">✕</button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {loading && (
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.12" strokeWidth="4" />
                <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-sm font-medium">Please wait</div>
                <div className="text-xs text-[color:var(--rc-bone)]/50">Processing your request...</div>
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--rc-plasma)]/10 text-[color:var(--rc-plasma)]">
                ✓
              </div>
              <div>
                <div className="text-sm font-medium text-[color:var(--rc-plasma)]">Success</div>
                <div className="text-xs text-[color:var(--rc-bone)]/50">Operation completed successfully.</div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/10 text-red-400">✕</div>
              <div>
                <div className="text-sm font-medium text-red-400">Error</div>
                <div className="text-xs text-[color:var(--rc-bone)]/50">{error}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--rc-bone)]/60 hover:text-[color:var(--rc-bone)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
