import { defineConfig } from "vite";

export default defineConfig({
    build: {
        minify: "esbuild",
    },
    esbuild: {
        drop: ["console", "debugger"],
    },
});
