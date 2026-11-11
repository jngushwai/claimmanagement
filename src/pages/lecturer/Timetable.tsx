import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Calendar, Download, Upload, Play, Trash2, Plus } from 'lucide-react';
import { TimetableEntry, Module, ClassItem } from '../../types';

export const TimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New entry form
  const [moduleId, setModuleId] = useState('');
  const [classId, setClassId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');

  // Populate form
  const [popMonth, setPopMonth] = useState(new Date().getMonth() + 1);
  const [popYear, setPopYear] = useState(new Date().getFullYear());
  const [popLoading, setPopLoading] = useState(false);

  // File import
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const [tRes, mRes, cRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/lecturer/modules'),
        api.get('/lecturer/classes'),
      ]);
      setTimetable(tRes.data.timetable);
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
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetable', { moduleId, classId, dayOfWeek, startTime, endTime, room });
      setRoom('');
      fetchData();
    } catch (err) {
      alert('Failed to add timetable entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this timetable entry?')) return;
    try {
      api.delete(`/timetable/${id}`).then(() => fetchData());
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/timetable/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'timetable_template.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download template');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/timetable/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Successfully imported ${res.data.importedCount} timetable entries!`);
      setFile(null);
      fetchData();
    } catch (err) {
      alert('Failed to import timetable');
    }
  };

  const handlePopulateSessions = async () => {
    setPopLoading(true);
    try {
      const res = await api.post('/timetable/populate', { month: popMonth, year: popYear });
      alert(`Successfully generated ${res.data.generatedCount} teaching sessions for ${popMonth}/${popYear}!`);
    } catch (err) {
      alert('Failed to populate sessions');
    } finally {
      setPopLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Timetable Planner</h1>
          <p className="text-sm text-slate-400">Manage your recurring teaching schedule & 1-click session generator</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition"
          >
            <Download size={16} /> <span>Excel Template</span>
          </button>
        </div>
      </div>

      {/* Import & Populate Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Excel Import Box */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Upload size={18} className="text-blue-400" /> Import Timetable from Excel</h3>
          <form onSubmit={handleImport} className="space-y-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-950 file:text-blue-300 hover:file:bg-blue-900"
            />
            <button
              type="submit"
              disabled={!file}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
            >
              Upload & Import Timetable
            </button>
          </form>
        </div>

        {/* 1-Click Monthly Session Generator */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Play size={18} className="text-emerald-400" /> 1-Click Monthly Session Generator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month</label>
              <select
                value={popMonth}
                onChange={e => setPopMonth(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Year</label>
              <input
                type="number"
                value={popYear}
                onChange={e => setPopYear(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
          <button
            onClick={handlePopulateSessions}
            disabled={popLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            <Play size={16} /> {popLoading ? 'Generating...' : 'Populate Teaching Sessions for Month'}
          </button>
        </div>
      </div>

      {/* Add Timetable Entry Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Plus size={18} className="text-blue-400" /> Add Timetable Slot</h3>
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
            <label className="block text-xs text-slate-400 mb-1">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={e => setDayOfWeek(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {days.map((d, i) => (
                <option key={i + 1} value={i + 1}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition">
              Add Slot
            </button>
          </div>
        </form>
      </div>

      {/* Timetable List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-white">Active Timetable Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Day</th>
                <th className="p-3">Time</th>
                <th className="p-3">Module</th>
                <th className="p-3">Class</th>
                <th className="p-3">Room</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {timetable.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No timetable entries configured.</td>
                </tr>
              ) : (
                timetable.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-white">{days[t.dayOfWeek - 1]}</td>
                    <td className="p-3">{t.startTime} - {t.endTime}</td>
                    <td className="p-3 font-medium text-blue-400">{t.module?.code} - {t.module?.name}</td>
                    <td className="p-3">{t.class?.name} ({t.class?.type})</td>
                    <td className="p-3">{t.room || 'N/A'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDeleteEntry(t.id)} className="text-red-400 hover:text-red-300 p-1">
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
