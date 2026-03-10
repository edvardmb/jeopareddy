import { createSystem, defaultConfig } from "@chakra-ui/react";

export const chakraSystem = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Segoe UI', Inter, sans-serif" },
        body: { value: "'Segoe UI', Inter, sans-serif" },
      },
    },
  },
});
