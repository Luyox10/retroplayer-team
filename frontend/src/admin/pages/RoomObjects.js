import React, { useEffect, useState } from 'react';
import { getRoomObjects, createRoomObject, updateRoomObject, deleteRoomObject } from '../services/adminRoomObjectsService';

const TYPES = ['television', 'turntable', 'lamp', 'visualizer', 'speaker', 'furniture', 'decoration'];
const STATUSES = ['draft', 'published', 'hidden'];

const emptyForm = { name: '', type: 'television', description: '', status: 'published', price: '0', is_free: true, is_active: true, model_url: '', image_url: '', config: '' };

export default function RoomObjects() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = () => getRoomObjects().then((r) => setItems(r?.objects || [])).catch((err) => setError(err.message));
  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), config: form.config ? JSON.parse(form.config) : null };
    try {
      if (editing) await updateRoomObject(editing, payload);
      else await createRoomObject(payload);
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
      model_url: item.model_url || '',
      image_url: item.image_url || '',
      config: item.config ? JSON.stringify(item.config) : '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar objeto?')) return;
    try { await deleteRoomObject(id); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h2>Objetos</h2>
      {error && <div className="admin-error">{error}</div>}
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
        <label>Model URL</label>
        <input name="model_url" value={form.model_url} onChange={handleChange} />
        <label>Imagen URL</label>
        <input name="image_url" value={form.image_url} onChange={handleChange} />
        <label>Config (JSON)</label>
        <input name="config" value={form.config} onChange={handleChange} />
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
