import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Phone, MapPin, X, ChevronLeft, ChevronRight, Store } from 'lucide-react'
import { getStoredUmkmItems } from '../data/umkm.js'

function UmkmCatalogPage({ onBackToHome, umkmList, isLoading = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedUmkm, setSelectedUmkm] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [localUmkm, setLocalUmkm] = useState(getStoredUmkmItems())

  useEffect(() => {
    const handleUmkmChange = () => {
      setLocalUmkm(getStoredUmkmItems())
    }
    window.addEventListener('umkmDataChanged', handleUmkmChange)
    return () => window.removeEventListener('umkmDataChanged', handleUmkmChange)
  }, [])

  const itemsToUse = umkmList && umkmList.length >= 0 ? umkmList : localUmkm
  const availableCategories = ['Semua', ...new Set(itemsToUse.map((item) => item.category).filter(Boolean))]

  const filteredUmkm = itemsToUse.filter((item) => {
    const matchesCategory =
      selectedCategory === 'Semua' || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  return (
    <div className="catalog-page">
      {/* Catalog Header Banner */}
      <header className="catalog-banner">
        <div className="catalog-banner__container">
          <button className="button button--secondary button--with-icon catalog-back-btn" onClick={onBackToHome}>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </button>
          <span className="catalog-banner__tag">Katalog Terpadu UMKM</span>
          <h1 className="catalog-banner__title">UMKM Tanjung Sari</h1>
          <p className="catalog-banner__subtitle">
            Daftar lengkap produk, kuliner, kerajinan, dan karya usaha lokal unggulan Kelurahan Tanjung Sari, Belakang Padang.
          </p>
        </div>
      </header>

      {/* Catalog Main Content */}
      <main className="catalog-content">
        <div className="catalog-container">
          {/* Controls: Search & Category Filters */}
          <div className="catalog-controls">
            <div className="catalog-search-row">
              <div className="catalog-search">
                <Search size={20} className="catalog-search__icon" />
                <input
                  type="text"
                  placeholder="Cari produk atau nama UMKM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="catalog-search__input"
                />
                {searchQuery && (
                  <button className="catalog-search__clear" onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {availableCategories.length > 1 && (
              <div className="catalog-categories">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`catalog-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid Cards View & Loading / Empty States */}
          {isLoading ? (
            <div className="loading-spinner-container" style={{ padding: '5rem 1rem' }}>
              <div className="loading-spinner"></div>
              <span className="loading-text">Memuat katalog UMKM Tanjung Sari dari Supabase Database...</span>
            </div>
          ) : filteredUmkm.length > 0 ? (
            <div className="catalog-grid">
              {filteredUmkm.map((item) => (
                <article key={item.id} className="catalog-card">
                  <div className="catalog-card__image-box">
                    <img
                      src={item.image || '/assets/images/hero-belakang-padang.jpg'}
                      alt={item.name}
                      className="catalog-card__img"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = '/assets/images/hero-belakang-padang.jpg'
                      }}
                    />
                    {item.category && <span className="catalog-card__category">{item.category}</span>}
                  </div>
                  <div className="catalog-card__body">
                    <h3 className="catalog-card__title">{item.name}</h3>
                    <div className="catalog-card__location">
                      <MapPin size={14} /> {item.location || 'Tanjung Sari'}
                    </div>
                    <p className="catalog-card__desc">{item.description}</p>
                    <button
                      className="button button--secondary catalog-card__action"
                      onClick={() => {
                        setSelectedUmkm(item)
                        setActiveImageIndex(0)
                      }}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : itemsToUse.length === 0 ? (
            <div className="empty-state-box" style={{ background: '#ffffff', margin: '2rem 0' }}>
              <div className="empty-state-box__icon">
                <Store size={32} />
              </div>
              <h3 className="empty-state-box__title">Belum Ada Produk UMKM Terdaftar</h3>
              <p className="empty-state-box__desc">
                Saat ini belum ada produk UMKM yang dipublikasikan. Data baru akan tampil secara otomatis di sini setelah ditambahkan melalui Panel Admin.
              </p>
            </div>
          ) : (
            <div className="catalog-empty">
              <p>Tidak ada UMKM yang sesuai dengan pencarian atau filter Anda.</p>
              <button
                className="button button--primary"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('Semua')
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </main>


      {/* UMKM Detail Lightbox Modal */}
      {selectedUmkm && (() => {
        const umkmImages = [selectedUmkm.image, ...(Array.isArray(selectedUmkm.images) ? selectedUmkm.images : [])].filter(Boolean)


        const handlePrev = (e) => {
          e.stopPropagation()
          setActiveImageIndex((prev) => (prev === 0 ? umkmImages.length - 1 : prev - 1))
        }

        const handleNext = (e) => {
          e.stopPropagation()
          setActiveImageIndex((prev) => (prev === umkmImages.length - 1 ? 0 : prev + 1))
        }

        return (
          <div className="modal-overlay" onClick={() => setSelectedUmkm(null)}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="featured-umkm__tag">{selectedUmkm.category}</span>
                  <h3 className="modal-title">{selectedUmkm.name}</h3>
                </div>
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setSelectedUmkm(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {/* Multi-Image Gallery Container */}
                <div className="modal-gallery">
                  <div className="modal-gallery__main">
                    <img
                      src={umkmImages[activeImageIndex] || selectedUmkm.image}
                      alt={`${selectedUmkm.name} - Foto ${activeImageIndex + 1}`}
                      className="modal-body__img-large"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = '/assets/images/hero-belakang-padang.jpg'
                      }}
                    />

                    {umkmImages.length > 1 && (
                      <>
                        <button
                          className="modal-gallery__nav modal-gallery__nav--prev"
                          type="button"
                          onClick={handlePrev}
                          aria-label="Foto Sebelumnya"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <button
                          className="modal-gallery__nav modal-gallery__nav--next"
                          type="button"
                          onClick={handleNext}
                          aria-label="Foto Selanjutnya"
                        >
                          <ChevronRight size={20} />
                        </button>

                        <span className="modal-gallery__counter">
                          {activeImageIndex + 1} / {umkmImages.length}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {umkmImages.length > 1 && (
                    <div className="modal-gallery__thumbs">
                      {umkmImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`modal-gallery__thumb ${activeImageIndex === idx ? 'active' : ''}`}
                          onClick={() => setActiveImageIndex(idx)}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/assets/images/hero-belakang-padang.jpg'
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-meta-list">
                  <div className="modal-meta-item">
                    <MapPin size={16} /> <span>{selectedUmkm.address || selectedUmkm.location}</span>
                  </div>
                  {selectedUmkm.phone && (
                    <div className="modal-meta-item">
                      <Phone size={16} /> <span>{selectedUmkm.phone}</span>
                    </div>
                  )}
                </div>
                <p className="modal-description">{selectedUmkm.description}</p>
                {selectedUmkm.phone && (
                  <div className="modal-actions">
                    <a
                      href={`https://wa.me/${selectedUmkm.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--primary"
                    >
                      <Phone size={16} /> Hubungi via WhatsApp / Telepon
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default UmkmCatalogPage
