import * as vscode from "vscode";

export class StatusBarItem {
    public constructor(alignment: vscode.StatusBarAlignment, priority: number = 0) {
        this.leftItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -priority);
        this.rightItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);

        [this.currentItem, this.anotherItem] =
            alignment === vscode.StatusBarAlignment.Left ?
                [this.leftItem, this.rightItem] : [this.rightItem, this.leftItem];
        this._alignment = alignment;
    }

    public get alignment(): vscode.StatusBarAlignment {
        return this._alignment;
    }

    public set alignment(alignment: vscode.StatusBarAlignment) {
        if (this._alignment === alignment) {
            return;
        }
        this._alignment = alignment;
        this.updateAlignment();
    }

    public get priority(): number | undefined {
        return this.currentItem.priority;
    }

    public get text(): string {
        return this.currentItem.text;
    }

    public set text(text: string) {
        this.currentItem.text = text;
    }

    public get tooltip(): string | vscode.MarkdownString | undefined {
        return this.currentItem.tooltip;
    }

    public set tooltip(tooltip: string | vscode.MarkdownString | undefined) {
        this.currentItem.tooltip = tooltip;
    }

    public get command(): string | vscode.Command | undefined {
        return this.currentItem.command;
    }

    public set command(command: string | vscode.Command | undefined) {
        this.currentItem.command = command;
    }

    public show(): void {
        this.anotherItem.hide();
        this.currentItem.show();
    }

    public hide(): void {
        this.currentItem.hide();
        this.anotherItem.hide();
    }

    public dispose(): void {
        this.leftItem.dispose();
        this.rightItem.dispose();
    }

    private updateAlignment() {
        [this.currentItem, this.anotherItem] = [this.anotherItem, this.currentItem];
        this.currentItem.text = this.anotherItem.text;
        this.currentItem.tooltip = this.anotherItem.tooltip;
        this.currentItem.command = this.anotherItem.command;
    }

    private readonly leftItem: vscode.StatusBarItem;
    private readonly rightItem: vscode.StatusBarItem;
    private currentItem: vscode.StatusBarItem;
    private anotherItem: vscode.StatusBarItem;

    private _alignment: vscode.StatusBarAlignment;
}