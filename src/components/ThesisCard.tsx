import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { Thesis, COLLEGES } from '../types';
import { motion } from 'motion/react';

interface ThesisCardProps {
  thesis: Thesis;
  onClick: () => void;
}

export const ThesisCard: React.FC<ThesisCardProps> = ({ thesis, onClick }) => {
  const collegeData = COLLEGES.find(c => 
    thesis.college === c.name || 
    thesis.college.includes(`(${c.abbreviation})`) ||
    thesis.college === `${c.name} (${c.abbreviation})`
  );
  const abbreviation = collegeData?.abbreviation || thesis.college;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="glass-card group cursor-pointer overflow-hidden flex flex-col h-full relative"
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#146c43_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      <div className="relative h-56 overflow-hidden">
        <img
          src={thesis.cover_image_url || `https://picsum.photos/seed/${thesis.id}/800/600`}
          alt={thesis.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lsu-green-deep/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {thesis.awardee && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-lsu-gold text-white p-2 rounded-full shadow-xl z-10"
            >
              <Star size={14} fill="white" />
            </motion.div>
          )}
          <div className="bg-white/20 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider z-10">
            {thesis.year}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
          <div className="w-10 h-10 bg-white text-lsu-green-deep rounded-full flex items-center justify-center shadow-2xl">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow space-y-4 relative z-10">
        <div className="space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-lsu-green-primary font-bold">
            {abbreviation}
          </p>
          <h3 className="text-xl font-serif font-medium text-theme-title leading-tight line-clamp-2 group-hover:text-lsu-green-primary transition-colors duration-300">
            {thesis.title}
          </h3>
        </div>
        
        <p className="text-sm text-theme-muted line-clamp-3 mb-4 flex-grow leading-relaxed font-light">
          {thesis.summary}
        </p>
        
        <div className="pt-4 mt-auto border-t border-lsu-green-deep/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-lsu-green-deep/5 flex items-center justify-center text-theme-title text-[10px] font-serif border border-lsu-green-deep/10">
              {thesis.author[0]}
            </div>
            <p className="text-xs text-theme-muted font-light tracking-wide truncate max-w-[120px]">
              {thesis.author}
            </p>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-theme-muted/60">
            Ref. #{thesis.id.toString().padStart(4, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
