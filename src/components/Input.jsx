function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        className={`w-full rounded-xl border border-border bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
      {error ? <span className="text-sm text-rose-500">{error}</span> : null}
    </label>
  )
}

export default Input
