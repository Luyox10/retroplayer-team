import React, { useEffect, useState } from 'react';
import { getProducts, createOrder } from '../services/shopService';
import { getOrders } from '../services/shopService';
import '../styles/Pages.css';

export default function Store() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProducts(), getOrders()])
      .then(([p, o]) => {
        setProducts(p?.products || []);
        setOrders(o?.orders || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (productId) => {
    try {
      await createOrder(productId);
      setMessage('Orden creada. Pendiente de pago.');
      const o = await getOrders();
      setOrders(o?.orders || []);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h2>Tienda</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="loading">{message}</div>}
      {loading && <div className="loading">Cargando...</div>}
      <div className="grid">
        {products.map((product) => (
          <div className="card" key={product.id}>
            <img src={product.image_url || '/logo192.png'} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price} {product.currency}</p>
            <button className="btn" onClick={() => handleBuy(product.id)}>Comprar</button>
          </div>
        ))}
      </div>

      <h3>Mis órdenes</h3>
      {orders.length === 0 ? <p className="empty">Sin órdenes</p> : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>{o.product_name} - ${o.total_amount} {o.currency} ({o.status})</li>
          ))}
        </ul>
      )}
    </div>
  );
}
