import React, { useEffect, useState } from 'react';
import { getProducts, createOrder } from '../services/shopService';
import { getOrders } from '../services/shopService';
import '../styles/Pages.css';

function ProductCard({ product, onBuy }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.image_url && !imgError;
  return (
    <div className="card product-card" key={product.id}>
      {hasImage ? (
        <img src={product.image_url} alt={product.name} onError={() => setImgError(true)} />
      ) : (
        <div className="cover-placeholder product-placeholder">
          <span>{product.name[0]}</span>
          <p>{product.type}</p>
        </div>
      )}
      <h3>{product.name}</h3>
      <span className="product-type">{product.type}</span>
      <p className="product-desc">{product.description}</p>
      <p className="product-price">${product.price} {product.currency}</p>
      <button className="btn" onClick={() => onBuy(product.id)}>Comprar</button>
    </div>
  );
}

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
          <ProductCard product={product} onBuy={handleBuy} key={product.id} />
        ))}
      </div>

      <h3>Mis órdenes</h3>
      {orders.length === 0 ? <p className="empty">Sin órdenes</p> : (
        <ul className="orders-list">
          {orders.map((o) => (
            <li key={o.id}>{o.product_name} - ${o.total_amount} {o.currency} ({o.status})</li>
          ))}
        </ul>
      )}
    </div>
  );
}
