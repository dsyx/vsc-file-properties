// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as util from "util";

const stat = util.promisify(fs.stat);
const outputChannel = vscode.window.createOutputChannel('File Properties');
const viewDetailCommand = vscode.commands.registerCommand("file-properties.viewDetail", viewDetailCommandHandler);
const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

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

function formatPermissions(mode: number): string {
	const permissions = [
		(mode & 0o0400 ? 'r' : '-'),
		(mode & 0o0200 ? 'w' : '-'),
		(mode & 0o0100 ? 'x' : '-'),
		(mode & 0o0040 ? 'r' : '-'),
		(mode & 0o0020 ? 'w' : '-'),
		(mode & 0o0010 ? 'x' : '-'),
		(mode & 0o0004 ? 'r' : '-'),
		(mode & 0o0002 ? 'w' : '-'),
		(mode & 0o0001 ? 'x' : '-'),
	];

	return permissions.join('');
}

function formatFileSize(size: number): string {
	const kilo = 1024;
	const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

	let index = 0;
	while (size >= kilo && index < units.length - 1) {
		size /= kilo;
		index++;
	}

	return `${size.toFixed(2)} ${units[index]}`;
}

function formatStats(stats: fs.Stats): string {
	const permissions = formatPermissions(stats.mode);
	const size = formatFileSize(stats.size);
	const mtime = stats.mtime.toISOString();

	return `[${permissions} | ${size} | ${mtime}]`;
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

async function getActiveFileStats(): Promise<fs.Stats> {
	const path = getActiveFilePath();
	return stat(path);
}

function handleError(error: any) {
	if (error instanceof ActiveEditorUndefinedError) {
		statusBar.hide();
	} else if (error instanceof ActiveEditorDocumentNotFileError) {
		statusBar.hide();
	} else if (error instanceof Error) {
		outputChannel.appendLine(error.message);
		outputChannel.show();
	} else {
		outputChannel.appendLine("An unknown error occurred");
		outputChannel.show();
	}
}

async function viewDetailCommandHandler() {
	try {
		const path = getActiveFilePath();
		const stats = await getActiveFileStats();

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
		handleError(error);
	}
}

async function updateStatusBar() {
	try {
		const stats = await getActiveFileStats();
		const properties = formatStats(stats);

		statusBar.text = properties;
		statusBar.tooltip = "File Properties: Click to view detailed file properties";
		statusBar.command = "file-properties.viewDetail";
		statusBar.show();
	} catch (error) {
		handleError(error);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(viewDetailCommand);

	updateStatusBar();
	vscode.window.onDidChangeActiveTextEditor(updateStatusBar);

	context.subscriptions.push(statusBar);
}

// This method is called when your extension is deactivated
export function deactivate() { }
