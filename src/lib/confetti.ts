export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (canvas.parentNode) {
      document.body.removeChild(canvas);
    }
    return;
  }

  const activeCtx = ctx;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  activeCtx.scale(dpr, dpr);

  const colors = ['#5d4ef7', '#3dd68c', '#4a38f5', '#f5a623', '#ff6b6b', '#38bdf8', '#c084fc'];
  const confettiCount = 120;
  const particles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    vRotation: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < confettiCount; i++) {
    particles.push({
      x: window.innerWidth * (0.3 + Math.random() * 0.4),
      y: window.innerHeight * 0.5,
      w: Math.random() * 8 + 6,
      h: Math.random() * 4 + 4,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.8) * 16 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let animationFrameId: number;
  const startTime = performance.now();

  function render(time: number) {
    const elapsed = time - startTime;
    activeCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // friction
      p.rotation += p.vRotation;
      p.opacity = Math.max(0, 1 - elapsed / 2800);

      if (p.opacity > 0 && p.y < window.innerHeight + 50) {
        activeParticles++;
        activeCtx.save();
        activeCtx.translate(p.x, p.y);
        activeCtx.rotate((p.rotation * Math.PI) / 180);
        activeCtx.fillStyle = p.color;
        activeCtx.globalAlpha = p.opacity;
        activeCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        activeCtx.restore();
      }
    }

    if (activeParticles > 0 && elapsed < 3000) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
