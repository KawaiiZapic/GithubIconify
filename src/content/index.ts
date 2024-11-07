import { runtime } from "webextension-polyfill";
import Icons from "virtual:icons";

(async () => {
    const fileExts = Object.keys(Icons.fileExtensions).map(v => "." + v);
    const getIcon = (name: string, isOpen: boolean = false) => {
        return runtime.getURL("icons/" + name + (isOpen ? "-open" : "") + ".svg");
    };
    const getFileExt = (name: string) => {
        const id = name.lastIndexOf(".");
        return id > -1 ? name.substring(id + 1) : name;
    }
    const getFolderName = (name: string) => {
        const id = name.indexOf("/");
        return id > -1 ? name.substring(0, id) : name;
    }
    const getFileIcon = (fileName: string) : HTMLImageElement => {
        const name = fileName.toLocaleLowerCase();
        let url = getIcon(Icons.file);
        const img = document.createElement("img");
        if (name in Icons.fileNames) {
            url = getIcon(Icons.fileNames[name]);
        } else {
            const matched = fileExts.filter(v => name.endsWith(v)).sort((a, b) => a.length - b.length)[0]?.substring(1);
            if (matched in Icons.fileExtensions) {
                url = getIcon(Icons.fileExtensions[matched]);
            } else {
                const ext = getFileExt(name);
                if (ext in Icons.fileExtensions) {
                    url = getIcon(Icons.fileExtensions[ext]);
                } else if (ext in Icons.languageIds) {
                    url = getIcon(Icons.languageIds[ext]);
                }
            }
        }
        img.src = url;
        return img;
    }
    const getFolderIcon = (folderName: string, isOpen: boolean) : HTMLImageElement => {
        const name = getFolderName(folderName).toLocaleLowerCase();
        let url = getIcon(Icons.folder, isOpen);
        const img = document.createElement("img");
        if (name in Icons.folderNames) {
            url = getIcon(Icons.folderNames[name], isOpen);
        }
        img.src = url;
        return img;
    }
    const handlerNormal = (v: Element) => {
        const fileName = v.nextElementSibling!.textContent!;
        const isDir = v.classList.contains("icon-directory");
        const x = isDir ? getFolderIcon(fileName, false) : getFileIcon(fileName);
        v.replaceWith(x);
    }
    const handlerSideListDirectory = (v: Element) => {
        const isDirOpen = v.classList.contains("octicon-file-directory-open-fill");
        const fileName = v.parentElement!.parentElement!.nextElementSibling!.textContent!;
        v.previousElementSibling?.remove();
        const x = getFolderIcon(fileName, isDirOpen);
        v.replaceWith(x);
    }
    const handlerSideListFile = (v: Element) => {
        const fileName = v.parentElement!.nextElementSibling!.textContent!;
        const x = getFileIcon(fileName);
        v.replaceWith(x);
    }
    const ob = new MutationObserver(() => {
        document.querySelectorAll(".react-directory-filename-column > svg").forEach(v => {
            handlerNormal(v);
        });
        document.querySelectorAll(".PRIVATE_TreeView-item-visual > .octicon-file").forEach(v => {
            handlerSideListFile(v);
        });
        document.querySelectorAll(".PRIVATE_TreeView-item-visual .octicon-file-directory-fill, .PRIVATE_TreeView-item-visual .octicon-file-directory-open-fill").forEach(v => {
            handlerSideListDirectory(v);
        });
        document.querySelectorAll("a[data-testid='up-tree'] svg").forEach(v => {
            v.replaceWith(getFolderIcon("", false));
        });
    });
    ob.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
