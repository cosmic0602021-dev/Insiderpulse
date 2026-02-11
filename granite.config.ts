import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'insiderpulse',
  brand: {
    displayName: '인사이더펄스',
    primaryColor: '#3182F6',
    icon: 'https://insiderpulse.pro/insiderpulse_appintoss.png',
    bridgeColorMode: 'basic',
  },
  web: {
    host: '0.0.0.0',
    port: 5000,
    publicUrl: 'https://insiderpulse.pro',
    commands: {
      dev: 'npm run dev',
      build: 'npm run build:ait',
    },
  },
  permissions: [
    {
      name: 'clipboard',
      access: 'read',
    },
    {
      name: 'clipboard',
      access: 'write',
    },
  ],
});
