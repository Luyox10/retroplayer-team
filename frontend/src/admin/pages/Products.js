import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/adminProductsService';

const TYPES = ['environment', 'object', 'subscription', 'bundle'];

const emptyForm = { name: '', type: 'environment', description: '', price: '', currency: 'USD', stock: '', image_url: '', metadata: '', is_active: true };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = () => getProducts().then((r) => setProducts(r?.products || [])).catch((err) => setError(err.message));

  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: form.stock === '' ? null : Number(form.stock),
      metadata: form.metadata ? JSON.parse(form.metadata) : null,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await updateProduct(editing, payload);
      } else {
        await createProduct(payload);
      }
      setForm({ ...emptyForm });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      type: p.type,
      description: p.description || '',
      price: String(p.price),
      currency: p.currency,
      stock: p.stock === null ? '' : String(p.stock),
      image_url: p.image_url || '',
      metadata: p.metadata ? JSON.stringify(p.metadata) : '',
      is_active: p.is_active,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Productos</h2>
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
        <label>Precio</label>
        <input name="price" type="number" value={form.price} onChange={handleChange} required />
        <label>Moneda</label>
        <input name="currency" value={form.currency} onChange={handleChange} />
        <label>Stock</label>
        <input name="stock" type="number" value={form.stock} onChange={handleChange} />
        <label>Imagen URL</label>
        <input name="image_url" value={form.image_url} onChange={handleChange} />
        <label>Metadata (JSON)</label>
        <input name="metadata" value={form.metadata} onChange={handleChange} />
        <label><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Activo</label>
        <button className="admin-btn" type="submit">{editing ? 'Guardar' : 'Crear'}</button>
        {editing && <button className="admin-btn secondary" type="button" onClick={() => { setEditing(null); setForm({ ...emptyForm }); }}>Cancelar</button>}
      </form>

      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Stock</th><th>Activo</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>{p.price} {p.currency}</td>
              <td>{p.stock}</td>
              <td>{p.is_active ? 'Sí' : 'No'}</td>
              <td>
                <button className="admin-btn secondary" onClick={() => startEdit(p)}>Editar</button>
                <button className="admin-btn" onClick={() => handleDelete(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
