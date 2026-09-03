import { MapPin, ChevronRight } from 'lucide-react'

function Footer() {
  return (
    <footer className="footer-rich">
      <div className="footer-rich__container">
        <div className="footer-rich__grid">
          {/* COLUMN 1: BRAND & LOGO KKN 55 */}
          <div className="footer-col footer-col--brand">
            <div className="footer-brand-header">
              <img
                src="/assets/images/logo-kkn55.png"
                alt="Logo KKN 55 UMRAH"
                className="footer-brand-logo"
              />
              <div>
                <h3 className="footer-brand-title">KKN 55 UMRAH</h3>
                <span className="footer-brand-sub">Kelurahan Tanjung Sari</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: QUICK NAVIGATION LINKS */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigasi Halaman</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#home"><ChevronRight size={14} /> Beranda</a>
              </li>
              <li>
                <a href="#about"><ChevronRight size={14} /> Tentang Tanjung Sari</a>
              </li>
              <li>
                <a href="#umkm"><ChevronRight size={14} /> Highlight UMKM</a>
              </li>
              <li>
                <a href="#galeri"><ChevronRight size={14} /> Galeri Foto</a>
              </li>
              <li>
                <a href="#sponsor"><ChevronRight size={14} /> Mitra & Dukungan</a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: ADDRESS */}
          <div className="footer-col">
            <h4 className="footer-col-title">Alamat</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="footer-contact-icon" />
                <span>Kelurahan Tanjung Sari, Kec. Belakang Padang, Kota Batam, Kepulauan Riau</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="footer-rich__bottom">
          <p className="footer-copyright-text">
            © 2026 <strong>KKN 55 UMRAH Tanjung Sari</strong> — Belakang Padang, Kota Batam. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
