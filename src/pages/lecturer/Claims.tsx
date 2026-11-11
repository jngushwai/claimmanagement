import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Claim } from '../../types';
import { FileText, Download, Upload, CheckCircle, AlertCircle, Mail } from 'lucide-react';

export const ClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate claim state
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [previewClaim, setPreviewClaim] = useState<any>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [claimLetter, setClaimLetter] = useState('');

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClaimId, setUploadClaimId] = useState('');

  const fetchClaims = async () => {
    try {
      const res = await api.get('/claims');
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

  const handleGenerateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/claims/generate', { month: genMonth, year: genYear });
      setPreviewClaim(res.data.claim);
      setSessionCount(res.data.sessionCount);
      setClaimLetter(res.data.letterText);
      fetchClaims();
    } catch (err) {
      alert('Failed to generate claim');
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

  const handleUploadDoc = async (e: React.FormEvent, claimId: string) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Student attendance sheet upload is mandatory!');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('claimId', claimId);
    formData.append('category', 'ATTENDANCE_SHEET');

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Mandatory student attendance sheet uploaded successfully!');
      setUploadFile(null);
      setUploadClaimId('');
      fetchClaims();
    } catch (err) {
      alert('Failed to upload attendance document');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Monthly Claims, Cover Letters & Attendance Uploads</h1>
        <p className="text-sm text-slate-400">Generate monthly claims matching DIT standard formats, official payment letters, and mandatory attendance sheets</p>
      </div>

      {/* Generate Claim Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Generate Monthly Claim & Payment Letter</h3>
        <form onSubmit={handleGenerateClaim} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Month</label>
            <select
              value={genMonth}
              onChange={e => setGenMonth(parseInt(e.target.value))}
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
              value={genYear}
              onChange={e => setGenYear(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition">
            Generate Claim & Letter
          </button>
        </form>

        {previewClaim && (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Claim Preview ({previewClaim.month}/{previewClaim.year})</span>
                <span className="text-xs px-2 py-1 bg-amber-950 text-amber-300 rounded font-semibold">{previewClaim.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Total Sessions</p>
                  <p className="font-bold text-white">{sessionCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Hours</p>
                  <p className="font-bold text-white">{previewClaim.totalHours} hrs</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tuition Pay</p>
                  <p className="font-bold text-white">{previewClaim.totalTuition.toLocaleString()} TZS</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Gross Pay</p>
                  <p className="font-bold text-emerald-400">{previewClaim.totalGross.toLocaleString()} TZS</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleDownloadExcel(previewClaim.month, previewClaim.year)}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  <Download size={16} /> <span>Download Official DIT Excel Form & Annual Summary</span>
                </button>
              </div>
            </div>

            {/* Corresponding Monthly Claim Letter */}
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm"><Mail size={16} className="text-amber-400" /> Corresponding Monthly Payment Request Letter</h4>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
                {claimLetter}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Submitted Claims List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-white">Your Submitted Claims History & Mandatory Attendance Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">Period</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Tuition</th>
                <th className="p-3">Transport</th>
                <th className="p-3">Gross Pay</th>
                <th className="p-3">HOD Status & Comments</th>
                <th className="p-3">Mandatory Attendance Sheet</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">No claims generated yet.</td>
                </tr>
              ) : (
                claims.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{c.month}/{c.year}</td>
                    <td className="p-3">{c.totalHours} hrs</td>
                    <td className="p-3">{c.totalTuition.toLocaleString()} TZS</td>
                    <td className="p-3">{c.totalTransport.toLocaleString()} TZS</td>
                    <td className="p-3 font-semibold text-emerald-400">{c.totalGross.toLocaleString()} TZS</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                        c.status === 'REJECTED' ? 'bg-red-950 text-red-300' :
                        'bg-amber-950 text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                      {c.feedback && <p className="text-xs text-slate-400 mt-1 italic">HOD Feedback: {c.feedback}</p>}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {c.documents?.length === 0 && (
                          <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> Attendance Sheet Mandatory
                          </span>
                        )}
                        {c.documents?.map(d => (
                          <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline">
                            ✅ {d.name}
                          </a>
                        ))}
                        {uploadClaimId === c.id ? (
                          <form onSubmit={e => handleUploadDoc(e, c.id)} className="mt-2 space-y-2">
                            <input
                              type="file"
                              required
                              onChange={e => setUploadFile(e.target.files?.[0] || null)}
                              className="text-xs text-slate-400"
                            />
                            <div className="flex space-x-2">
                              <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Upload Attendance</button>
                              <button type="button" onClick={() => setUploadClaimId('')} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <button onClick={() => setUploadClaimId(c.id)} className="text-xs bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 px-2.5 py-1 rounded mt-1">
                            + Upload Attendance
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadExcel(c.month, c.year)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto"
                      >
                        <Download size={14} /> <span>Excel Form</span>
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
