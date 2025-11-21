/**
 * Stripe-style Mesh Gradient Background
 *
 * Sophisticated radial gradients with multiple color stops
 * inspired by Stripe's premium design system.
 *
 * Colors: Purple (#a960ee), Cyan (#90e0ff), Gold (#ffcb57), Red (#ff333d)
 */

interface StripeMeshGradientProps {
  variant?: 'default' | 'purple' | 'blue' | 'warm';
  opacity?: number;
  animate?: boolean;
  className?: string;
}

export function StripeMeshGradient({
  variant = 'default',
  opacity = 0.6,
  animate = true,
  className = ""
}: StripeMeshGradientProps) {
  const gradientVariants = {
    default: {
      gradient1: 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 50%)',
      gradient2: 'radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%)',
      gradient3: 'radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%)',
      gradient4: 'radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%)',
      gradient5: 'radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%)',
      gradient6: 'radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%)',
      gradient7: 'radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)',
    },
    purple: {
      gradient1: 'radial-gradient(at 40% 20%, hsla(270, 80%, 65%, 0.8) 0px, transparent 50%)',
      gradient2: 'radial-gradient(at 80% 0%, hsla(189, 100%, 78%, 0.6) 0px, transparent 50%)',
      gradient3: 'radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.4) 0px, transparent 50%)',
      gradient4: 'radial-gradient(at 80% 80%, hsla(256, 96%, 67%, 0.7) 0px, transparent 50%)',
      gradient5: 'radial-gradient(at 0% 100%, hsla(45, 100%, 70%, 0.5) 0px, transparent 50%)',
      gradient6: 'radial-gradient(at 50% 50%, hsla(240, 70%, 50%, 0.3) 0px, transparent 50%)',
      gradient7: 'radial-gradient(at 100% 50%, hsla(280, 80%, 70%, 0.4) 0px, transparent 50%)',
    },
    blue: {
      gradient1: 'radial-gradient(at 30% 30%, hsla(210, 100%, 60%, 0.7) 0px, transparent 50%)',
      gradient2: 'radial-gradient(at 70% 70%, hsla(190, 100%, 70%, 0.6) 0px, transparent 50%)',
      gradient3: 'radial-gradient(at 50% 0%, hsla(220, 90%, 65%, 0.5) 0px, transparent 50%)',
      gradient4: 'radial-gradient(at 0% 80%, hsla(200, 100%, 75%, 0.4) 0px, transparent 50%)',
      gradient5: 'radial-gradient(at 100% 20%, hsla(230, 80%, 60%, 0.6) 0px, transparent 50%)',
      gradient6: 'radial-gradient(at 20% 100%, hsla(195, 100%, 80%, 0.5) 0px, transparent 50%)',
      gradient7: 'radial-gradient(at 80% 40%, hsla(215, 85%, 55%, 0.4) 0px, transparent 50%)',
    },
    warm: {
      gradient1: 'radial-gradient(at 50% 20%, hsla(45, 100%, 70%, 0.6) 0px, transparent 50%)',
      gradient2: 'radial-gradient(at 80% 80%, hsla(15, 90%, 65%, 0.5) 0px, transparent 50%)',
      gradient3: 'radial-gradient(at 20% 80%, hsla(355, 85%, 70%, 0.4) 0px, transparent 50%)',
      gradient4: 'radial-gradient(at 90% 30%, hsla(35, 100%, 75%, 0.7) 0px, transparent 50%)',
      gradient5: 'radial-gradient(at 10% 10%, hsla(25, 95%, 60%, 0.5) 0px, transparent 50%)',
      gradient6: 'radial-gradient(at 60% 90%, hsla(5, 80%, 65%, 0.4) 0px, transparent 50%)',
      gradient7: 'radial-gradient(at 40% 60%, hsla(40, 90%, 70%, 0.3) 0px, transparent 50%)',
    }
  };

  const currentGradients = gradientVariants[variant];
  const gradientString = Object.values(currentGradients).join(', ');

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 ${
        animate ? 'animate-mesh-gradient' : ''
      } ${className}`}
      style={{
        opacity,
        background: gradientString,
        filter: 'blur(80px) saturate(150%)',
      }}
    >
      {animate && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes mesh-gradient {
            0%, 100% {
              transform: scale(1) translateY(0);
            }
            33% {
              transform: scale(1.1) translateY(-10px);
            }
            66% {
              transform: scale(0.95) translateY(10px);
            }
          }

          .animate-mesh-gradient {
            animation: mesh-gradient 20s ease-in-out infinite;
          }
        `}} />
      )}
    </div>
  );
}
