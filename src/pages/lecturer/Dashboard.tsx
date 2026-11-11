import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Clock, DollarSign, FileText, Calendar, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export const LecturerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lecturer/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;
  }

  const stats = data?.currentMonthStats || { totalHours: 0, totalTuition: 0, totalTransport: 0, grossPay: 0, sessionCount: 0 };
  const recentSessions = data?.recentSessions || [];
  const earnings = data?.monthlyEarnings || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Lecturer Workspace</h1>
          <p className="text-sm text-slate-400">Current month teaching consultation summary & earnings</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/sessions"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
          >
            Log Session
          </Link>
          <Link
            to="/claims"
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            View Claims
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Total Teaching Hours</span>
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg"><Clock size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-slate-500 mt-1">{stats.sessionCount} recorded sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Tuition Pay (TZS)</span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg"><DollarSign size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalTuition.toLocaleString()} TZS</p>
          <p className="text-xs text-emerald-500 mt-1">Based on hourly rates</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Transport Pay (TZS)</span>
            <div className="p-2 bg-amber-950 text-amber-400 rounded-lg"><DollarSign size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalTransport.toLocaleString()} TZS</p>
          <p className="text-xs text-amber-500 mt-1">Transport allowances</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Gross Earnings (TZS)</span>
            <div className="p-2 bg-purple-950 text-purple-400 rounded-lg"><FileText size={20} /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.grossPay.toLocaleString()} TZS</p>
          <p className="text-xs text-purple-400 mt-1">Tuition + Transport</p>
        </div>
      </div>

      {/* Earnings Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold text-white mb-4">12-Month Earnings Trend (TZS)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="monthName" stroke="#64748b" textAnchor="end" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} TZS`, 'Earnings']}
              />
              <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white">Recent Teaching Sessions</h3>
          <Link to="/sessions" className="text-xs text-blue-400 hover:text-blue-300">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Module</th>
                <th className="p-3">Class</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Gross (TZS)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No sessions recorded yet this month.</td>
                </tr>
              ) : (
                recentSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-800/50">
                    <td className="p-3">{s.date}</td>
                    <td className="p-3 font-medium text-white">{s.module?.code} - {s.module?.name}</td>
                    <td className="p-3">{s.class?.name} ({s.class?.type})</td>
                    <td className="p-3">{s.hours} hrs</td>
                    <td className="p-3 font-semibold text-emerald-400">{s.gross.toLocaleString()} TZS</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        s.status === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
