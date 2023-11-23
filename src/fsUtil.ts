import * as fs from "fs";
import * as util from "util";
import * as dayjs from "dayjs";

const FILE_SIZE_UNITS: Record<FileSizeUnit, { units: string[]; step: number }> = {
    si: {
        units: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        step: 1000,
    },
    iec: {
        units: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
        step: 1024,
    }
};

export enum FileType {
    blockDevice = "Block Device",
    characterDevice = "Character Device",
    fifo = "FIFO",
    regular = "Regular File",
    directory = "Directory",
    symlink = "Symbolic Link",
    socket = "Socket",
    unknown = "Unknown",
}

export enum FileSizeUnit {
    si = "si",
    iec = "iec",
}

export const lstat = util.promisify(fs.lstat);

export function getFileType(stats: fs.Stats): FileType {
    switch (true) {
        case stats.isBlockDevice():
            return FileType.blockDevice;
        case stats.isCharacterDevice():
            return FileType.characterDevice;
        case stats.isFIFO():
            return FileType.fifo;
        case stats.isFile():
            return FileType.regular;
        case stats.isDirectory():
            return FileType.directory;
        case stats.isSymbolicLink():
            return FileType.symlink;
        case stats.isSocket():
            return FileType.socket;
        default:
            return FileType.unknown;
    }
}

export function formatPermissions(mode: number): string {
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

export function formatSize(size: number, unit: FileSizeUnit): string {
    const { units, step } = FILE_SIZE_UNITS[unit];

    let index = 0;
    while (size >= step && index < units.length - 1) {
        size /= step;
        index++;
    }

    return `${size.toFixed(2)} ${units[index]}`;
}

export function formatDate(date: Date, format: string): string {
    return dayjs(date).format(format);
}