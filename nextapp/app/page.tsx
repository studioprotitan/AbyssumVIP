'use client';

export default function Home() {
  return (
    <main style={{
      backgroundImage: "url('/gateway-page-load-aspect-ratio-a.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: '8vh'
    }}>
      <a href="/forge-confirm/" style={{
        color: '#20d9b4',
        fontFamily: 'monospace',
        fontSize: '16px',
        letterSpacing: '4px',
        textDecoration: 'none',
        border: '1px solid #20d9b4',
        padding: '12px 40px',
        background: 'rgba(0,0,0,0.6)'
      }}>
        ENTER THE FORGE
      </a>
    </main>
  );
}