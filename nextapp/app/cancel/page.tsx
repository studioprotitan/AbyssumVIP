Set-Content C:\Developer\AbyssumVIP\nextapp\app\page.tsx @'
export default function Home() {
  return (
    <main style={{
      background: "#0a0806",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "serif",
      color: "#e87c2a"
    }}>
      <h1 style={{ fontSize: "2.5rem", letterSpacing: "0.2em" }}>ABYSSUM VIP</h1>
      <p style={{ color: "#888", marginTop: "1rem" }}>Forge Network Access Portal</p>
      <a href="/api/create-checkout-session" style={{ marginTop: "2rem", color: "#00d4c8", fontSize: "0.9rem" }}>
        Enter the Forge
      </a>
    </main>
  );
}
'@