/**
 * Brutalist Grid Overlay Component
 *
 * Adds geometric grid patterns inspired by trading platforms,
 * Stripe, and brutalist design principles.
 *
 * Provides multiple grid styles: dots, lines, mesh
 */

interface BrutalistGridProps {
  variant?: 'dots' | 'lines' | 'mesh' | 'data';
  opacity?: number;
  className?: string;
  animate?: boolean;
}

export function BrutalistGrid({
  variant = 'lines',
  opacity = 0.15,
  className = "",
  animate = false
}: BrutalistGridProps) {
  const renderGrid = () => {
    switch (variant) {
      case 'dots':
        return (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
              opacity
            }}
          />
        );

      case 'lines':
        return (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              opacity
            }}
          />
        );

      case 'mesh':
        return (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px),
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
              backgroundPosition: '0 0, 0 0, 0 0, 0 0',
              opacity
            }}
          />
        );

      case 'data':
        // Trading platform inspired data grid
        return (
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity }}
          >
            <defs>
              <pattern
                id="data-grid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                {/* Major grid lines */}
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.3"
                />
                {/* Minor grid lines */}
                <path
                  d="M 40 0 L 40 80 M 0 40 L 80 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#data-grid)" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 text-foreground/20 ${
        animate ? 'animate-pulse-slow' : ''
      } ${className}`}
    >
      {renderGrid()}
    </div>
  );
}
