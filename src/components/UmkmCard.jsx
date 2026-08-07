function UmkmCard({ umkm, onViewDetail }) {
  return (
    <article className="umkm-card fade-up" data-reveal>
      <div className="umkm-card__visual" style={{ backgroundImage: `url(${umkm.image})` }} aria-label={umkm.name}></div>
      <div className="umkm-card__content">
        <div>
          <h3 className="umkm-card__title">{umkm.name}</h3>
          <div className="umkm-card__meta">
            <span>{umkm.category}</span>
            <span>{umkm.location}</span>
          </div>
          <p className="umkm-card__text">{umkm.description}</p>
        </div>
        <button className="button button--secondary umkm-card__action" type="button" onClick={() => onViewDetail(umkm)}>
          View Detail
        </button>
      </div>
    </article>
  )
}

export default UmkmCard
