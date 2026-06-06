export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>

      {/* ── Base ── */}
      <div className="absolute inset-0" style={{ background: 'var(--surface-base)' }} />

      {/* ── Aurora Mesh Gradients ── */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 70%),
          radial-gradient(ellipse 60% 50% at 80% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 50% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)
        `,
        animation: 'auroraShift 20s ease-in-out infinite',
        backgroundSize: '200% 200%',
      }} />

      {/* ── Floating Aurora Blobs ── */}
      <div className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: '10%', left: '15%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'auroraFloat1 18s ease-in-out infinite',
        }} />

      <div className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: '50%', right: '10%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animation: 'auroraFloat2 22s ease-in-out infinite',
        }} />

      <div className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          bottom: '10%', left: '40%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 65%)',
          filter: 'blur(45px)',
          animation: 'auroraFloat3 15s ease-in-out infinite',
        }} />

      {/* ── Subtle Grid Overlay ── */}
      <div className="absolute inset-0" style={{
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at center, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at center, black 20%, transparent 70%)',
        animation: 'gridPulse 8s ease-in-out infinite',
      }} />

      {/* ── Noise Texture ── */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* ── Vignette ── */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.65) 100%)' }} />
    </div>
  );
}
