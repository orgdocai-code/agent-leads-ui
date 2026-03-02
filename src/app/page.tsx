'use client';

import { useState, useEffect, useCallback } from 'react';

interface Job {
  id: number;
  source: string;
  title: string;
  description: string;
  payout: string;
  payoutCurrency: string;
  author: string;
  url: string;
  category: string;
  status: string;
  scrapedAt: string;
  skills: string[];
  featured: boolean;
}

const API_BASE = 'https://agent-leads-production.up.railway.app';
const DEMO_KEY = 'demo';
const JOBS_PER_PAGE = 20;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [skills, setSkills] = useState<{ name: string; count: number }[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  // Load saved jobs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedJobs');
      if (saved) setSavedJobs(JSON.parse(saved));
      if (localStorage.getItem('emailSubmitted')) setEmailSubmitted(true);
    } catch (e) { console.error(e); }
  }, []);

  // Fetch skills
  useEffect(() => {
    fetch(`${API_BASE}/skills`, { headers: { 'x-api-key': DEMO_KEY } })
      .then(res => res.json())
      .then(data => { if (data.skills) setSkills(data.skills); })
      .catch(console.error)
      .finally(() => setLoadingSkills(false));
  }, []);

  // Fetch jobs
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    
    const url = new URL(`${API_BASE}/opportunities`);
    url.searchParams.set('limit', '100');
    if (selectedSkills.length > 0) url.searchParams.set('skills', selectedSkills.join(','));

    fetch(url.toString(), { headers: { 'x-api-key': DEMO_KEY } })
      .then(res => { if (!res.ok) throw new Error(`API error: ${res.status}`); return res.json(); })
      .then(data => {
        setJobs(data.data || []);
        setDisplayedJobs((data.data || []).slice(0, JOBS_PER_PAGE));
        setHasMore((data.data || []).length > JOBS_PER_PAGE);
        setLoading(false);
      })
      .catch(err => { setError('Failed to load jobs. Click to retry.'); setLoading(false); });
  }, [selectedSkills]);

  // Load more jobs
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * JOBS_PER_PAGE;
    const end = start + JOBS_PER_PAGE;
    const newJobs = jobs.slice(0, end);
    setDisplayedJobs(newJobs);
    setPage(nextPage);
    setHasMore(end < jobs.length);
  }, [page, jobs]);

  // Subscribe
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) { setEmailError('Enter email'); return; }
    if (!isValidEmail(email)) { setEmailError('Invalid email'); return; }
    
    setSubscribeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, skills: selectedSkills.join(',') })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('emailSubmitted', 'true');
        setEmailSubmitted(true);
      } else {
        setEmailError(data.error || 'Failed');
      }
    } catch { setEmailError('Network error'); }
    setSubscribeLoading(false);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const saveJob = (jobId: number) => {
    const newSaved = savedJobs.includes(jobId) ? savedJobs.filter(id => id !== jobId) : [...savedJobs, jobId];
    setSavedJobs(newSaved);
    localStorage.setItem('savedJobs', JSON.stringify(newSaved));
  };

  const filteredJobs = showSaved ? displayedJobs.filter(j => savedJobs.includes(j.id)) : displayedJobs;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-12 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                🤖 <span className="hidden sm:inline">AgentLeads</span>
              </h1>
              <p className="text-indigo-100 mt-1">AI Agent Job Opportunities</p>
            </div>
            
            {!emailSubmitted && (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Get job alerts..."
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className="px-4 py-2 rounded-lg text-gray-900 w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button type="submit" disabled={subscribeLoading} className="px-4 py-2 bg-yellow-400 text-indigo-900 font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                  {subscribeLoading ? '...' : '🔔'}
                </button>
              </form>
            )}
            {emailSubmitted && <span className="text-green-300 text-sm">✓ Alerts on</span>}
          </div>
          {emailError && <p className="text-red-300 text-sm mt-2">{emailError}</p>}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0">
          <div className="bg-gray-800 rounded-xl p-4 sticky top-36">
            <h2 className="font-semibold mb-3 flex items-center gap-2">🔍 Skills</h2>
            {loadingSkills ? <p className="text-gray-400 text-sm">Loading...</p> : (
              <div className="max-h-80 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {skills.slice(0, 20).map(skill => (
                  <label key={skill.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1.5 rounded-lg transition">
                    <input type="checkbox" checked={selectedSkills.includes(skill.name)} onChange={() => toggleSkill(skill.name)} className="rounded text-purple-500 bg-gray-700 border-gray-600" />
                    <span className="text-sm text-gray-300 flex-1">{skill.name}</span>
                    <span className="text-xs text-gray-500">{skill.count}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedSkills.length > 0 && <button onClick={() => setSelectedSkills([])} className="mt-3 text-sm text-purple-400 hover:text-purple-300">Clear all</button>}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Search */}
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Search jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <button className="px-6 bg-purple-600 rounded-lg hover:bg-purple-500">Search</button>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => setShowSaved(false)} className={`px-3 py-1 rounded-full text-sm ${!showSaved ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>All ({jobs.length})</button>
              <button onClick={() => setShowSaved(true)} className={`px-3 py-1 rounded-full text-sm ${showSaved ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>⭐ Saved ({savedJobs.length})</button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-4"><p className="text-red-300">{error}</p></div>}

          {/* Jobs */}
          {loading ? (
            <div className="text-center py-12"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-gray-400 mt-3">Loading jobs...</p></div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-xl"><p className="text-gray-400">No jobs found</p></div>
          ) : (
            <>
              <div className="space-y-3">
                {filteredJobs.map(job => (
                  <div key={job.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition border border-gray-700 hover:border-purple-500/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {job.featured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">⭐ Featured</span>}
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">{job.source}</span>
                        </div>
                        <h3 className="font-semibold text-lg text-white truncate">{job.title}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{job.description || 'No description'}</p>
                        {job.skills?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{job.skills.slice(0, 4).map(s => <span key={s} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">{s}</span>)}{job.skills.length > 4 && <span className="text-xs text-gray-500">+{job.skills.length - 4}</span>}</div>}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {job.payout && parseFloat(job.payout) > 0 ? (
                            <span className="text-green-400 font-semibold">💰 {job.payout} {job.payoutCurrency}</span>
                          ) : (
                            <span className="text-gray-500 font-semibold">💰 Competitive</span>
                          )}
                          <span className="text-gray-500">{new Date(job.scrapedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => saveJob(job.id)} className={`p-2 rounded-lg ${savedJobs.includes(job.id) ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>⭐</button>
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 text-center">Apply</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More */}
              {!showSaved && hasMore && jobs.length > displayedJobs.length && (
                <div className="text-center mt-6">
                  <button onClick={loadMore} className="px-8 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Load more ({jobs.length - displayedJobs.length} remaining)</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </div>
  );
}
