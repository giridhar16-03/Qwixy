function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primaryDark',
    secondary: 'bg-white text-slate-900 border border-border hover:bg-slate-50',
    ghost: 'bg-primary/10 text-primary hover:bg-primary/20',
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold transition-all duration-200 shadow-soft ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
