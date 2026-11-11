import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, Calendar, Clock, FileText, User, Shield, Users } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const lecturerLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Modules & Classes', path: '/modules', icon: BookOpen },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Teaching Sessions', path: '/sessions', icon: Clock },
    { name: 'Claims & Docs', path: '/claims', icon: FileText },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Users & Lecturers', path: '/admin/users', icon: Users },
    { name: 'Institutional Claims', path: '/admin/claims', icon: FileText },
  ];

  const links = user?.role === 'super_admin' && location.pathname.startsWith('/admin') ? adminLinks : lecturerLinks;

  return (
    <aside className="w-64 bg-[#227A9C] text-white flex flex-col min-h-[calc(100vh-4rem)] border-r border-[#1a617c] shadow-lg">
      <div className="p-4">
        {user?.role === 'super_admin' && (
          <div className="mb-4 bg-[#1a617c]/80 p-2 rounded-lg border border-[#144f65] flex items-center justify-between">
            <span className="text-xs text-cyan-100 font-semibold">Admin Mode</span>
            <Link
              to={location.pathname.startsWith('/admin') ? '/' : '/admin'}
              className="text-xs bg-white text-[#227A9C] hover:bg-cyan-50 px-2 py-1 rounded font-semibold transition"
            >
              {location.pathname.startsWith('/admin') ? 'Lecturer View' : 'Admin Panel'}
            </Link>
          </div>
        )}

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-[#003366] text-white shadow'
                    : 'hover:bg-[#1a617c] text-cyan-50'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-[#1a617c] text-xs text-cyan-100/70 text-center">
        DIT Campus Hub v2.6 &copy; 2026
      </div>
    </aside>
  );
};
