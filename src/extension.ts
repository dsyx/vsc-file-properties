import * as vscode from "vscode";
import * as cfg from "./configuration";
import * as fs from "./fileStat";
import { StatusBarAlignment, StatusBarItem } from "./statusBar";

const configurationManager = cfg.ConfigurationManager.getConfigurationManager();
const outputChannel = vscode.window.createOutputChannel("File Properties");

let statusBarItem: StatusBarItem;

async function viewDetailCommandHandler() {
	try {
		const path = getActiveFilePath();
		const stat = new fs.FileStat(path);

		outputChannel.appendLine(``.padEnd(80, "*"));
		outputChannel.appendLine(`path:      ${path}`);
		outputChannel.appendLine(`dev:       ${stat.dev}`);
		outputChannel.appendLine(`ino:       ${stat.ino}`);
		outputChannel.appendLine(`mode:      ${stat.mode}`);
		outputChannel.appendLine(`nlink:     ${stat.nlink}`);
		outputChannel.appendLine(`uid:       ${stat.uid}`);
		outputChannel.appendLine(`gid:       ${stat.gid}`);
		outputChannel.appendLine(`rdev:      ${stat.rdev}`);
		outputChannel.appendLine(`size:      ${stat.size}`);
		outputChannel.appendLine(`blksize:   ${stat.blksize}`);
		outputChannel.appendLine(`blocks:    ${stat.blocks}`);
		outputChannel.appendLine(`atime:     ${stat.atime}`);
		outputChannel.appendLine(`mtime:     ${stat.mtime}`);
		outputChannel.appendLine(`ctime:     ${stat.ctime}`);
		outputChannel.appendLine(`birthtime: ${stat.birthtime}`);
		outputChannel.appendLine(``.padEnd(80, "*"));
		outputChannel.show();
	} catch (error) {
		handleError(error);
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

function handleError(error: any) {
	if (error instanceof ActiveEditorUndefinedError) {
		statusBarItem.hide();
	} else if (error instanceof ActiveEditorDocumentNotFileError) {
		statusBarItem.hide();
	} else if (error instanceof Error) {
		outputChannel.appendLine(error.message);
		outputChannel.show();
	} else {
		outputChannel.appendLine("An unknown error occurred");
		outputChannel.show();
	}
}

function formatStatusBarText(stat: fs.FileStat, cfg: cfg.Configuration): string {
	const properties = [];

	if (cfg.showPermissionsInStatusBar) {
		properties.push(stat.formattedPermissions());
	}
	if (cfg.showSizeInStatusBar) {
		properties.push(stat.formattedSize(cfg.useSiSizeUnit ? fs.FileSizeUnit.si : fs.FileSizeUnit.iec));
	}
	if (cfg.showMtimeInStatusBar) {
		properties.push(stat.formattedMTime(cfg.dateFormat));
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

async function updateAndShowStatusBarText() {
	try {
		const path = getActiveFilePath();
		const stat = new fs.FileStat(path);
		const text = formatStatusBarText(stat, configurationManager.configuration);

		statusBarItem.text = text;
		statusBarItem.show();
	} catch (error) {
		handleError(error);
	}
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	const command = vscode.commands.registerCommand("file-properties.viewDetail", viewDetailCommandHandler);
	context.subscriptions.push(command);

	const statusBarAlignment = configurationManager.configuration.statusBarAlignment;
	statusBarItem = new StatusBarItem(statusBarAlignment === "Left" ? StatusBarAlignment.left : StatusBarAlignment.right);
	statusBarItem.command = "file-properties.viewDetail";
	context.subscriptions.push(statusBarItem);
	configurationManager.addChangeEventListener((cfg) => {
		const statusBarAlignment = cfg.statusBarAlignment;
		statusBarItem.alignment = statusBarAlignment === "Left" ? StatusBarAlignment.left : StatusBarAlignment.right;
	});
	vscode.window.onDidChangeActiveTextEditor(updateAndShowStatusBarText);
	updateAndShowStatusBarText();
}

// This method is called when your extension is deactivated
export function deactivate() { }
