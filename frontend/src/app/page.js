import React from 'react';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Tech Salary Transparency System</h1>
      <p>Sri Lanka MSc Cloud Computing Coursework</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Submit Salary (Anonymous)</h2>
        <form style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
          <input type="text" placeholder="Job Title" required />
          <input type="text" placeholder="Company (Optional)" />
          <input type="number" placeholder="Years of Experience" required />
          <input type="number" placeholder="Base Salary (LKR)" required />
          <button type="button">Submit (Pending Approval)</button>
        </form>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2>Search Salaries</h2>
        <input type="text" placeholder="Search by Job Title" />
        <button type="button">Search</button>
      </div>
    </main>
  );
}
