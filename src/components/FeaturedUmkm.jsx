function FeaturedUmkm({ umkmList = [] }) {
  const highlightItem = umkmList.find((item) => item.featured) || umkmList[0]

  if (!highlightItem) return null

  return (
    <section id="umkm" className="section-wrapper umkm-profile-section">
      <div className="about-profile-container">
        {/* Left Column: Image */}
        <div className="about-profile-left fade-left" data-reveal>
          <div className="about-image-card">
            <img
              src={highlightItem.image}
              alt={highlightItem.name}
              className="about-image"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/assets/images/tanjung-sari.jpg'
              }}
            />
          </div>
        </div>

        {/* Right Column: Text & Description */}
        <div className="about-profile-right fade-right" data-reveal>
          <div className="about-tag">
            <span className="about-tag__line"></span>
            <span>Highlight UMKM</span>
          </div>
          <h2 className="about-heading">
            {highlightItem.name}
          </h2>

          <p className="about-description">
            {highlightItem.description}
          </p>
        </div>
      </div>
    </section>
  )
}

export default FeaturedUmkm
