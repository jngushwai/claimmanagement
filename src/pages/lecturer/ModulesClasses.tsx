import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import { Module, ClassItem } from '../../types';

export const ModulesClasses: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Module form state
  const [modCode, setModCode] = useState('');
  const [modName, setModName] = useState('');

  // Class form state
  const [className, setClassName] = useState('');
  const [classType, setClassType] = useState<'DEGREE' | 'OD'>('DEGREE');

  const fetchData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        api.get('/lecturer/modules'),
        api.get('/lecturer/classes'),
      ]);
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

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lecturer/modules', { code: modCode, name: modName });
      setModCode('');
      setModName('');
      fetchData();
    } catch (err) {
      alert('Failed to add module');
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      await api.delete(`/lecturer/modules/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete module');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lecturer/classes', { name: className, type: classType });
      setClassName('');
      fetchData();
    } catch (err) {
      alert('Failed to add class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.delete(`/lecturer/classes/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete class');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Modules & Classes Management</h1>
        <p className="text-sm text-slate-400">Configure your teaching modules and student class groups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modules Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-blue-400" /> Teaching Modules
          </h3>

          <form onSubmit={handleAddModule} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Add New Module</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Code (e.g. TSE 07201)"
                required
                value={modCode}
                onChange={e => setModCode(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <input
                type="text"
                placeholder="Module Name"
                required
                value={modName}
                onChange={e => setModName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition">
              Add Module
            </button>
          </form>

          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {modules.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">No modules found.</p>
            ) : (
              modules.map(m => (
                <div key={m.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white">{m.code}</span>
                    <p className="text-xs text-slate-400">{m.name}</p>
                  </div>
                  <button onClick={() => handleDeleteModule(m.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Classes Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-400" /> Student Classes
          </h3>

          <form onSubmit={handleAddClass} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Add New Class</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Class Name (e.g. BTIT III)"
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <select
                value={classType}
                onChange={e => setClassType(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="DEGREE">Degree</option>
                <option value="OD">Ordinary Diploma (OD)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition">
              Add Class
            </button>
          </form>

          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {classes.length === 0 ? (
              <p className="text-center text-slate-500 py-4 text-sm">No classes found.</p>
            ) : (
              classes.map(c => (
                <div key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${c.type === 'DEGREE' ? 'bg-blue-950 text-blue-300' : 'bg-amber-950 text-amber-300'}`}>
                      {c.type}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteClass(c.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
