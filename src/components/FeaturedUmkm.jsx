import { useState } from 'react'
import { Store, ChevronLeft, ChevronRight } from 'lucide-react'

function FeaturedUmkm({ umkmList = [], isLoading = false, onNavigateToUmkmPage }) {
  // Hanya ambil item yang secara eksplisit diset featured: true
  const highlightItem = umkmList.find((item) => item.featured)
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  // Gabungkan Gambar Toko (main image) dan Foto Produk Terdebest (images array)
  const allImages = highlightItem
    ? [highlightItem.image, ...(Array.isArray(highlightItem.images) ? highlightItem.images : [])].filter(Boolean)
    : []

  return (
    <section id="umkm" className="section-wrapper umkm-profile-section">
      <div className="about-profile-container">
        {isLoading ? (
          <div className="loading-spinner-container" style={{ width: '100%', padding: '4rem 1rem' }}>
            <div className="loading-spinner"></div>
            <span className="loading-text">Memuat produk Highlight UMKM Tanjung Sari...</span>
          </div>
        ) : highlightItem ? (
          <>
            {/* Left Column: Image Gallery */}
            <div className="about-profile-left fade-left" data-reveal>
              <div className="about-image-card" style={{ position: 'relative' }}>
                <img
                  src={allImages[activeImgIdx] || highlightItem.image || '/assets/images/hero-belakang-padang.jpg'}
                  alt={highlightItem.name}
                  className="about-image"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/assets/images/hero-belakang-padang.jpg'
                  }}
                />

                {allImages.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(11, 45, 85, 0.75)', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIdx(idx)}
                        style={{
                          width: activeImgIdx === idx ? '18px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: activeImgIdx === idx ? '#c5a04a' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Text & Description */}
            <div className="about-profile-right fade-right" data-reveal>
              <div className="about-tag">
                <span className="about-tag__line"></span>
                <span>Highlight UMKM Tanjung Sari</span>
              </div>
              <h2 className="about-heading">
                {highlightItem.name}
              </h2>

              <p className="about-description">
                {highlightItem.description}
              </p>
            </div>
          </>
        ) : (
          <div className="empty-state-box" style={{ width: '100%', background: '#ffffff', padding: '3.5rem 1.5rem' }}>
            <div className="empty-state-box__icon">
              <Store size={32} />
            </div>
            <h3 className="empty-state-box__title">Belum Ada Produk UMKM Highlight</h3>
            <p className="empty-state-box__desc">
              Saat ini belum ada UMKM yang dipilih sebagai Highlight Utama Beranda. Admin dapat memilih produk unggulan melalui Panel Admin untuk ditautkan di sini.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedUmkm
