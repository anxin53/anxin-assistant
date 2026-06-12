import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { AppSettings } from '../shared/types';

const defaultSettings: AppSettings = {
  gpuBackups: {},
  colorBackups: {},
  importedProfiles: [],
  filters: {
    brightness: 0,
    contrast: 0,
    gamma: 1,
    saturation: 0,
    temperature: 0
  }
};

let settingsPath = '';

export function initializeSettings(userDataPath: string): void {
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }

  settingsPath = path.join(userDataPath, 'settings.json');
  if (!existsSync(settingsPath)) {
    writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
  }
}

export function getSettings(): AppSettings {
  ensureInitialized();
  let current: Partial<AppSettings> = {};
  try {
    current = JSON.parse(readFileSync(settingsPath, 'utf8')) as Partial<AppSettings>;
  } catch {
    current = {};
  }

  return {
    ...defaultSettings,
    ...current,
    filters: {
      ...defaultSettings.filters,
      ...(current.filters || {})
    },
    gpuBackups: current.gpuBackups || {},
    colorBackups: current.colorBackups || {},
    importedProfiles: current.importedProfiles || []
  };
}

export function setSettings(settings: AppSettings): AppSettings {
  ensureInitialized();
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  return getSettings();
}

export function patchSettings(patch: Partial<AppSettings>): AppSettings {
  setSettings({
    ...getSettings(),
    ...patch
  });
  return getSettings();
}

function ensureInitialized(): void {
  if (!settingsPath) {
    throw new Error('Settings store is not initialized.');
  }
}
