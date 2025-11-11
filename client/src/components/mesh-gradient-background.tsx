import { useEffect, useState } from 'react';

export function MeshGradientBackground() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <style>{`
        @keyframes mesh-move-1 {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg);
          }
          33% {
            transform: translate(30%, -30%) rotate(120deg);
          }
          66% {
            transform: translate(-20%, 20%) rotate(240deg);
          }
        }

        @keyframes mesh-move-2 {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg);
          }
          33% {
            transform: translate(-30%, 30%) rotate(-120deg);
          }
          66% {
            transform: translate(20%, -20%) rotate(-240deg);
          }
        }

        @keyframes mesh-move-3 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
          }
          50% {
            transform: translate(-10%, 10%) scale(1.1);
          }
        }

        @keyframes mesh-move-4 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
          }
          50% {
            transform: translate(10%, -10%) scale(0.9);
          }
        }

        .mesh-gradient-container {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
          background: #0f172a;
        }

        .mesh-gradient {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          opacity: 0.8;
        }

        .gradient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          mix-blend-mode: normal;
          will-change: transform;
        }

        .gradient-blob-1 {
          width: 50%;
          height: 50%;
          top: 10%;
          left: 10%;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, transparent 70%);
          animation: mesh-move-1 20s ease-in-out infinite;
        }

        .gradient-blob-2 {
          width: 60%;
          height: 60%;
          top: 40%;
          right: 10%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          animation: mesh-move-2 25s ease-in-out infinite;
        }

        .gradient-blob-3 {
          width: 55%;
          height: 55%;
          bottom: 10%;
          left: 20%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%);
          animation: mesh-move-3 30s ease-in-out infinite;
        }

        .gradient-blob-4 {
          width: 45%;
          height: 45%;
          bottom: 20%;
          right: 20%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
          animation: mesh-move-4 22s ease-in-out infinite;
        }

        .gradient-blob-5 {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 40%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          animation: mesh-move-1 28s ease-in-out infinite reverse;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .gradient-blob {
            animation: none !important;
          }
        }

        /* Noise texture overlay for added depth */
        .mesh-gradient::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          opacity: 0.5;
          mix-blend-mode: overlay;
        }
      `}</style>

      <div className="mesh-gradient-container">
        <div className="mesh-gradient">
          <div className="gradient-blob gradient-blob-1"></div>
          <div className="gradient-blob gradient-blob-2"></div>
          <div className="gradient-blob gradient-blob-3"></div>
          <div className="gradient-blob gradient-blob-4"></div>
          <div className="gradient-blob gradient-blob-5"></div>
        </div>
      </div>
    </>
  );
}
