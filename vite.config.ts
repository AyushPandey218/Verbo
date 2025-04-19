
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    // Add the new allowed host
    allowedHosts: [
      '722783b8-1e45-4576-8bd4-f042e8990037.lovableproject.com',
      '620cdabf-6a4a-4e0b-8290-f0c52f2d370f.lovableproject.com'
    ],
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/socket\.io/, '/socket.io'),
        timeout: 60000,
        // Websocket configuration
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
          proxy.on('open', () => {
            console.log('WebSocket connection established');
          });
          proxy.on('close', () => {
            console.log('WebSocket connection closed');
          });
        }
      }
    }
  },
  plugins: [
    react({
      jsxImportSource: 'react',
      tsDecorators: true,
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
}));
