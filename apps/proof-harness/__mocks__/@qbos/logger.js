"use strict";
/**
 * Mock for @qbos/logger package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = void 0;
exports.logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};
class Logger {
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    debug = jest.fn();
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map