// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as util from "util";

const stat = util.promisify(fs.stat);

function formatPermissions(mode: number) {
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

function formatStats(stats: fs.Stats) {
	const permissions = formatPermissions(stats.mode);
	const size = formatFileSize(stats.size);
	const mtime = stats.mtime.toLocaleString();

	return `[${permissions} | ${size} | ${mtime}]`;
}

async function getFileProperties(filePath: string): Promise<string> {
	try {
		const stats = await stat(filePath);
		const properties = formatStats(stats);
		return properties;
	} catch (error) {
		throw error;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

	async function updateStatusBar() {
		try {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor) {
				const filePath = activeEditor.document.uri.fsPath;
				const properties = await getFileProperties(filePath);
				statusBar.text = properties;
				statusBar.show();
			} else {
				statusBar.hide();
			}
		} catch (error) {
			console.error(error);
		}
	}

	updateStatusBar();
	vscode.window.onDidChangeActiveTextEditor(updateStatusBar);

	context.subscriptions.push(statusBar);
}

// This method is called when your extension is deactivated
export function deactivate() { }
