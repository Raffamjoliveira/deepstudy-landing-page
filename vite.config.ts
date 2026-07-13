import path from 'path';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [],
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            termos: path.resolve(__dirname, 'termos/index.html'),
            privacidade: path.resolve(__dirname, 'privacidade/index.html'),
            empresa: path.resolve(__dirname, 'empresa/index.html'),
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});