import React from 'react';
import './Layout.css';

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/explore', label: 'Explorar' },
  { to: '/library', label: 'Biblioteca' },
  { to: '/store', label: 'Tienda' },
  { to: '/profile', label: 'Perfil' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <a href={`#${link.to}`}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
