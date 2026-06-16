import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Two build modes:
//   - default: builds the demo site (index.html) for preview/deploy
//   - lib:     builds the distributable, framework-agnostic widget
export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      build: {
        lib: {
          entry: here("src/walkthrough/index.ts"),
          name: "Walkthrough",
          fileName: "walkthrough",
          formats: ["es", "umd"],
        },
        emptyOutDir: true,
      },
    };
  }

  return {
    server: { open: false, host: true, port: 5173 },
  };
});
