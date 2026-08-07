import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Tanjung Sari', href: '#tanjung-sari' },
  { label: 'UMKM', href: '#umkm' },
  { label: 'About', href: '#about' },
]

function Navbar({ isSolid }) {
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

  return (
    <header className={`navbar ${isSolid ? 'navbar--solid' : 'navbar--transparent'} section-wrapper section-wrapper--nav`}>
      <a className="navbar__brand" href="#home">
        <strong>KKN 55</strong> UMRAH
      </a>
      <nav className="navbar__menu" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} className="navbar__link" href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="navbar__actions">
        <a className="button button--primary" href="#umkm">
          Explore UMKM
        </a>
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
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
        <a className="button button--primary" href="#umkm" onClick={() => setMenuOpen(false)}>
          Explore UMKM
        </a>
      </div>
    </header>
  )
}

export default Navbar
