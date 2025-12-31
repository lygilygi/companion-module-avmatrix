export const DEVICE_UDP_PORT = 19523
export const LOCAL_UDP_PORT = 19522

export const PING_INTERVAL_MS = 1000
export const SYNC_KEEPALIVE_MS = 1000

export const ANY_RX_OK_MS = 12000
export const STATUS_RX_OK_MS = 6000
export const STATUS_TICK_MS = 250
export const MISS_TO_WARNING = 12 // 12 * 250ms = 3s

export const VIDEO_SOURCES = [
	{ id: 1, label: 'IN1' },
	{ id: 2, label: 'IN2' },
	{ id: 3, label: 'IN3' },
	{ id: 4, label: 'IN4' },
	{ id: 5, label: 'Pattern' },
]

export const STILL_INPUTS = Array.from({ length: 16 }, (_, i) => {
	const n = i + 1
	return { id: n, label: `Still ${n}` }
})

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