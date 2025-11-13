/**
 * Grain Texture Overlay Component
 *
 * Adds a subtle film grain / noise effect to create depth and sophistication.
 * Inspired by Apple, Stripe, and modern trading platforms.
 *
 * Usage: <GrainTexture opacity={0.03} />
 */

interface GrainTextureProps {
  opacity?: number;
  animate?: boolean;
  className?: string;
}

export function GrainTexture({
  opacity = 0.03,
  animate = true,
  className = ""
}: GrainTextureProps) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-50 ${className}`}
        style={{
          opacity,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.5' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          ...(animate && {
            animation: 'grain 8s steps(10) infinite'
          })
        }}
      />

      {animate && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes grain {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-5%, -10%); }
            20% { transform: translate(-15%, 5%); }
            30% { transform: translate(7%, -25%); }
            40% { transform: translate(-5%, 25%); }
            50% { transform: translate(-15%, 10%); }
            60% { transform: translate(15%, 0%); }
            70% { transform: translate(0%, 15%); }
            80% { transform: translate(3%, 35%); }
            90% { transform: translate(-10%, 10%); }
          }
        `}} />
      )}
    </>
  );
}
