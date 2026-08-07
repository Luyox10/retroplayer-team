import React, { useEffect, useState } from 'react';
import { getReports, updateReport } from '../services/adminReportsService';

const STATUSES = ['open', 'reviewed', 'resolved', 'dismissed'];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  const load = () => getReports().then((r) => setReports(r?.reports || [])).catch((err) => setError(err.message));
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    try {
      await updateReport(id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Reportes</h2>
      {error && <div className="admin-error">{error}</div>}
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Reporter</th><th>Target</th><th>Target ID</th><th>Razón</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.reporter_user_id}</td>
              <td>{r.target_type}</td>
              <td>{r.target_id}</td>
              <td>{r.reason}</td>
              <td>{r.status}</td>
              <td>
                {STATUSES.filter((s) => s !== r.status).map((s) => (
                  <button key={s} className="admin-btn secondary" onClick={() => changeStatus(r.id, s)}>{s}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
