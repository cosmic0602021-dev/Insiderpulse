/**
 * Glassmorphism Card Component
 *
 * Linear + Stripe inspired glass effect cards
 * with backdrop blur and subtle borders
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered' | 'premium';
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  variant = 'default',
  hover = true,
  onClick
}: GlassCardProps) {
  const baseStyles = "backdrop-blur-xl bg-white/5 border transition-all duration-300";

  const variantStyles = {
    default: "border-white/10 rounded-2xl shadow-lg shadow-black/10",
    elevated: "border-white/20 rounded-3xl shadow-2xl shadow-black/20 bg-white/10",
    bordered: "border-white/30 rounded-xl shadow-xl shadow-black/15 ring-1 ring-white/10",
    premium: `
      border-white/20 rounded-3xl
      shadow-[0_50px_100px_-20px_rgba(50,50,93,.25),0_30px_60px_-30px_rgba(0,0,0,.3)]
      bg-gradient-to-br from-white/10 to-white/5
    `
  };

  const hoverStyles = hover
    ? "hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
