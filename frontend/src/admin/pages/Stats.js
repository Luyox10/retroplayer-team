import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/adminDashboardService';
import { getReports } from '../services/adminReportsService';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDashboard(), getReports()])
      .then(([s, r]) => {
        setStats(s);
        setReports(r?.reports || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-error">{error}</div>;
  if (!stats) return <div>Cargando...</div>;

  const byStatus = { open: 0, reviewed: 0, resolved: 0, dismissed: 0 };
  reports.forEach((r) => { if (byStatus[r.status] !== undefined) byStatus[r.status]++; });

  return (
    <div>
      <h2>Estadísticas</h2>
      <div className="admin-card-grid">
        <div className="admin-card"><h3>{stats.users}</h3><p>Usuarios</p></div>
        <div className="admin-card"><h3>{stats.plays}</h3><p>Reproducciones</p></div>
        <div className="admin-card"><h3>{Math.floor(stats.listened_time / 60)}</h3><p>Minutos escuchados</p></div>
        <div className="admin-card"><h3>${stats.revenue}</h3><p>Ingresos</p></div>
      </div>
      <h3>Reportes por estado</h3>
      <div className="admin-card-grid">
        {Object.entries(byStatus).map(([k, v]) => (
          <div className="admin-card" key={k}><h3>{v}</h3><p>{k}</p></div>
        ))}
      </div>
    </div>
  );
}
