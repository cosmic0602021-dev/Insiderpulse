import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'insiderpulse',
  brand: {
    displayName: 'InsiderPulse',
    primaryColor: '#3182F6',
    icon: './client/public/favicon.ico',
    bridgeColorMode: 'basic',
  },
  web: {
    host: '0.0.0.0',
    port: 5000,
    publicUrl: 'https://insiderpulse.pro',
    commands: {
      dev: 'npm run dev',
      build: 'vite build',
    },
  },
  permissions: [],
});
