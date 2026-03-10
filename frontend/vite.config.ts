import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("@chakra-ui") ||
            id.includes("@emotion") ||
            id.includes("@zag-js")
          ) {
            return "chakra-vendor";
          }

          if (
            id.includes("react-dom") ||
            id.includes("react/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query-vendor";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n-vendor";
          }

          return "vendor";
        },
      },
    },
  },
})
