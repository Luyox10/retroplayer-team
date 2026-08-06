import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import UserApp from './user/App';
import AdminApp from './admin/App';

const target = process.env.REACT_APP_TARGET || 'user';
const App = target === 'admin' ? AdminApp : UserApp;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
