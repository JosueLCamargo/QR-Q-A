// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Submit from "./pages/Submit";
import Auth from "./pages/Auth";
import AdminView from "./pages/AdminView";
import FeedView from "./pages/FeedView";   // 👈 ahora se importa de su archivo propio
import Users from "./pages/Users";          // ✅

import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/submit" replace />} />
      <Route path="/submit" element={<Submit />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminView />} />
      <Route path="/feed" element={<FeedView />} />
      <Route path="/users" element={<Users />} /> {/* ⬅️ NUEVO */}
      <Route path="*" element={<Navigate to="/submit" replace />} />
    </Routes>
  );
}
