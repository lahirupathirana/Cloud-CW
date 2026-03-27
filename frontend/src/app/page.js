"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lock, Shield, Search, TrendingUp, PlusCircle, User, ThumbsUp, LogOut, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Voting & Auth State
  const [token, setToken] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Submit Form State
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('');
  const [salary, setSalary] = useState('');
  const [anonymize, setAnonymize] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Load token
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) setToken(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setActiveTab('search');
  };

  // Fetch stats or pending based on tab
  useEffect(() => {
    if (activeTab === 'stats') {
      fetch('/api/proxy/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error(err));
    }
    if (activeTab === 'review' && token) {
      fetch('/api/proxy/submissions')
        .then(res => res.json())
        .then(data => setPendingSubmissions(data))
        .catch(err => console.error(err));
    }
  }, [activeTab, token]);

  const handleAuth = async (e, isLogin) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await fetch(`/api/proxy${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setActiveTab('review');
      } else {
        setAuthError('Registered successfully. Please log in.');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(`/api/proxy/search?keyword=${searchQuery}`)
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .catch(err => console.error(err));
  };

  const handleSubmitSalary = (e) => {
    e.preventDefault();
    let finalCompany = company;
    let finalJobTitle = jobTitle;
    if (anonymize) {
      finalCompany = null;
      if (jobTitle.toLowerCase().includes('engineer')) finalJobTitle = 'Engineering Professional';
      else if (jobTitle.toLowerCase().includes('manager')) finalJobTitle = 'Management Professional';
    }

    const payload = {
      job_title: finalJobTitle,
      company_name: finalCompany,
      years_of_experience: parseInt(experience),
      base_salary: parseFloat(salary)
    };

    fetch('/api/proxy/submissions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.ok) setSubmitMessage('Salary submitted! Status: PENDING. Wait for 3 Upvotes to be APPROVED.');
      else setSubmitMessage('Error submitting salary.');
      setJobTitle(''); setCompany(''); setExperience(''); setSalary(''); setAnonymize(false);
    });
  };

  const handleVote = async (submissionId, type) => {
    try {
      const res = await fetch('/api/proxy/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submission_id: submissionId, vote_type: type })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Vote failed');
      else alert('Vote recorded! ' + data.upvotes + ' total upvotes now.');
    } catch (err) {
      console.error(err);
    }
  };

  const navItemClass = (tabId) => `flex flex-col sm:flex-row items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
    activeTab === tabId 
    ? 'bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/30 scale-105' 
    : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50'
  }`;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-blue-600 p-2 rounded-lg text-white">
              <Shield size={22} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              TechPays SL
            </h1>
          </div>
          <div className="flex gap-4">
             {token ? (
               <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors">
                 <LogOut size={16} /> Logout
               </button>
             ) : (
               <button onClick={() => setActiveTab('login')} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                 <User size={16} /> Login
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button onClick={() => setActiveTab('stats')} className={navItemClass('stats')}>
            <TrendingUp size={20} /> <span className="hidden sm:inline">Market Trends</span>
          </button>
          <button onClick={() => setActiveTab('search')} className={navItemClass('search')}>
            <Search size={20} /> <span className="hidden sm:inline">Search Salaries</span>
          </button>
          <button onClick={() => setActiveTab('submit')} className={navItemClass('submit')}>
            <PlusCircle size={20} /> <span className="hidden sm:inline">Contribute</span>
          </button>
          {token && (
            <button onClick={() => setActiveTab('review')} className={navItemClass('review')}>
              <CheckCircle size={20} /> <span className="hidden sm:inline">Review Pendings</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="w-full max-w-5xl mx-auto">
          {activeTab === 'stats' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Market Insights</h2>
              {stats.length > 0 ? (
                <div className="h-[450px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="job_title" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value / 1000}k`} />
                      <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="average_salary" name="Average Base Salary (LKR)" fill="url(#colorUv)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                  <TrendingUp size={48} className="mb-4 opacity-50" />
                  <p>Loading market stats or no APPROVED data available yet...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Discover Salaries</h2>
              <p className="text-slate-500 mb-8 max-w-xl">Search through verified submissions filtered by our community. See accurate representation of the tech industry compensation.</p>
              
              <form onSubmit={handleSearch} className="flex gap-3 mb-10 w-full max-w-2xl relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineer..." 
                  className="flex h-14 w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-12 pr-4 text-base focus-visible:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="h-14 px-8 bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/30 rounded-full font-semibold transition-all hover:scale-105 active:scale-95">
                  Search
                </button>
              </form>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {searchResults.map((item) => (
                  <div key={item.id} className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col gap-2 relative shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg leading-tight text-slate-800 dark:text-slate-200">{item.job_title}</h3>
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-1.5 rounded-full" title="Community Approved">
                        <CheckCircle size={16} />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-primary flex items-center gap-1.5 mt-1">
                      {item.company_name ? item.company_name : <><Lock size={12}/> Undisclosed Company</>}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Experience</span>
                      <span className="font-medium mb-2">{item.years_of_experience} years</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Base Salary</span>
                      <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Rs. {item.base_salary.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {searchResults.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 mt-4">
                  <Search size={48} className="mb-4 opacity-50" />
                  <p>No matching verified salaries found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl max-w-2xl mx-auto">
              <div className="flex flex-col items-center mb-10 text-center">
                <div className="bg-gradient-to-br from-primary to-blue-600 p-4 rounded-full text-white mb-4 shadow-lg shadow-primary/30">
                  <Shield size={32} />
                </div>
                <h2 className="text-3xl font-bold">Anonymous Contribution</h2>
                <p className="text-slate-500 mt-2">Help the community by sharing your compensation details.</p>
              </div>
              
              {submitMessage && (
                <div className="mb-8 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm font-medium flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmitSalary} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Job Title</label>
                  <input required type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" />
                </div>
                
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Company (Optional)</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm disabled:opacity-40 disabled:bg-slate-50" disabled={anonymize}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Years of Experience</label>
                    <input required type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5" className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Base Salary (LKR)</label>
                    <input required type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 300000" className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-8 border border-slate-100 dark:border-slate-700">
                  <div className="flex-1">
                    <label className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer" onClick={() => setAnonymize(!anonymize)}>
                      Strict Anonymization <Lock size={16} className="text-primary" />
                    </label>
                    <p className="text-sm text-slate-500 mt-1">Removes company name and generalizes job title to protect your identity entirely.</p>
                  </div>
                  <button 
                    type="button" 
                    role="switch"
                    aria-checked={anonymize}
                    onClick={() => setAnonymize(!anonymize)}
                    className={`ml-4 relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border-2 border-transparent ${anonymize ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${anonymize ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <button type="submit" className="w-full h-14 mt-4 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Submit Securely
                </button>
              </form>
            </div>
          )}

          {activeTab === 'login' && !token && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex justify-center p-4 bg-primary/10 rounded-full mb-4">
                  <User size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Community Portal</h2>
                <p className="text-slate-500 text-sm mt-2">Log in to review and vote on pending submissions.</p>
              </div>

              {authError && <div className="mb-6 p-4 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium border border-slate-300">{authError}</div>}

              <form className="space-y-4">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="flex h-12 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button onClick={(e) => handleAuth(e, true)} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5">
                    Log In
                  </button>
                  <button onClick={(e) => handleAuth(e, false)} className="flex-1 h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary text-slate-800 dark:text-white rounded-xl font-bold shadow-sm transition-all">
                    Register
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'review' && token && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Review Pending Submissions</h2>
              <p className="text-slate-500 mb-8">Upvote trustworthy submissions. Demands 3 upvotes to clear the queue.</p>
              
              <div className="space-y-4">
                {pendingSubmissions.length > 0 ? pendingSubmissions.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">Pending</span>
                        <h3 className="font-bold text-xl">{item.jobTitle}</h3>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{item.companyName || 'Anonymous Company'} • {item.yearsOfExperience} yrs exp</p>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        Rs. {item.baseSalary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => handleVote(item.id, 'UP')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl font-bold transition-colors">
                        <ThumbsUp size={18} /> Upvote
                      </button>
                      <button onClick={() => handleVote(item.id, 'DOWN')} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold transition-colors">
                         Reject
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <CheckCircle size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Queue is empty!</p>
                    <p className="text-sm">All submissions have been reviewed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
