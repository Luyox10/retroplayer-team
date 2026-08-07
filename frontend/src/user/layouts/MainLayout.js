import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../components/Layout.css';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Header />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
