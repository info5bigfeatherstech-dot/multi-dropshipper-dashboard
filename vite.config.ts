import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = env.VITE_BACKEND_BASE_URL 
    ? env.VITE_BACKEND_BASE_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:8081';

  return {
    plugins: [
      react(),
      {
        name: 'catalog-categories-fallback',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url === '/catalog/categories' || url === '/api/dropshipper/catalog/categories') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                categories: ['All', 'Electronics', 'Audio', 'Home & Living', 'Beauty & Wellness', 'Kitchenware']
              }));
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        },
        '/catalog': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => `/api/dropshipper${path}`
        },
        '/orders': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => `/api/dropshipper${path}`,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) {
              return '/index.html';
            }
          }
        }
      }
    }
  };
});
