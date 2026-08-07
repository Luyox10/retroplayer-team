import React, { useEffect, useState } from 'react';
import { getEnvironments, createEnvironment, updateEnvironment, deleteEnvironment } from '../services/adminEnvironmentsService';

const TYPES = ['room', 'studio', 'lounge', 'arcade'];
const STATUSES = ['draft', 'published', 'hidden'];

const emptyForm = { name: '', type: 'room', description: '', status: 'published', price: '0', is_free: true, is_active: true, image_url: '', thumbnail_url: '', scene_data: '' };

export default function Environments() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getEnvironments().then((r) => setItems(r?.environments || [])).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), scene_data: form.scene_data ? JSON.parse(form.scene_data) : null };
    try {
      if (editing) await updateEnvironment(editing, payload);
      else await createEnvironment(payload);
      setForm({ ...emptyForm });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name,
      type: item.type,
      description: item.description || '',
      status: item.status,
      price: String(item.price),
      is_free: item.is_free,
      is_active: item.is_active,
      image_url: item.image_url || '',
      thumbnail_url: item.thumbnail_url || '',
      scene_data: item.scene_data ? JSON.stringify(item.scene_data) : '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar ambiente?')) return;
    try { await deleteEnvironment(id); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h2>Ambientes</h2>
      {error && <div className="admin-error">{error}</div>}
      {loading && <div>Cargando...</div>}
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input name="name" value={form.name} onChange={handleChange} required />
        <label>Tipo</label>
        <select name="type" value={form.type} onChange={handleChange}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Descripción</label>
        <input name="description" value={form.description} onChange={handleChange} />
        <label>Estado</label>
        <select name="status" value={form.status} onChange={handleChange}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label>Precio</label>
        <input name="price" type="number" value={form.price} onChange={handleChange} required />
        <label>Imagen URL</label>
        <input name="image_url" value={form.image_url} onChange={handleChange} />
        <label>Thumbnail URL</label>
        <input name="thumbnail_url" value={form.thumbnail_url} onChange={handleChange} />
        <label>Scene data (JSON)</label>
        <input name="scene_data" value={form.scene_data} onChange={handleChange} />
        <label><input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} /> Gratis</label>
        <label><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Activo</label>
        <button className="admin-btn" type="submit">{editing ? 'Guardar' : 'Crear'}</button>
        {editing && <button className="admin-btn secondary" type="button" onClick={() => { setEditing(null); setForm({ ...emptyForm }); }}>Cancelar</button>}
      </form>

      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Gratis</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.price}</td>
              <td>{item.is_free ? 'Sí' : 'No'}</td>
              <td>
                <button className="admin-btn secondary" onClick={() => startEdit(item)}>Editar</button>
                <button className="admin-btn" onClick={() => handleDelete(item.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
