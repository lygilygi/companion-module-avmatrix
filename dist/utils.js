"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampInt = clampInt;
exports.isOnAir = isOnAir;
exports.isKey = isKey;
function clampInt(val, min, max) {
    const n = typeof val === 'number' ? val : parseInt(String(val), 10);
    if (Number.isNaN(n))
        return min;
    return Math.min(max, Math.max(min, n));
}
function isOnAir(v) {
    return (v & 0x01) === 0x01;
}
function isKey(v) {
    return (v & 0x02) === 0x02;
}
