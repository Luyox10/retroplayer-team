import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <div>Cargando...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
