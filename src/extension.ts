import * as vscode from "vscode";
import { Stats } from "fs";
import { basename } from "path";
import { platform } from "process";
import { Configurator, Configuration } from "./configurator";
import { FileSizeUnit, lstat, getFileType, formatPermissions, formatSize, formatDate } from "./fsUtil";
import { StatusBarItem } from "./statusBarItem";
import { HTMLTableBuilder } from "./html";

class ActiveEditorUndefinedError extends Error {
    constructor() {
        super("Active editor is undefined");
        this.name = "ActiveEditorUndefinedError";
    }
}

class ActiveEditorDocumentNotFileError extends Error {
    constructor() {
        super("Active editor document is not a file");
        this.name = "ActiveEditorDocumentNotFileError";
    }
}

function formatStatusBarText(stats: Stats, cfg: Configuration): string {
    const properties = [];

    if (cfg.showPermissionsInStatusBar) {
        properties.push(formatPermissions(stats.mode));
    }
    if (cfg.showSizeInStatusBar) {
        properties.push(formatSize(stats.size, cfg.sizeUnit));
    }
    if (cfg.showATimeInStatusBar) {
        properties.push(`${formatDate(stats.atime, cfg.timeFormat)} (A)`);
    }
    if (cfg.showMTimeInStatusBar) {
        properties.push(`${formatDate(stats.mtime, cfg.timeFormat)} (M)`);
    }
    if (cfg.showCTimeInStatusBar) {
        properties.push(`${formatDate(stats.ctime, cfg.timeFormat)} (C)`);
    }

    return `[ ${properties.join(" | ")} ]`;
}

function getActiveFilePath(): string {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        throw new ActiveEditorUndefinedError();
    }
    const uri = activeEditor.document.uri;
    if (uri.scheme !== "file") {
        throw new ActiveEditorDocumentNotFileError();
    }
    return uri.fsPath;
}

function createViewDetailsHandler(cfg: Configuration) {
    return async () => {
        try {
            const path = getActiveFilePath();
            const stats = await lstat(path);
            const name = basename(path);

            const panel = vscode.window.createWebviewPanel("FileProperties", `Properties of ${name}`, vscode.ViewColumn.Beside, {});
            const htmlTable = new HTMLTableBuilder(["Property", "Value"]);

            htmlTable.addRow(["Name", `${name} `]);
            htmlTable.addRow(["Path", `${path}`]);
            htmlTable.addRow(["Type", `${getFileType(stats)}`]);
            htmlTable.addRow(["Ownership", `UID=${stats.uid}, GID=${stats.gid}`]);
            htmlTable.addRow(["Permissions", `<b>${formatPermissions(stats.mode)}</b> (oct: ${stats.mode.toString(8)})`]);
            htmlTable.addRow(["Size", `<b>${formatSize(stats.size, cfg.sizeUnit)}</b> (${stats.size} B)`]);

            htmlTable.addRow(["ID of containing device", `${stats.dev}`]);
            htmlTable.addRow([platform === "win32" ? "File Index" : "I-node Number", `${stats.ino}`]);
            htmlTable.addRow(["Hardware Link Count", `${stats.nlink}`]);

            htmlTable.addRow(["Blocks Allocated", `<b>${stats.blocks}</b> (* 512 = ${stats.blocks * 512} B)`]);
            htmlTable.addRow(["Preferred I/O Block Size", `${stats.blksize}`]);
            htmlTable.addRow(["Type of device", `${stats.rdev}`]);

            htmlTable.addRow(["Last Access Time", `${formatDate(stats.atime, cfg.timeFormat)}`]);
            htmlTable.addRow(["Last Modification Time", `${formatDate(stats.mtime, cfg.timeFormat)}`]);
            htmlTable.addRow(["Last Metadata Change Time", `${formatDate(stats.ctime, cfg.timeFormat)}`]);
            htmlTable.addRow(["Creation Time", `${formatDate(stats.birthtime, cfg.timeFormat)}`]);

            panel.webview.html = htmlTable.build();
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[File Properties] ${error.message}`);
            } else {
                console.error(`[File Properties] An unknown error occurred`);
            }
        }
    };
}

function createUpdateAndShowStatusBarFn(statusBarItem: StatusBarItem, cfg: Configuration) {
    return async () => {
        try {
            const path = getActiveFilePath();
            const stats = await lstat(path);
            statusBarItem.text = formatStatusBarText(stats, cfg);;
            statusBarItem.show();
        } catch (error) {
            if (error instanceof ActiveEditorUndefinedError || error instanceof ActiveEditorDocumentNotFileError) {
                statusBarItem.hide();
            } else if (error instanceof Error) {
                console.error(`[File Properties] ${error.message}`);
            } else {
                console.error(`[File Properties] An unknown error occurred`);
            }
        }
    };
}

function createChangeEventListener(statusBarItem: StatusBarItem) {
    return (cfg: Configuration) => {
        statusBarItem.alignment = cfg.statusBarAlignment;
    };
}

function createOnDidSaveTextDocumentListener(cb: () => any) {
    return (document: vscode.TextDocument) => {
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (activeDocument === document) {
            cb();
        }
    };
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    const configurator = Configurator.getInstance();
    const configuration = configurator.configuration;

    const disposables: vscode.Disposable[] = [];

    disposables.push(vscode.commands.registerCommand("file-properties.viewDetails", createViewDetailsHandler(configuration)));

    const statusBarItem = new StatusBarItem(configuration.statusBarAlignment, 1024);
    statusBarItem.tooltip = "Click to view more detailed file properties";
    statusBarItem.command = "file-properties.viewDetails";
    disposables.push(statusBarItem);

    configurator.addChangeEventListener(createChangeEventListener(statusBarItem));

    const updateAndShowStatusBarFn = createUpdateAndShowStatusBarFn(statusBarItem, configuration);
    disposables.push(vscode.window.onDidChangeActiveTextEditor(updateAndShowStatusBarFn));
    disposables.push(vscode.workspace.onDidSaveTextDocument(createOnDidSaveTextDocumentListener(updateAndShowStatusBarFn)));

    context.subscriptions.push(...disposables);

    updateAndShowStatusBarFn();
}

// This method is called when your extension is deactivated
export function deactivate() { }
