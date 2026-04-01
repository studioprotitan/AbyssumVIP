
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Arenas of Echelon',
  description: 'A cinematic high-fidelity operator simulation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Cinzel+Decorative:wght@400;700;900&family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  );
}
