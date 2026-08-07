import { MapPin, Waves, Store } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'

const iconMap = {
  MapPin: MapPin,
  Waves: Waves,
  Store: Store,
}

function ProfileSection({ profile }) {
  return (
    <section id="tanjung-sari" className="section-wrapper section-wrapper--compact umkm-section">
      <div className="profile-grid">
        <div className="profile-image fade-up" data-reveal aria-hidden="true"></div>
        <div className="profile-card fade-up" data-reveal>
          <SectionTitle
            label="About Tanjung Sari"
            heading="Mengenal Tanjung Sari"
            subtitle={profile.overview}
          />
          <div className="info-cards">
            {profile.cards.map((card) => {
              const Icon = iconMap[card.icon]
              return (
                <article key={card.id} className="info-card">
                  <div className="info-card__icon">
                    <Icon size={24} color="#c5a04a" aria-hidden="true" />
                  </div>
                  <h3 className="info-card__title">{card.title}</h3>
                  <p className="info-card__text">{card.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileSection
