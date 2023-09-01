import * as vscode from "vscode";

const CONFIGURATION_SECTION = "file-properties";

const DEFAULT_CONFIGURATION: Configuration = {
    statusBarAlignment: vscode.StatusBarAlignment.Right,
    showPermissionsInStatusBar: true,
    showSizeInStatusBar: true,
    showMTimeInStatusBar: true,
    useSiSizeUnit: false,
    dateFormat: "yyyy-MM-dd HH:mm:ss",
};

export type Configuration = {
    statusBarAlignment: vscode.StatusBarAlignment;
    showPermissionsInStatusBar: boolean;
    showSizeInStatusBar: boolean;
    showMTimeInStatusBar: boolean;
    useSiSizeUnit: boolean;
    dateFormat: string;
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

        const statusBarAlignment = config.get<string>("statusBarAlignment");
        this.configuration = {
            statusBarAlignment: statusBarAlignment === "Left" ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
            showPermissionsInStatusBar: config.get("showPermissionsInStatusBar", DEFAULT_CONFIGURATION.showPermissionsInStatusBar),
            showSizeInStatusBar: config.get("showSizeInStatusBar", DEFAULT_CONFIGURATION.showSizeInStatusBar),
            showMTimeInStatusBar: config.get("showMTimeInStatusBar", DEFAULT_CONFIGURATION.showMTimeInStatusBar),
            useSiSizeUnit: config.get("useSiSizeUnit", DEFAULT_CONFIGURATION.useSiSizeUnit),
            dateFormat: config.get("dateFormat", DEFAULT_CONFIGURATION.dateFormat),
        };

        this.notifyChangeEventListeners();
    }

    private constructor() {
        this.changeEventListeners = new Set<ChangeEventListener>();
        this._configuration = { ...DEFAULT_CONFIGURATION };

        vscode.workspace.onDidChangeConfiguration(this.changeConfigurationEventListener);
        this.updateConfiguration();
    }

    private set configuration(cfg: Configuration) {
        this._configuration.statusBarAlignment = cfg.statusBarAlignment;
        this._configuration.showPermissionsInStatusBar = cfg.showPermissionsInStatusBar;
        this._configuration.showSizeInStatusBar = cfg.showSizeInStatusBar;
        this._configuration.showMTimeInStatusBar = cfg.showMTimeInStatusBar;
        this._configuration.useSiSizeUnit = cfg.useSiSizeUnit;
        this._configuration.dateFormat = cfg.dateFormat;
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