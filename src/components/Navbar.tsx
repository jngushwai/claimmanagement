import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#003366] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white text-[#003366] p-2 rounded-lg font-black text-xl tracking-wider">
            DIT
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
