import { useState, useEffect } from 'react'
import { fetchSponsorsWithSupabase, getStoredSponsors } from '../data/sponsors.js'

function SponsorSection() {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSponsorsData() {
      setLoading(true)
      const data = await fetchSponsorsWithSupabase()
      if (isMounted) {
        setSponsors(data || [])
        setLoading(false)
      }
    }

    loadSponsorsData()

    const handleSponsorChange = () => {
      if (isMounted) {
        setSponsors(getStoredSponsors())
      }
    }

    window.addEventListener('sponsorDataChanged', handleSponsorChange)
    return () => {
      isMounted = false
      window.removeEventListener('sponsorDataChanged', handleSponsorChange)
    }
  }, [])

  return (
    <section id="sponsor" className="section-wrapper sponsor-section">
      <div className="sponsor-container">
        <div className="sponsor-logo-showcase">
          <div className="sponsor-logo-subtitle fade-left is-visible">
            Dukungan & Mitra Kerja
          </div>

          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                color: '#64748b',
                fontSize: '0.95rem',
                padding: '2rem 0'
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #cbd5e1',
                  borderTopColor: '#0b2d55',
                  borderRadius: '50%',
                  animation: 'sponsorSpin 0.8s linear infinite'
                }}
              />
              <style>{`
                @keyframes sponsorSpin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <span>Memuat...</span>
            </div>
          ) : sponsors.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.95rem',
                padding: '2rem 0',
                fontStyle: 'italic'
              }}
            >
              tidak ada sponsor
            </div>
          ) : (
            <div className="sponsor-logo-row sponsor-logo-row--circle fade-right is-visible">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="sponsor-logo-item sponsor-logo-item--circle"
                  title={sponsor.name || sponsor.alt || 'Sponsor'}
                >
                  <img
                    src={sponsor.image || sponsor.src}
                    alt={sponsor.name || sponsor.alt || 'Sponsor'}
                    className="sponsor-logo-img--round"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SponsorSection

