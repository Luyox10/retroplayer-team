import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/adminDashboardService';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then((r) => setStats(r))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-error">{error}</div>;
  if (!stats) return <div>Cargando...</div>;

  const cards = [
    { label: 'Usuarios', value: stats.users },
    { label: 'Activos', value: stats.active_users },
    { label: 'Favoritos', value: stats.favorites },
    { label: 'Reproducciones', value: stats.plays },
    { label: 'Segundos escuchados', value: stats.listened_time },
    { label: 'Productos vendidos', value: stats.products_sold },
    { label: 'Ingresos', value: `$${stats.revenue}` },
    { label: 'Ambientes', value: stats.environments },
    { label: 'Reportes abiertos', value: stats.pending_reports },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="admin-card-grid">
        {cards.map((c) => (
          <div className="admin-card" key={c.label}>
            <h3>{c.value}</h3>
            <p>{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
