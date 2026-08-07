import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RequireAdmin from './RequireAdmin';
import AdminLogin from '../pages/AdminLogin';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Products from '../pages/Products';
import Environments from '../pages/Environments';
import RoomObjects from '../pages/RoomObjects';
import Reports from '../pages/Reports';
import Stats from '../pages/Stats';

export default function AppRouter() {
  return (
    <HashRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
          <Route path="/products" element={<RequireAdmin><Products /></RequireAdmin>} />
          <Route path="/environments" element={<RequireAdmin><Environments /></RequireAdmin>} />
          <Route path="/room-objects" element={<RequireAdmin><RoomObjects /></RequireAdmin>} />
          <Route path="/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
          <Route path="/stats" element={<RequireAdmin><Stats /></RequireAdmin>} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    </HashRouter>
  );
}
