import React, { useEffect, useState } from 'react';
import { getUsers, updateUserStatus } from '../services/adminUsersService';

const STATUSES = ['active', 'suspended', 'banned'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const load = () => {
    getUsers()
      .then((r) => setUsers(r?.users || []))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const changeStatus = async (id, status) => {
    try {
      await updateUserStatus(id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Usuarios</h2>
      {error && <div className="admin-error">{error}</div>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                {STATUSES.filter((s) => s !== u.status).map((s) => (
                  <button key={s} className="admin-btn secondary" onClick={() => changeStatus(u.id, s)}>{s}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
