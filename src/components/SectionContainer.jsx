function SectionContainer({ children, className = '', id }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  )
}

export default SectionContainer
