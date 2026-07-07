import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecureVault - Premium Password Manager',
  description: 'Secure password management with client-side encryption, wrapped in a beautiful interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${outfit.className} relative min-h-screen`}>
        {/* Global Mesh Background */}
        <div className="mesh-bg"></div>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
