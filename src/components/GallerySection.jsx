import { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react'
import { getStoredGalleryItems, fetchGalleryItemsWithSupabase } from '../data/gallery.js'

function GallerySection() {
  const [galleryItems, setGalleryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeModalPhoto, setActiveModalPhoto] = useState(null)
  const isThrottled = useRef(false)

  // Initial fetch from Supabase & state sync
  useEffect(() => {
    let isMounted = true
    async function loadSupabaseGallery() {
      setLoading(true)
      try {
        const data = await fetchGalleryItemsWithSupabase()
        if (isMounted) {
          setGalleryItems(data || [])
        }
      } catch (err) {
        console.error('Error fetching gallery:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadSupabaseGallery()

    const syncGallery = () => {
      const updated = getStoredGalleryItems()
      setGalleryItems(updated)
      setLoading(false)
      if (currentIndex >= updated.length && updated.length > 0) {
        setCurrentIndex(0)
      }
    }

    window.addEventListener('galleryDataChanged', syncGallery)
    window.addEventListener('storage', syncGallery)
    return () => {
      isMounted = false
      window.removeEventListener('galleryDataChanged', syncGallery)
      window.removeEventListener('storage', syncGallery)
    }
  }, [currentIndex])

  const safeIndex = Math.min(currentIndex, Math.max(0, galleryItems.length - 1))
  const currentItem = galleryItems.length > 0 ? galleryItems[safeIndex] : null

  const nextPhoto = (e) => {
    if (e) e.stopPropagation()
    if (galleryItems.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length)
  }

  const prevPhoto = (e) => {
    if (e) e.stopPropagation()
    if (galleryItems.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)
  }

  return (
    <section id="galeri" className="section-wrapper gallery-section">
      <div className="about-profile-container">
        {/* LEFT COLUMN: DESCRIPTION & TITLE */}
        <div className="about-profile-left fade-left" data-reveal>
          <div className="about-tag">
            <span className="about-tag__line"></span>
            <span>Dokumentasi Foto</span>
          </div>

          <h2 className="about-heading">
            Galeri Foto Tanjung Sari
          </h2>

          <p className="about-description">
            Kumpulan dokumentasi momen keindahan alam pesisir, kegiatan sosial masyarakat, serta ragam potensi UMKM lokal di Kelurahan Tanjung Sari, Belakang Padang.
          </p>

          {loading ? (
            <div className="gallery-active-info-box" style={{ minHeight: '70px', justifyContent: 'center' }}>
              <span className="gallery-info-category" style={{ width: '90px', height: '14px', background: 'rgba(197,160,74,0.3)', borderRadius: '4px', display: 'block' }}></span>
              <div style={{ width: '200px', height: '22px', background: 'rgba(11,45,85,0.12)', borderRadius: '6px', marginTop: '6px' }}></div>
            </div>
          ) : currentItem ? (
            <div className="gallery-active-info-box" style={{ minHeight: '70px' }}>
              <span className="gallery-info-category">{currentItem.category}</span>
              <h3 className="gallery-active-title">{currentItem.title}</h3>
            </div>
          ) : (
            <div className="gallery-active-info-box" style={{ minHeight: '70px' }}>
              <span className="gallery-info-category">Informasi Galeri</span>
              <h3 className="gallery-active-title" style={{ color: '#64748b' }}>Tidak ada gambar terbaru</h3>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: IMAGE SLIDER CARD WITH OVERLAY CONTROLS */}
        <div className="about-profile-right fade-right" data-reveal>
          {loading ? (
            /* EXACT SAME FRAME CONTAINER AS IMAGE CARD DURING LOADING */
            <div
              className="gallery-slider-card"
              style={{
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'linear-gradient(135deg, #0b2d55 0%, #06182e 100%)'
              }}
            >
              <div className="gallery-loader-circle"></div>
              <p className="gallery-loader-text-pulse">
                Memuat dokumentasi galeri...
              </p>
            </div>
          ) : currentItem ? (
            <div
              className="gallery-slider-card"
              onClick={() => setActiveModalPhoto(currentItem)}
            >
              <img
                src={currentItem.image}
                alt={currentItem.title}
                className="gallery-slider-img"
                key={currentItem.id}
              />

              {/* FLOATING OVERLAY NAV BUTTONS DIRECTLY ON IMAGE */}
              <button
                type="button"
                onClick={prevPhoto}
                className="gallery-image-nav-btn gallery-image-nav-btn--left"
                aria-label="Foto Sebelumnya"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={nextPhoto}
                className="gallery-image-nav-btn gallery-image-nav-btn--right"
                aria-label="Foto Selanjutnya"
              >
                <ChevronRight size={22} />
              </button>

              {/* BOTTOM BAR WITH COUNTER & DOTS DIRECTLY ON IMAGE */}
              <div className="gallery-slider-bottom-bar" onClick={(e) => e.stopPropagation()}>
                <span className="gallery-counter">
                  {safeIndex + 1} / {galleryItems.length}
                </span>

                <div className="gallery-dots">
                  {galleryItems.map((item, idx) => (
                    <button
                      key={item.id}
                      className={`gallery-dot ${idx === safeIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentIndex(idx)
                      }}
                      aria-label={`Ke foto ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="gallery-zoom-badge-btn"
                  onClick={() => setActiveModalPhoto(currentItem)}
                  title="Perbesar Foto"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* EMPTY STATE: TIDAK ADA GAMBAR TERBARU */
            <div
              className="gallery-slider-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                flexDirection: 'column',
                gap: '0.85rem',
                background: 'linear-gradient(135deg, #0f2744 0%, #081a30 100%)',
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                padding: '2rem'
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(197, 160, 74, 0.12)',
                  border: '1px solid rgba(197, 160, 74, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem'
                }}
              >
                <ImageIcon size={28} color="#c5a04a" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: '600' }}>
                Tidak ada gambar terbaru
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', maxWidth: '320px', lineHeight: '1.5' }}>
                Belum ada dokumentasi foto yang diunggah ke dalam galeri.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PURE FULL PHOTO LIGHTBOX MODAL */}
      {activeModalPhoto && (
        <div className="gallery-modal-overlay" onClick={() => setActiveModalPhoto(null)}>
          <div className="gallery-modal-content gallery-modal-content--full" onClick={(e) => e.stopPropagation()}>
            <button
              className="gallery-modal-close"
              onClick={() => setActiveModalPhoto(null)}
              aria-label="Tutup"
            >
              <X size={24} />
            </button>
            <div className="gallery-modal-body gallery-modal-body--full">
              <img
                src={activeModalPhoto.image}
                alt=""
                className="gallery-modal-img gallery-modal-img--full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default GallerySection
