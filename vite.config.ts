import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
    return {
        build: {
            minify: "esbuild",
        },
        esbuild: {
            // On ne supprime les consoles QUE si on est en mode 'build' (production)
            drop: command === "build" ? ["console", "debugger"] : [],
        },
    };
});
