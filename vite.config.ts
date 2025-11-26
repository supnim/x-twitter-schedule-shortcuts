import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/**
 * Plugin to copy manifest.json to dist after build
 */
function copyManifest(): Plugin {
	return {
		name: "copy-manifest",
		closeBundle() {
			const distDir = resolve(__dirname, "dist");
			copyFileSync(resolve(__dirname, "manifest.json"), resolve(distDir, "manifest.json"));
			console.log("manifest.json copied to dist/");
		},
	};
}

export default defineConfig({
	plugins: [react(), copyManifest()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				"content-script": resolve(__dirname, "src/content/index.tsx"),
				background: resolve(__dirname, "src/background/index.ts"),
			},
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				assetFileNames: "[name].[ext]",
			},
		},
		cssCodeSplit: false,
	},
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
});
