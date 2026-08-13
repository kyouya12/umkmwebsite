import { useState, useEffect } from 'react'
import {
  getStoredAboutProfile,
  fetchAboutProfileWithSupabase,
} from '../data/profile.js'

function ProfileSection() {
  const [about, setAbout] = useState(getStoredAboutProfile())

  useEffect(() => {
    let isMounted = true

    async function loadAboutData() {
      const data = await fetchAboutProfileWithSupabase()
      if (isMounted && data) {
        setAbout(data)
      }
    }

    loadAboutData()

    const handleAboutChange = () => {
      if (isMounted) {
        setAbout(getStoredAboutProfile())
      }
    }

    window.addEventListener('aboutProfileDataChanged', handleAboutChange)
    return () => {
      isMounted = false
      window.removeEventListener('aboutProfileDataChanged', handleAboutChange)
    }
  }, [])

  return (
    <section id="about" className="section-wrapper about-profile-section">
      <div className="about-profile-container">
        <div className="about-profile-left fade-left is-visible">
          <div className="about-tag">
            <span className="about-tag__line"></span>
            <span>About</span>
          </div>
          <h2 className="about-heading">
            {about?.title || 'Tentang Tanjung Sari'}
          </h2>
          <p className="about-description">
            {about?.description ||
              'Kelurahan Tanjung Sari merupakan salah satu kelurahan yang terletak di Kecamatan Belakang Padang, Kota Batam, Kepulauan Riau. Wilayah ini memiliki keindahan alam laut yang mempesona serta masyarakat yang ramah dan menjunjung tinggi nilai-nilai budaya dan gotong royong.'}
          </p>
        </div>

        <div className="about-profile-right fade-right is-visible">
          <div className="about-image-card">
            <img
              src={about?.image || '/assets/images/hero-belakang-padang.jpg'}
              alt={about?.title || 'Profil Tanjung Sari'}
              className="about-image"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileSection

