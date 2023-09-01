import * as vscode from "vscode";

const STATUS_BAR_ITEM_PRIORITY = 1024;

export enum StatusBarAlignment {
    left = vscode.StatusBarAlignment.Left,
    right = vscode.StatusBarAlignment.Right,
}

/**
 * Represents a custom status bar item that can be aligned to the left or right side of the status bar.
 */
export class StatusBarItem {
    /**
     * Creates a new StatusBarItem instance.
     * @param alignment - The alignment of the status bar item (left or right).
     */
    public constructor(alignment: StatusBarAlignment) {
        this.leftItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -STATUS_BAR_ITEM_PRIORITY);
        this.rightItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, STATUS_BAR_ITEM_PRIORITY);
        this.item = alignment === StatusBarAlignment.left ? this.leftItem : this.rightItem;
        this._alignment = alignment;
    }

    /**
     * Get the alignment of the status bar item.
     * @returns The alignment of the status bar item.
     */
    public get alignment(): StatusBarAlignment {
        return this._alignment;
    }

    /**
     * Set the alignment of the status bar item.
     * @param alignment - The new alignment value.
     */
    public set alignment(alignment: StatusBarAlignment) {
        if (this._alignment === alignment) {
            return;
        }
        this._alignment = alignment;
        this.updateItemAlignment();
    }

    /**
     * Get the text to show for the entry.
     * @returns The text displayed in the status bar item.
     */
    public get text(): string {
        return this.item.text;
    }

    /**
     * Set the text to show for the entry.
     * @param text - The text to set.
     */
    public set text(text: string) {
        this.item.text = text;
    }

    /**
     * Get the tooltip text when you hover over this entry.
     * @returns The text displayed in the status bar item.
     */
    public get tooltip(): string {
        return this.item.tooltip as string;
    }

    /**
     * Set the tooltip text when you hover over this entry.
     * @param text - The text to set.
     */
    public set tooltip(text: string) {
        this.item.tooltip = text;
    }

    /**
     * Get the identifier of a command to run on click.
     * @returns The text displayed in the status bar item.
     */
    public get command(): string {
        return this.item.command as string;
    }

    /**
     * Set the identifier of a command to run on click.
     * @param identifier - The identifier of a command to set.
     */
    public set command(identifier: string) {
        this.item.command = identifier;
    }

    /**
     * Hide the status bar item.
     */
    public hide() {
        this.item.hide();
    }

    /**
     * Show the status bar item.
     */
    public show() {
        this.item.show();
    }

    /**
     * Dispose of the status bar item and release associated resources.
     */
    public dispose() {
        this.leftItem.dispose();
        this.rightItem.dispose();
    }

    /**
     * Update the alignment of the status bar item.
     */
    private updateItemAlignment() {
        const tmp = this.item;
        this.item = this.alignment === StatusBarAlignment.left ? this.leftItem : this.rightItem;
        this.item.text = tmp.text;
        this.item.tooltip = tmp.tooltip;
        this.item.command = tmp.command;
        tmp.hide();
        this.item.show();
    }

    // The status bar item aligned to the left side.
    private readonly leftItem: vscode.StatusBarItem;
    // The status bar item aligned to the right side.
    private readonly rightItem: vscode.StatusBarItem;
    // The current status bar item.
    private item: vscode.StatusBarItem;
    // The alignment of the status bar item.
    private _alignment: StatusBarAlignment;
}