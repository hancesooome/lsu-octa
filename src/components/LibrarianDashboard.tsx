import React, { useState, useEffect } from 'react';
import { Thesis, COLLEGES } from '../types';
import { Check, X, Eye, Award, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface LibrarianDashboardProps {
  onViewThesis?: (thesis: Thesis) => void;
}

export const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({ onViewThesis }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTheses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/theses?status=${activeTab}`);
      const data = await response.json();
      setTheses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheses();
  }, [activeTab]);

  const handleAction = async (id: number, status: string) => {
    try {
      await fetch(`/api/theses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approval_date: new Date().toISOString() }),
      });
      fetchTheses();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAward = async (id: number, current: boolean) => {
    try {
      await fetch(`/api/theses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awardee: !current }),
      });
      fetchTheses();
    } catch (err) {
      console.error(err);
    }
  };

  const setFeatured = async (id: number) => {
    try {
      await fetch(`/api/theses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: true }),
      });
      fetchTheses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-theme-title">Librarian Control Panel</h2>
        <div className="flex p-1 bg-lsu-green-primary/5 rounded-xl">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white text-lsu-green-primary shadow-sm' 
                  : 'text-theme-muted hover:text-lsu-green-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-lsu-green-primary/20 border-t-lsu-green-primary rounded-full animate-spin"></div>
        </div>
      ) : theses.length === 0 ? (
        <div className="glass-panel py-20 text-center">
          <p className="text-theme-muted text-lg">No {activeTab} submissions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {theses.map(thesis => (
            <motion.div
              layout
              key={thesis.id}
              className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={thesis.cover_image_url || `https://picsum.photos/seed/${thesis.id}/400/300`}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lsu-green-primary bg-lsu-green-primary/10 px-2 py-0.5 rounded">
                    {thesis.year}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                    {COLLEGES.find(c => 
                      thesis.college === c.name || 
                      thesis.college.includes(`(${c.abbreviation})`)
                    )?.abbreviation || thesis.college}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg truncate mb-1 text-theme-title">{thesis.title}</h3>
                <p className="text-sm text-theme-muted">By {thesis.author}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {activeTab === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(thesis.id, 'approved')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(thesis.id, 'rejected')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                    >
                      <X size={16} /> Reject
                    </button>
                  </>
                )}
                {activeTab === 'approved' && (
                  <>
                    <button
                      onClick={() => toggleAward(thesis.id, thesis.awardee)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        thesis.awardee ? 'bg-lsu-gold text-white' : 'bg-white/10 text-lsu-gold border border-lsu-gold/20'
                      }`}
                    >
                      <Award size={16} fill={thesis.awardee ? "white" : "none"} />
                      {thesis.awardee ? 'Awarded' : 'Award'}
                    </button>
                    <button
                      onClick={() => setFeatured(thesis.id)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        thesis.featured ? 'bg-lsu-green-primary text-white' : 'bg-white/10 text-lsu-green-primary border border-lsu-green-primary/20'
                      }`}
                    >
                      <Star size={16} fill={thesis.featured ? "white" : "none"} />
                      {thesis.featured ? 'Featured' : 'Feature'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => onViewThesis?.(thesis)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 text-theme-title px-4 py-2 rounded-xl text-sm font-bold border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <Eye size={16} /> View
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
