import { X } from 'lucide-react'

function UmkmModal({ umkm, onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="umkm-modal-title">
      <div className="modal-panel fade-up" data-reveal>
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
          <div className="modal-body__image" style={{ backgroundImage: `url(${umkm.image})` }} aria-label={umkm.name}></div>
          <div className="modal-meta">
            <span>{umkm.category}</span>
            <span>{umkm.location}</span>
          </div>
          <p className="modal-description">{umkm.description}</p>
        </div>
      </div>
    </div>
  )
}

export default UmkmModal
