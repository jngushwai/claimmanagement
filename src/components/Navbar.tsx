import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#003366] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-lg w-10 h-10 flex items-center justify-center shadow">
            <img src="/assets/aistudio/new_DIT_d71fb25e.png" alt="DIT Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Dar es Salaam Institute of Technology</h1>
            <p className="text-xs text-blue-200">Campus Hub & Part-Time Lecturer Claims</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold">
                {user.lecturer ? `${user.lecturer.firstName} ${user.lecturer.lastName}` : user.email}
              </span>
              <span className="text-xs text-blue-200 capitalize flex items-center justify-end gap-1">
                {user.role === 'super_admin' && <ShieldAlert size={12} className="text-amber-300" />}
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm transition font-medium"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
