import React from 'react';
import './AdminLayout.css';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Usuarios' },
  { to: '/products', label: 'Productos' },
  { to: '/environments', label: 'Ambientes' },
  { to: '/room-objects', label: 'Objetos' },
  { to: '/reports', label: 'Reportes' },
  { to: '/stats', label: 'Estadísticas' },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
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
