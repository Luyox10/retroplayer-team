import React from 'react';
import { useLocation } from 'react-router-dom';
import './Layout.css';

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/explore', label: 'Explorar' },
  { to: '/library', label: 'Biblioteca' },
  { to: '/store', label: 'Tienda' },
  { to: '/room', label: 'Ambiente' },
  { to: '/profile', label: 'Perfil' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <a
                href={`#${link.to}`}
                className={location.pathname === link.to ? 'active' : ''}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
