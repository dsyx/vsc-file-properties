import * as fs from "fs";
import { DateTime } from "luxon";

/**
 * Enumeration of file size units and their corresponding step values for conversion.
 */
const FILE_SIZE_UNITS: Record<FileSizeUnit, { units: string[]; step: number }> = {
    /**
     * SI (International System of Units) file size units.
     */
    si: {
        units: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        step: 1000,
    },
    /**
     * IEC (International Electrotechnical Commission) file size units.
     */
    iec: {
        units: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
        step: 1024,
    }
};

/**
 * Enum representing different types of files.
 */
export enum FileType {
    blockDevice = "Block Device",         // Block device
    characterDevice = "Character Device", // Character device
    fifo = "FIFO",                        // FIFO
    regular = "Regular File",             // Regular file
    directory = "Directory",              // Directory
    symlink = "Symbolic Link",            // Symbolic link
    socket = "Socket",                    // Socket
    unknown = "Unknown",                  // Unknown
}

export enum FileSizeUnit {
    si = "si",
    iec = "iec",
}

/**
 * Class representing file statistics.
 */
export class FileStat {
    /**
     * Constructs a FileStat instance for the specified file path.
     * @param {string} path - The path to the file.
     * @throws {Error} Throws an error if the file does not exist or cannot be accessed.
     */
    public constructor(path: string) {
        this.stats = fs.statSync(path);
    }

    /**
     * Describes the device on which this file resides.
     */
    public get dev(): number {
        return this.stats.dev;
    }

    /**
     * File's inode number.
     */
    public get ino(): number {
        return this.stats.ino;
    }

    /**
     * Contains the file type and mode.
     */
    public get mode(): number {
        return this.stats.mode;
    }

    /**
     * Number of hard links to the file.
     */
    public get nlink(): number {
        return this.stats.nlink;
    }

    /**
     * User ID of the owner of the file.
     */
    public get uid(): number {
        return this.stats.uid;
    }

    /**
     * ID of the group owner of the file.
     */
    public get gid(): number {
        return this.stats.gid;
    }

    /**
     * Describes the device that this file (inode) represents.
     */
    public get rdev(): number {
        return this.stats.rdev;
    }

    /**
     * Gives the size of the file (if it is a regular file or a symbolic link) in bytes.
     * The size of a symbolic link is the length of the pathname it contains, without a terminating null byte.
     */
    public get size(): number {
        return this.stats.size;
    }

    /**
     * Gives the "preferred" block size for efficient filesystem I/O.
     */
    public get blksize(): number {
        return this.stats.blksize;
    }

    /**
     * Indicates the number of blocks allocated to the file, in 512-byte units.
     * (This may be smaller than st_size/512 when the file has holes.)
     */
    public get blocks(): number {
        return this.stats.blocks;
    }

    /**
     * Time of the last access of file data.
     */
    public get atime(): Date {
        return this.stats.atime;
    }

    /**
     * Time of last modification of file data.
     */
    public get mtime(): Date {
        return this.stats.mtime;
    }

    /**
     * File's last status change timestamp (time of last change to the inode).
     */
    public get ctime(): Date {
        return this.stats.ctime;
    }

    /**
     * Creation time of the file.
     */
    public get birthtime(): Date {
        return this.stats.birthtime;
    }

    /**
     * Gets the type of the file.
     * @returns {FileType} The file type.
     */
    public type(): FileType {
        if (this.stats.isBlockDevice()) {
            return FileType.blockDevice;
        } else if (this.stats.isCharacterDevice()) {
            return FileType.characterDevice;
        } else if (this.stats.isFIFO()) {
            return FileType.fifo;
        } else if (this.stats.isFile()) {
            return FileType.regular;
        } else if (this.stats.isDirectory()) {
            return FileType.directory;
        } else if (this.stats.isSymbolicLink()) {
            return FileType.symlink;
        } else if (this.stats.isSocket()) {
            return FileType.socket;
        } else {
            return FileType.unknown;
        }
    }

    /**
     * Gets the formatted permissions of the file.
     * @returns {string} The formatted permissions string.
     */
    public formattedPermissions(): string {
        const mode = this.stats.mode;
        const permissions = [
            (mode & 0o0400 ? "r" : "-"),
            (mode & 0o0200 ? "w" : "-"),
            (mode & 0o0100 ? "x" : "-"),
            (mode & 0o0040 ? "r" : "-"),
            (mode & 0o0020 ? "w" : "-"),
            (mode & 0o0010 ? "x" : "-"),
            (mode & 0o0004 ? "r" : "-"),
            (mode & 0o0002 ? "w" : "-"),
            (mode & 0o0001 ? "x" : "-"),
        ];
        return permissions.join("");
    }

    /**
     * Get the formatted file size.
     * @param {FileSizeUnit} unit - Indicates file size unit.
     * @returns {string} The formatted file size string.
     */
    public formattedSize(unit: FileSizeUnit = FileSizeUnit.iec): string {
        const { units, step } = FILE_SIZE_UNITS[unit];

        let size = this.size;
        let index = 0;
        while (size >= step && index < units.length - 1) {
            size /= step;
            index++;
        }

        return `${size.toFixed(2)} ${units[index]}`;
    }

    /**
     * Gets the formatted access time of the file.
     * @param {string} format - The format string for the date and time.
     * @returns {string} The formatted access time string.
     */
    public formattedATime(format: string): string {
        return this.formatDate(this.atime, format);
    }

    /**
     * Gets the formatted modification time of the file.
     * @param {string} format - The format string for the date and time.
     * @returns {string} The formatted access time string.
     */
    public formattedMTime(format: string): string {
        return this.formatDate(this.mtime, format);
    }

    /**
     * Gets the formatted change time of the file.
     * @param {string} format - The format string for the date and time.
     * @returns {string} The formatted access time string.
     */
    public formattedCTime(format: string): string {
        return this.formatDate(this.ctime, format);
    }

    /**
     * Gets the formatted birth time of the file.
     * @param {string} format - The format string for the date and time.
     * @returns {string} The formatted access time string.
     */
    public formattedBirthTime(format: string): string {
        return this.formatDate(this.birthtime, format);
    }

    /**
     * Formats a Date object using the specified format.
     * @param {Date} date - The Date object to format.
     * @param {string} format - The format string for the date and time.
     * @returns {string} The formatted date and time string.
     * @private
     */
    private formatDate(date: Date, format: string): string {
        return DateTime.fromJSDate(date).toFormat(format);
    }

    private readonly stats: fs.Stats;
}