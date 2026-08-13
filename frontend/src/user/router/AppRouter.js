import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import RequireAuth from './RequireAuth';
import Home from '../pages/Home';
import Explore from '../pages/Explore';
import ArtistPage from '../pages/ArtistPage';
import Library from '../pages/Library';
import Store from '../pages/Store';
import Profile from '../pages/Profile';
import Room from '../pages/Room';
import Login from '../pages/Login';
import Register from '../pages/Register';

export default function AppRouter() {
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
          <Route path="/store" element={<RequireAuth><Store /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/room" element={<RequireAuth><Room /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}
