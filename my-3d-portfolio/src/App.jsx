
import ProfileScene from './components/ProfileSchene';
import './App.css';

function App() {
  return (
    <main className="portfolio">
      <header className="navbar">
        <a className="brand" href="#">Mawl</a>

        <nav>
          <a className="active" href="#profile">Profile</a>
          <a href="#skills">Skill</a>
          <a href="#experience">Karya</a>
          <a href="#contact">Kontak</a>
        </nav>

        <button className="cv-button">Unduh CV</button>
      </header>

      <section className="hero" id="profile">
        <div className="hero-content">
          <span className="eyebrow">Welcome to my Portofolio</span>

          <h1>
            Muhamad Wahyu Maulana
            <br />
          </h1>

          <h2>AI & Fullstack Developer</h2>

          <p>
            Satu atau dua kalimat tentang kamu, spesialisasi,
            dan nilai yang kamu bawa ke tim.
          </p>

          <div className="hero-actions">
            <button className="primary-button">Lihat Karya</button>
            <button className="secondary-button">Hubungi Aku</button>
          </div>
        </div>

        <div className="hero-3d">
          <ProfileScene />

          <div className="drag-hint">
            <span className="hint-dot" />
            Drag & drop huruf-nya
          </div>
        </div>
      </section>

      <footer className="hero-footer">
        <span>Scroll untuk melihat karya</span>
        <span>Bandung, Indonesia</span>
      </footer>
    </main>
  );
}

export default App;
