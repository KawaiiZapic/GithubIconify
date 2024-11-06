import {
    generateFileIcons,
    generateFolderIcons,
    generateManifest,
    getDefaultConfig
} from "../dependencies/vscode-material-icon-theme/src/core";

import { bundledLanguagesInfo } from "shiki";

import fs from "fs";
import type { Plugin } from "vite";

export default (): Plugin => {
    let copyPublic = false;
    return {
        name: "generate-json",
        configResolved(config) {
            copyPublic = !!config.publicDir;
        },
        closeBundle: {
            handler() {
                try {
                    copyPublic && fs.cpSync("./dependencies/vscode-material-icon-theme/icons", "./dist/icons", { recursive: true });
                } catch (error) {
                    console.error(error);
                    throw Error('An error while generating the manifest occurred!');
                }
            },
            order: "post"
        },
        resolveId(id) {
            if (id === "virtual:icons") {
                return "\0virtual:icons";
            }
        },
        load(id) {
            if (id === "\0virtual:icons") {
                const config = getDefaultConfig();
                generateFileIcons(config.files.color, config.opacity, config.saturation);
                generateFolderIcons(config.folders.color, config.opacity, config.saturation);

                const manifest = generateManifest();
                delete manifest.iconDefinitions;
                delete manifest.light;
                delete manifest.hidesExplorerArrows;
                delete manifest.highContrast;
                delete manifest.folderExpanded;
                delete manifest.folderNamesExpanded;
                const exts = Object.fromEntries(bundledLanguagesInfo.flatMap((i) => i.aliases?.map((a) => [a, i.id]) || []));
                for (const id in exts) {
                    if (fs.existsSync("./dependencies/vscode-material-icon-theme/icons/" + exts[id] + ".svg")) {
                        manifest.languageIds![id] = exts[id];
                    }
                }
                return "export default " + JSON.stringify(manifest, null, 2);
            }
        }
    };

}