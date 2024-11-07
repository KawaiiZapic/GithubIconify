declare module "virtual:icons" {
    const icons: Required<
        Omit<
            import("material-icon-theme").Manifest,
            "iconDefinitions"
            | "light"
            | "hidesExplorerArrows"
            | "highContrast"
            | "folderExpanded"
            | "folderNamesExpanded"
        >
    >;
    export default icons;
}