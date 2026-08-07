function SectionTitle({ label, heading, subtitle }) {
  return (
    <div className="section-title fade-up" data-reveal>
      <div className="section-title__label">{label}</div>
      <h2 className="section-title__heading">{heading}</h2>
      {subtitle ? <p className="section-title__subtitle">{subtitle}</p> : null}
    </div>
  )
}

export default SectionTitle
