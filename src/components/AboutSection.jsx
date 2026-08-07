import { MapPin, Store, HeartHandshake } from 'lucide-react'
import FeatureCard from './FeatureCard.jsx'
import SectionTitle from './SectionTitle.jsx'

const features = [
  {
    id: 'discover',
    title: 'Temukan',
    description: 'Menemukan berbagai UMKM lokal di Tanjung Sari.',
    icon: <MapPin size={24} color="#c5a04a" aria-hidden="true" />,
  },
  {
    id: 'learn',
    title: 'Kenali',
    description: 'Mengenal cerita, produk, dan potensi di balik setiap usaha.',
    icon: <Store size={24} color="#c5a04a" aria-hidden="true" />,
  },
  {
    id: 'support',
    title: 'Dukung',
    description: 'Mendorong masyarakat untuk mengenal dan mendukung produk lokal.',
    icon: <HeartHandshake size={24} color="#c5a04a" aria-hidden="true" />,
  },
]

function AboutSection() {
  return (
    <section id="about" className="section-wrapper about-section">
      <div className="about-content fade-up" data-reveal>
        <SectionTitle
          label="Local Potential"
          heading="Kenali Potensi, Dukung UMKM Lokal"
          subtitle="Website ini hadir sebagai media informasi dan promosi untuk memperkenalkan UMKM yang ada di Kelurahan Tanjung Sari. Melalui platform ini, masyarakat dan pengunjung dapat mengenal lebih dekat berbagai usaha lokal, produk yang ditawarkan, serta potensi yang dimiliki oleh masyarakat setempat."
        />
        <div className="features-grid">
          {features.map((item) => (
            <FeatureCard key={item.id} {...item} />
          ))}
        </div>
      </div>
      <div className="wave-divider"></div>
    </section>
  )
}

export default AboutSection
