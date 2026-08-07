import React from 'react';
import './AdminLayout.css';

export default function AdminFooter() {
  return (
    <footer className="admin-footer">
      <p>RetroPlayer Admin &copy; {new Date().getFullYear()}</p>
    </footer>
  );
}
