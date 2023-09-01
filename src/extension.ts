import * as vscode from "vscode";
import * as fs from "fs";
import * as cfg from "./configurator";
import * as fu from "./fsUtil";
import * as sbi from "./statusBarItem";

async function viewDetailCommandHandler() {
	const outputChannel = vscode.window.createOutputChannel("File Properties");

	try {
		const path = getActiveFilePath();
		const stats = await fu.lstat(path);

		outputChannel.appendLine(``.padEnd(80, "*"));
		outputChannel.appendLine(`path:      ${path}`);
		outputChannel.appendLine(`dev:       ${stats.dev}`);
		outputChannel.appendLine(`ino:       ${stats.ino}`);
		outputChannel.appendLine(`mode:      ${stats.mode}`);
		outputChannel.appendLine(`nlink:     ${stats.nlink}`);
		outputChannel.appendLine(`uid:       ${stats.uid}`);
		outputChannel.appendLine(`gid:       ${stats.gid}`);
		outputChannel.appendLine(`rdev:      ${stats.rdev}`);
		outputChannel.appendLine(`size:      ${stats.size}`);
		outputChannel.appendLine(`blksize:   ${stats.blksize}`);
		outputChannel.appendLine(`blocks:    ${stats.blocks}`);
		outputChannel.appendLine(`atime:     ${stats.atime}`);
		outputChannel.appendLine(`mtime:     ${stats.mtime}`);
		outputChannel.appendLine(`ctime:     ${stats.ctime}`);
		outputChannel.appendLine(`birthtime: ${stats.birthtime}`);
		outputChannel.appendLine(``.padEnd(80, "*"));
		outputChannel.show();
	} catch (error) {
		if (error instanceof Error) {
			console.error(`[File Properties] ${error.message}`);
		} else {
			console.error(`[File Properties] An unknown error occurred`);
		}
	}
}

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

function formatStatusBarText(stats: fs.Stats, cfg: cfg.Configuration): string {
	const properties = [];

	if (cfg.showPermissionsInStatusBar) {
		properties.push(fu.formatPermissions(stats.mode));
	}
	if (cfg.showSizeInStatusBar) {
		properties.push(fu.formatSize(stats.size, cfg.useSiSizeUnit ? fu.FileSizeUnit.si : fu.FileSizeUnit.iec));
	}
	if (cfg.showMTimeInStatusBar) {
		properties.push(fu.formatDate(stats.mtime, cfg.dateFormat));
	}

	return `[${properties.join(" | ")}]`;
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

function createUpdateAndShowStatusBarFn(statusBarItem: sbi.StatusBarItem, cfg: cfg.Configuration) {
	return async () => {
		try {
			const path = getActiveFilePath();
			const stats = await fu.lstat(path);
			statusBarItem.text = formatStatusBarText(stats, cfg);;
			statusBarItem.show();
		} catch (error) {
			if (error instanceof ActiveEditorUndefinedError || ActiveEditorDocumentNotFileError) {
				statusBarItem.hide();
			} else if (error instanceof Error) {
				console.error(`[File Properties] ${error.message}`);
			} else {
				console.error(`[File Properties] An unknown error occurred`);
			}
		}
	};
}

function createChangeEventListener(statusBarItem: sbi.StatusBarItem) {
	return (cfg: cfg.Configuration) => {
		statusBarItem.alignment = cfg.statusBarAlignment;
	};
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	const configurator = cfg.Configurator.getInstance();
	const configuration = configurator.configuration;

	const disposables: vscode.Disposable[] = [];

	disposables.push(vscode.commands.registerCommand("file-properties.viewDetail", viewDetailCommandHandler))

	const statusBarItem = new sbi.StatusBarItem(configuration.statusBarAlignment, 1024);
	statusBarItem.tooltip = "Click to view detailed file properties";
	statusBarItem.command = "file-properties.viewDetail";
	disposables.push(statusBarItem);

	configurator.addChangeEventListener(createChangeEventListener(statusBarItem));

	const updateAndShowStatusBarFn = createUpdateAndShowStatusBarFn(statusBarItem, configuration);
	disposables.push(vscode.window.onDidChangeActiveTextEditor(updateAndShowStatusBarFn));

	context.subscriptions.push(...disposables);

	updateAndShowStatusBarFn();
}

// This method is called when your extension is deactivated
export function deactivate() { }
