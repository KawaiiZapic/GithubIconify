import { defineConfig, UserConfig } from "vite";
import GenerateJSON from "./plugins/GenerateJSON";
import zip from "./plugins/ViteZip";

export default defineConfig(() => {
	return {
		plugins: [
			GenerateJSON(),
			zip({
				outDir: "dist"
			})
		],
		build: {
			emptyOutDir: true,
			minify: false,
			target: "esnext",
			rollupOptions: {
				input: {
					"content-script": "src/content/index.ts"
				},
				output: {
					entryFileNames: "[name].js",
					format: "iife"
				}
			}
		}
	} as UserConfig;
});
