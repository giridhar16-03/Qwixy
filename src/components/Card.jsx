function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-surface bg-surface p-5 shadow-soft ${className}`}>
      {children}
    </div>
  )
}

export default Card
