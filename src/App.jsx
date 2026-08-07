import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ProfileSection from './components/ProfileSection.jsx'
import AboutSection from './components/AboutSection.jsx'
import FeaturedUmkm from './components/FeaturedUmkm.jsx'
import Footer from './components/Footer.jsx'
import profileData from './data/profile.js'
import umkmData from './data/umkm.js'

function App() {
  const [isNavSolid, setIsNavSolid] = useState(false)
  const [selectedUmkm, setSelectedUmkm] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsNavSolid(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll('[data-reveal]').forEach((section) => {
      observer.observe(section)
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="app-shell">
      <Navbar isSolid={isNavSolid} />
      <main>
        <Hero />
        <ProfileSection profile={profileData} />
        <AboutSection />
        <FeaturedUmkm
          featured={umkmData.find((item) => item.featured)}
          others={umkmData.filter((item) => !item.featured)}
          onViewDetail={setSelectedUmkm}
        />
      </main>
      <Footer />
      {selectedUmkm && (
        <FeaturedUmkm.Modal
          umkm={selectedUmkm}
          onClose={() => setSelectedUmkm(null)}
        />
      )}
    </div>
  )
}

export default App
