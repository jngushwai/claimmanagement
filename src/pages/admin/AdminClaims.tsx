import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Claim } from '../../types';
import { FileText, Download, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

export const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback modal
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  const fetchClaims = async () => {
    try {
      const res = await api.get('/admin/claims');
      setClaims(res.data.claims);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED', feedbackNote: string) => {
    try {
      await api.put(`/admin/claims/${id}/status`, { status, feedback: feedbackNote });
      setSelectedClaimId(null);
      setFeedback('');
      fetchClaims();
    } catch (err) {
      alert('Failed to update claim status');
    }
  };

  const handleDownloadSummary = async () => {
    try {
      const res = await api.get('/admin/claims/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DIT_Institutional_Claims_Summary.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download institutional summary');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Institutional Claims Approval Queue</h1>
          <p className="text-sm text-slate-400">Review lecturer claims, inspect attendance sheets, and provide feedback notes</p>
        </div>
        <button
          onClick={handleDownloadSummary}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
        >
          <Download size={16} /> <span>Export Institutional Summary (.xlsx)</span>
        </button>
      </div>

      {/* Claims Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Lecturer</th>
                <th className="p-3">Department</th>
                <th className="p-3">Period</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Gross Pay</th>
                <th className="p-3">Documents</th>
                <th className="p-3">Status & Feedback</th>
                <th className="p-3 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">No claims submitted.</td>
                </tr>
              ) : (
                claims.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-semibold text-white">
                      {c.lecturer ? `${c.lecturer.firstName} ${c.lecturer.lastName}` : 'Unknown'}
                    </td>
                    <td className="p-3">{c.lecturer?.department?.name || 'N/A'}</td>
                    <td className="p-3">{c.month}/{c.year}</td>
                    <td className="p-3">{c.totalHours} hrs</td>
                    <td className="p-3 font-bold text-emerald-400">{c.totalGross.toLocaleString()} TZS</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {c.documents?.length === 0 && <span className="text-xs text-slate-500">No docs attached</span>}
                        {c.documents?.map(d => (
                          <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline">
                            📎 {d.name}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                        c.status === 'REJECTED' ? 'bg-red-950 text-red-300' :
                        'bg-amber-950 text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                      {c.feedback && <p className="text-xs text-slate-400 mt-1 italic">Note: {c.feedback}</p>}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClaimId(c.id);
                          setActionType('APPROVED');
                          setFeedback(c.feedback || 'Verified and approved.');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClaimId(c.id);
                          setActionType('REJECTED');
                          setFeedback(c.feedback || 'Rejected. Please review session hours/attendance.');
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedClaimId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {actionType === 'APPROVED' ? 'Approve Claim' : 'Reject Claim'} & Feedback
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Feedback Notes for Lecturer</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedClaimId(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedClaimId, actionType, feedback)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                  actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
