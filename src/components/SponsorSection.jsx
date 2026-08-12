const sponsorList = [
  { id: 1, alt: 'Universitas Maritim Raja Ali Haji (UMRAH)', src: '/assets/images/logo-kkn55.png' },
  { id: 2, alt: 'Pemerintah Kelurahan Tanjung Sari', src: '/assets/images/logo-kkn55.png' },
  { id: 3, alt: 'Yayasan Amal Dapur 12 Batam', src: '/assets/images/logo-yayasan-amal.png' },
]

function SponsorSection() {
  return (
    <section id="sponsor" className="section-wrapper sponsor-section">
      <div className="sponsor-container">
        <div className="sponsor-logo-showcase">
          <div className="sponsor-logo-subtitle fade-left" data-reveal>Dukungan & Mitra Kerja</div>

          {/* Original Unedited Image Files */}
          <div className="sponsor-logo-row sponsor-logo-row--circle fade-right" data-reveal>
            {sponsorList.map((sponsor) => (
              <div key={sponsor.id} className="sponsor-logo-item sponsor-logo-item--circle" title={sponsor.alt}>
                <img
                  src={sponsor.src}
                  alt={sponsor.alt}
                  className="sponsor-logo-img--round"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SponsorSection
