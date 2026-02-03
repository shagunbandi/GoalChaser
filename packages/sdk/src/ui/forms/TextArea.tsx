'use client'

interface TextAreaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  className?: string
  testId?: string
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  required = false,
  className = '',
  testId,
}: TextAreaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/60">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        data-testid={testId}
        className={`
          w-full px-4 py-3
          bg-white/[0.03] backdrop-blur-xl
          border border-white/[0.08] rounded-2xl
          text-white placeholder-white/30
          focus:outline-none focus:border-[#007AFF]/50
          focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-none
          ${className}
        `}
      />
    </div>
  )
}
