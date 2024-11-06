

declare module "virtual:icons" {
    const icons: Required<Omit<
        import("../dependencies/vscode-material-icon-theme/src/core/models/manifest").Manifest,
        "iconDefinitions"
        | "light"
        | "hidesExplorerArrows"
        | "highContrast"
        | "folderExpanded"
        | "folderNamesExpanded"
    >>;
    export default icons;
}