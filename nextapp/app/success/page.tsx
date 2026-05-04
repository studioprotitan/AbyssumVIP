export default function ForgeConfirmPage() {
  return (
    <iframe
      src="/forge-confirm/index.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 9999,
      }}
      title="Forge Confirm — Abyssum Genesis Verse"
    />
  );
}