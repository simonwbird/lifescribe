import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f4da578ccf694b70a8cfb3f7b8479f0b',
  appName: 'life-legacy',
  webDir: 'dist',
  server: {
    url: 'https://f4da578c-cf69-4b70-a8cf-b3f7b8479f0b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;