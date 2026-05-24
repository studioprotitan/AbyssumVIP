export default function Home() {
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      backgroundImage: "url('/gateway-page-load-aspect-ratio-a.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: '8vh',
      margin: 0,
      overflow: 'hidden'
    }}>
      <a href="/forge-confirm/" style={{
        color: '#20d9b4',
        fontFamily: 'monospace',
        fontSize: '16px',
        letterSpacing: '4px',
        textDecoration: 'none',
        border: '1px solid #20d9b4',
        padding: '12px 40px',
        background: 'rgba(0,0,0,0.7)',
        textTransform: 'uppercase' as const
      }}>
        ENTER THE FORGE
      </a>
    </main>
  );
}
