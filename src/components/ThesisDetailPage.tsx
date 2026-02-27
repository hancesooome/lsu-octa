import React from 'react';
import { ChevronLeft, Calendar, BookOpen, Award, ExternalLink } from 'lucide-react';
import { Thesis, COLLEGES } from '../types';

interface ThesisDetailPageProps {
  thesis: Thesis;
  onBack: () => void;
}

const SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

export const ThesisDetailPage: React.FC<ThesisDetailPageProps> = ({ thesis, onBack }) => {
  const pdfUrl = thesis.pdf_url || SAMPLE_PDF;
  return (
    <div className="space-y-0">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-theme-muted hover:text-lsu-green-primary transition-colors mb-6"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="overflow-hidden rounded-3xl">
        <div className="relative h-72 md:h-96">
          <img
            src={thesis.cover_image_url || `https://picsum.photos/seed/${thesis.id}/1200/400`}
            alt={thesis.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lsu-green-deep/90 via-lsu-green-deep/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
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

        <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16 bg-white/5 backdrop-blur-sm border border-white/10 border-t-0 rounded-b-3xl">
          <div className="lg:col-span-8 space-y-12">
            <section>
              <span className="section-label">Research Abstract</span>
              <p className="text-theme-text/90 leading-relaxed text-xl font-light text-pretty">
                {thesis.summary}
              </p>
            </section>

            <section className="bg-lsu-green-deep/5 rounded-[2.5rem] p-10 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <span className="section-label !mb-0">Document Preview</span>
                <span className="text-[10px] font-mono uppercase text-theme-muted">
                  {thesis.pdf_url ? 'Secure Institutional Access' : 'Sample document for testing'}
                </span>
              </div>
              <div className="rounded-2xl border border-white/20 overflow-hidden bg-white shadow-sm">
                <iframe
                  src={`${pdfUrl}#view=FitH`}
                  title="Document preview"
                  className="w-full aspect-[4/3] min-h-[400px] border-0"
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-theme-muted">
                  {thesis.pdf_url
                    ? 'The complete manuscript is available for authenticated members.'
                    : 'Showing sample PDF. Upload a document when submitting to preview your thesis.'}
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  <span>Open in new tab</span>
                </a>
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
                    <span key={tag} className="text-[11px] font-mono uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-lg text-theme-title border border-white/10">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
