function ProfileSection({ profile }) {
  return (
    <section id="about" className="section-wrapper about-profile-section">
      <div className="about-profile-container">
        <div className="about-profile-left fade-left" data-reveal>
          <div className="about-tag">
            <span className="about-tag__line"></span>
            <span>About</span>
          </div>
          <h2 className="about-heading">
            Tentang Tanjung Sari
          </h2>
          <p className="about-description">
            {profile?.overview ||
              'Kelurahan Tanjung Sari merupakan salah satu kelurahan yang terletak di Kecamatan Belakang Padang, Kota Batam, Kepulauan Riau. Wilayah ini memiliki keindahan alam laut yang mempesona serta masyarakat yang ramah dan menjunjung tinggi nilai-nilai budaya dan gotong royong.'}
          </p>
        </div>

        <div className="about-profile-right fade-right" data-reveal>
          <div className="about-image-card">
            <img
              src="/assets/images/hero-belakang-padang.jpg"
              alt="Pesisir Tanjung Sari"
              className="about-image"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileSection
