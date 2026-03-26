export const metadata = {
  title: 'Tech Salary Transparency',
  description: 'Anonymous tech salary sharing for Sri Lanka',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
