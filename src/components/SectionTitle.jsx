function SectionTitle({ label, heading, subtitle }) {
  return (
    <div className="section-title fade-up" data-reveal>
      {label && (
        <div className="about-tag">
          <span className="about-tag__line"></span>
          <span>{label}</span>
        </div>
      )}
      {heading && <h2 className="about-heading">{heading}</h2>}
      {subtitle ? <p className="about-description">{subtitle}</p> : null}
    </div>
  )
}

export default SectionTitle
