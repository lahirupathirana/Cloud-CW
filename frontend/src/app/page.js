"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lock, Shield, Search, TrendingUp, PlusCircle } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Submit Form State
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('');
  const [salary, setSalary] = useState('');
  const [anonymize, setAnonymize] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Example BFF URL handling relative path since proxy handles it
  useEffect(() => {
    if (activeTab === 'stats') {
      fetch('/api/proxy/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error(err));
    }
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(`/api/proxy/search?keyword=${searchQuery}`)
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .catch(err => console.error(err));
  };

  const handleSubmitSalary = (e) => {
    e.preventDefault();
    
    // Anonymize Logic
    let finalCompany = company;
    let finalJobTitle = jobTitle;
    if (anonymize) {
      finalCompany = null; // Remove company completely
      if (jobTitle.toLowerCase().includes('engineer')) {
        finalJobTitle = 'Engineering Professional';
      } else if (jobTitle.toLowerCase().includes('manager')) {
        finalJobTitle = 'Management Professional';
      }
    }

    const payload = {
      job_title: finalJobTitle,
      company_name: finalCompany,
      years_of_experience: parseInt(experience),
      base_salary: parseFloat(salary)
    };

    fetch('/api/proxy/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.ok) setSubmitMessage('Salary submitted successfully! Status: PENDING. Wait for 3 Upvotes to be APPROVED.');
      else setSubmitMessage('Error submitting salary.');
      setJobTitle(''); setCompany(''); setExperience(''); setSalary(''); setAnonymize(false);
    });
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'stats' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          <TrendingUp size={20} /> Salary Trends
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'search' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          <Search size={20} /> Search Database
        </button>
        <button onClick={() => setActiveTab('submit')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'submit' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
          <PlusCircle size={20} /> Contribute Salary
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Market Trends in Sri Lanka</h2>
          {stats.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="job_title" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `Rs ${value / 1000}k`} />
                  <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="average_salary" name="Average Base Salary (LKR)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground p-10 border border-dashed text-center rounded-lg">Loading market stats or no APPROVED data available yet...</p>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Search Approved Salaries</h2>
          <form onSubmit={handleSearch} className="flex gap-4 mb-8">
            <input 
              type="text" 
              placeholder="e.g. Software Engineer" 
              className="flex h-10 w-full md:w-96 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
              Search
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 relative">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{item.job_title}</h3>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-200">Verified</span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">{item.company_name ? item.company_name : <><Lock size={12}/> Anonymous Company</>}</p>
                <div className="mt-4 flex flex-col gap-1">
                  <span className="text-sm">Experience: <span className="font-medium">{item.years_of_experience} years</span></span>
                  <span className="text-2xl font-bold mt-2">Rs. {item.base_salary.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && searchQuery && (
              <p className="text-muted-foreground p-10 border border-dashed text-center rounded-lg">No matching verified salaries found.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submit' && (
        <div className="bg-card rounded-xl border shadow-sm p-6 max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="text-primary" size={28} />
            <h2 className="text-2xl font-semibold">Anonymous Contribution</h2>
          </div>
          
          {submitMessage && (
            <div className="mb-6 p-4 rounded-md bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmitSalary} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <input required type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Company (Optional)</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. WSO2, Sysco LABS" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" disabled={anonymize}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Experience</label>
                <input required type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Salary (LKR)</label>
                <input required type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 300000" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 pb-2 border-t mt-6">
              <button 
                type="button" 
                role="switch"
                aria-checked={anonymize}
                onClick={() => setAnonymize(!anonymize)}
                className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${anonymize ? 'bg-primary' : 'bg-input'}`}
              >
                <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${anonymize ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div className="flex flex-col">
                <label className="text-sm font-medium leading-none flex items-center gap-1 cursor-pointer" onClick={() => setAnonymize(!anonymize)}>
                  Strict Anonymize <Lock size={14} className="text-muted-foreground" />
                </label>
                <p className="text-[0.8rem] text-muted-foreground mt-1">Removes company and generalizes job title to protect identity.</p>
              </div>
            </div>

            <button type="submit" className="w-full h-10 mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
              Submit Salary (Pending Approval)
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
