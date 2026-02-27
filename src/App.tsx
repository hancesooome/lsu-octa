/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Award, LogIn, LogOut, User as UserIcon, Plus, LayoutDashboard, Home, ChevronRight, BookOpen, Star, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Thesis, COLLEGES } from './types';
import { GlassPanel, GlassCard } from './components/GlassUI';
import { ThesisCard } from './components/ThesisCard';
import { LoginModal } from './components/LoginModal';
import { ThesisDetailModal } from './components/ThesisDetailModal';
import { SubmissionForm } from './components/SubmissionForm';
import { LibrarianDashboard } from './components/LibrarianDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [featuredThesis, setFeaturedThesis] = useState<Thesis | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [view, setView] = useState<'home' | 'dashboard' | 'submit' | 'about' | 'colleges'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    college: '',
    year: '',
    awardee: false
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [collegeStats, setCollegeStats] = useState<{[key: string]: number}>({});

  const fetchCollegeStats = async () => {
    try {
      const response = await fetch('/api/college-stats');
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        setCollegeStats({});
        return;
      }
      const statsMap = data.reduce((acc: any, curr: any) => {
        acc[curr.college] = curr.count;
        return acc;
      }, {});
      setCollegeStats(statsMap);
    } catch (err) {
      console.error(err);
      setCollegeStats({});
    }
  };

  useEffect(() => {
    fetchCollegeStats();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchTheses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'approved');
      if (filters.college) params.append('college', filters.college);
      if (filters.year) params.append('year', filters.year);
      if (filters.awardee) params.append('awardee', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/theses?${params.toString()}`);
      const rawData = await response.json();
      if (!response.ok || !Array.isArray(rawData)) {
        setTheses([]);
        return;
      }
      const data = rawData.map((t: any) => ({
        ...t,
        awardee: !!t.awardee,
        featured: !!t.featured,
      }));
      setTheses(data);
    } catch (err) {
      console.error(err);
      setTheses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await fetch('/api/theses/featured');
      const raw = await response.json();
      if (!response.ok || !raw || typeof raw !== 'object') {
        setFeaturedThesis(null);
        return;
      }
      setFeaturedThesis({
        ...raw,
        awardee: !!raw.awardee,
        featured: !!raw.featured,
      });
    } catch (err) {
      console.error(err);
      setFeaturedThesis(null);
    }
  };

  useEffect(() => {
    fetchTheses();
    fetchFeatured();
  }, [filters, searchQuery]);

  const handleThesisClick = (thesis: Thesis) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setSelectedThesis(thesis);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 px-4 py-4 md:px-8">
        <GlassPanel className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setView('home')}
          >
            <div>
              <h1 className="font-display font-bold text-xl leading-none text-theme-title">LSU OCTA</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Archive Platform</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView('home')}
              className={`text-sm font-semibold transition-colors ${view === 'home' ? 'text-lsu-green-primary' : 'text-theme-muted hover:text-lsu-green-primary'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setView('colleges')}
              className={`text-sm font-semibold transition-colors ${view === 'colleges' ? 'text-lsu-green-primary' : 'text-theme-muted hover:text-lsu-green-primary'}`}
            >
              Colleges
            </button>
            <button 
              onClick={() => setView('about')}
              className={`text-sm font-semibold transition-colors ${view === 'about' ? 'text-lsu-green-primary' : 'text-theme-muted hover:text-lsu-green-primary'}`}
            >
              About
            </button>
            {user && (
              <button 
                onClick={() => setView('dashboard')}
                className={`text-sm font-semibold transition-colors ${view === 'dashboard' ? 'text-lsu-green-primary' : 'text-theme-muted hover:text-lsu-green-primary'}`}
              >
                Dashboard
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-theme-muted hover:text-lsu-green-primary transition-colors bg-lsu-green-deep/5 rounded-xl"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-lsu-charcoal leading-none">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase text-theme-muted capitalize">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-theme-muted hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </GlassPanel>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <section className="relative py-20 md:py-28 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-lsu-green-primary/10 to-transparent"></div>
                  <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-lsu-green-primary/10 to-transparent"></div>
                  <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-lsu-green-primary/10 to-transparent"></div>
                  
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1],
                      x: [0, 50, 0],
                      y: [0, -30, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 left-10 w-96 h-96 bg-lsu-green-primary/10 rounded-full blur-[100px]"
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.05, 0.15, 0.05],
                      x: [0, -40, 0],
                      y: [0, 60, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-lsu-gold/10 rounded-full blur-[120px]"
                  />
                </div>

                <div className="relative text-center space-y-12">
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lsu-green-deep/5 border border-lsu-green-deep/10">
                      <span className="w-2 h-2 rounded-full bg-lsu-green-primary animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-theme-title">Institutional Repository</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-light text-theme-title tracking-tighter leading-[0.95] text-balance">
                      Academic <br />
                      <span className="italic font-normal text-lsu-green-primary">Excellence.</span>
                    </h2>
                    <p className="text-theme-muted max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed text-pretty">
                      The definitive digital archive for La Salle University's research legacy. 
                      Where innovation meets preservation.
                    </p>
                  </div>

                  <div id="search-section" className="max-w-3xl mx-auto space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 p-2 glass-panel bg-white/60 dark:bg-black/40 shadow-2xl border-white/80 dark:border-white/10">
                      <div className="flex-grow relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-muted dark:text-theme-muted/80" size={20} />
                        <input 
                          type="text"
                          placeholder="Search by title, author, or keyword..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-14 pr-6 py-4 bg-transparent outline-none text-lg font-light placeholder:text-theme-muted/40 dark:placeholder:text-white/40 dark:text-white"
                        />
                      </div>
                      <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-medium transition-all duration-300 ${
                          isFilterOpen ? 'bg-lsu-green-deep text-white shadow-lg' : 'bg-white/60 dark:bg-white/10 text-lsu-green-deep dark:text-white hover:bg-white dark:hover:bg-white/20'
                        }`}
                      >
                        <Filter size={20} />
                        <span>Refine</span>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-3xl mx-auto"
                      >
                        <GlassPanel className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 text-left">
                          <div>
                            <label className="section-label !mb-2">College</label>
                            <select 
                              value={filters.college}
                              onChange={(e) => setFilters({...filters, college: e.target.value})}
                              className="w-full input-glass py-2.5 text-sm bg-white/30"
                            >
                              <option value="">All Colleges</option>
                              {COLLEGES.map(c => <option key={c.abbreviation} value={c.name}>{c.abbreviation}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="section-label !mb-2">Academic Year</label>
                            <select 
                              value={filters.year}
                              onChange={(e) => setFilters({...filters, year: e.target.value})}
                              className="w-full input-glass py-2.5 text-sm bg-white/30"
                            >
                              <option value="">All Years</option>
                              {[2026, 2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button 
                              onClick={() => setFilters({...filters, awardee: !filters.awardee})}
                              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                filters.awardee ? 'bg-lsu-gold text-white shadow-lg' : 'bg-white/50 text-lsu-gold border border-lsu-gold/20 hover:bg-white'
                              }`}
                            >
                              <Award size={18} /> 
                              <span>Awardees Only</span>
                            </button>
                          </div>
                        </GlassPanel>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Stats Section */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: 'Total Archives', value: '2,450+', icon: BookOpen },
                  { label: 'Active Researchers', value: '1,200+', icon: UserIcon },
                  { label: 'Awarded Theses', value: '85', icon: Award },
                  { label: 'Colleges', value: '7', icon: Home },
                ].map((stat, i) => (
                  <GlassCard key={i} className="p-8 text-center space-y-3 group">
                    <div className="w-12 h-12 bg-lsu-green-deep/5 rounded-2xl flex items-center justify-center text-lsu-green-primary mx-auto group-hover:scale-110 transition-transform duration-500">
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-theme-title">{stat.value}</p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">{stat.label}</p>
                    </div>
                  </GlassCard>
                ))}
              </section>

              {/* Featured Section - Compact Cinematic Version */}
              {featuredThesis && !searchQuery && !filters.college && !filters.year && !filters.awardee && (
                <section className="space-y-8">
                  <div className="flex items-end justify-between border-b border-lsu-green-deep/10 dark:border-white/10 pb-4">
                    <div className="space-y-1">
                      <span className="section-label !mb-0">Academic Spotlight</span>
                      <h3 className="text-2xl font-serif font-medium text-lsu-green-deep dark:text-lsu-green-primary">Thesis of the Year</h3>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-theme-muted">Selection Cycle</p>
                      <p className="font-serif italic text-lsu-green-primary dark:text-lsu-gold">AY {featuredThesis.year}</p>
                    </div>
                  </div>
                  
                  <div 
                    className="relative group cursor-pointer overflow-hidden rounded-[2rem] bg-lsu-green-deep shadow-xl"
                    onClick={() => handleThesisClick(featuredThesis)}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[450px]">
                      {/* Content Side */}
                      <div className="p-8 md:p-12 flex flex-col justify-center space-y-6 relative z-10 bg-lsu-green-deep text-white">
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none overflow-hidden">
                          <div className="text-[12rem] font-serif font-bold absolute -top-8 -left-8 leading-none">
                            {featuredThesis.year.toString().slice(-2)}
                          </div>
                        </div>
                        
                        <div className="space-y-4 relative">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
                            <Award size={12} className="text-lsu-gold" fill="currentColor" />
                            <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em]">Distinguished Research</span>
                          </div>
                          <h2 className="text-3xl md:text-5xl font-serif font-medium leading-[1.1] text-pretty">
                            {featuredThesis.title}
                          </h2>
                          <p className="text-white/70 text-base font-light leading-relaxed line-clamp-3 text-pretty max-w-lg">
                            {featuredThesis.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-white/20 p-1">
                              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center font-serif text-lg">
                                {featuredThesis.author[0]}
                              </div>
                            </div>
                            <div>
                              <p className="text-[8px] font-mono uppercase tracking-widest text-white/40">Lead Researcher</p>
                              <p className="text-lg font-serif">{featuredThesis.author}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button className="group/btn flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-lsu-gold">
                            <span>View Full Manuscript</span>
                            <div className="w-8 h-8 rounded-full border border-lsu-gold/30 flex items-center justify-center group-hover/btn:bg-lsu-gold group-hover/btn:text-lsu-green-deep transition-all duration-500">
                              <ChevronRight size={16} />
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Image Side */}
                      <div className="relative h-full min-h-[300px] lg:min-h-0 overflow-hidden">
                        <img 
                          src={featuredThesis.cover_image_url || "https://picsum.photos/seed/featured/1200/800"} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-lsu-green-deep lg:block hidden"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-lsu-green-deep via-transparent to-transparent lg:hidden block"></div>
                        
                        {/* Floating Metadata Badge */}
                        <div className="absolute top-8 right-8">
                          <div className="glass-panel !bg-white/10 !backdrop-blur-2xl !border-white/20 p-4 space-y-3 shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-700">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-lsu-gold"></div>
                              <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white">Verified Archive</span>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-white/60 font-mono uppercase">Reference ID</p>
                              <p className="text-base font-serif text-white">#{featuredThesis.id.toString().padStart(4, '0')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Grid Section */}
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-bold text-theme-title">
                    {searchQuery || filters.college || filters.year || filters.awardee ? 'Search Results' : 'Recent Submissions'}
                  </h3>
                  <p className="text-sm font-medium text-theme-muted">
                    Showing {theses.length} results
                  </p>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="glass-card h-96 animate-pulse bg-white/20"></div>
                    ))}
                  </div>
                ) : theses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {theses.map(thesis => (
                      <ThesisCard 
                        key={thesis.id} 
                        thesis={thesis} 
                        onClick={() => handleThesisClick(thesis)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel py-20 text-center">
                    <p className="text-theme-muted text-lg">No theses found matching your criteria.</p>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {view === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {user.role === 'librarian' ? (
                <LibrarianDashboard />
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-bold text-theme-title">Student Dashboard</h2>
                    <button 
                      onClick={() => setView('submit')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={20} /> Submit New Thesis
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <GlassCard className="p-6 md:col-span-2">
                      <h3 className="text-xl font-display font-bold text-theme-title mb-6">My Submissions</h3>
                      <MySubmissionsList userId={user.id} onSelect={setSelectedThesis} />
                    </GlassCard>
                    
                    <div className="space-y-8">
                      <GlassCard className="p-6">
                        <h3 className="text-lg font-display font-bold text-theme-title mb-4">Submission Status</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/10 dark:bg-white/5 rounded-xl">
                            <span className="text-sm font-medium text-theme-text">Approved</span>
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">2</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/10 dark:bg-white/5 rounded-xl">
                            <span className="text-sm font-medium text-theme-text">Pending</span>
                            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">1</span>
                          </div>
                        </div>
                      </GlassCard>

                      <GlassCard className="p-6 bg-lsu-green-primary text-white">
                        <h3 className="text-lg font-display font-bold mb-2">Need Help?</h3>
                        <p className="text-sm text-white/80 mb-4">
                          Check our submission guidelines or contact the library for assistance.
                        </p>
                        <button className="w-full py-2 bg-white text-lsu-green-primary rounded-xl text-sm font-bold">
                          View Guidelines
                        </button>
                      </GlassCard>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'submit' && user && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-colors text-theme-title"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
                <h2 className="text-3xl font-display font-bold text-theme-title">Submit Your Thesis</h2>
              </div>
              
              <GlassPanel className="p-8 md:p-12">
                <SubmissionForm user={user} onSuccess={() => setView('dashboard')} />
              </GlassPanel>
            </motion.div>
          )}

          {view === 'colleges' && (
            <motion.div
              key="colleges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <CollegesView onSelectCollege={(name) => {
                setFilters({ ...filters, college: name });
                setView('home');
                setTimeout(() => {
                  document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }} />
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-24 py-16"
            >
              <div className="text-center space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lsu-green-primary/5 rounded-full blur-3xl -z-10"></div>
                <span className="section-label">Institutional Legacy</span>
                <h2 className="text-5xl md:text-8xl font-serif font-light text-theme-title leading-tight tracking-tighter">
                  Preserving <br />
                  <span className="italic font-normal text-lsu-green-primary">Innovation.</span>
                </h2>
                <p className="text-theme-muted text-xl font-light max-w-2xl mx-auto leading-relaxed text-pretty">
                  LSU OCTA is more than a repository; it is a living testament to the academic rigor and creative spirit of La Salle University.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'Preservation', desc: 'Safeguarding intellectual capital for future generations of scholars.', icon: Award },
                  { title: 'Accessibility', desc: 'Bridging the gap between complex research and global visibility.', icon: BookOpen },
                  { title: 'Excellence', desc: 'Celebrating the highest achievements in undergraduate and graduate study.', icon: Star },
                ].map((item, i) => (
                  <GlassCard key={i} className="p-10 space-y-6 group">
                    <div className="w-14 h-14 bg-lsu-green-deep/5 rounded-2xl flex items-center justify-center text-lsu-green-primary group-hover:bg-lsu-green-primary group-hover:text-white transition-all duration-500">
                      <item.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-serif font-medium text-theme-title">{item.title}</h3>
                    <p className="text-theme-muted font-light leading-relaxed">
                      {item.desc}
                    </p>
                  </GlassCard>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-8">
                  <span className="section-label">The Repository</span>
                  <h3 className="text-4xl font-serif font-medium text-theme-title">A Modern Standard for Academic Archiving</h3>
                  <div className="space-y-6">
                    <p className="text-theme-muted font-light leading-relaxed text-lg">
                      LSU OCTA utilizes state-of-the-art digital preservation techniques to ensure that every thesis and capstone project remains accessible, searchable, and secure.
                    </p>
                    <ul className="space-y-4">
                      {[
                        'Encrypted Document Storage',
                        'Advanced Metadata Indexing',
                        'Institutional Access Control',
                        'Global Research Visibility'
                      ].map(point => (
                        <li key={point} className="flex items-center gap-3 text-theme-title font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-lsu-gold"></div>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="relative aspect-square glass-panel p-4 rotate-3">
                    <img 
                      src="https://picsum.photos/seed/library/800/800" 
                      alt="LSU Library" 
                      className="w-full h-full object-cover rounded-[1rem]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-6 -left-6 glass-panel p-6 -rotate-6 shadow-2xl">
                      <p className="text-2xl font-serif text-theme-title">Est. 2024</p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-theme-muted">Digital Era</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-16 text-center space-y-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
                  <div className="text-[20rem] font-serif font-bold">LSU</div>
                </div>
                <h3 className="text-4xl font-serif font-medium text-theme-title relative z-10">Institutional Partners</h3>
                <div className="flex flex-wrap justify-center gap-16 opacity-40 grayscale relative z-10">
                  <div className="text-sm font-mono uppercase tracking-[0.3em]">LSU Research Council</div>
                  <div className="text-sm font-mono uppercase tracking-[0.3em]">University Library</div>
                  <div className="text-sm font-mono uppercase tracking-[0.3em]">Academic Affairs</div>
                  <div className="text-sm font-mono uppercase tracking-[0.3em]">Graduate School</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4">
        <GlassPanel className="flex items-center justify-around py-3 px-6 shadow-2xl">
          <button 
            onClick={() => setView('home')}
            className={`p-2 rounded-xl transition-all ${view === 'home' ? 'bg-lsu-green-primary text-white' : 'text-theme-muted'}`}
          >
            <Home size={24} />
          </button>
          <button 
            onClick={() => setView('colleges')}
            className={`p-2 rounded-xl transition-all ${view === 'colleges' ? 'bg-lsu-green-primary text-white' : 'text-theme-muted'}`}
          >
            <BookOpen size={24} />
          </button>
          <button 
            onClick={() => {
              if (!user) setIsLoginModalOpen(true);
              else setView('dashboard');
            }}
            className={`p-2 rounded-xl transition-all ${view === 'dashboard' ? 'bg-lsu-green-primary text-white' : 'text-theme-muted'}`}
          >
            <LayoutDashboard size={24} />
          </button>
          <button 
            onClick={() => {
              if (!user) setIsLoginModalOpen(true);
              else setView('submit');
            }}
            className={`p-2 rounded-xl transition-all ${view === 'submit' ? 'bg-lsu-green-primary text-white' : 'text-theme-muted'}`}
          >
            <Plus size={24} />
          </button>
        </GlassPanel>
      </div>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={setUser} 
      />
      
      <ThesisDetailModal 
        thesis={selectedThesis} 
        onClose={() => setSelectedThesis(null)} 
      />
    </div>
  );
}

function CollegesView({ onSelectCollege }: { onSelectCollege: (name: string) => void }) {
  const [stats, setStats] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetch('/api/college-stats')
      .then(res => res.json())
      .then(data => {
        const map = data.reduce((acc: any, curr: any) => {
          acc[curr.college] = curr.count;
          return acc;
        }, {});
        setStats(map);
      });
  }, []);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-serif font-medium text-theme-title">Academic Colleges</h2>
        <p className="text-theme-muted max-w-2xl mx-auto">
          Explore research contributions across our diverse academic departments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {COLLEGES.map((college) => (
          <motion.div
            key={college.abbreviation}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="glass-card group cursor-pointer overflow-hidden flex h-44 md:h-48"
            onClick={() => onSelectCollege(college.name)}
          >
            <div className="w-1/3 bg-lsu-green-deep/5 dark:bg-white/5 flex items-center justify-center p-6 relative overflow-hidden border-r border-white/10">
               <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                  <div className="absolute -top-8 -left-8 text-[10rem] font-serif font-bold text-lsu-green-primary leading-none">{college.abbreviation[0]}</div>
               </div>
               <img 
                  src={college.logo} 
                  alt={college.abbreviation} 
                  className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
            </div>
            <div className="w-2/3 p-6 flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award size={48} className="text-lsu-green-primary" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                   <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-lsu-green-primary font-bold">{college.abbreviation}</span>
                   <div className="flex items-center gap-1.5 text-theme-muted bg-white/10 dark:bg-white/5 px-2 py-1 rounded-md">
                      <BookOpen size={12} className="text-lsu-green-primary" />
                      <span className="text-[10px] font-mono font-bold">{stats[college.name] || 0}</span>
                   </div>
                </div>
                <h3 className="text-lg md:text-xl font-serif font-medium text-theme-title leading-tight group-hover:text-lsu-green-primary transition-colors line-clamp-2">
                  {college.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-lsu-green-primary font-bold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                 <span>Browse Collection</span>
                 <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MySubmissionsList({ userId, onSelect }: { userId: number, onSelect: (t: Thesis) => void }) {
  const [submissions, setSubmissions] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const response = await fetch(`/api/my-submissions/${userId}`);
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMySubmissions();
  }, [userId]);

  if (loading) return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-20 bg-white/10 dark:bg-white/5 animate-pulse rounded-xl"></div>)}</div>;

  if (submissions.length === 0) return <p className="text-center py-10 text-theme-muted">You haven't submitted any theses yet.</p>;

  return (
    <div className="space-y-4">
      {submissions.map(t => (
        <div 
          key={t.id} 
          className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer border border-white/20"
          onClick={() => onSelect(t)}
        >
          <div className="min-w-0 flex-grow mr-4">
            <h4 className="font-bold truncate text-theme-title">{t.title}</h4>
            <p className="text-xs text-theme-muted">
              {t.year} • {COLLEGES.find(c => 
                t.college === c.name || 
                t.college.includes(`(${c.abbreviation})`)
              )?.abbreviation || t.college}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
              t.status === 'approved' ? 'bg-green-500/20 text-green-500' :
              t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {t.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
