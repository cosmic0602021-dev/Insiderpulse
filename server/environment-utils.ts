/**
 * Environment Utilities
 * Helper functions to detect environment (PWA vs Apps-in-Toss)
 */

import type { Request } from 'express';

/**
 * Check if request is from Apps-in-Toss environment
 * Detects via headers: x-appintos-env or origin/referer containing tossmini.com
 */
export function isAppintosEnvironment(req: Request): boolean {
  // Check x-appintos-env header
  if (req.headers['x-appintos-env'] === 'true') {
    return true;
  }

  // Check origin or referer for tossmini.com
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin.includes('tossmini.com') || origin.includes('apps-in-toss')) {
    return true;
  }

  return false;
}
