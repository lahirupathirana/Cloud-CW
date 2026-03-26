import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Tech Salary Transparency Dashboard',
  description: 'Anonymous tech salary sharing for Sri Lanka',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <header className="border-b px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">Tech Salary Transparency</h1>
        </header>
        {children}
      </body>
    </html>
  )
}
