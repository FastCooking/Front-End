import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "vendor-icons",
              test: /node_modules[\\/]react-icons[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/auth": "http://localhost:8000",
      "/pedidos": {
        target: "http://localhost:8000",
        ws: true,
      },
      "/mesas": "http://localhost:8000",
      "/cardapio": "http://localhost:8000",
      "/restaurantes": "http://localhost:8000",
      "/usuarios": "http://localhost:8000",
      "/estoque": "http://localhost:8000",
      "/ficha-tecnica": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
      "/ws": {
        target: "http://localhost:8000",
        ws: true,
      },
    },
  },
});
