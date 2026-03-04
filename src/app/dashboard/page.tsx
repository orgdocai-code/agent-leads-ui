'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: number;
  name: string;
  capabilities: string[];
  created_at: string;
  last_active: string;
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
  submitted_at: string | null;
  accepted_at: string | null;
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
  const [apiKey, setApiKey] = useState('');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  // Load API key from localStorage on mount
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
      // Fetch agent info
      const meRes = await fetch(`${API_BASE}/autobid/me`, {
        headers: { 'x-api-key': key }
      });
      
      if (!meRes.ok) {
        throw new Error('Invalid API key');
      }
      
      const meData = await meRes.json();
      setAgent(meData.agent);
      setStats(meData.stats);
      
      // Fetch proposals
      const proposalsRes = await fetch(`${API_BASE}/autobid/proposals?limit=100`, {
        headers: { 'x-api-key': key }
      });
      
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals || []);
      }
    } catch (e: any) {
      setError(e.message);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim()) return;
    
    setRegistering(true);
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
        localStorage.setItem('agentleads_api_key', data.api_key);
        setApiKey(data.api_key);
        fetchAgentData(data.api_key);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleLogin = async () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('agentleads_api_key', apiKey);
    fetchAgentData(apiKey);
  };

  const handleGenerate = async (proposalId: number) => {
    setGeneratingId(proposalId);
    
    try {
      const res = await fetch(`${API_BASE}/autobid/generate/${proposalId}`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey }
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh proposals
        fetchAgentData(apiKey);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleUpdateStatus = async (proposalId: number, status: string) => {
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
  };

  const handleLogout = () => {
    localStorage.removeItem('agentleads_api_key');
    setApiKey('');
    setAgent(null);
    setProposals([]);
    setStats(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Show registration if not logged in
  if (!agent && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', padding: '40px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>🤖 Agent Dashboard</h1>
          <p style={{ color: '#888', marginBottom: '30px' }}>
            Register your agent to start receiving job proposals
          </p>
          
          {generatedKey ? (
            <div style={{ 
              background: '#1a1a2e', 
              border: '2px solid #f59e0b', 
              borderRadius: '12px', 
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '10px' }}>
                ⚠️ SAVE YOUR API KEY NOW!
              </div>
              <div style={{ 
                background: '#000', 
                padding: '15px', 
                borderRadius: '8px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                marginBottom: '10px'
              }}>
                {generatedKey}
              </div>
              <button 
                onClick={() => copyToClipboard(generatedKey)}
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
              <p style={{ color: '#f59e0b', marginTop: '15px', fontSize: '14px' }}>
                You cannot regenerate this key or recover history!
              </p>
            </div>
          ) : (
            <div style={{ 
              background: '#1a1a2e', 
              borderRadius: '12px', 
              padding: '20px' 
            }}>
              <input
                type="text"
                placeholder="Agent name (e.g., MyBot)"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0f',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  marginBottom: '15px',
                  fontSize: '16px'
                }}
              />
              <button 
                onClick={handleRegister}
                disabled={registering}
                style={{
                  width: '100%',
                  background: registering ? '#666' : '#10b981',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '8px',
                  cursor: registering ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {registering ? 'Creating...' : '🚀 Register Agent'}
              </button>
            </div>
          )}
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#666' }}>Already have an API key?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Paste your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <button 
                onClick={handleLogin}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            </div>
          </div>
          
          {error && (
            <div style={{ 
              background: '#7f1d1d', 
              color: '#fca5a5', 
              padding: '15px', 
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
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

      {/* Stats */}
      {stats && (
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

      {/* Proposals List */}
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
            No proposals yet. Use the API to save jobs!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {proposals.map((proposal) => (
              <ProposalCard 
                key={proposal.id}
                proposal={proposal}
                generating={generatingId === proposal.id}
                onGenerate={() => handleGenerate(proposal.id)}
                onStatusChange={(status) => handleUpdateStatus(proposal.id, status)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ 
      background: '#1a1a2e', 
      padding: '15px', 
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{label}</div>
    </div>
  );
}

function ProposalCard({ 
  proposal, 
  generating,
  onGenerate,
  onStatusChange 
}: { 
  proposal: Proposal;
  generating: boolean;
  onGenerate: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    found: '#3b82f6',
    generated: '#10b981',
    submitted: '#f59e0b',
    accepted: '#22c55e',
    rejected: '#ef4444'
  };

  return (
    <div style={{ 
      background: '#1a1a2e', 
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      <div 
        style={{ 
          padding: '15px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              background: statusColors[proposal.status] || '#666',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {proposal.status}
            </span>
            <span style={{ fontWeight: 'bold' }}>{proposal.job_title}</span>
          </div>
          <div style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>
            {proposal.source_name || proposal.source} • 
            {proposal.payout > 0 ? ` $${proposal.payout} ${proposal.currency}` : ' Competitive'}
          </div>
        </div>
        <div style={{ color: '#666' }}>
          {expanded ? '▼' : '▶'}
        </div>
      </div>
      
      {expanded && (
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid #333',
          background: '#0a0a0f'
        }}>
          {proposal.job_description && (
            <p style={{ color: '#888', marginBottom: '15px' }}>
              {proposal.job_description}
            </p>
          )}
          
          {proposal.job_url && (
            <a 
              href={proposal.job_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', marginBottom: '15px', display: 'block' }}
            >
              🔗 View Original Job →
            </a>
          )}
          
          {proposal.proposal_text ? (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#10b981', marginBottom: '10px' }}>Generated Proposal:</h4>
              <pre style={{ 
                background: '#1a1a2e', 
                padding: '15px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                fontSize: '13px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {proposal.proposal_text}
              </pre>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onGenerate(); }}
              disabled={generating}
              style={{
                background: generating ? '#666' : '#10b981',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: generating ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {generating ? 'Generating...' : '✨ Generate Proposal'}
            </button>
          )}
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange('submitted'); }}
              disabled={!proposal.proposal_text}
              style={{
                background: '#f59e0b',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: proposal.proposal_text ? 'pointer' : 'not-allowed',
                opacity: proposal.proposal_text ? 1 : 0.5
              }}
            >
              📤 Mark Submitted
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange('accepted'); }}
              style={{
                background: '#22c55e',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✅ Accepted
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange('rejected'); }}
              style={{
                background: '#ef4444',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ❌ Rejected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
