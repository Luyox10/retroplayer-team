import React from 'react';
import './Layout.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p>RetroPlayer &copy; {new Date().getFullYear()}</p>
    </footer>
  );
}
