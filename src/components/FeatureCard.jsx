function FeatureCard({ icon, title, description }) {
  return (
    <article className="feature-card fade-up" data-reveal>
      <div className="feature-card__icon">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__text">{description}</p>
    </article>
  )
}

export default FeatureCard
