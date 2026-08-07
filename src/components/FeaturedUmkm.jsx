import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import UmkmGrid from './UmkmGrid.jsx'
import UmkmModal from './UmkmModal.jsx'

function FeaturedUmkm({ featured, others, onViewDetail }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <section id="umkm" className="section-wrapper section-wrapper--compact umkm-section">
      <div className="featured-umkm fade-up" data-reveal>
        <SectionTitle
          label="Local UMKM"
          heading="Explore Local UMKM"
          subtitle="Temukan cerita, produk, dan usaha lokal dari Tanjung Sari."
        />
        <div className="featured-umkm__panel">
          <span className="featured-umkm__tag">Featured</span>
          <h3 className="featured-umkm__title">{featured.name}</h3>
          <div className="featured-umkm__meta">
            <span>{featured.category}</span>
            <span>{featured.location}</span>
          </div>
          <p className="featured-umkm__description">{featured.description}</p>
          <button className="button button--primary" type="button" onClick={() => onViewDetail(featured)}>
            See More
          </button>
        </div>
        <div className="featured-umkm__image"></div>
      </div>
      <div className="extra-section">
        {showMore ? (
          <UmkmGrid umkmList={others} onViewDetail={onViewDetail} />
        ) : (
          <button className="button button--secondary" type="button" onClick={() => setShowMore(true)}>
            See More UMKM
          </button>
        )}
      </div>
      {showMore && <div className="wave-divider"></div>}
    </section>
  )
}

FeaturedUmkm.Modal = UmkmModal

export default FeaturedUmkm
