import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

console.log("[NODE_ENV]", process.env.NODE_ENV);
const isProd = process.env.NODE_ENV === "production";

let lib = {};
let customElement = false;
if (isProd) {
  lib = {
    entry: "src/components/index.js",
    name: "MswTools",
    formats: ["umd", "es"],
    fileName: "msw-tools.min",
  };
  customElement = true;
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // port: 3033
  },
  build: {
    lib,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
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
      preprocess: sveltePreprocess(),
    }),
  ],
});
