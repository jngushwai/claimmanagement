import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Lecturer, Department } from '../../types';
import { User as UserIcon, Lock, DollarSign, Building } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [degreeRate, setDegreeRate] = useState(25000);
  const [odRate, setOdRate] = useState(20000);
  const [transportRate, setTransportRate] = useState(15000);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/lecturer/profile');
      const l = res.data.lecturer;
      setLecturer(l);
      setDepartments(res.data.departments);

      if (l) {
        setFirstName(l.firstName || '');
        setLastName(l.lastName || '');
        setPhone(l.phone || '');
        setDepartmentId(l.departmentId || '');
        setProgrammeId(l.programmeId || '');
        setBankName(l.bankName || '');
        setBankAccountName(l.bankAccountName || '');
        setAccountNumber(l.accountNumber || '');
        setDegreeRate(l.degreeRate || 25000);
        setOdRate(l.odRate || 20000);
        setTransportRate(l.transportRate || 15000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/lecturer/profile', {
        firstName,
        lastName,
        phone,
        departmentId,
        programmeId,
        bankName,
        bankAccountName,
        accountNumber,
        degreeRate,
        odRate,
        transportRate,
      });
      setLecturer(res.data.lecturer);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPassMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassMsg(err.response?.data?.error || 'Failed to update password');
    }
  };

  const selectedDept = departments.find(d => d.id === departmentId);
  const availableProgrammes = selectedDept?.programmes || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-black">Lecturer Profile & Settings</h1>
        <p className="text-sm text-slate-400">Manage personal details, banking information, hourly rates, and account security</p>
      </div>

      {/* Profile & Rates Form */}
      <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-6">
        <h3 className="font-bold text-white flex items-center gap-2"><UserIcon size={18} className="text-blue-400" /> Personal & Departmental Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={e => {
                setDepartmentId(e.target.value);
                setProgrammeId('');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Programme</label>
            <select
              value={programmeId}
              onChange={e => setProgrammeId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select Programme</option>
              {availableProgrammes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="font-bold text-white flex items-center gap-2 pt-4 border-t border-slate-800"><DollarSign size={18} className="text-emerald-400" /> Banking & Rates Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="e.g. CRDB Bank"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account Holder Name</label>
            <input
              type="text"
              value={bankAccountName}
              onChange={e => setBankAccountName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Degree Hourly Rate (TZS)</label>
            <input
              type="number"
              value={degreeRate}
              onChange={e => setDegreeRate(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">OD Hourly Rate (TZS)</label>
            <input
              type="number"
              value={odRate}
              onChange={e => setOdRate(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Transport Rate per Session (TZS)</label>
            <input
              type="number"
              value={transportRate}
              onChange={e => setTransportRate(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow">
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Lock size={18} className="text-amber-400" /> Account Security & Password</h3>
        {passMsg && (
          <p className={`text-xs ${passMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{passMsg}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition border border-slate-700">
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};
