import { useEffect, useRef } from 'react';

interface Particle {
  hue: number;
  sat: number;
  lum: number;
  x: number;
  y: number;
  xLast: number;
  yLast: number;
  xSpeed: number;
  ySpeed: number;
  age: number;
  ageSinceStuck: number;
  attractor: {
    oldIndex: number;
    gridSpotIndex: number;
  };
  name: string;
  speed?: number;
  dist?: number;
}

interface GridSpot {
  x: number;
  y: number;
  busyAge: number;
  spotIndex: number;
  isEdge: string | false;
  field: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const appRef = useRef<{
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    width: number;
    height: number;
    xC: number;
    yC: number;
    stepCount: number;
    particles: Particle[];
    lifespan: number;
    popPerBirth: number;
    maxPop: number;
    birthFreq: number;
    gridSize: number;
    gridSteps: number;
    grid: GridSpot[];
    gridMaxIndex: number;
    drawnInLastFrame: number;
    deathCount: number;
    dataToImageRatio: number;
  }>({
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    xC: 0,
    yC: 0,
    stepCount: 0,
    particles: [],
    lifespan: 1500,
    popPerBirth: 1,
    maxPop: 120,
    birthFreq: 3,
    gridSize: 8,
    gridSteps: 0,
    grid: [],
    gridMaxIndex: 0,
    drawnInLastFrame: 0,
    deathCount: 0,
    dataToImageRatio: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      appRef.current.width = canvas.width;
      appRef.current.height = canvas.height;
      appRef.current.xC = canvas.width / 2;
      appRef.current.yC = canvas.height / 2;
      appRef.current.dataToImageRatio = dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    appRef.current.canvas = canvas;
    appRef.current.ctx = ctx;

    ctx.imageSmoothingEnabled = false;

    // Build grid
    const gridSize = 8;
    const gridSteps = Math.floor(1000 / gridSize);
    appRef.current.gridSize = gridSize;
    appRef.current.gridSteps = gridSteps;

    const grid: GridSpot[] = [];
    let i = 0;
    for (let xx = -500; xx < 500; xx += gridSize) {
      for (let yy = -500; yy < 500; yy += gridSize) {
        const r = Math.sqrt(xx * xx + yy * yy);
        const r0 = 100;
        let field: number;

        if (r < r0) field = 255 / r0 * r;
        else field = 255 - Math.min(255, (r - r0) / 2);

        grid.push({
          x: xx,
          y: yy,
          busyAge: 0,
          spotIndex: i,
          isEdge: (xx === -500 ? 'left' :
                   (xx === (-500 + gridSize * (gridSteps - 1)) ? 'right' :
                    (yy === -500 ? 'top' :
                     (yy === (-500 + gridSize * (gridSteps - 1)) ? 'bottom' :
                      false
                     )
                    )
                   )
                  ),
          field: field
        });
        i++;
      }
    }
    appRef.current.grid = grid;
    appRef.current.gridMaxIndex = i;

    // Initial draw - transparent background to show landing page gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Animation loop
    const evolve = () => {
      const app = appRef.current;
      if (!app.ctx) return;

      app.stepCount++;

      // Increment all grid ages
      app.grid.forEach((e) => {
        if (e.busyAge > 0) e.busyAge++;
      });

      // Birth new particles
      if (app.stepCount % app.birthFreq === 0 && (app.particles.length + app.popPerBirth) < app.maxPop) {
        birth();
      }

      move();
      draw();
    };

    const birth = () => {
      const app = appRef.current;
      const gridSpotIndex = Math.floor(Math.random() * app.gridMaxIndex);
      const gridSpot = app.grid[gridSpotIndex];
      const x = gridSpot.x;
      const y = gridSpot.y;

      const particle: Particle = {
        hue: 210 + Math.floor(20 * Math.random()), // Blue-gray range
        sat: 40 + Math.floor(30 * Math.random()), // Lower saturation for subtle effect
        lum: 50 + Math.floor(20 * Math.random()), // Lighter for visibility on dark bg
        x: x,
        y: y,
        xLast: x,
        yLast: y,
        xSpeed: 0,
        ySpeed: 0,
        age: 0,
        ageSinceStuck: 0,
        attractor: {
          oldIndex: gridSpotIndex,
          gridSpotIndex: gridSpotIndex,
        },
        name: 'seed-' + Math.ceil(10000000 * Math.random())
      };
      app.particles.push(particle);
    };

    const kill = (particleName: string) => {
      const app = appRef.current;
      app.particles = app.particles.filter(seed => seed.name !== particleName);
    };

    const move = () => {
      const app = appRef.current;

      for (let i = 0; i < app.particles.length; i++) {
        const p = app.particles[i];

        p.xLast = p.x;
        p.yLast = p.y;

        const index = p.attractor.gridSpotIndex;
        let gridSpot = app.grid[index];

        if (Math.random() < 0.5) {
          if (!gridSpot.isEdge) {
            const topIndex = index - 1;
            const bottomIndex = index + 1;
            const leftIndex = index - app.gridSteps;
            const rightIndex = index + app.gridSteps;
            const topSpot = app.grid[topIndex];
            const bottomSpot = app.grid[bottomIndex];
            const leftSpot = app.grid[leftIndex];
            const rightSpot = app.grid[rightIndex];

            const chaos = 30;
            const spots = [topSpot, bottomSpot, leftSpot, rightSpot];
            let maxFieldSpot = spots[0];
            let maxField = spots[0].field + chaos * Math.random();

            for (const spot of spots) {
              const field = spot.field + chaos * Math.random();
              if (field > maxField) {
                maxField = field;
                maxFieldSpot = spot;
              }
            }

            const potentialNewGridSpot = maxFieldSpot;
            if (potentialNewGridSpot.busyAge === 0 || potentialNewGridSpot.busyAge > 15) {
              p.ageSinceStuck = 0;
              p.attractor.oldIndex = index;
              p.attractor.gridSpotIndex = potentialNewGridSpot.spotIndex;
              gridSpot = potentialNewGridSpot;
              gridSpot.busyAge = 1;
            } else {
              p.ageSinceStuck++;
            }
          } else {
            p.ageSinceStuck++;
          }

          if (p.ageSinceStuck === 10) {
            kill(p.name);
            continue;
          }
        }

        const k = 5; // Slower, more elegant movement
        const visc = 0.4;
        const dx = p.x - gridSpot.x;
        const dy = p.y - gridSpot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const xAcc = -k * dx;
        const yAcc = -k * dy;

        p.xSpeed += xAcc;
        p.ySpeed += yAcc;

        p.xSpeed *= visc;
        p.ySpeed *= visc;

        p.speed = Math.sqrt(p.xSpeed * p.xSpeed + p.ySpeed * p.ySpeed);
        p.dist = dist;

        p.x += 0.1 * p.xSpeed;
        p.y += 0.1 * p.ySpeed;

        p.age++;

        if (p.age > app.lifespan) {
          kill(p.name);
          app.deathCount++;
        }
      }
    };

    const dataXYtoCanvasXY = (x: number, y: number) => {
      const app = appRef.current;
      const zoom = 1.6;
      const xx = app.xC + x * zoom * app.dataToImageRatio;
      const yy = app.yC + y * zoom * app.dataToImageRatio;
      return { x: xx, y: yy };
    };

    const draw = () => {
      const app = appRef.current;
      if (!app.ctx) return;

      app.drawnInLastFrame = 0;
      if (!app.particles.length) return;

      // Fade effect to clear previous frames cleanly
      app.ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; // Increased fade to reduce trail buildup
      app.ctx.fillRect(0, 0, app.width, app.height);

      for (let i = 0; i < app.particles.length; i++) {
        const p = app.particles[i];

        const h = p.hue + app.stepCount / 30;
        const s = p.sat;
        const l = p.lum;
        const a = 0.35; // Semi-transparent for subtle, blurred effect

        const last = dataXYtoCanvasXY(p.xLast, p.yLast);
        const now = dataXYtoCanvasXY(p.x, p.y);
        const attracSpot = app.grid[p.attractor.gridSpotIndex];
        const attracXY = dataXYtoCanvasXY(attracSpot.x, attracSpot.y);
        const oldAttracSpot = app.grid[p.attractor.oldIndex];
        const oldAttracXY = dataXYtoCanvasXY(oldAttracSpot.x, oldAttracSpot.y);

        app.ctx.beginPath();
        app.ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        app.ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;

        app.ctx.moveTo(last.x, last.y);
        app.ctx.lineTo(now.x, now.y);
        app.ctx.lineWidth = 1.5 * app.dataToImageRatio;
        app.ctx.stroke();
        app.ctx.closePath();

        app.ctx.beginPath();
        app.ctx.lineWidth = 1.5 * app.dataToImageRatio;
        app.ctx.moveTo(oldAttracXY.x, oldAttracXY.y);
        app.ctx.lineTo(attracXY.x, attracXY.y);
        app.ctx.arc(attracXY.x, attracXY.y, 1.5 * app.dataToImageRatio, 0, 2 * Math.PI, false);

        app.ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        app.ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${a})`;
        app.ctx.stroke();
        app.ctx.fill();
        app.ctx.closePath();

        app.drawnInLastFrame++;
      }
    };

    const frame = () => {
      evolve();
      animationRef.current = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent', zIndex: -1 }}
    />
  );
}
