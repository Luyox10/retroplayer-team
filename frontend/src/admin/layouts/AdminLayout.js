import React from 'react';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import AdminFooter from '../components/AdminFooter';
import '../components/AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-app">
      <AdminHeader />
      <AdminSidebar />
      <main className="admin-main">{children}</main>
      <AdminFooter />
    </div>
  );
}
