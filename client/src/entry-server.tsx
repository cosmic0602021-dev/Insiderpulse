import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import App from './App';

// Simple memory-based location hook for SSR
function useStaticLocation() {
  return ['/', () => {}] as const;
}

// Server-side rendering function
export function render(url: string) {
  // Render the React app to an HTML string with static location for SSR
  const html = renderToString(
    <Router hook={useStaticLocation}>
      <App />
    </Router>
  );

  return { html };
}
