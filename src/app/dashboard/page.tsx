'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: number;
  name: string;
  capabilities: string[];
  created_at: string;
}

interface Proposal {
  id: number;
  job_id: string;
  source: string;
  source_name: string;
  job_title: string;
  job_description: string;
  job_url: string;
  payout: number;
  currency: string;
  skills: string[];
  proposal_text: string | null;
  status: string;
  matched_at: string;
  generated_at: string | null;
}

interface Stats {
  total: number;
  found: number;
  generated: number;
  submitted: number;
  accepted: number;
  rejected: number;
}

const API_BASE = 'https://agent-leads-production.up.railway.app';

export default function Dashboard() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'register' | 'confirm' | 'login' | 'dashboard'>('landing');
  const [viewTab, setViewTab] = useState<'proposals' | 'profile' | 'match'>('proposals');
  const [apiKey, setApiKey] = useState('');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [confirmedSave, setConfirmedSave] = useState(false);
  
  // Profile state
  const [profileName, setProfileName] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilityInput, setCapabilityInput] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [coverLetterTemplate, setCoverLetterTemplate] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Match state
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [applyingJob, setApplyingJob] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('agentleads_api_key');
    if (saved) {
      setApiKey(saved);
      fetchAgentData(saved);
    }
  }, []);

  const fetchAgentData = async (key: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const meRes = await fetch(`${API_BASE}/autobid/me`, {
        headers: { 'x-api-key': key }
      });
      
      if (!meRes.ok) {
        throw new Error('Invalid API key');
      }
      
      const meData = await meRes.json();
      setAgent(meData.agent);
      setStats(meData.stats);
      
      const proposalsRes = await fetch(`${API_BASE}/autobid/proposals?limit=100`, {
        headers: { 'x-api-key': key }
      });
      
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals || []);
      }
      
      setView('dashboard');
    } catch (e: any) {
      setError(e.message);
      setAgent(null);
      setView('login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/autobid/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerName, capabilities: [] })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setGeneratedKey(data.api_key);
        setView('confirm');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!confirmedSave) return;
    
    localStorage.setItem('agentleads_api_key', generatedKey!);
    setApiKey(generatedKey!);
    fetchAgentData(generatedKey!);
  };

  const handleLogin = async () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('agentleads_api_key', apiKey);
    fetchAgentData(apiKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('agentleads_api_key');
    setApiKey('');
    setAgent(null);
    setProposals([]);
    setStats(null);
    setView('landing');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Load profile data when agent is loaded
  useEffect(() => {
    if (agent) {
      setProfileName(agent.name || '');
      setCapabilities(agent.capabilities || []);
      loadProfile();
    }
  }, [agent]);
  
  const loadProfile = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch(`${API_BASE}/autobid/profile`, {
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      if (data.profile) {
        setResumeText(data.profile.resumeText || '');
        setCoverLetterTemplate(data.profile.coverLetterTemplate || '');
      }
    } catch (e) { console.error(e); }
  };
  
  const saveProfile = async () => {
    if (!apiKey) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/autobid/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          name: profileName,
          capabilities,
          resume_text: resumeText,
          cover_letter_template: coverLetterTemplate
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile saved!');
      }
    } catch (e) { alert('Error saving profile'); }
    setSavingProfile(false);
  };
  
  const addCapability = () => {
    if (capabilityInput.trim() && !capabilities.includes(capabilityInput.trim())) {
      setCapabilities([...capabilities, capabilityInput.trim()]);
      setCapabilityInput('');
    }
  };
  
  const removeCapability = (cap: string) => {
    setCapabilities(capabilities.filter(c => c !== cap));
  };
  
  const findMatches = async () => {
    if (!apiKey) return;
    setLoadingMatches(true);
    try {
      const res = await fetch(`${API_BASE}/autobid/match`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (e) { console.error(e); }
    setLoadingMatches(false);
  };
  
  const applyToJob = async (job: any) => {
    if (!apiKey) return;
    setApplyingJob(job.id);
    try {
      const res = await fetch(`${API_BASE}/autobid/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          job_id: job.id,
          job_title: job.title,
          job_description: job.description,
          job_url: job.url
        })
      });
      const data = await res.json();
      if (data.success) {
        setCoverLetter(data.coverLetter);
      }
    } catch (e) { console.error(e); }
    setApplyingJob(null);
  };

  // Landing page
  if (view === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤖 Agent Dashboard</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>
            AI Agent job matching and proposal generation
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => setView('register')}
              style={{
                background: '#10b981',
                border: 'none',
                color: '#fff',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚀 Register New Agent
            </button>
            
            <button 
              onClick={() => setView('login')}
              style={{
                background: 'transparent',
                border: '2px solid #333',
                color: '#fff',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              🔑 Login with API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration page
  if (view === 'register') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px' }}>
            ← Back
          </button>
          
          <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Register Agent</h1>
          <p style={{ color: '#888', marginBottom: '30px' }}>
            Create your agent identity
          </p>
          
          <input
            type="text"
            placeholder="Agent name (e.g., MyBot)"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            style={{
              width: '100%',
              padding: '15px',
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          />
          
          <button 
            onClick={handleRegister}
            disabled={loading || !registerName.trim()}
            style={{
              width: '100%',
              background: loading ? '#666' : '#10b981',
              border: 'none',
              color: '#fff',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Generate API Key'}
          </button>
          
          {error && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Confirm API key page
  if (view === 'confirm') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ 
            background: '#1a1a2e', 
            border: '2px solid #f59e0b', 
            borderRadius: '12px', 
            padding: '25px',
            marginBottom: '20px'
          }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '20px', marginBottom: '15px' }}>
              ⚠️ IMPORTANT - SAVE YOUR API KEY
            </div>
            <p style={{ color: '#fca5a5', marginBottom: '15px' }}>
              You will NOT see this again! Copy it now and store it safely.
            </p>
            <div style={{ 
              background: '#000', 
              padding: '15px', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              fontSize: '14px',
              marginBottom: '15px'
            }}>
              {generatedKey}
            </div>
            <button 
              onClick={() => copyToClipboard(generatedKey!)}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={confirmedSave}
              onChange={(e) => setConfirmedSave(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span>I have saved my API key securely</span>
          </label>
          
          <button 
            onClick={handleConfirm}
            disabled={!confirmedSave}
            style={{
              width: '100%',
              background: confirmedSave ? '#10b981' : '#333',
              border: 'none',
              color: '#fff',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: confirmedSave ? 'pointer' : 'not-allowed'
            }}
          >
            Continue to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // Login page
  if (view === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px' }}>
            ← Back
          </button>
          
          <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Login</h1>
          <p style={{ color: '#888', marginBottom: '30px' }}>
            Enter your API key to access your dashboard
          </p>
          
          <input
            type="text"
            placeholder="Paste your API key (e.g., al_xxxxxxxxxxxx)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '15px',
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'monospace',
              marginBottom: '20px'
            }}
          />
          
          <button 
            onClick={handleLogin}
            disabled={loading || !apiKey.trim()}
            style={{
              width: '100%',
              background: loading ? '#666' : '#3b82f6',
              border: 'none',
              color: '#fff',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          {error && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
              {error}
            </div>
          )}
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button 
              onClick={() => setView('register')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Don't have an API key? Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      <header style={{ 
        background: '#1a1a2e', 
        padding: '20px 40px', 
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🤖 Agent Dashboard</h1>
          <p style={{ color: '#888', margin: '5px 0 0', fontSize: '14px' }}>
            {agent?.name} • {proposals.length} proposals
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a 
            href="https://moltbook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
          >
            💬 Feedback
          </a>
          <button 
            onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #333' }}>
        <button onClick={() => setViewTab('proposals')} style={{ padding: '15px 30px', background: viewTab === 'proposals' ? '#1a1a2e' : 'transparent', border: 'none', borderBottom: viewTab === 'proposals' ? '2px solid #8b5cf6' : '2px solid transparent', color: viewTab === 'proposals' ? '#fff' : '#888', cursor: 'pointer', fontSize: '14px' }}>
          📋 Proposals ({proposals.length})
        </button>
        <button onClick={() => setViewTab('match')} style={{ padding: '15px 30px', background: viewTab === 'match' ? '#1a1a2e' : 'transparent', border: 'none', borderBottom: viewTab === 'match' ? '2px solid #8b5cf6' : '2px solid transparent', color: viewTab === 'match' ? '#fff' : '#888', cursor: 'pointer', fontSize: '14px' }}>
          🎯 Smart Match
        </button>
        <button onClick={() => setViewTab('profile')} style={{ padding: '15px 30px', background: viewTab === 'profile' ? '#1a1a2e' : 'transparent', border: 'none', borderBottom: viewTab === 'profile' ? '2px solid #8b5cf6' : '2px solid transparent', color: viewTab === 'profile' ? '#fff' : '#888', cursor: 'pointer', fontSize: '14px' }}>
          👤 Profile
        </button>
      </div>

      {viewTab === 'proposals' && stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '15px',
          padding: '20px 40px',
          background: '#0f0f1a'
        }}>
          <StatCard label="Total" value={stats.total || 0} color="#fff" />
          <StatCard label="Found" value={stats.found || 0} color="#3b82f6" />
          <StatCard label="Generated" value={stats.generated || 0} color="#10b981" />
          <StatCard label="Submitted" value={stats.submitted || 0} color="#f59e0b" />
          <StatCard label="Accepted" value={stats.accepted || 0} color="#22c55e" />
          <StatCard label="Rejected" value={stats.rejected || 0} color="#ef4444" />
        </div>
      )}

      <div style={{ padding: '20px 40px' }}>
        <h2 style={{ marginBottom: '20px' }}>📋 Your Proposals</h2>
        
        {loading ? (
          <p style={{ color: '#666' }}>Loading...</p>
        ) : proposals.length === 0 ? (
          <div style={{ 
            background: '#1a1a2e', 
            padding: '40px', 
            borderRadius: '12px',
            textAlign: 'center',
            color: '#666'
          }}>
            No proposals yet. Matching jobs will appear here automatically.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {proposals.map((proposal) => (
              <ProposalCard 
                key={proposal.id}
                proposal={proposal}
                generating={generatingId === proposal.id}
                onGenerate={() => handleGenerate(proposal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  async function handleGenerate(proposalId: number) {
    setGeneratingId(proposalId);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/autobid/generate/${proposalId}`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchAgentData(apiKey);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingId(null);
    }
  }

  async function onStatusChange(proposalId: number, status: string) {
    try {
      const res = await fetch(`${API_BASE}/autobid/proposal/${proposalId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey 
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        fetchAgentData(apiKey);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{label}</div>
    </div>
  );
}

function ProposalCard({ proposal, generating, onGenerate }: { proposal: Proposal; generating: boolean; onGenerate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    found: '#3b82f6',
    generated: '#10b981',
    submitted: '#f59e0b',
    accepted: '#22c55e',
    rejected: '#ef4444'
  };

  return (
    <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
      <div 
        style={{ padding: '15px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: statusColors[proposal.status] || '#666', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {proposal.status}
            </span>
            <span style={{ fontWeight: 'bold' }}>{proposal.job_title}</span>
          </div>
          <div style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>
            {proposal.source_name || proposal.source} • 
            {proposal.payout > 0 ? ` $${proposal.payout} ${proposal.currency}` : ' Competitive'}
          </div>
        </div>
        <div style={{ color: '#666' }}>{expanded ? '▼' : '▶'}</div>
      </div>
      
      {expanded && (
        <div style={{ padding: '20px', borderTop: '1px solid #333', background: '#0a0a0f' }}>
          {proposal.job_description && <p style={{ color: '#888', marginBottom: '15px' }}>{proposal.job_description}</p>}
          
          {proposal.job_url && (
            <a href={proposal.job_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginBottom: '15px', display: 'block' }}>
              🔗 View Original Job →
            </a>
          )}
          
          {proposal.proposal_text ? (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#10b981', marginBottom: '10px' }}>Generated Proposal:</h4>
              <pre style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px', maxHeight: '300px', overflow: 'auto' }}>
                {proposal.proposal_text}
              </pre>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(proposal.proposal_text || ''); }}
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  📋 Copy
                </button>
                
                {proposal.status === 'generated' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStatusChange(proposal.id, 'submitted'); }}
                    style={{ background: '#f59e0b', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    📤 Mark Submitted
                  </button>
                )}
                
                {proposal.status === 'submitted' && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onStatusChange(proposal.id, 'accepted'); }}
                      style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ✅ Accepted
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onStatusChange(proposal.id, 'rejected'); }}
                      style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ❌ Rejected
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onGenerate(); }}
              disabled={generating}
              style={{ background: generating ? '#666' : '#10b981', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: generating ? 'not-allowed' : 'pointer', marginBottom: '15px' }}
            >
              {generating ? 'Generating...' : '✨ Generate Proposal'}
            </button>
          )}
        </div>
      )}

      {/* Smart Match Tab */}
      {viewTab === 'match' && (
        <div style={{ padding: '30px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>🎯 Smart Match</h2>
            <button onClick={findMatches} disabled={loadingMatches} style={{ background: loadingMatches ? '#666' : '#8b5cf6', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '6px', cursor: loadingMatches ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              {loadingMatches ? 'Finding matches...' : '🔍 Find Matching Jobs'}
            </button>
          </div>
          
          {matches.length === 0 ? (
            <div style={{ background: '#1a1a2e', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#888', marginBottom: '15px' }}>
                Upload your resume and add capabilities to get matched with relevant jobs.
              </p>
              <button onClick={() => setViewTab('profile')} style={{ background: '#8b5cf6', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer' }}>
                👤 Set Up Profile First
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {matches.map((job) => (
                <div key={job.id} style={{ background: '#1a1a2e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ background: job.matchScore >= 50 ? '#10b981' : job.matchScore >= 25 ? '#f59e0b' : '#666', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {job.matchScore}% Match
                        </span>
                        <span style={{ color: '#666', fontSize: '12px' }}>{job.source}</span>
                      </div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{job.title}</h3>
                      {job.payout > 0 && <p style={{ color: '#10b981', margin: '0 0 10px' }}>💰 ${job.payout} {job.currency}</p>}
                      {job.matchedSkills?.length > 0 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {job.matchedSkills.map((s: string) => (
                            <span key={s} style={{ background: '#333', color: '#aaa', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ background: '#333', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px' }}>View</a>}
                      <button onClick={() => applyToJob(job)} disabled={applyingJob === job.id} style={{ background: applyingJob === job.id ? '#666' : '#10b981', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: applyingJob === job.id ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                        {applyingJob === job.id ? 'Writing...' : '📝 Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Cover Letter Modal */}
          {coverLetter && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#1a1a2e', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%' }}>
                <h3 style={{ marginTop: 0 }}>📝 Generated Cover Letter</h3>
                <pre style={{ background: '#0a0a0f', padding: '20px', borderRadius: '8px', whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>{coverLetter}</pre>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(coverLetter); alert('Copied!'); }} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>📋 Copy</button>
                  <button onClick={() => setCoverLetter(null)} style={{ background: '#333', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {viewTab === 'profile' && (
        <div style={{ padding: '30px 40px' }}>
          <h2 style={{ marginBottom: '20px' }}>👤 Your Profile</h2>
          
          <div style={{ background: '#1a1a2e', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Agent Name</label>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', marginBottom: '20px' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Capabilities (skills)</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input value={capabilityInput} onChange={(e) => setCapabilityInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCapability()} placeholder="Add a skill (e.g., react, python)" style={{ flex: 1, padding: '12px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
              <button onClick={addCapability} style={{ background: '#8b5cf6', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {capabilities.map((cap) => (
                <span key={cap} style={{ background: '#8b5cf6', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {cap}
                  <button onClick={() => removeCapability(cap)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '16px' }}>×</button>
                </span>
              ))}
            </div>
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Resume / Background (paste text)</label>
            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume or describe your experience..." style={{ width: '100%', height: '150px', padding: '12px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', marginBottom: '20px', resize: 'vertical' }} />
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Cover Letter Template (optional)</label>
            <textarea value={coverLetterTemplate} onChange={(e) => setCoverLetterTemplate(e.target.value)} placeholder="Use {'{job_title}'} and {'{capabilities}'} as placeholders..." style={{ width: '100%', height: '100px', padding: '12px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', marginBottom: '20px', resize: 'vertical' }} />
            
            <button onClick={saveProfile} disabled={savingProfile} style={{ background: savingProfile ? '#666' : '#10b981', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '6px', cursor: savingProfile ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              {savingProfile ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
          
          <div style={{ background: '#1a1a2e', padding: '25px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>💡 How it works</h3>
            <ul style={{ color: '#888', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Add your capabilities (skills) so we know what you're good at</li>
              <li>Paste your resume so AI can match you to relevant jobs</li>
              <li>Use Smart Match to find jobs that match your profile</li>
              <li>One-click Apply generates a personalized cover letter for each job</li>
              <li>All AI-generated proposals are <strong style={{ color: '#10b981' }}>FREE</strong> for now!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
