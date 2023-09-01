import * as vscode from "vscode";

/**
 * Identifier for the configuration section.
 */
const CONFIGURATION_SECTION = "file-properties";

/**
 * Acceptable status bar alignments.
 */
type StatusBarAlignment = "Left" | "Right";

/**
 * Default configuration values.
 */
const DEFAULT_CONFIGURATION: Configuration = {
    statusBarAlignment: "Right",
    showPermissionsInStatusBar: true,
    showSizeInStatusBar: true,
    showMtimeInStatusBar: true,
    useSiSizeUnit: false,
    dateFormat: "yyyy-MM-dd HH:mm:ss",
};

/**
 * Configuration object type.
 */
export type Configuration = {
    statusBarAlignment: StatusBarAlignment;
    showPermissionsInStatusBar: boolean;
    showSizeInStatusBar: boolean;
    showMtimeInStatusBar: boolean;
    useSiSizeUnit: boolean;
    dateFormat: string;
};

/**
 * Configuration change event listener callback type.
 */
export type ChangeEventListener = (configuration: Configuration) => any;

/**
 * Configuration manager class responsible for handling extension configuration.
 */
export class ConfigurationManager {
    /**
     * Gets the ConfigurationManager instance (Singleton pattern).
     * @returns The ConfigurationManager instance.
     */
    public static getConfigurationManager(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    /**
     * Gets the current configuration.
     * @returns The current configuration.
     */
    public get configuration(): Configuration {
        return { ...this._configuration };
    }

    /**
     * Adds a configuration change event listener.
     * @param listener - The callback function to be invoked on configuration change.
     */
    public addChangeEventListener(listener: ChangeEventListener): void {
        this.changeEventListeners.add(listener);
    }

    /**
     * Constructor for ConfigurationManager.
     */
    private constructor() {
        this.updateConfiguration();
        vscode.workspace.onDidChangeConfiguration(this.didChangeConfigurationListener);
    }

    /**
     * Sets the configuration.
     * @param cfg - The new configuration values to be set.
     */
    private set configuration(cfg: Configuration) {
        this._configuration = cfg;
    }

    /**
     * Handles the configuration change event and updates the configuration accordingly.
     * @param e - The configuration change event.
     */
    private didChangeConfigurationListener = (e: vscode.ConfigurationChangeEvent): void => {
        if (e.affectsConfiguration(CONFIGURATION_SECTION)) {
            this.updateConfiguration();
        }
    };

    /**
     * Updates the configuration from VS Code settings, using default values if not set.
     */
    private updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);

        this.configuration = {
            statusBarAlignment: config.get("statusBarAlignment", DEFAULT_CONFIGURATION.statusBarAlignment),
            showPermissionsInStatusBar: config.get("showPermissionsInStatusBar", DEFAULT_CONFIGURATION.showPermissionsInStatusBar),
            showSizeInStatusBar: config.get("showSizeInStatusBar", DEFAULT_CONFIGURATION.showSizeInStatusBar),
            showMtimeInStatusBar: config.get("showMtimeInStatusBar", DEFAULT_CONFIGURATION.showMtimeInStatusBar),
            useSiSizeUnit: config.get("useSiSizeUnit", DEFAULT_CONFIGURATION.useSiSizeUnit),
            dateFormat: config.get("dateFormat", DEFAULT_CONFIGURATION.dateFormat),
        };

        this.notifyChangeEventListeners();
    }

    /**
     * Notifies configuration change listeners by invoking their callback functions.
     */
    private notifyChangeEventListeners(): void {
        this.changeEventListeners.forEach((listener) => {
            listener(this.configuration);
        });
    }

    // Singleton pattern instance
    private static instance: ConfigurationManager | undefined = undefined;
    // Configuration object
    private _configuration: Configuration = { ...DEFAULT_CONFIGURATION };
    // Set of configuration change event listeners
    private changeEventListeners: Set<ChangeEventListener> = new Set<ChangeEventListener>();
}
