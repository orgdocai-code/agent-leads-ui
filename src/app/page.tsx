'use client';

import { useState, useEffect } from 'react';

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

interface SkillsData {
  success: boolean;
  count: number;
  skills: { name: string; count: number }[];
}

const API_BASE = 'https://agent-leads-production.up.railway.app';
const DEMO_KEY = 'demo'; // Free tier API key for demo

// Email validation regex
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
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

  // Load saved jobs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedJobs');
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
      const emailSub = localStorage.getItem('emailSubmitted');
      if (emailSub) {
        setEmailSubmitted(true);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // Fetch skills
  useEffect(() => {
    setLoadingSkills(true);
    fetch(`${API_BASE}/skills`, {
      headers: { 'x-api-key': DEMO_KEY }
    })
      .then(res => res.json())
      .then(data => {
        if (data.skills) setSkills(data.skills);
        setLoadingSkills(false);
      })
      .catch(err => {
        console.error('Error fetching skills:', err);
        setLoadingSkills(false);
      });
  }, []);

  // Fetch jobs
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const url = new URL(`${API_BASE}/opportunities`);
    url.searchParams.set('limit', '50');
    
    if (selectedSkills.length > 0) {
      url.searchParams.set('skills', selectedSkills.join(','));
    }

    fetch(url.toString(), {
      headers: { 'x-api-key': DEMO_KEY }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.data) {
          setJobs(data.data);
        } else {
          setJobs([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Please try again.');
        setLoading(false);
      });
  }, [selectedSkills]);

  // Handle email signup with validation
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Please enter an email address');
      return;
    }
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Store locally for now (in production, send to API/database)
    try {
      // Get existing subscribers
      const existing = localStorage.getItem('subscriberEmails') || '[]';
      const emails = JSON.parse(existing);
      
      // Add new email if not already present
      if (!emails.includes(email)) {
        emails.push(email);
        localStorage.setItem('subscriberEmails', JSON.stringify(emails));
      }
      
      localStorage.setItem('emailSubmitted', 'true');
      setEmailSubmitted(true);
    } catch (err) {
      console.error('Error saving email:', err);
      setEmailError('Failed to save. Please try again.');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      return;
    }
    // Filter client-side for search
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setJobs(filtered);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const saveJob = (jobId: number) => {
    try {
      const newSaved = savedJobs.includes(jobId)
        ? savedJobs.filter(id => id !== jobId)
        : [...savedJobs, jobId];
      setSavedJobs(newSaved);
      localStorage.setItem('savedJobs', JSON.stringify(newSaved));
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  const filteredJobs = showSaved 
    ? jobs.filter(j => savedJobs.includes(j.id))
    : jobs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">🤖 AgentLeads</h1>
          <p className="text-indigo-100 text-lg">AI Agent Job Opportunities — Find your next gig</p>
          
          {/* Email Signup with validation */}
          {!emailSubmitted && (
            <div className="mt-4">
              <form onSubmit={handleEmailSubmit} className="flex flex-wrap gap-2">
                <input
                  type="email"
                  placeholder="Enter email for job alerts"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className={`px-4 py-2 rounded-lg text-gray-800 w-64 ${emailError ? 'border-2 border-red-500' : ''}`}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-400 text-indigo-900 font-semibold rounded-lg hover:bg-yellow-300"
                >
                  Get Alerts 🔔
                </button>
              </form>
              {emailError && (
                <p className="mt-2 text-red-300 text-sm">{emailError}</p>
              )}
            </div>
          )}
          {emailSubmitted && (
            <p className="mt-4 text-green-300">✓ You're signed up for job alerts!</p>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar - Filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4 sticky top-4">
            <h2 className="font-semibold text-gray-800 mb-3">🔍 Skills</h2>
            
            {loadingSkills ? (
              <p className="text-gray-500 text-sm">Loading skills...</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-1">
                {skills.slice(0, 25).map(skill => (
                  <label key={skill.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.name)}
                      onChange={() => toggleSkill(skill.name)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{skill.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{skill.count}</span>
                  </label>
                ))}
              </div>
            )}
            
            {selectedSkills.length > 0 && (
              <button
                onClick={() => setSelectedSkills([])}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Click to retry
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowSaved(false)}
                className={`px-3 py-1 rounded-full text-sm ${!showSaved ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setShowSaved(true)}
                className={`px-3 py-1 rounded-full text-sm ${showSaved ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                ⭐ Saved ({savedJobs.length})
              </button>
            </div>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                {selectedSkills.length > 0 
                  ? `No jobs found for skills: ${selectedSkills.join(', ')}`
                  : 'No jobs found'}
              </p>
              {selectedSkills.length > 0 && (
                <button
                  onClick={() => setSelectedSkills([])}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {job.featured && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Featured</span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{job.source}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {job.description || 'No description available'}
                      </p>
                      
                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 5).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="text-xs text-gray-400">+{job.skills.length - 5} more</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="font-semibold text-green-600">💰 {job.payout} {job.payoutCurrency}</span>
                        <span className="text-gray-500">📅 {new Date(job.scrapedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => saveJob(job.id)}
                        className={`p-2 rounded ${savedJobs.includes(job.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title={savedJobs.includes(job.id) ? 'Remove from saved' : 'Save job'}
                      >
                        ⭐
                      </button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 text-center"
                      >
                        Apply
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
