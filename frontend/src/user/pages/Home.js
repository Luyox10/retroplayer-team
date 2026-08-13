import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHome } from '../services/homeService';
import HomeSection from '../components/HomeSection';
import '../styles/Pages.css';

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero" aria-label="Bienvenida">
      <div className="hero-glow hero-glow-1" aria-hidden="true" />
      <div className="hero-glow hero-glow-2" aria-hidden="true" />
      <div className="hero-content">
        <h1>Descubre tu sonido retro</h1>
        <p className="hero-subtitle">Explora canciones, crea tu espacio y vive la musica con estilo.</p>
        <button className="btn btn-hero" onClick={() => navigate('/explore')} type="button">
          Explorar musica
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHome()
      .then((data) => {
        setSections(data?.sections || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page home-page">
        <Hero />
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page home-page">
        <Hero />
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <Hero />
      {sections.map((section, index) => (
        <HomeSection key={`${section.type}-${section.genre || index}`} section={section} />
      ))}
      {sections.length === 0 && (
        <p className="empty">No hay contenido disponible</p>
      )}
    </div>
  );
}
