function UmkmCard({ umkm }) {
  return (
    <article className="umkm-card fade-up" data-reveal>
      <div className="umkm-card__visual">
        <img
          src={umkm.image}
          alt={umkm.name}
          className="umkm-card__img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/images/tanjung-sari.jpg';
          }}
        />
      </div>
      <div className="umkm-card__content">
        <h3 className="umkm-card__title">{umkm.name}</h3>
        <p className="umkm-card__text">{umkm.description}</p>
      </div>
    </article>
  )
}

export default UmkmCard
