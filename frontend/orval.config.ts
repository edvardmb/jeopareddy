import { defineConfig } from "orval";

const apiBaseUrl = process.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export default defineConfig({
  jeopareddy: {
    input: `${apiBaseUrl}/openapi/v1.json`,
    output: {
      target: "./src/api/generated/jeopareddy.ts",
      schemas: "./src/api/generated/models",
      client: "react-query",
      mode: "single",
      override: {
        mutator: {
          path: "./src/api/orvalFetcher.ts",
          name: "orvalFetcher",
        },
      },
    },
  },
});
