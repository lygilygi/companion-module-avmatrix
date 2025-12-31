"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HP_SOURCES = exports.AUDIO_CHANNELS = exports.STILL_INPUTS = exports.KEY_MODES = exports.PIP_SIZES = exports.PIP_SOURCES = exports.VIDEO_SOURCES = exports.MISS_TO_WARNING = exports.STATUS_TICK_MS = exports.STATUS_RX_OK_MS = exports.ANY_RX_OK_MS = exports.SYNC_KEEPALIVE_MS = exports.PING_INTERVAL_MS = exports.LOCAL_UDP_PORT = exports.DEVICE_UDP_PORT = void 0;
exports.DEVICE_UDP_PORT = 19523;
exports.LOCAL_UDP_PORT = 19522;
exports.PING_INTERVAL_MS = 1000;
exports.SYNC_KEEPALIVE_MS = 1000;
exports.ANY_RX_OK_MS = 12000;
exports.STATUS_RX_OK_MS = 6000;
exports.STATUS_TICK_MS = 250;
exports.MISS_TO_WARNING = 12; // 12 * 250ms = 3s hysteresis before showing warning
exports.VIDEO_SOURCES = [
    { id: 1, label: 'IN1' },
    { id: 2, label: 'IN2' },
    { id: 3, label: 'IN3' },
    { id: 4, label: 'IN4' },
    { id: 5, label: 'Pattern' },
];
exports.PIP_SOURCES = [
    { id: 0, label: 'Black' },
    { id: 1, label: 'Color Bar' },
    { id: 2, label: 'Color 1' },
    { id: 3, label: 'Color 2' },
    { id: 4, label: 'IN1' },
    { id: 5, label: 'IN2' },
    { id: 6, label: 'IN3' },
    { id: 7, label: 'IN4' },
    { id: 8, label: 'Image' },
];
exports.PIP_SIZES = [
    { id: 0, label: '1/2' },
    { id: 1, label: '1/4' },
    { id: 2, label: '1/8' },
];
exports.KEY_MODES = [
    { id: 0, label: 'Off' },
    { id: 1, label: 'Key' },
    { id: 2, label: 'On Air' },
    { id: 3, label: 'Key + On Air' },
];
exports.STILL_INPUTS = [
    { id: 1, label: 'Still 1' },
    { id: 2, label: 'Still 2' },
    { id: 3, label: 'Still 3' },
    { id: 4, label: 'Still 4' },
    { id: 5, label: 'Still 5' },
    { id: 6, label: 'Still 6' },
    { id: 7, label: 'Still 7' },
    { id: 8, label: 'Still 8' },
    { id: 9, label: 'Still 9' },
    { id: 10, label: 'Still 10' },
    { id: 11, label: 'Still 11' },
    { id: 12, label: 'Still 12' },
    { id: 13, label: 'Still 13' },
    { id: 14, label: 'Still 14' },
    { id: 15, label: 'Still 15' },
    { id: 16, label: 'Still 16' },
];
exports.AUDIO_CHANNELS = [
    { id: 0, label: 'Master' },
    { id: 1, label: 'Ch1' },
    { id: 2, label: 'Ch2' },
    { id: 3, label: 'Ch3' },
    { id: 4, label: 'Ch4' },
    { id: 5, label: 'Mic1' },
    { id: 6, label: 'Mic2' },
    { id: 7, label: 'HeadPhones' },
];
exports.HP_SOURCES = [
    { id: 0, label: 'Master' },
    { id: 1, label: 'Ch1' },
    { id: 2, label: 'Ch2' },
    { id: 3, label: 'Ch3' },
    { id: 4, label: 'Ch4' },
    { id: 5, label: 'Mic1' },
    { id: 6, label: 'Mic2' },
];
