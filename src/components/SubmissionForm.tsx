import React, { useState, useRef } from 'react';
import { COLLEGES, User, Collaborator } from '../types';
import { Upload, CheckCircle, Plus, X, Loader2, FileText } from 'lucide-react';
import { uploadResearchFile, validateFile } from '../supabase';

interface SubmissionFormProps {
  user: User;
  onSuccess: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: user.name,
    year: new Date().getFullYear(),
    college: COLLEGES[0].name,
    summary: '',
    cover_image_url: '',
    pdf_url: '',
    is_awardee_candidate: false,
    collaborators: [] as Collaborator[]
  });
  const [collabIdInput, setCollabIdInput] = useState('');
  const [collabLookupError, setCollabLookupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const addCollaborator = async () => {
    const id = collabIdInput.trim();
    if (!id) return;
    setCollabLookupError('');
    try {
      const res = await fetch(`/api/users/by-id-number?id=${encodeURIComponent(id)}`);
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!contentType.includes('application/json')) {
        throw new Error('Server error. Ensure the API is running and the route is configured.');
      }
      const student = JSON.parse(text);
      if (!res.ok) {
        throw new Error(student.error || 'Student not found');
      }
      if (formData.collaborators.some(c => c.user_id === student.id || c.id_number === (student.id_number ?? id))) {
        setCollabLookupError('Already added');
        return;
      }
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, { id_number: student.id_number ?? id, name: student.name, user_id: student.id }]
      });
      setCollabIdInput('');
    } catch (err) {
      setCollabLookupError(err instanceof Error ? err.message : 'Student not found');
    }
  };

  const removeCollaborator = (idNumber: string) => {
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter(c => c.id_number !== idNumber)
    });
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(null);
    const err = validateFile(file, 'cover');
    if (err) {
      setCoverError(err);
      return;
    }
    setCoverUploading(true);
    try {
      const url = await uploadResearchFile(file, 'cover');
      setFormData(f => ({ ...f, cover_image_url: url }));
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError(null);
    const err = validateFile(file, 'pdf');
    if (err) {
      setPdfError(err);
      return;
    }
    setPdfUploading(true);
    try {
      const url = await uploadResearchFile(file, 'pdf');
      setFormData(f => ({ ...f, pdf_url: url }));
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPdfUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, submitted_by: user.id, collaborators: formData.collaborators.length ? formData.collaborators : undefined }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-lsu-green-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-lsu-green-primary" />
        </div>
        <h3 className="text-2xl font-display font-bold text-theme-title mb-2">Submission Received</h3>
        <p className="text-theme-muted max-w-md">
          Your thesis has been submitted for librarian review. You will be notified once it has been approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            Thesis Title
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter the full title of your capstone project"
            className="w-full input-glass"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            Author Name
          </label>
          <input
            type="text"
            readOnly
            value={formData.author}
            className="w-full input-glass bg-gray-100 cursor-not-allowed"
            title="Author is set from your account"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            Collaborators / Co-researchers
          </label>
          <p className="text-xs text-theme-muted mb-2">Add by student ID number (must exist in system)</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={collabIdInput}
              onChange={e => { setCollabIdInput(e.target.value); setCollabLookupError(''); }}
              placeholder="Enter ID number"
              className="flex-1 input-glass"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
            />
            <button type="button" onClick={addCollaborator} className="btn-primary px-4 py-2 flex items-center gap-1">
              <Plus size={16} /> Add
            </button>
          </div>
          {collabLookupError && <p className="text-red-500 text-sm mb-2">{collabLookupError}</p>}
          {formData.collaborators.length > 0 && (
            <div className="space-y-2">
              {formData.collaborators.map(c => (
                <div key={c.id_number} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <span className="text-sm font-medium text-theme-title">{c.name} <span className="text-theme-muted">(ID: {c.id_number})</span></span>
                  <button type="button" onClick={() => removeCollaborator(c.id_number)} className="p-1 rounded text-red-500 hover:bg-red-500/20">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            Academic Year
          </label>
          <select
            value={formData.year}
            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full input-glass"
          >
            {[2026, 2025, 2024, 2023, 2022, 2021].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            College
          </label>
          <select
            value={formData.college}
            onChange={e => setFormData({ ...formData, college: e.target.value })}
            className="w-full input-glass"
          >
            {COLLEGES.map(c => (
              <option key={c.abbreviation} value={c.name}>{c.name} ({c.abbreviation})</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
            Summary / Abstract
          </label>
          <textarea
            required
            rows={6}
            value={formData.summary}
            onChange={e => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Provide a concise summary of your research findings..."
            className="w-full input-glass resize-none"
          />
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-dashed border-2 border-lsu-green-primary/20 flex flex-col items-center justify-center text-center min-h-[180px]">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handleCoverChange}
              disabled={coverUploading}
            />
            {formData.cover_image_url ? (
              <div className="w-full flex flex-col items-center">
                <img src={formData.cover_image_url} alt="Cover preview" className="max-h-24 rounded-lg object-cover border border-theme-muted/30" />
                <p className="text-xs text-theme-muted mt-2 truncate max-w-full">Cover image uploaded</p>
                <button type="button" onClick={() => setFormData(f => ({ ...f, cover_image_url: '' }))} className="text-red-500 text-xs mt-1 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                {coverUploading ? <Loader2 size={32} className="text-lsu-green-primary animate-spin mb-3" /> : <Upload size={32} className="text-lsu-green-primary/40 mb-3" />}
                <p className="text-sm font-medium text-theme-text mb-1">Cover Image</p>
                <p className="text-xs text-theme-muted mb-4">JPG, PNG up to 5MB</p>
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading} className="btn-secondary py-2 px-4 text-xs">Browse Files</button>
              </>
            )}
            {coverError && <p className="text-red-500 text-xs mt-2">{coverError}</p>}
          </div>
          <div className="glass-card p-6 border-dashed border-2 border-lsu-green-primary/20 flex flex-col items-center justify-center text-center min-h-[180px]">
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfChange}
              disabled={pdfUploading}
            />
            {formData.pdf_url ? (
              <div className="w-full flex flex-col items-center">
                <FileText size={40} className="text-lsu-green-primary mb-2" />
                <p className="text-xs text-theme-muted">PDF uploaded</p>
                <button type="button" onClick={() => setFormData(f => ({ ...f, pdf_url: '' }))} className="text-red-500 text-xs mt-1 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                {pdfUploading ? <Loader2 size={32} className="text-lsu-green-primary animate-spin mb-3" /> : <Upload size={32} className="text-lsu-green-primary/40 mb-3" />}
                <p className="text-sm font-medium text-theme-text mb-1">Full PDF Document</p>
                <p className="text-xs text-theme-muted mb-4">PDF only up to 20MB</p>
                <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={pdfUploading} className="btn-secondary py-2 px-4 text-xs">Browse Files</button>
              </>
            )}
            {pdfError && <p className="text-red-500 text-xs mt-2">{pdfError}</p>}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative inline-flex shrink-0">
              <input
                type="checkbox"
                checked={formData.is_awardee_candidate}
                onChange={e => setFormData({ ...formData, is_awardee_candidate: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-theme-muted/60 border border-theme-muted/50 peer-checked:bg-lsu-green-primary peer-checked:border-lsu-green-primary transition-colors" aria-hidden="true" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md border border-gray-200 transition-transform duration-200 peer-checked:translate-x-4 pointer-events-none" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-theme-text group-hover:text-theme-title transition-colors">
              Mark as candidate for Thesis of the Year
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading || coverUploading || pdfUploading}
          className="btn-primary px-12 py-4 text-lg"
        >
          {loading ? 'Submitting...' : 'Submit Thesis'}
        </button>
      </div>
    </form>
  );
};
