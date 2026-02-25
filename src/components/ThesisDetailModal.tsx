import React from 'react';
import { X, Calendar, BookOpen, User as UserIcon, Award, FileText, ExternalLink } from 'lucide-react';
import { Thesis, COLLEGES } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ThesisDetailModalProps {
  thesis: Thesis | null;
  onClose: () => void;
}

export const ThesisDetailModal: React.FC<ThesisDetailModalProps> = ({ thesis, onClose }) => {
  if (!thesis) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-lsu-green-deep/30 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] glass-panel overflow-hidden flex flex-col shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 dark:bg-black/20 hover:bg-white/20 rounded-full text-theme-title hover:text-lsu-green-primary transition-all shadow-sm backdrop-blur-md"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto flex-grow">
            <div className="relative h-72 md:h-96">
              <img
                src={thesis.cover_image_url || `https://picsum.photos/seed/${thesis.id}/1200/400`}
                alt={thesis.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lsu-green-deep/90 via-lsu-green-deep/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-10 w-full">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {thesis.awardee && (
                    <span className="flex items-center gap-2 bg-lsu-gold text-white px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em] shadow-2xl">
                      <Award size={14} fill="white" /> Thesis of the Year
                    </span>
                  )}
                  <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                    AY {thesis.year}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-medium text-white leading-[1.1] text-pretty max-w-4xl">
                  {thesis.title}
                </h1>
              </div>
            </div>

            <div className="p-10 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-12">
                <section>
                  <span className="section-label">Research Abstract</span>
                  <p className="text-theme-text/90 leading-relaxed text-xl font-light text-pretty">
                    {thesis.summary}
                  </p>
                </section>

                <section className="bg-lsu-green-deep/5 dark:bg-white/5 rounded-[2.5rem] p-10 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="section-label !mb-0">Document Preview</span>
                    <span className="text-[10px] font-mono uppercase text-theme-muted">Secure Institutional Access</span>
                  </div>
                  <div className="aspect-[16/10] bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center p-12 relative overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <div className="text-6xl font-serif font-bold rotate-[-30deg] whitespace-nowrap text-theme-title">
                        LSU OCTA • INSTITUTIONAL REPOSITORY • LSU OCTA • INSTITUTIONAL REPOSITORY
                      </div>
                    </div>
                    <div className="w-20 h-20 bg-lsu-green-deep/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <FileText size={40} className="text-lsu-green-primary" />
                    </div>
                    <h3 className="text-2xl font-serif font-medium text-theme-title mb-3">Full Manuscript Access</h3>
                    <p className="text-theme-muted mb-8 max-w-sm font-light">
                      The complete research manuscript is available for authenticated institutional members. 
                      Downloads are restricted to maintain intellectual property security.
                    </p>
                    <button className="btn-primary">
                      <ExternalLink size={18} />
                      <span>Open Secure Reader</span>
                    </button>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-10">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <span className="section-label">Researcher</span>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-lsu-green-deep text-white flex items-center justify-center font-serif text-2xl">
                        {thesis.author[0]}
                      </div>
                      <div>
                        <p className="font-serif text-2xl text-theme-title">{thesis.author}</p>
                        <p className="text-xs font-mono uppercase tracking-widest text-theme-muted">Lead Author</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <span className="section-label">Classification</span>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-lsu-green-primary shadow-sm">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">Department</p>
                          <p className="font-medium text-theme-title leading-tight">
                            {COLLEGES.find(c => 
                              thesis.college === c.name || 
                              thesis.college.includes(`(${c.abbreviation})`)
                            )?.abbreviation || thesis.college}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-lsu-green-primary shadow-sm">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">Publication Year</p>
                          <p className="font-medium text-theme-title">{thesis.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <span className="section-label">Academic Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {["Research", "Innovation", "LSU", "Capstone"].map(tag => (
                        <span key={tag} className="text-[11px] font-mono uppercase tracking-wider bg-white/10 dark:bg-white/5 px-3 py-1.5 rounded-lg text-theme-title border border-white/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
