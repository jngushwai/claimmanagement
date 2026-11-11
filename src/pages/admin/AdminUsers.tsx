import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Department } from '../../types';
import { Users, Plus, Trash2, Edit2, ShieldAlert, Key, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / form state
  const [showModal, setShowModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'lecturer' | 'super_admin'>('lecturer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [degreeRate, setDegreeRate] = useState(25000);
  const [odRate, setOdRate] = useState(20000);
  const [transportRate, setTransportRate] = useState(15000);

  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
      setDepartments(res.data.departments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditUserId(null);
    setEmail('');
    setPassword('');
    setRole('lecturer');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDepartmentId('');
    setProgrammeId('');
    setDegreeRate(25000);
    setOdRate(20000);
    setTransportRate(15000);
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditUserId(u.id);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setFirstName(u.lecturer?.firstName || '');
    setLastName(u.lecturer?.lastName || '');
    setPhone(u.lecturer?.phone || '');
    setDepartmentId(u.lecturer?.departmentId || '');
    setProgrammeId(u.lecturer?.programmeId || '');
    setDegreeRate(u.lecturer?.degreeRate || 25000);
    setOdRate(u.lecturer?.odRate || 20000);
    setTransportRate(u.lecturer?.transportRate || 15000);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        email,
        password: password || undefined,
        role,
        firstName,
        lastName,
        phone,
        departmentId,
        programmeId,
        degreeRate,
        odRate,
        transportRate,
      };

      if (editUserId) {
        await api.put(`/admin/users/${editUserId}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handleToggleActive = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('You cannot disable your own active admin account.');
      return;
    }
    try {
      await api.put(`/admin/users/${u.id}`, { isActive: !u.isActive });
      fetchData();
    } catch (err) {
      alert('Failed to update account status');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${u.email}?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const selectedDept = departments.find(d => d.id === departmentId);
  const availableProgrammes = selectedDept?.programmes || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User & Lecturer Management</h1>
          <p className="text-sm text-slate-400">Create accounts, assign roles, configure hourly rates, and enable/disable access</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
        >
          <Plus size={16} /> <span>Create New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Name / Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Degree Rate</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="p-3">
                    <span className="font-semibold text-white">
                      {u.lecturer ? `${u.lecturer.firstName} ${u.lecturer.lastName}` : 'No Profile'}
                    </span>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      u.role === 'super_admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-blue-950 text-blue-300'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">{u.lecturer?.department?.name || 'N/A'}</td>
                  <td className="p-3">{u.lecturer?.degreeRate?.toLocaleString()} TZS/hr</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1 ${
                        u.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                      }`}
                    >
                      {u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEditModal(u)} className="text-blue-400 hover:text-blue-300 p-1">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(u)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">
              {editUserId ? 'Edit User & Lecturer Profile' : 'Create New User Account'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Password {editUserId && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  required={!editUserId}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="lecturer">Lecturer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Degree Rate (TZS)</label>
                  <input
                    type="number"
                    value={degreeRate}
                    onChange={e => setDegreeRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">OD Rate (TZS)</label>
                  <input
                    type="number"
                    value={odRate}
                    onChange={e => setOdRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Transport (TZS)</label>
                  <input
                    type="number"
                    value={transportRate}
                    onChange={e => setTransportRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {editUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
