declare global {
  interface ImportMetaEnv {
    readonly VITE_MODE: 'development' | 'production' | 'test';
    readonly VITE_BASE_URL: string;
    readonly VITE_BASE_PATH: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};