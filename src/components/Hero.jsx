function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content fade-up" data-reveal>
        <div className="hero-label">KKN 55 UMRAH</div>
        <h1 className="hero-heading">
          <span>WELCOME TO</span>
          <span>BELAKANG PADANG</span>
        </h1>
        <p className="hero-description">
          Mengenal keindahan, masyarakat, dan potensi lokal Kelurahan Tanjung Sari.
        </p>
        <div className="hero-separator"></div>
        <div className="hero-actions">
          <a className="button button--primary" href="#tanjung-sari">
            Explore Tanjung Sari
          </a>
          <a className="button button--secondary" href="#umkm">
            Discover Local UMKM
          </a>
        </div>
      </div>
      <div className="scroll-indicator fade-up" data-reveal>
        <span aria-hidden="true"></span>
        <div>Scroll</div>
      </div>
    </section>
  )
}

export default Hero
