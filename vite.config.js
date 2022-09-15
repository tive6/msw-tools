import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

console.log("[NODE_ENV]", process.env.NODE_ENV);
const isProd = process.env.NODE_ENV === "production";

let lib = {};
let customElement = false;
if (isProd) {
  lib = {
    entry: "src/components/index.js",
    name: "MswTools",
    formats: ["umd", "iife"],
    fileName: "msw-tools.min",
  };
  customElement = true;
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib,
  },
  define: {
    "process.env": {},
  },
  plugins: [
    svelte({
      compilerOptions: {
        // You can optionally set 'customElement' to 'true' to compile
        // your components to custom elements (aka web elements)
        customElement,
      },
    }),
  ],
});
