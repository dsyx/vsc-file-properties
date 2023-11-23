import * as vscode from "vscode";
import * as os from "os";
import { FileSizeUnit } from "./fsUtil";

const CONFIGURATION_SECTION = "file-properties";

function getStatusBarAlignmentConfigOrDefault(config: vscode.WorkspaceConfiguration): vscode.StatusBarAlignment {
    return config.get<string>("statusBarAlignment") === "left" ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
}

function getShowPermissionsInStatusBarConfigOrDefault(config: vscode.WorkspaceConfiguration): boolean {
    switch (os.platform()) {
        case "darwin":
            return config.get<boolean>("showPermissionsInStatusBar.darwin") === false ? false : true;
        case "linux":
            return config.get<boolean>("showPermissionsInStatusBar.linux") === false ? false : true;
        case "win32":
            return config.get<boolean>("showPermissionsInStatusBar.win32") === true ? true : false;
        default:
            return false;
    }
}

function getShowSizeInStatusBarConfigOrDefault(config: vscode.WorkspaceConfiguration): boolean {
    return config.get<boolean>("showSizeInStatusBar") === false ? false : true;
}

function getShowATimeInStatusBarConfigOrDefault(config: vscode.WorkspaceConfiguration): boolean {
    return config.get<boolean>("showATimeInStatusBar") === true ? true : false;
}

function getShowMTimeInStatusBarConfigOrDefault(config: vscode.WorkspaceConfiguration): boolean {
    return config.get<boolean>("showMTimeInStatusBar") === false ? false : true;
}

function getShowCTimeInStatusBarConfigOrDefault(config: vscode.WorkspaceConfiguration): boolean {
    return config.get<boolean>("showCTimeInStatusBar") === true ? true : false;
}

function getSizeUnitConfigOrDefault(config: vscode.WorkspaceConfiguration): FileSizeUnit {
    return config.get<string>("sizeUnit") === FileSizeUnit.si ? FileSizeUnit.si : FileSizeUnit.iec;
}

function getTimeFormatConfigOrDefault(config: vscode.WorkspaceConfiguration): string {
    const format = config.get<string>("timeFormat");
    return format ? format : "YYYY-MM-DD HH:mm:ss";
}


export type Configuration = {
    statusBarAlignment: vscode.StatusBarAlignment;
    showPermissionsInStatusBar: boolean;
    showSizeInStatusBar: boolean;
    showATimeInStatusBar: boolean;
    showMTimeInStatusBar: boolean;
    showCTimeInStatusBar: boolean;
    sizeUnit: FileSizeUnit;
    timeFormat: string;
};

export type ChangeEventListener = (cfg: Configuration) => any;

export class Configurator {
    public static getInstance(): Configurator {
        if (!Configurator.instance) {
            Configurator.instance = new Configurator();
        }
        return Configurator.instance;
    }

    public get configuration(): Configuration {
        return this._configuration;
    }

    public addChangeEventListener(listener: ChangeEventListener): void {
        this.changeEventListeners.add(listener);
    }

    public updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
        this.configuration = {
            statusBarAlignment: getStatusBarAlignmentConfigOrDefault(config),
            showPermissionsInStatusBar: getShowPermissionsInStatusBarConfigOrDefault(config),
            showSizeInStatusBar: getShowSizeInStatusBarConfigOrDefault(config),
            showATimeInStatusBar: getShowATimeInStatusBarConfigOrDefault(config),
            showMTimeInStatusBar: getShowMTimeInStatusBarConfigOrDefault(config),
            showCTimeInStatusBar: getShowCTimeInStatusBarConfigOrDefault(config),
            sizeUnit: getSizeUnitConfigOrDefault(config),
            timeFormat: getTimeFormatConfigOrDefault(config),
        };

        this.notifyChangeEventListeners();
    }

    private constructor() {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
        this._configuration = {
            statusBarAlignment: getStatusBarAlignmentConfigOrDefault(config),
            showPermissionsInStatusBar: getShowPermissionsInStatusBarConfigOrDefault(config),
            showSizeInStatusBar: getShowSizeInStatusBarConfigOrDefault(config),
            showATimeInStatusBar: getShowATimeInStatusBarConfigOrDefault(config),
            showMTimeInStatusBar: getShowMTimeInStatusBarConfigOrDefault(config),
            showCTimeInStatusBar: getShowCTimeInStatusBarConfigOrDefault(config),
            sizeUnit: getSizeUnitConfigOrDefault(config),
            timeFormat: getTimeFormatConfigOrDefault(config),
        };
        this.changeEventListeners = new Set<ChangeEventListener>();

        vscode.workspace.onDidChangeConfiguration(this.changeConfigurationEventListener);
        this.updateConfiguration();
    }

    private set configuration(cfg: Configuration) {
        this._configuration.statusBarAlignment = cfg.statusBarAlignment;
        this._configuration.showPermissionsInStatusBar = cfg.showPermissionsInStatusBar;
        this._configuration.showSizeInStatusBar = cfg.showSizeInStatusBar;
        this._configuration.showATimeInStatusBar = cfg.showATimeInStatusBar;
        this._configuration.showMTimeInStatusBar = cfg.showMTimeInStatusBar;
        this._configuration.showCTimeInStatusBar = cfg.showCTimeInStatusBar;
        this._configuration.sizeUnit = cfg.sizeUnit;
        this._configuration.timeFormat = cfg.timeFormat;
    }

    private changeConfigurationEventListener = (e: vscode.ConfigurationChangeEvent): void => {
        if (e.affectsConfiguration(CONFIGURATION_SECTION)) {
            this.updateConfiguration();
        }
    };

    private notifyChangeEventListeners(): void {
        this.changeEventListeners.forEach((listener) => {
            listener(this.configuration);
        });
    }

    private static instance: Configurator | undefined;
    private changeEventListeners: Set<ChangeEventListener>;

    private _configuration: Configuration;
}