import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, BookOpen, FileText, DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading admin overview...</div>;
  }

  const stats = data?.stats || { userCount: 0, lecturerCount: 0, sessionCount: 0, claimCount: 0, totalHours: 0, totalTuition: 0, totalTransport: 0, totalGross: 0 };
  const recentClaims = data?.recentClaims || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-amber-400" /> Super Admin Control Panel
          </h1>
          <p className="text-sm text-slate-400">Dar es Salaam Institute of Technology institutional claims & lecturer monitoring</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/claims"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
          >
            Review Claims
          </Link>
          <Link
            to="/admin/users"
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Institutional KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total System Users</span>
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.userCount}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.lecturerCount} registered lecturers</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total Teaching Hours</span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg"><BookOpen size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-emerald-500 mt-1">{stats.sessionCount} total sessions logged</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total Tuition Pay</span>
            <div className="p-2 bg-purple-950 text-purple-400 rounded-lg"><DollarSign size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalTuition.toLocaleString()} TZS</p>
          <p className="text-xs text-purple-400 mt-1">Institutional tuition expenditure</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total Gross Payout</span>
            <div className="p-2 bg-amber-950 text-amber-400 rounded-lg"><FileText size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalGross.toLocaleString()} TZS</p>
          <p className="text-xs text-amber-500 mt-1">Tuition + Transport allowances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Claims Approval Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Recent Claims Queue</h3>
            <Link to="/admin/claims" className="text-xs text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          <div className="divide-y divide-slate-800">
            {recentClaims.length === 0 ? (
              <p className="p-6 text-center text-slate-500 text-sm">No claims submitted yet.</p>
            ) : (
              recentClaims.map((c: any) => (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50">
                  <div>
                    <span className="font-semibold text-white">
                      {c.lecturer?.firstName} {c.lecturer?.lastName}
                    </span>
                    <p className="text-xs text-slate-400">Period: {c.month}/{c.year} &bull; {c.totalGross.toLocaleString()} TZS</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    c.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                    c.status === 'REJECTED' ? 'bg-red-950 text-red-300' :
                    'bg-amber-950 text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Recently Registered Users</h3>
            <Link to="/admin/users" className="text-xs text-blue-400 hover:text-blue-300">Manage All</Link>
          </div>
          <div className="divide-y divide-slate-800">
            {recentUsers.length === 0 ? (
              <p className="p-6 text-center text-slate-500 text-sm">No users registered.</p>
            ) : (
              recentUsers.map((u: any) => (
                <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50">
                  <div>
                    <span className="font-semibold text-white">
                      {u.lecturer ? `${u.lecturer.firstName} ${u.lecturer.lastName}` : u.email}
                    </span>
                    <p className="text-xs text-slate-400">{u.email} &bull; <span className="capitalize">{u.role.replace('_', ' ')}</span></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
