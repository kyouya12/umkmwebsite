import { useState, useEffect } from 'react'
import { X, ZoomIn } from 'lucide-react'

function UmkmModal({ umkm, onClose }) {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!isFullScreen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullScreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullScreen])

  return (
    <>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="umkm-modal-title"
        onClick={onClose}
        data-lenis-prevent
        data-lenis-prevent-touch
        data-lenis-prevent-wheel
      >
        <div
          className="modal-panel"
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent
          data-lenis-prevent-touch
          data-lenis-prevent-wheel
        >
          <div className="modal-header">
            <div>
              <p className="featured-umkm__tag">Local UMKM</p>
              <h3 id="umkm-modal-title" className="modal-title">{umkm.name}</h3>
            </div>
            <button className="modal-close" type="button" aria-label="Close modal" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div
              className="modal-gallery__image-wrapper"
              onClick={() => setIsFullScreen(true)}
              title="Klik untuk melihat foto ukuran penuh"
            >
              <div className="modal-body__image" style={{ backgroundImage: `url(${umkm.image})` }} aria-label={umkm.name}></div>
              <div className="modal-gallery__zoom-badge">
                <ZoomIn size={15} /> <span>Lihat Ukuran Penuh</span>
              </div>
            </div>
            <div className="modal-meta">
              <span>{umkm.category}</span>
              <span>{umkm.location}</span>
            </div>
            <p className="modal-description">{umkm.description}</p>
          </div>
        </div>
      </div>

      {isFullScreen && (
        <div
          className="fullscreen-lightbox-overlay"
          onClick={() => setIsFullScreen(false)}
          data-lenis-prevent
          data-lenis-prevent-touch
          data-lenis-prevent-wheel
        >
          <div className="fullscreen-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-lightbox-close"
              type="button"
              onClick={() => setIsFullScreen(false)}
              aria-label="Tutup Tampilan Penuh"
            >
              <X size={26} />
            </button>
            <img
              src={umkm.image}
              alt={umkm.name}
              className="fullscreen-lightbox-img"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/assets/images/hero-belakang-padang.jpg'
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default UmkmModal

