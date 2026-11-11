import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TeachingSession, Module, ClassItem } from '../../types';
import { Clock, Plus, Trash2, Filter, Calendar } from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // New session state
  const [moduleId, setModuleId] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:00');
  const [hours, setHours] = useState(3);

  const fetchData = async () => {
    try {
      const [sRes, mRes, cRes] = await Promise.all([
        api.get(`/sessions?month=${filterMonth}&year=${filterYear}`),
        api.get('/lecturer/modules'),
        api.get('/lecturer/classes'),
      ]);
      setSessions(sRes.data.sessions);
      setModules(mRes.data.modules);
      setClasses(cRes.data.classes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  // Automatically compute hours when start/end time changes
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh + em / 60) - (sh + sm / 60);
      if (diff > 0) setHours(parseFloat(diff.toFixed(1)));
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sessions', { moduleId, classId, date, hours });
      fetchData();
    } catch (err) {
      alert('Failed to log session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete session');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Teaching Sessions & Manual Logging</h1>
          <p className="text-sm text-slate-400">Log consultancy sessions with calendar date picker and starting time</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
          />
        </div>
      </div>

      {/* Log Session Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Plus size={18} className="text-blue-400" /> Manually Add Teaching Session</h3>
        <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Module</label>
            <select
              required
              value={moduleId}
              onChange={e => setModuleId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select Module</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Class</label>
            <select
              required
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Date Picker</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={e => handleTimeChange(e.target.value, endTime)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Time (Hours: {hours})</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={e => handleTimeChange(startTime, e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition">
              Log Session
            </button>
          </div>
        </form>
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-white">Recorded Sessions for {filterMonth}/{filterYear}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Module</th>
                <th className="p-3">Class Type</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Hourly Rate</th>
                <th className="p-3">Tuition</th>
                <th className="p-3">Transport</th>
                <th className="p-3">Gross</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">No sessions logged for this month.</td>
                </tr>
              ) : (
                sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/50">
                    <td className="p-3">{s.date}</td>
                    <td className="p-3 font-medium text-white">{s.module?.code}</td>
                    <td className="p-3">{s.class?.name} ({s.class?.type})</td>
                    <td className="p-3">{s.hours} hrs</td>
                    <td className="p-3">{s.hourlyRate.toLocaleString()} TZS</td>
                    <td className="p-3">{s.tuition.toLocaleString()} TZS</td>
                    <td className="p-3">{s.transport.toLocaleString()} TZS</td>
                    <td className="p-3 font-bold text-emerald-400">{s.gross.toLocaleString()} TZS</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        s.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                        s.status === 'REJECTED' ? 'bg-red-950 text-red-300' :
                        'bg-amber-950 text-amber-300'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDeleteSession(s.id)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 size={16} />
                      </button>
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
