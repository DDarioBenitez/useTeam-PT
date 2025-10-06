import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfiPaths from "vite-tsconfig-paths";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tsConfiPaths(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "../shared/src"),
        },
    },
    server: {
        fs: {
            allow: [path.resolve(__dirname, "..")],
        },
    },
});
