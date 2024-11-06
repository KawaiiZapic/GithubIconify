import { defineConfig, UserConfig } from "vite";
import GenerateJSON from "./plugins/GenerateJSON";

export default defineConfig((env) => {
	return {
		plugins: [
			GenerateJSON()
		],
		build: {
			emptyOutDir: true,
			minify: false,
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
