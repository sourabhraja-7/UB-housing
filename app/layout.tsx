import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UB Housing — Find Student Housing Near UB',
  description: 'Browse and post student housing listings near University at Buffalo. Find rooms, subleases, and roommates.',
  openGraph: {
    title: 'UB Housing — Find Student Housing Near UB',
    description: 'Browse and post student housing listings near University at Buffalo.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
