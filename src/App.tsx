/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { AuthPage } from './pages/Auth';
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import { ModulesClasses } from './pages/lecturer/ModulesClasses';
import { TimetablePage } from './pages/lecturer/Timetable';
import { SessionsPage } from './pages/lecturer/Sessions';
import { ClaimsPage } from './pages/lecturer/Claims';
import { ProfilePage } from './pages/lecturer/Profile';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminClaims } from './pages/admin/AdminClaims';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#E3F3F7] text-slate-800 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          {/* Lecturer Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout><LecturerDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/modules" element={<ProtectedRoute><AppLayout><ModulesClasses /></AppLayout></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute><AppLayout><TimetablePage /></AppLayout></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><AppLayout><SessionsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><AppLayout><ClaimsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

          {/* Super Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AppLayout><AdminUsers /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/claims" element={<ProtectedRoute requireAdmin><AppLayout><AdminClaims /></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
