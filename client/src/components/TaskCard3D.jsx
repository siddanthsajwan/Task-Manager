import { useRef, useState } from 'react';

export default function TaskCard3D({ children }) {
  const ref = useRef(null);
  const [tf, setTf] = useState('');
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = -(((y - r.height / 2) / r.height) * 5);
    const ry =   ((x - r.width  / 2) / r.width)  * 5;
    setTf(`perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.008,1.008,1.008)`);
    setGlow({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  };

  const onLeave = () => setTf('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        transform: tf || 'perspective(1100px)',
        transition: tf ? 'transform 0.06s ease-out' : 'transform 0.55s ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        borderRadius: '20px',
        position: 'relative',
      }}>

      {/* Animated red border glow following cursor */}
      <div style={{
        position: 'absolute', inset: '-1px', borderRadius: '21px',
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%,
          rgba(239,35,60,0.55) 0%,
          rgba(239,35,60,0.2) 25%,
          rgba(239,35,60,0.05) 55%,
          transparent 75%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        transition: 'background 0.08s ease',
      }} />

      {/* Inner surface shimmer */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%,
          rgba(255,255,255,0.03) 0%, transparent 55%)`,
        pointerEvents: 'none',
        transition: 'background 0.08s ease',
      }} />

      {/* Drop shadow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(239,35,60,0.08)',
        pointerEvents: 'none',
      }} />

      {children}
    </div>
  );
}
