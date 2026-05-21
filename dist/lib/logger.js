"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor() {
        this.logDir = './logs';
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    getLogFile(level) {
        const date = new Date().toISOString().split('T')[0];
        return path_1.default.join(this.logDir, `${level}-${date}.log`);
    }
    formatEntry(level, message, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
        };
        if (data) {
            entry.data = data;
        }
        return entry;
    }
    writeLog(level, message, data) {
        const entry = this.formatEntry(level, message, data);
        const logFile = this.getLogFile(level);
        fs_1.default.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }
    info(message, data) {
        console.log(`[INFO] ${message}`, data ?? '');
        this.writeLog('info', message, data);
    }
    warn(message, data) {
        console.warn(`[WARN] ${message}`, data ?? '');
        this.writeLog('warn', message, data);
    }
    error(message, data) {
        console.error(`[ERROR] ${message}`, data ?? '');
        this.writeLog('error', message, data);
    }
    debug(message, data) {
        console.debug(`[DEBUG] ${message}`, data ?? '');
        this.writeLog('debug', message, data);
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map