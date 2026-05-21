declare class Logger {
    private logDir;
    constructor();
    private getLogFile;
    private formatEntry;
    private writeLog;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    debug(message: string, data?: unknown): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map