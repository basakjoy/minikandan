import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Mini Kanban Board - Collaborative Workflow Engine',
  description: 'Full-stack Kanban Board with JWT auth, role permissions, and drag-and-drop task movement',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${poppins.variable}`}>
      <body className={`${poppins.className} font-sans bg-black text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative`}>
        {/* Liquid Glass Dynamic Ambient Background Blobs */}
        <div className="liquid-bg-blob-1" aria-hidden="true" />
        <div className="liquid-bg-blob-2" aria-hidden="true" />

        <div className="relative z-10 min-h-screen flex flex-col">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}

