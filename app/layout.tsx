import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Texarkana Live Map & Autonomous Agent Trace',
  description: 'Interactive real-time map with autonomous agent telemetry, automated waypoint tours, geofencing, multi-agent fleet operations, and AI mission intelligence.',
  openGraph: {
    title: 'Texarkana Live Map & Autonomous Agent Trace',
    description: 'Interactive real-time map with autonomous agent telemetry, automated waypoint tours, geofencing, multi-agent fleet operations, and AI mission intelligence.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texarkana Live Map & Autonomous Agent Trace',
    description: 'Interactive real-time map with autonomous agent telemetry, automated waypoint tours, geofencing, multi-agent fleet operations, and AI mission intelligence.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`command-center-bg text-gray-100 antialiased overflow-hidden selection:bg-blue-600 selection:text-white font-sans ${jakarta.variable} ${jetbrains.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
