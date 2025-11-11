import { useEffect, useState } from 'react';

export function AuroraBackground() {
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
        @keyframes aurora-1 {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg) scale(1);
            opacity: 0.6;
          }
          33% {
            transform: translate(30%, -20%) rotate(120deg) scale(1.1);
            opacity: 0.8;
          }
          66% {
            transform: translate(-20%, 30%) rotate(240deg) scale(0.95);
            opacity: 0.7;
          }
        }

        @keyframes aurora-2 {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg) scale(1);
            opacity: 0.5;
          }
          33% {
            transform: translate(-30%, 30%) rotate(-120deg) scale(1.15);
            opacity: 0.7;
          }
          66% {
            transform: translate(25%, -25%) rotate(-240deg) scale(0.9);
            opacity: 0.6;
          }
        }

        @keyframes aurora-3 {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate(15%, 20%) rotate(180deg) scale(1.2);
            opacity: 0.9;
          }
        }

        @keyframes aurora-border {
          0%, 100% {
            border-radius: 50% 60% 70% 40%;
          }
          25% {
            border-radius: 60% 40% 50% 70%;
          }
          50% {
            border-radius: 70% 50% 60% 40%;
          }
          75% {
            border-radius: 40% 70% 50% 60%;
          }
        }

        .aurora-container {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          background: #0f172a;
          pointer-events: none;
        }

        .aurora-gradient {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
        }

        .aurora-blob {
          position: absolute;
          filter: blur(80px);
          mix-blend-mode: normal;
          will-change: transform, opacity;
          animation: aurora-border 20s ease-in-out infinite;
        }

        .aurora-blob-1 {
          width: 70%;
          height: 70%;
          top: -5%;
          left: 10%;
          background: radial-gradient(circle at center,
            rgba(59, 130, 246, 0.25) 0%,
            rgba(59, 130, 246, 0.20) 25%,
            rgba(59, 130, 246, 0.12) 50%,
            transparent 70%
          );
          animation: aurora-1 25s ease-in-out infinite, aurora-border 20s ease-in-out infinite;
        }

        .aurora-blob-2 {
          width: 80%;
          height: 80%;
          top: 25%;
          right: -5%;
          background: radial-gradient(circle at center,
            rgba(79, 70, 229, 0.20) 0%,
            rgba(79, 70, 229, 0.15) 25%,
            rgba(79, 70, 229, 0.10) 50%,
            transparent 70%
          );
          animation: aurora-2 30s ease-in-out infinite, aurora-border 25s ease-in-out infinite reverse;
        }

        .aurora-blob-3 {
          width: 75%;
          height: 75%;
          bottom: 5%;
          left: 15%;
          background: radial-gradient(circle at center,
            rgba(99, 102, 241, 0.22) 0%,
            rgba(99, 102, 241, 0.17) 25%,
            rgba(99, 102, 241, 0.10) 50%,
            transparent 70%
          );
          animation: aurora-3 28s ease-in-out infinite, aurora-border 22s ease-in-out infinite;
        }

        .aurora-blob-4 {
          width: 65%;
          height: 65%;
          top: 35%;
          left: 35%;
          background: radial-gradient(circle at center,
            rgba(37, 99, 235, 0.18) 0%,
            rgba(37, 99, 235, 0.14) 25%,
            rgba(37, 99, 235, 0.08) 50%,
            transparent 70%
          );
          animation: aurora-1 32s ease-in-out infinite reverse, aurora-border 18s ease-in-out infinite reverse;
        }

        .aurora-blob-5 {
          width: 60%;
          height: 60%;
          bottom: 15%;
          right: 10%;
          background: radial-gradient(circle at center,
            rgba(67, 56, 202, 0.20) 0%,
            rgba(67, 56, 202, 0.15) 25%,
            rgba(67, 56, 202, 0.09) 50%,
            transparent 70%
          );
          animation: aurora-2 27s ease-in-out infinite reverse, aurora-border 23s ease-in-out infinite;
        }

        /* Accent gradient layers for more depth */
        .aurora-blob-6 {
          width: 55%;
          height: 55%;
          top: 55%;
          left: 45%;
          background: radial-gradient(circle at center,
            rgba(30, 64, 175, 0.15) 0%,
            rgba(30, 64, 175, 0.12) 25%,
            transparent 60%
          );
          animation: aurora-3 24s ease-in-out infinite reverse, aurora-border 20s ease-in-out infinite reverse;
        }

        /* Reduced motion support - disabled to ensure animation always shows */
        /* @media (prefers-reduced-motion: reduce) {
          .aurora-blob {
            animation: none !important;
          }
        } */

        /* Noise texture overlay for added depth */
        .aurora-gradient::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* Vignette effect for better content readability */
        .aurora-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(15, 23, 42, 0.3) 70%,
            rgba(15, 23, 42, 0.6) 100%
          );
          pointer-events: none;
        }
      `}</style>

      <div className="aurora-container">
        <div className="aurora-gradient">
          <div className="aurora-blob aurora-blob-1"></div>
          <div className="aurora-blob aurora-blob-2"></div>
          <div className="aurora-blob aurora-blob-3"></div>
          <div className="aurora-blob aurora-blob-4"></div>
          <div className="aurora-blob aurora-blob-5"></div>
          <div className="aurora-blob aurora-blob-6"></div>
        </div>
      </div>
    </>
  );
}
