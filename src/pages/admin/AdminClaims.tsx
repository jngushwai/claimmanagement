import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Claim } from '../../types';
import { FileText, Download, CheckCircle, XCircle, MessageSquare, Eye, FileCheck } from 'lucide-react';

export const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Review state
  const [viewingClaim, setViewingClaim] = useState<Claim | null>(null);
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
      setViewingClaim(null);
      setFeedback('');
      fetchClaims();
    } catch (err) {
      alert('Failed to update claim status');
    }
  };

  const handleDownloadExcel = async (m: number, y: number) => {
    try {
      const res = await api.get(`/claims/excel?month=${m}&year=${y}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DIT_Claim_${m}_${y}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download Excel form');
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
          <h1 className="text-2xl font-bold text-black">Institutional Claims Approval Queue</h1>
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
                <th className="p-3">Attendance PDF</th>
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
                      {c.documents?.length === 0 ? (
                        <span className="text-xs text-red-400">Missing PDF</span>
                      ) : (
                        c.documents?.map(d => (
                          <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            📄 {d.name}
                          </a>
                        ))
                      )}
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
                          setViewingClaim(c);
                          setFeedback(c.feedback || '');
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 inline-flex"
                      >
                        <Eye size={14} /> View Claim
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Claim Review & Inspection Modal */}
      {viewingClaim && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck size={20} className="text-emerald-400" /> In-App Claim Inspection ({viewingClaim.month}/{viewingClaim.year})
                </h3>
                <p className="text-xs text-slate-400">
                  Lecturer: {viewingClaim.lecturer?.firstName} {viewingClaim.lecturer?.lastName} &bull; {viewingClaim.lecturer?.department?.name}
                </p>
              </div>
              <button onClick={() => setViewingClaim(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Total Hours</p>
                <p className="font-bold text-white text-base">{viewingClaim.totalHours} hrs</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tuition Pay</p>
                <p className="font-bold text-white text-base">{viewingClaim.totalTuition.toLocaleString()} TZS</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Transport Pay</p>
                <p className="font-bold text-white text-base">{viewingClaim.totalTransport.toLocaleString()} TZS</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Gross Payout</p>
                <p className="font-bold text-emerald-400 text-base">{viewingClaim.totalGross.toLocaleString()} TZS</p>
              </div>
            </div>

            {/* Submitted Excel Download & Bank Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Banking Information</h4>
                <p className="text-xs text-slate-300"><span className="text-slate-400">Bank:</span> {viewingClaim.lecturer?.bankName || 'N/A'}</p>
                <p className="text-xs text-slate-300"><span className="text-slate-400">Account Name:</span> {viewingClaim.lecturer?.bankAccountName || 'N/A'}</p>
                <p className="text-xs text-slate-300"><span className="text-slate-400">Account Number:</span> {viewingClaim.lecturer?.accountNumber || 'N/A'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Submitted Excel Form</h4>
                <p className="text-xs text-slate-300">Review official DIT claim spreadsheet & annual breakdown summary.</p>
                <button
                  onClick={() => handleDownloadExcel(viewingClaim.month, viewingClaim.year)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Download size={14} /> Download Submitted Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Attached Student Attendance PDF */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Mandatory Student Attendance Sheets (PDF)</h4>
              {viewingClaim.documents?.length === 0 ? (
                <p className="text-xs text-red-400 font-semibold">No attendance sheet PDF uploaded by lecturer.</p>
              ) : (
                <div className="space-y-2">
                  {viewingClaim.documents?.map(d => (
                    <div key={d.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="text-xs text-blue-400 font-medium">📄 {d.name}</span>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold"
                      >
                        View PDF in Tab
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HOD Feedback & Decision Action */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">HOD Feedback / Correction Notes</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Provide feedback notes if returning for corrections or approving..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
              />

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleUpdateStatus(viewingClaim.id, 'REJECTED', feedback || 'Rejected for corrections.')}
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow"
                >
                  Reject & Return for Correction
                </button>
                <button
                  onClick={() => handleUpdateStatus(viewingClaim.id, 'APPROVED', feedback || 'Verified and approved by HOD.')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow"
                >
                  Approve Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
