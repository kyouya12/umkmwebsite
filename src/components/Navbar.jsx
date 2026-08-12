import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Galeri', href: '#galeri' },
  { label: 'Sponsor', href: '#sponsor' },
]

function Navbar({ isSolid, onNavigateToHome, onNavigateToUmkmPage, isCatalogPage }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleBrandClick = (e) => {
    if (isCatalogPage) {
      e.preventDefault()
      onNavigateToHome()
    }
  }

  const handleExploreClick = (e) => {
    e.preventDefault()
    setMenuOpen(false)
    onNavigateToUmkmPage()
  }

  return (
    <header className={`navbar ${isSolid ? 'navbar--solid' : 'navbar--transparent'} section-wrapper section-wrapper--nav`}>
      <a className="navbar__brand" href="#home" onClick={handleBrandClick}>
        <div className="navbar__title-group">
          <span className="navbar__title">Kelurahan Tanjung Sari</span>
        </div>
      </a>
      <nav className="navbar__menu" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            key={item.href}
            className="navbar__link"
            href={item.href}
            onClick={(e) => {
              if (item.label === 'UMKM') {
                handleExploreClick(e)
              } else if (isCatalogPage) {
                e.preventDefault()
                onNavigateToHome()
                setTimeout(() => {
                  const target = document.querySelector(item.href)
                  if (target) target.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="navbar__actions">
        <button className="button button--primary" onClick={handleExploreClick}>
          Explore UMKM
        </button>
      </div>
      <button
        className="navbar__toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((state) => !state)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              setMenuOpen(false)
              if (item.label === 'UMKM') {
                handleExploreClick(e)
              } else if (isCatalogPage) {
                e.preventDefault()
                onNavigateToHome()
                setTimeout(() => {
                  const target = document.querySelector(item.href)
                  if (target) target.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
          >
            {item.label}
          </a>
        ))}
        <button
          className="button button--primary"
          onClick={handleExploreClick}
        >
          Explore UMKM
        </button>
      </div>
    </header>
  )
}

export default Navbar
