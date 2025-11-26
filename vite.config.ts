import { resolve } from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.json";

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
		},
		cors: {
			origin: "*",
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
