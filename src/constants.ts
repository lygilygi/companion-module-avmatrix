export const DEVICE_UDP_PORT = 19523
export const LOCAL_UDP_PORT = 19522

export const PING_INTERVAL_MS = 1000
export const SYNC_KEEPALIVE_MS = 1000

export const ANY_RX_OK_MS = 12000
export const STATUS_RX_OK_MS = 6000
export const STATUS_TICK_MS = 250
export const MISS_TO_WARNING = 12 // 12 * 250ms = 3s hysteresis before showing warning

export const VIDEO_SOURCES = [
	{ id: 1, label: 'IN1' },
	{ id: 2, label: 'IN2' },
	{ id: 3, label: 'IN3' },
	{ id: 4, label: 'IN4' },
	{ id: 5, label: 'Pattern' },
]

export const PIP_SOURCES = [
	{ id: 0, label: 'Black' },
	{ id: 1, label: 'Color Bar' },
	{ id: 2, label: 'Color 1' },
	{ id: 3, label: 'Color 2' },
	{ id: 4, label: 'IN1' },
	{ id: 5, label: 'IN2' },
	{ id: 6, label: 'IN3' },
	{ id: 7, label: 'IN4' },
	{ id: 8, label: 'Image' },
]

export const PIP_SIZES = [
	{ id: 0, label: '1/2' },
	{ id: 1, label: '1/4' },
	{ id: 2, label: '1/8' },
]

export const KEY_MODES = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'Key' },
	{ id: 2, label: 'On Air' },
	{ id: 3, label: 'Key + On Air' },
]

export const STILL_INPUTS = [
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
]

export const AUDIO_CHANNELS = [
	{ id: 0, label: 'Master' },
	{ id: 1, label: 'Ch1' },
	{ id: 2, label: 'Ch2' },
	{ id: 3, label: 'Ch3' },
	{ id: 4, label: 'Ch4' },
	{ id: 5, label: 'Mic1' },
	{ id: 6, label: 'Mic2' },
	{ id: 7, label: 'HeadPhones' },
]

export const HP_SOURCES = [
	{ id: 0, label: 'Master' },
	{ id: 1, label: 'Ch1' },
	{ id: 2, label: 'Ch2' },
	{ id: 3, label: 'Ch3' },
	{ id: 4, label: 'Ch4' },
	{ id: 5, label: 'Mic1' },
	{ id: 6, label: 'Mic2' },
]
