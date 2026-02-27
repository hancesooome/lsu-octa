import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentFormData {
  name: string;
  email: string;
  password: string;
  id_number: string;
}

const emptyForm: StudentFormData = { name: '', email: '', password: '', id_number: '' };

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', id_number: u.id_number || '' });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editing) {
        const body: Record<string, string> = { name: form.name, email: form.email, id_number: form.id_number };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update');
      } else {
        if (!form.password.trim()) throw new Error('Password is required for new accounts');
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create');
      }
      closeModal();
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete student "${u.name}" (${u.email})?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-display font-bold text-theme-title">Student Accounts</h3>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Student
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-lsu-green-primary/20 border-t-lsu-green-primary rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-theme-muted">No student accounts yet.</p>
          <button onClick={openAdd} className="btn-primary mt-4">
            Add first student
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((u) => (
            <motion.div
              key={u.id}
              layout
              className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-grow min-w-0">
                <p className="font-bold text-theme-title truncate">{u.name}</p>
                <p className="text-sm text-theme-muted truncate">{u.email}</p>
                {u.id_number && <p className="text-xs text-theme-muted truncate">ID: {u.id_number}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="p-2 rounded-xl bg-white/10 text-lsu-green-primary hover:bg-white/20 transition-colors"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="p-2 rounded-xl bg-white/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-lsu-green-deep/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl"
            >
              <h4 className="text-xl font-display font-bold text-theme-title mb-6">
                {editing ? 'Edit Student' : 'Add Student'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full input-glass"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">ID Number</label>
                  <input
                    type="text"
                    value={form.id_number}
                    onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                    placeholder="Student ID (for collaborator lookup)"
                    className="w-full input-glass"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full input-glass"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 ml-1">
                    Password {editing && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    required={!editing}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? '••••••••' : ''}
                    className="w-full input-glass"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-300 text-theme-title font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                    {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
