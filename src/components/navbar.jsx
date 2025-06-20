import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faBox,
  faClipboardList,
  faUserTie,
  faUser,
  faCubes,
  faCube,
  faFileInvoice,
  faChartBar,
  faBars,
  faSearch,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import '../css/navbar.css';

const NavBar = ({ className }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const navGroups = [
    {
      group: 'Inicio',
      items: [
        { to: '/', text: 'Inicio', icon: faHome },
      ],
    },
    {
      group: 'Gestión de Personas',
      items: [
        { to: '/Proveedores', text: 'Proveedores', icon: faUsers },
        { to: '/Clientes', text: 'Clientes', icon: faUser },
        { to: '/trabajadores', text: 'Trabajadores', icon: faUserTie },
      ],
    },
    {
      group: 'Gestión de Inventario',
      items: [
        { to: '/Stock', text: 'Stock', icon: faCubes },
        { to: '/Modelos', text: 'Modelos', icon: faCube },
        { to: '/Recibimientos', text: 'Recibimientos', icon: faTruck },
      ],
    },
    {
      group: 'Gestión de Órdenes',
      items: [
        { to: '/ordenes-de-compra', text: 'Órdenes de Compra', icon: faClipboardList },
        { to: '/Pedidos', text: 'Pedidos', icon: faFileInvoice },
      ],
    },
    {
      group: 'Reportes',
      items: [
        { to: '/Informes', text: 'Informes', icon: faChartBar },
      ],
    },
  ];

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.text.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(group => group.items.length > 0 || search === '');

  return (
    <div className={`navbar-container ${className || ''} ${isOpen ? 'open' : ''}`}>
      <button
        className="menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        title={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <div className="navbar-search">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar en el menú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar en el menú"
        />
      </div>
      <nav className="navbar-nav">
        <ul>
          {filteredNavGroups.length === 0 ? (
            <li className="no-results">No se encontraron resultados</li>
          ) : (
            filteredNavGroups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {group.items.length > 0 && (
                  <li className="nav-group-header">{group.group}</li>
                )}
                {group.items.map((item, itemIndex) => (
                  <li key={`${groupIndex}-${itemIndex}`}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      onClick={() => setIsOpen(false)}
                    >
                      <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                      <span className="nav-text">{item.text}</span>
                    </NavLink>
                  </li>
                ))}
              </React.Fragment>
            ))
          )}
        </ul>
      </nav>
    </div>
  );
};

export default NavBar;