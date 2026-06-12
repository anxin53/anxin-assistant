/// <reference types="vite/client" />

import type { LightQualityApi } from '../electron/preload';

declare global {
  interface Window {
    lightQuality: LightQualityApi;
  }
}
