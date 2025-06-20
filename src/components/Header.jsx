import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import '../css/Header.css';

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-content">
        <button
          className="menu-toggle"
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-label={isNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          title={isNavOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className="logo-section">
          <img src="/Foto.png" alt="ModuVida Logo" className="company-logo" />
          <div className="text-section">
            <h1 className="company-name">ModuVida</h1>
            <p className="company-slogan">Construyendo el Futuro, Módulo a Módulo</p>
          </div>
        </div>
        <nav className={`nav-menu ${isNavOpen ? 'active' : ''}`}>
          <ul className="nav-list">
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;