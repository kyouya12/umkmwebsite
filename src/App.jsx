import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ProfileSection from './components/ProfileSection.jsx'
import FeaturedUmkm from './components/FeaturedUmkm.jsx'
import GallerySection from './components/GallerySection.jsx'
import SponsorSection from './components/SponsorSection.jsx'
import Footer from './components/Footer.jsx'
import UmkmCatalogPage from './pages/UmkmCatalogPage.jsx'
import SecretAdminPage from './pages/SecretAdminPage.jsx'
import profileData from './data/profile.js'
import umkmData from './data/umkm.js'

function App() {
  const [isNavSolid, setIsNavSolid] = useState(false)
  const [currentPage, setCurrentPage] = useState('home') // 'home' | 'umkm-catalog' | 'secret-admin'

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsNavSolid(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)

    const checkRoute = () => {
      const href = window.location.href.toLowerCase()
      const path = window.location.pathname.toLowerCase()
      const hash = window.location.hash.toLowerCase()
      const search = window.location.search.toLowerCase()

      if (
        href.includes('thisnotforuse') ||
        path.includes('thisnotforuse') ||
        hash.includes('thisnotforuse') ||
        search.includes('thisnotforuse')
      ) {
        setCurrentPage('secret-admin')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    checkRoute()
    window.addEventListener('popstate', checkRoute)
    window.addEventListener('hashchange', checkRoute)

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
      window.removeEventListener('popstate', checkRoute)
      window.removeEventListener('hashchange', checkRoute)
      observer.disconnect()
    }
  }, [currentPage])

  const goToUmkmCatalog = () => {
    setCurrentPage('umkm-catalog')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToHome = () => {
    if (window.location.pathname !== '/' || window.location.hash) {
      window.history.pushState({}, '', '/')
      window.location.hash = ''
    }
    setCurrentPage('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToSecretAdmin = () => {
    window.location.hash = '#/thisnotforuse'
    setCurrentPage('secret-admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      {currentPage !== 'secret-admin' && (
        <Navbar
          isSolid={isNavSolid}
          onNavigateToHome={goToHome}
          onNavigateToUmkmPage={goToUmkmCatalog}
          isCatalogPage={currentPage === 'umkm-catalog'}
        />
      )}

      {currentPage === 'home' ? (
        <main>
          <Hero />
          <ProfileSection profile={profileData} />
          <FeaturedUmkm umkmList={umkmData} />
          <GallerySection />
          <SponsorSection />
        </main>
      ) : currentPage === 'umkm-catalog' ? (
        <UmkmCatalogPage onBackToHome={goToHome} />
      ) : (
        <SecretAdminPage onBackToHome={goToHome} />
      )}

      {currentPage === 'home' && <Footer />}
    </div>
  )
}

export default App
