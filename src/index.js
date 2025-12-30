'use strict'

const dgram = require('dgram')
const {
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	combineRgb,
} = require('@companion-module/base')

const DEVICE_UDP_PORT = 19523
const LOCAL_UDP_PORT = 19522

const PING_INTERVAL_MS = 1000
const SYNC_KEEPALIVE_MS = 1000

const ANY_RX_OK_MS = 12000
const STATUS_RX_OK_MS = 6000
const STATUS_TICK_MS = 250
const MISS_TO_WARNING = 12 // 12 * 250ms = 3s hysteresis before showing warning

const VIDEO_SOURCES = [
	{ id: 1, label: 'IN1' },
	{ id: 2, label: 'IN2' },
	{ id: 3, label: 'IN3' },
	{ id: 4, label: 'IN4' },
	{ id: 5, label: 'Pattern' },
]

const PIP_SOURCES = [
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

const PIP_SIZES = [
	{ id: 0, label: '1/2' },
	{ id: 1, label: '1/4' },
	{ id: 2, label: '1/8' },
]

const KEY_MODES = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'Key' },
	{ id: 2, label: 'On Air' },
	{ id: 3, label: 'Key + On Air' },
]

const STILL_INPUTS = [
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

const AUDIO_CHANNELS = [
	{ id: 0, label: 'Master' },
	{ id: 1, label: 'Ch1' },
	{ id: 2, label: 'Ch2' },
	{ id: 3, label: 'Ch3' },
	{ id: 4, label: 'Ch4' },
	{ id: 5, label: 'Mic1' },
	{ id: 6, label: 'Mic2' },
	{ id: 7, label: 'HeadPhones' },
]

const HP_SOURCES = [
	{ id: 0, label: 'Master' },
	{ id: 1, label: 'Ch1' },
	{ id: 2, label: 'Ch2' },
	{ id: 3, label: 'Ch3' },
	{ id: 4, label: 'Ch4' },
	{ id: 5, label: 'Mic1' },
	{ id: 6, label: 'Mic2' },
]

function clampInt(v, min, max) {
	const n = Number(v)
	if (!Number.isFinite(n)) return min
	return Math.max(min, Math.min(max, Math.round(n)))
}

function buildPacket(cmd, dataBytes) {
	const devType = 0x00
	const devId = 0x00
	const reserve = 0x00

	const dataLen = 1 + (dataBytes?.length || 0)
	const base = [0x5a, 0x00, 0x00, devType, devId, reserve, dataLen, cmd, ...(dataBytes || [])]

	const totalLen = base.length + 2
	base[1] = totalLen & 0xff
	base[2] = (totalLen >> 8) & 0xff

	const checksum = base.reduce((a, b) => (a + b) & 0xff, 0x00)
	return Buffer.from([...base, checksum, 0xdd])
}

class AVMatrixInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.udp = null
		this.config = {}

		this.pingTimer = null
		this.syncTimer = null
		this.statusTimer = null

		this.lastAnyRxAt = 0
		this.lastStatusRxAt = 0
		this.rxMissCount = 0
		this.lastStatusKey = ''

		this.state = {
			pgm: 1,
			pvw: 1,
			ftb: false,
			mute: false,

			still: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

			keyStatus: [0, 0, 0, 0, 0, 0],

			pip1: { src: 4, size: 1, x: 50, y: 50 },
			pip2: { src: 5, size: 1, x: 60, y: 60 },

			logo: { x: 50, y: 50, size: 100, opacity: 100 },

			audio: {
				ch: {
					0: { sw: 1, vol: 60, delay: 0, mode: 0 }, // Master (mode = AFV 0/1)
					1: { sw: 1, vol: 60, delay: 0, mode: 0 },
					2: { sw: 1, vol: 60, delay: 0, mode: 0 },
					3: { sw: 1, vol: 60, delay: 0, mode: 0 },
					4: { sw: 1, vol: 60, delay: 0, mode: 0 },
					5: { sw: 1, vol: 60, delay: 0, mode: 0 }, // Mic1 (mode = Line/Mic)
					6: { sw: 1, vol: 60, delay: 0, mode: 0 }, // Mic2
					7: { sw: 1, vol: 60, delay: 0, mode: 0 }, // HP (mode = HP select)
				},
			},
		}
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'AV Matrix UDP',
				value:
					`Ports fixed: Device ${DEVICE_UDP_PORT} | Local ${LOCAL_UDP_PORT}\n` +
					'Status is computed from REAL status RX packets (PGM/PVW/Key/PIP/Logo/Audio), with hysteresis to avoid blinking.\n' +
					'Sync keepalive (0xFE 01) is sent every second.\n' +
					'Optional ping (0xFF 01) is sent every second as keepalive but does NOT affect status.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP / Hostname',
				width: 6,
				default: '192.168.1.215',
			},
		]
	}
	configFields() {
		return this.getConfigFields()
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Disconnected, 'Starting…')

		await this.initUdp()

		this.initActions()
		this.initFeedbacks()
		this.initPresets()

		this.startStatusWatcher()
		this.startPing()
		this.startSync()
	}

	async destroy() {
		this.stopStatusWatcher()
		this.stopSync()
		this.stopPing()
		this.closeUdp()
	}

	async configUpdated(config) {
		this.config = config
		this.lastAnyRxAt = 0
		this.lastStatusRxAt = 0
		this.rxMissCount = 0
		await this.initUdp()
		this.startStatusWatcher()
		this.startPing()
		this.startSync()
	}

	initActions() {
		const videoChoices = VIDEO_SOURCES.map((s) => ({ id: s.id, label: s.label }))
		const stillChoices = STILL_INPUTS.map((s) => ({ id: s.id, label: s.label }))
		const audioChoices = AUDIO_CHANNELS.map((c) => ({ id: c.id, label: c.label }))
		const hpChoices = HP_SOURCES.map((c) => ({ id: c.id, label: c.label }))
		const keyModeChoices = KEY_MODES.map((m) => ({ id: m.id, label: m.label }))
		const pipSrcChoices = PIP_SOURCES.map((s) => ({ id: s.id, label: s.label }))
		const pipSizeChoices = PIP_SIZES.map((s) => ({ id: s.id, label: s.label }))

		this.setActionDefinitions({
			pgm_set: {
				name: 'Set PGM Source',
				options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
				callback: async (action) => {
					const src = Number(action.options.source)
					this.sendCmd(0x12, [src])
					this.state.pgm = src
					this.checkFeedbacks('pgm_is')
					this.checkFeedbacks('pgm_still_is')
				},
			},
			pvw_set: {
				name: 'Set PVW Source',
				options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
				callback: async (action) => {
					const src = Number(action.options.source)
					this.sendCmd(0x13, [src])
					this.state.pvw = src
					this.checkFeedbacks('pvw_is')
					this.checkFeedbacks('pvw_still_is')
				},
			},
			cut: { name: 'CUT', options: [], callback: async () => this.sendCmd(0x11, [0x02, 0x00]) },
			auto: { name: 'AUTO', options: [], callback: async () => this.sendCmd(0x11, [0x01, 0x00]) },

			ftb_on: {
				name: 'FTB ON',
				options: [],
				callback: async () => {
					this.sendCmd(0x11, [0x03, 0x01])
					this.state.ftb = true
					this.checkFeedbacks('ftb_on')
				},
			},
			ftb_off: {
				name: 'FTB OFF',
				options: [],
				callback: async () => {
					this.sendCmd(0x11, [0x03, 0x00])
					this.state.ftb = false
					this.checkFeedbacks('ftb_on')
				},
			},
			ftb_toggle: {
				name: 'FTB TOGGLE',
				options: [],
				callback: async () => {
					const next = !this.state.ftb
					this.sendCmd(0x11, [0x03, next ? 0x01 : 0x00])
					this.state.ftb = next
					this.checkFeedbacks('ftb_on')
				},
			},

			still_to_pgm: {
				name: 'STILL → PGM',
				options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
				callback: async (action) => {
					const idx = Number(action.options.still)
					this.setStillInput(idx, true)
					this.sendCmd(0x12, [idx])
					this.state.pgm = idx
					this.checkFeedbacks('pgm_is')
					this.checkFeedbacks('pgm_still_is')
				},
			},
			still_to_pvw: {
				name: 'STILL → PVW',
				options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
				callback: async (action) => {
					const idx = Number(action.options.still)
					this.setStillInput(idx, true)
					this.sendCmd(0x13, [idx])
					this.state.pvw = idx
					this.checkFeedbacks('pvw_is')
					this.checkFeedbacks('pvw_still_is')
				},
			},

			
			
			luma_mode_set: {
			name: 'LUMA: Set Mode (Off/Key/OnAir/Key+OnAir)',
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
			callback: async (action) => {
				this.state.keyStatus[0] = Number(action.options.mode)
				this.sendKeyStatus()
				this.checkFeedbacks('luma_onair')
				this.checkFeedbacks('luma_key')
			},
			},
			chroma_mode_set: {
			name: 'CHROMA: Set Mode (Off/Key/OnAir/Key+OnAir)',
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
			callback: async (action) => {
				this.state.keyStatus[1] = Number(action.options.mode)
				this.sendKeyStatus()
				this.checkFeedbacks('chroma_onair')
				this.checkFeedbacks('chroma_key')
			},
			},
			dsk_mode_set: {
			name: 'DSK: Set Mode (Off/Key/OnAir/Key+OnAir)',
			options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
			callback: async (action) => {
				this.state.keyStatus[4] = Number(action.options.mode)
				this.sendKeyStatus()
				this.checkFeedbacks('dsk_onair')
				this.checkFeedbacks('dsk_key')
			},
			},

			luma_onair_on: {
			name: 'ON AIR: LUMA ON',
			options: [],
			callback: async () => {
				this.state.keyStatus[0] = 2
				this.sendKeyStatus()
				this.checkFeedbacks('luma_onair')
				this.checkFeedbacks('luma_key')
			},
			},
			luma_onair_off: {
			name: 'ON AIR: LUMA OFF',
			options: [],
			callback: async () => {
				this.state.keyStatus[0] = 0
				this.sendKeyStatus()
				this.checkFeedbacks('luma_onair')
				this.checkFeedbacks('luma_key')
			},
			},
			luma_onair_toggle: {
			name: 'ON AIR: LUMA TOGGLE',
			options: [],
			callback: async () => {
				const cur = this.state.keyStatus[0] || 0
				const next = (cur === 2 || cur === 3) ? 0 : 2
				this.state.keyStatus[0] = next
				this.sendKeyStatus()
				this.checkFeedbacks('luma_onair')
				this.checkFeedbacks('luma_key')
			},
			},

			chroma_onair_on: {
			name: 'ON AIR: CHROMA ON',
			options: [],
			callback: async () => {
				this.state.keyStatus[1] = 2
				this.sendKeyStatus()
				this.checkFeedbacks('chroma_onair')
				this.checkFeedbacks('chroma_key')
			},
			},
			chroma_onair_off: {
			name: 'ON AIR: CHROMA OFF',
			options: [],
			callback: async () => {
				this.state.keyStatus[1] = 0
				this.sendKeyStatus()
				this.checkFeedbacks('chroma_onair')
				this.checkFeedbacks('chroma_key')
			},
			},
			chroma_onair_toggle: {
			name: 'ON AIR: CHROMA TOGGLE',
			options: [],
			callback: async () => {
				const cur = this.state.keyStatus[1] || 0
				const next = (cur === 2 || cur === 3) ? 0 : 2
				this.state.keyStatus[1] = next
				this.sendKeyStatus()
				this.checkFeedbacks('chroma_onair')
				this.checkFeedbacks('chroma_key')
			},
			},

			dsk_onair_on: {
			name: 'ON AIR: DSK ON',
			options: [],
			callback: async () => {
				this.state.keyStatus[4] = 2
				this.sendKeyStatus()
				this.checkFeedbacks('dsk_onair')
				this.checkFeedbacks('dsk_key')
			},
			},
			dsk_onair_off: {
			name: 'ON AIR: DSK OFF',
			options: [],
			callback: async () => {
				this.state.keyStatus[4] = 0
				this.sendKeyStatus()
				this.checkFeedbacks('dsk_onair')
				this.checkFeedbacks('dsk_key')
			},
			},
			dsk_onair_toggle: {
			name: 'ON AIR: DSK TOGGLE',
			options: [],
			callback: async () => {
				const cur = this.state.keyStatus[4] || 0
				const next = (cur === 2 || cur === 3) ? 0 : 2
				this.state.keyStatus[4] = next
				this.sendKeyStatus()
				this.checkFeedbacks('dsk_onair')
				this.checkFeedbacks('dsk_key')
			},
			},
			
			
			pip1_mode_set: {
				name: 'PIP1: Set Mode (Off/Key/OnAir/Key+OnAir)',
				options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
				callback: async (action) => {
					this.state.keyStatus[2] = Number(action.options.mode)
					this.sendKeyStatus()
					this.checkFeedbacks('pip1_onair')
					this.checkFeedbacks('pip1_key')
				},
			},
			pip2_mode_set: {
				name: 'PIP2: Set Mode (Off/Key/OnAir/Key+OnAir)',
				options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
				callback: async (action) => {
					this.state.keyStatus[3] = Number(action.options.mode)
					this.sendKeyStatus()
					this.checkFeedbacks('pip2_onair')
					this.checkFeedbacks('pip2_key')
				},
			},
			logo_mode_set: {
				name: 'LOGO: Set Mode (Off/Key/OnAir/Key+OnAir)',
				options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
				callback: async (action) => {
					this.state.keyStatus[5] = Number(action.options.mode)
					this.sendKeyStatus()
					this.checkFeedbacks('logo_onair')
					this.checkFeedbacks('logo_key')
				},
			},

			pip1_onair_on: {
				name: 'ON AIR: PIP1 ON',
				options: [],
				callback: async () => {
					this.state.keyStatus[2] = 2
					this.sendKeyStatus()
					this.checkFeedbacks('pip1_onair')
					this.checkFeedbacks('pip1_key')
				},
			},
			pip1_onair_off: {
				name: 'ON AIR: PIP1 OFF',
				options: [],
				callback: async () => {
					this.state.keyStatus[2] = 0
					this.sendKeyStatus()
					this.checkFeedbacks('pip1_onair')
					this.checkFeedbacks('pip1_key')
				},
			},
			pip1_onair_toggle: {
				name: 'ON AIR: PIP1 TOGGLE',
				options: [],
				callback: async () => {
					const cur = this.state.keyStatus[2] || 0
					const next = (cur === 2 || cur === 3) ? 0 : 2
					this.state.keyStatus[2] = next
					this.sendKeyStatus()
					this.checkFeedbacks('pip1_onair')
					this.checkFeedbacks('pip1_key')
				},
			},

			pip2_onair_on: {
				name: 'ON AIR: PIP2 ON',
				options: [],
				callback: async () => {
					this.state.keyStatus[3] = 2
					this.sendKeyStatus()
					this.checkFeedbacks('pip2_onair')
					this.checkFeedbacks('pip2_key')
				},
			},
			pip2_onair_off: {
				name: 'ON AIR: PIP2 OFF',
				options: [],
				callback: async () => {
					this.state.keyStatus[3] = 0
					this.sendKeyStatus()
					this.checkFeedbacks('pip2_onair')
					this.checkFeedbacks('pip2_key')
				},
			},
			pip2_onair_toggle: {
				name: 'ON AIR: PIP2 TOGGLE',
				options: [],
				callback: async () => {
					const cur = this.state.keyStatus[3] || 0
					const next = (cur === 2 || cur === 3) ? 0 : 2
					this.state.keyStatus[3] = next
					this.sendKeyStatus()
					this.checkFeedbacks('pip2_onair')
					this.checkFeedbacks('pip2_key')
				},
			},

			logo_onair_on: {
				name: 'ON AIR: LOGO ON',
				options: [],
				callback: async () => {
					this.state.keyStatus[5] = 2
					this.sendKeyStatus()
					this.checkFeedbacks('logo_onair')
					this.checkFeedbacks('logo_key')
				},
			},
			logo_onair_off: {
				name: 'ON AIR: LOGO OFF',
				options: [],
				callback: async () => {
					this.state.keyStatus[5] = 0
					this.sendKeyStatus()
					this.checkFeedbacks('logo_onair')
					this.checkFeedbacks('logo_key')
				},
			},
			logo_onair_toggle: {
				name: 'ON AIR: LOGO TOGGLE',
				options: [],
				callback: async () => {
					const cur = this.state.keyStatus[5] || 0
					const next = (cur === 2 || cur === 3) ? 0 : 2
					this.state.keyStatus[5] = next
					this.sendKeyStatus()
					this.checkFeedbacks('logo_onair')
					this.checkFeedbacks('logo_key')
				},
			},

			pip1_set: {
				name: 'PIP1: Set Source/Size/X/Y',
				options: [
					{ id: 'src', type: 'dropdown', label: 'Source', default: this.state.pip1.src, choices: pipSrcChoices },
					{ id: 'size', type: 'dropdown', label: 'Size', default: this.state.pip1.size, choices: pipSizeChoices },
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.pip1.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.pip1.y },
				],
				callback: async (action) => {
					this.state.pip1.src = Number(action.options.src)
					this.state.pip1.size = Number(action.options.size)
					this.state.pip1.x = clampInt(action.options.x, 0, 100)
					this.state.pip1.y = clampInt(action.options.y, 0, 100)
					this.sendPip1()
					this.checkFeedbacks('pip1_source_is')
				},
			},
			pip1_source_set: {
				name: 'PIP1: Set Source',
				options: [{ id: 'src', type: 'dropdown', label: 'Source', default: this.state.pip1.src, choices: pipSrcChoices }],
				callback: async (action) => {
					this.state.pip1.src = Number(action.options.src)
					this.sendPip1()
					this.checkFeedbacks('pip1_source_is')
				},
			},
			pip1_size_set: {
				name: 'PIP1: Set Size',
				options: [{ id: 'size', type: 'dropdown', label: 'Size', default: this.state.pip1.size, choices: pipSizeChoices }],
				callback: async (action) => {
					this.state.pip1.size = Number(action.options.size)
					this.sendPip1()
				},
			},
			pip1_pos_set: {
				name: 'PIP1: Set Position (X/Y)',
				options: [
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.pip1.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.pip1.y },
				],
				callback: async (action) => {
					this.state.pip1.x = clampInt(action.options.x, 0, 100)
					this.state.pip1.y = clampInt(action.options.y, 0, 100)
					this.sendPip1()
				},
			},

			pip2_set: {
				name: 'PIP2: Set Source/Size/X/Y',
				options: [
					{ id: 'src', type: 'dropdown', label: 'Source', default: this.state.pip2.src, choices: pipSrcChoices },
					{ id: 'size', type: 'dropdown', label: 'Size', default: this.state.pip2.size, choices: pipSizeChoices },
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.pip2.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.pip2.y },
				],
				callback: async (action) => {
					this.state.pip2.src = Number(action.options.src)
					this.state.pip2.size = Number(action.options.size)
					this.state.pip2.x = clampInt(action.options.x, 0, 100)
					this.state.pip2.y = clampInt(action.options.y, 0, 100)
					this.sendPip2()
					this.checkFeedbacks('pip2_source_is')
				},
			},
			pip2_source_set: {
				name: 'PIP2: Set Source',
				options: [{ id: 'src', type: 'dropdown', label: 'Source', default: this.state.pip2.src, choices: pipSrcChoices }],
				callback: async (action) => {
					this.state.pip2.src = Number(action.options.src)
					this.sendPip2()
					this.checkFeedbacks('pip2_source_is')
				},
			},
			pip2_size_set: {
				name: 'PIP2: Set Size',
				options: [{ id: 'size', type: 'dropdown', label: 'Size', default: this.state.pip2.size, choices: pipSizeChoices }],
				callback: async (action) => {
					this.state.pip2.size = Number(action.options.size)
					this.sendPip2()
				},
			},
			pip2_pos_set: {
				name: 'PIP2: Set Position (X/Y)',
				options: [
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.pip2.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.pip2.y },
				],
				callback: async (action) => {
					this.state.pip2.x = clampInt(action.options.x, 0, 100)
					this.state.pip2.y = clampInt(action.options.y, 0, 100)
					this.sendPip2()
				},
			},

			logo_set: {
				name: 'LOGO: Set Position/Size/Opacity',
				options: [
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.logo.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.logo.y },
					{ id: 'size', type: 'number', label: 'Size (50–150)', min: 50, max: 150, default: this.state.logo.size },
					{ id: 'opacity', type: 'number', label: 'Opacity (20–100)', min: 20, max: 100, default: this.state.logo.opacity },
				],
				callback: async (action) => {
					this.state.logo.x = clampInt(action.options.x, 0, 100)
					this.state.logo.y = clampInt(action.options.y, 0, 100)
					this.state.logo.size = clampInt(action.options.size, 50, 150)
					this.state.logo.opacity = clampInt(action.options.opacity, 20, 100)
					this.sendLogo()
				},
			},
			logo_pos_set: {
				name: 'LOGO: Set Position (X/Y)',
				options: [
					{ id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: this.state.logo.x },
					{ id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: this.state.logo.y },
				],
				callback: async (action) => {
					this.state.logo.x = clampInt(action.options.x, 0, 100)
					this.state.logo.y = clampInt(action.options.y, 0, 100)
					this.sendLogo()
				},
			},
			logo_size_set: {
				name: 'LOGO: Set Size',
				options: [{ id: 'size', type: 'number', label: 'Size (50–150)', min: 50, max: 150, default: this.state.logo.size }],
				callback: async (action) => {
					this.state.logo.size = clampInt(action.options.size, 50, 150)
					this.sendLogo()
				},
			},
			logo_opacity_set: {
				name: 'LOGO: Set Opacity',
				options: [{ id: 'opacity', type: 'number', label: 'Opacity (20–100)', min: 20, max: 100, default: this.state.logo.opacity }],
				callback: async (action) => {
					this.state.logo.opacity = clampInt(action.options.opacity, 20, 100)
					this.sendLogo()
				},
			},

			audio_set: {
				name: 'Audio: Set Channel (On/Off + Volume + Delay)',
				options: [
					{ id: 'ch', type: 'dropdown', label: 'Channel', default: 0, choices: audioChoices },
					{ id: 'sw', type: 'dropdown', label: 'Switch', default: 1, choices: [{ id: 0, label: 'Off' }, { id: 1, label: 'On' }] },
					{ id: 'vol', type: 'number', label: 'Volume (0–72)', min: 0, max: 72, default: 60 },
					{ id: 'delay', type: 'number', label: 'Delay ms (0–500)', min: 0, max: 500, default: 0 },
				],
				callback: async (action) => {
					const ch = Number(action.options.ch)
					const sw = Number(action.options.sw)
					const vol = clampInt(action.options.vol, 0, 72)
					const delay = clampInt(action.options.delay, 0, 500)

					const st = this.state.audio.ch[ch] || { sw: 1, vol: 60, delay: 0, mode: 0 }
					st.sw = sw
					st.vol = vol
					st.delay = delay
					this.state.audio.ch[ch] = st

					this.sendAudioSetting(ch)
					this.checkFeedbacks('audio_on')

					if (ch === 0) {
						this.state.mute = sw === 0
						this.checkFeedbacks('mute_on')
					}
				},
			},

			audio_mute_on: {
				name: 'Audio: MUTE ON',
				options: [],
				callback: async () => {
					this.sendCmd(0x11, [0x05, 0x01])
					this.state.mute = true
					this.checkFeedbacks('mute_on')
				},
			},
			audio_mute_off: {
				name: 'Audio: MUTE OFF',
				options: [],
				callback: async () => {
					this.sendCmd(0x11, [0x05, 0x00])
					this.state.mute = false
					this.checkFeedbacks('mute_on')
				},
			},
			audio_mute_toggle: {
				name: 'Audio: MUTE TOGGLE',
				options: [],
				callback: async () => {
					const next = !this.state.mute
					this.sendCmd(0x11, [0x05, next ? 0x01 : 0x00])
					this.state.mute = next
					this.checkFeedbacks('mute_on')
				},
			},


			audio_hp_select: {
				name: 'Audio: HeadPhones Select Source',
				options: [{ id: 'src', type: 'dropdown', label: 'HeadPhones Source', default: 0, choices: hpChoices }],
				callback: async (action) => {
					const src = Number(action.options.src)
					this.state.audio.ch[7].mode = src
					this.sendAudioSetting(7)
				},
			},

			audio_mic1_mode: {
				name: 'Audio: Mic1 Mode',
				options: [{ id: 'mode', type: 'dropdown', label: 'Mic Mode', default: 0, choices: [{ id: 0, label: 'Line' }, { id: 1, label: 'Mic' }] }],
				callback: async (action) => {
					this.state.audio.ch[5].mode = Number(action.options.mode)
					this.sendAudioSetting(5)
				},
			},
			audio_mic2_mode: {
				name: 'Audio: Mic2 Mode',
				options: [{ id: 'mode', type: 'dropdown', label: 'Mic Mode', default: 0, choices: [{ id: 0, label: 'Line' }, { id: 1, label: 'Mic' }] }],
				callback: async (action) => {
					this.state.audio.ch[6].mode = Number(action.options.mode)
					this.sendAudioSetting(6)
				},
			},
		})
	}

	initFeedbacks() {
		const videoChoices = VIDEO_SOURCES.map((s) => ({ id: s.id, label: s.label }))
		const stillChoices = STILL_INPUTS.map((s) => ({ id: s.id, label: s.label }))
		const audioChoices = AUDIO_CHANNELS.map((c) => ({ id: c.id, label: c.label }))
		const pipSrcChoices = PIP_SOURCES.map((s) => ({ id: s.id, label: s.label }))

		this.setFeedbackDefinitions({
			pgm_is: {
				type: 'boolean',
				name: 'PGM is Source',
				options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
				defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
				callback: (fb) => this.state.pgm === Number(fb.options.source),
			},
			pvw_is: {
				type: 'boolean',
				name: 'PVW is Source',
				options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
				defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
				callback: (fb) => this.state.pvw === Number(fb.options.source),
			},

			ftb_on: {
				type: 'boolean',
				name: 'FTB is ON',
				options: [],
				defaultStyle: { bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) },
				callback: () => !!this.state.ftb,
			},

			pgm_still_is: {
				type: 'boolean',
				name: 'PGM is STILL (1–4)',
				options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
				defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
				callback: (fb) => {
					const idx = Number(fb.options.still)
					return this.state.pgm === idx && this.state.still[idx - 1] === 1
				},
			},
			pvw_still_is: {
				type: 'boolean',
				name: 'PVW is STILL (1–4)',
				options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
				defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
				callback: (fb) => {
					const idx = Number(fb.options.still)
					return this.state.pvw === idx && this.state.still[idx - 1] === 1
				},
			},

			mute_on: {
				type: 'boolean',
				name: 'Audio MUTE is ON',
				options: [],
				defaultStyle: { bgcolor: combineRgb(255, 180, 0), color: combineRgb(0, 0, 0) },
				callback: () => !!this.state.mute,
			},
			audio_on: {
				type: 'boolean',
				name: 'Audio Channel is ON',
				options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 0, choices: audioChoices }],
				defaultStyle: { bgcolor: combineRgb(0, 120, 255), color: combineRgb(255, 255, 255) },
				callback: (fb) => {
					const ch = Number(fb.options.ch)
					return (this.state.audio.ch[ch]?.sw ?? 0) === 1
				},
			},

			
			pip1_onair: {
				type: 'boolean',
				name: 'PIP1 is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[2] || 0
					return m === 2 || m === 3
				},
			},
			pip1_key: {
				type: 'boolean',
				name: 'PIP1 KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[2] || 0
					return m === 1 || m === 3
				},
			},
			pip2_onair: {
				type: 'boolean',
				name: 'PIP2 is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[3] || 0
					return m === 2 || m === 3
				},
			},
			pip2_key: {
				type: 'boolean',
				name: 'PIP2 KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[3] || 0
					return m === 1 || m === 3
				},
			},
			logo_onair: {
				type: 'boolean',
				name: 'LOGO is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[5] || 0
					return m === 2 || m === 3
				},
			},
			logo_key: {
				type: 'boolean',
				name: 'LOGO KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => {
					const m = this.state.keyStatus[5] || 0
					return m === 1 || m === 3
				},
			},

			pip1_source_is: {
				type: 'boolean',
				name: 'PIP1 Source is …',
				options: [{ id: 'src', type: 'dropdown', label: 'Source', default: 4, choices: pipSrcChoices }],
				defaultStyle: { bgcolor: combineRgb(40, 40, 40), color: combineRgb(255, 255, 255) },
				callback: (fb) => this.state.pip1.src === Number(fb.options.src),
			},
			pip2_source_is: {
				type: 'boolean',
				name: 'PIP2 Source is …',
				options: [{ id: 'src', type: 'dropdown', label: 'Source', default: 5, choices: pipSrcChoices }],
				defaultStyle: { bgcolor: combineRgb(40, 40, 40), color: combineRgb(255, 255, 255) },
				callback: (fb) => this.state.pip2.src === Number(fb.options.src),
			},

			luma_onair: {
				type: 'boolean',
				name: 'LUMA is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isOnAir(this.state.keyStatus[0]),
			},
			luma_key: {
				type: 'boolean',
				name: 'LUMA KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isKey(this.state.keyStatus[0]),
			},
			chroma_onair: {
				type: 'boolean',
				name: 'CHROMA is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isOnAir(this.state.keyStatus[1]),
			},
			chroma_key: {
				type: 'boolean',
				name: 'CHROMA KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isKey(this.state.keyStatus[1]),
			},
			dsk_onair: {
				type: 'boolean',
				name: 'DSK is ON AIR',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isOnAir(this.state.keyStatus[4]),
			},
			dsk_key: {
				type: 'boolean',
				name: 'DSK KEY enabled',
				options: [],
				defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
				callback: () => isKey(this.state.keyStatus[4]),
			},
		})
	}


	initPresets() {
		const presets = []

		const redOn = { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) }
		const redOff = { bgcolor: combineRgb(60, 0, 0), color: combineRgb(255, 255, 255) }

		const greenOn = { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) }
		const greenOff = { bgcolor: combineRgb(0, 40, 0), color: combineRgb(255, 255, 255) }

		const stillOn = { bgcolor: combineRgb(255, 140, 0), color: combineRgb(0, 0, 0) }
		const stillOff = { bgcolor: combineRgb(60, 35, 0), color: combineRgb(255, 255, 255) }

		const yellowOn = { bgcolor: combineRgb(255, 180, 0), color: combineRgb(0, 0, 0) }
		const yellowOff = { bgcolor: combineRgb(35, 25, 0), color: combineRgb(255, 255, 255) }

		const blueOn = { bgcolor: combineRgb(0, 120, 255), color: combineRgb(255, 255, 255) }
		const blueOff = { bgcolor: combineRgb(0, 20, 45), color: combineRgb(255, 255, 255) }

		const purpleOn = { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) }
		const purpleOff = { bgcolor: combineRgb(35, 0, 45), color: combineRgb(255, 255, 255) }

		for (let i = 1; i <= 16; i++) {
			presets.push({
				type: 'button',
				category: 'Inputs / PGM',
				name: `PGM IN${i}`,
				style: { text: `PGM\nIN${i}`, size: 'auto', ...redOff },
				steps: [{ down: [{ actionId: 'pgm_set', options: { source: i } }], up: [] }],
				feedbacks: [{ feedbackId: 'pgm_is', options: { source: i }, style: redOn }],
			})

			presets.push({
				type: 'button',
				category: 'Inputs / PVW',
				name: `PVW IN${i}`,
				style: { text: `PVW\nIN${i}`, size: 'auto', ...greenOff },
				steps: [{ down: [{ actionId: 'pvw_set', options: { source: i } }], up: [] }],
				feedbacks: [{ feedbackId: 'pvw_is', options: { source: i }, style: greenOn }],
			})

			presets.push({
				type: 'button',
				category: 'Stills / PGM',
				name: `PGM STILL ${i}`,
				style: { text: `PGM\nSTILL${i}`, size: 'auto', ...stillOff },
				steps: [{ down: [{ actionId: 'still_to_pgm', options: { still: i } }], up: [] }],
				feedbacks: [{ feedbackId: 'pgm_still_is', options: { still: i }, style: stillOn }],
			})

			presets.push({
				type: 'button',
				category: 'Stills / PVW',
				name: `PVW STILL ${i}`,
				style: { text: `PVW\nSTILL${i}`, size: 'auto', ...stillOff },
				steps: [{ down: [{ actionId: 'still_to_pvw', options: { still: i } }], up: [] }],
				feedbacks: [{ feedbackId: 'pvw_still_is', options: { still: i }, style: stillOn }],
			})
		}

		presets.push({
			type: 'button',
			category: 'Transitions',
			name: 'CUT',
			style: { text: 'CUT', size: 'auto', bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) },
			steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }],
			feedbacks: [],
		})

		presets.push({
			type: 'button',
			category: 'Transitions',
			name: 'AUTO',
			style: { text: 'AUTO', size: 'auto', bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) },
			steps: [{ down: [{ actionId: 'auto', options: {} }], up: [] }],
			feedbacks: [],
		})

		presets.push({
			type: 'button',
			category: 'Transitions',
			name: 'FTB',
			style: { text: 'FTB', size: 'auto', ...yellowOff },
			steps: [{ down: [{ actionId: 'ftb_toggle', options: {} }], up: [] }],
			feedbacks: [{ feedbackId: 'ftb_on', options: {}, style: yellowOn }],
		})

		presets.push({
			type: 'button',
			category: 'Audio',
			name: 'MUTE',
			style: { text: 'MUTE', size: 'auto', ...blueOff },
			steps: [{ down: [{ actionId: 'audio_mute_toggle', options: {} }], up: [] }],
			feedbacks: [{ feedbackId: 'mute_on', options: {}, style: blueOn }],
		})

		presets.push({
			type: 'button',
			category: 'Audio',
			name: 'AFV',
			style: { text: 'AFV', size: 'auto', ...blueOff },
			steps: [{ down: [{ actionId: 'audio_afv_on', options: { state: 1 } }], up: [] }],
			feedbacks: [{ feedbackId: 'afv_on', options: {}, style: blueOn }],
		})

		const onAirButtons = [
			{ category: 'Keys', name: 'LUMA ON AIR', actionId: 'luma_onair_toggle', feedbackId: 'luma_onair' },
			{ category: 'Keys', name: 'CHROMA ON AIR', actionId: 'chroma_onair_toggle', feedbackId: 'chroma_onair' },
			{ category: 'Keys', name: 'DSK ON AIR', actionId: 'dsk_onair_toggle', feedbackId: 'dsk_onair' },
			{ category: 'PIP', name: 'PIP1 ON AIR', actionId: 'pip1_onair_toggle', feedbackId: 'pip1_onair' },
			{ category: 'PIP', name: 'PIP2 ON AIR', actionId: 'pip2_onair_toggle', feedbackId: 'pip2_onair' },
			{ category: 'Logo', name: 'LOGO ON AIR', actionId: 'logo_onair_toggle', feedbackId: 'logo_onair' },
		]

		for (const b of onAirButtons) {
			presets.push({
				type: 'button',
				category: b.category,
				name: b.name,
				style: { text: b.name, size: '14', ...purpleOff },
				steps: [{ down: [{ actionId: b.actionId, options: {} }], up: [] }],
				feedbacks: [{ feedbackId: b.feedbackId, options: {}, style: purpleOn }],
			})
		}

		this.setPresetDefinitions(presets)
	}


	async initUdp() {
		this.closeUdp()

		const host = (this.config.host || '').trim()
		if (!host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Missing device IP')
			return
		}

		try {
			this.udp = dgram.createSocket('udp4')

			this.udp.on('error', (err) => {
				this.log('error', `UDP error: ${err?.message || err}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, err?.message || 'UDP error')
			})

			this.udp.on('message', (msg, rinfo) => {
				if (rinfo.address === host) {
					this.lastAnyRxAt = Date.now()
				}

				const isStatus = this.handleRxFrame(msg)
				if (rinfo.address === host && isStatus) {
					this.lastStatusRxAt = Date.now()
				}

				this.log('debug', `RX ${rinfo.address}:${rinfo.port} ${msg.toString('hex')}`)
			})

			await new Promise((resolve, reject) => {
				this.udp.bind(LOCAL_UDP_PORT, (err) => (err ? reject(err) : resolve()))
			})

			this.lastAnyRxAt = 0
			this.lastStatusRxAt = 0
			this.rxMissCount = 0
			this.setStatusOnce(InstanceStatus.Warning, `Waiting for device RX (${host})…`)

			this.log('info', `UDP bound local:${LOCAL_UDP_PORT} → device:${host}:${DEVICE_UDP_PORT}`)
		} catch (e) {
			this.log('error', `UDP init failed: ${e?.message || e}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, e?.message || 'UDP init failed')
		}
	}

	closeUdp() {
		if (this.udp) {
			try { this.udp.close() } catch (e) {}
			this.udp = null
		}
	}

	startStatusWatcher() {
		this.stopStatusWatcher()

		const host = (this.config.host || '').trim()
		if (!host) return

		this.statusTimer = setInterval(() => {
			if (!this.udp) return

			const now = Date.now()
			const anyRxOk = this.lastAnyRxAt && (now - this.lastAnyRxAt) <= ANY_RX_OK_MS
			const statusRxOk = this.lastStatusRxAt && (now - this.lastStatusRxAt) <= STATUS_RX_OK_MS

			if (statusRxOk) {
				this.rxMissCount = 0
				this.setStatusOnce(InstanceStatus.Ok, `Connected (${host})`)
				return
			}

			this.rxMissCount++

			if (!anyRxOk) {
				if (this.rxMissCount >= MISS_TO_WARNING) {
					this.setStatusOnce(InstanceStatus.Warning, `No RX from ${host}`)
				}
				return
			}

			if (this.rxMissCount >= (MISS_TO_WARNING * 2)) {
				this.setStatusOnce(InstanceStatus.Warning, `Connected, waiting for status (${host})…`)
			} else {
			}
		}, STATUS_TICK_MS)
	}

	stopStatusWatcher() {
		if (this.statusTimer) {
			clearInterval(this.statusTimer)
			this.statusTimer = null
		}
	}

	setStatusOnce(status, text) {
		const k = `${status}|${text}`
		if (this.lastStatusKey !== k) {
			this.lastStatusKey = k
			this.updateStatus(status, text)
		}
	}

	startPing() {
		this.stopPing()
		const host = (this.config.host || '').trim()
		if (!host || !this.udp) return

		const pingPacket = buildPacket(0xff, [0x01]) // Search Device
		this.pingTimer = setInterval(() => {
			if (!this.udp) return
			this.udp.send(pingPacket, DEVICE_UDP_PORT, host)
			this.log('debug', `TX(PING) ${host}:${DEVICE_UDP_PORT} ${pingPacket.toString('hex')}`)
		}, PING_INTERVAL_MS)
	}

	stopPing() {
		if (this.pingTimer) {
			clearInterval(this.pingTimer)
			this.pingTimer = null
		}
	}

	startSync() {
		this.stopSync()
		if (!this.udp) return
		const sendSync = () => this.sendCmd(0xFE, [0x01]) // Sync=1
		sendSync()
		this.syncTimer = setInterval(sendSync, SYNC_KEEPALIVE_MS)
	}

	stopSync() {
		if (this.syncTimer) {
			clearInterval(this.syncTimer)
			this.syncTimer = null
		}
	}

	sendCmd(cmd, dataBytes) {
		if (!this.udp) return
		const host = String(this.config.host || '').trim()
		if (!host) return
		const pkt = buildPacket(cmd, dataBytes)
		this.udp.send(pkt, DEVICE_UDP_PORT, host)
		this.log('debug', `TX ${host}:${DEVICE_UDP_PORT} ${pkt.toString('hex')}`)
	}

	handleRxFrame(buf) {
		try {
			if (!Buffer.isBuffer(buf) || buf.length < 10) return false
			if (buf[0] !== 0x5a || buf[buf.length - 1] !== 0xdd) return false

			const len = buf[1] | (buf[2] << 8)
			if (len !== buf.length) return false

			const dataLen = buf[6]
			const cmd = buf[7]
			if (dataLen < 1) return false

			const payloadLen = dataLen - 1
			const payload = buf.slice(8, 8 + payloadLen)

			let isStatusPacket = false

			switch (cmd) {
				case 0x12: { // PGM Source
					if (payload.length >= 1) {
						isStatusPacket = true
						this.state.pgm = payload[0]
						this.checkFeedbacks('pgm_is')
						this.checkFeedbacks('pgm_still_is')
					}
					break
				}
				case 0x13: { // PVW Source
					if (payload.length >= 1) {
						isStatusPacket = true
						this.state.pvw = payload[0]
						this.checkFeedbacks('pvw_is')
						this.checkFeedbacks('pvw_still_is')
					}
					break
				}
				case 0x11: { // Control (type, value)
					if (payload.length >= 2) {
						isStatusPacket = true
						const type = payload[0]
						const val = payload[1]
						if (type === 0x03) {
							this.state.ftb = val !== 0
							this.checkFeedbacks('ftb_on')
						} else if (type === 0x05) {
							this.state.mute = val !== 0
							this.checkFeedbacks('mute_on')
						}
					}
					break
				}
				case 0x14: { // Still status (1..16)
					if (payload.length >= 16) {
						isStatusPacket = true
						this.state.still = Array.from(payload.slice(0, 16))
						this.checkFeedbacks('pgm_still_is')
						this.checkFeedbacks('pvw_still_is')
					}
					break
				}
				case 0x01: { // Audio setting (6 bytes)
					if (payload.length >= 6) {
						isStatusPacket = true
						const ch = payload[0]
						const sw = payload[1]
						const vol = payload[2]
						const delay = (payload[3] << 8) | payload[4]
						const mode = payload[5]

						this.state.audio.ch[ch] = { sw, vol, delay, mode }
						if (ch === 0) {							this.state.mute = sw === 0
							this.checkFeedbacks('mute_on')
													}
						this.checkFeedbacks('audio_on')
					}
					break
				}

				case 0x20: {
					if (payload.length >= 6) {
						isStatusPacket = true
						this.state.keyStatus = [payload[0], payload[1], payload[2], payload[3], payload[4], payload[5]]
						this.checkFeedbacks('luma_onair')
						this.checkFeedbacks('luma_key')
						this.checkFeedbacks('chroma_onair')
						this.checkFeedbacks('chroma_key')
						this.checkFeedbacks('dsk_onair')
						this.checkFeedbacks('dsk_key')
						this.checkFeedbacks('pip1_onair')
						this.checkFeedbacks('pip1_key')
						this.checkFeedbacks('pip2_onair')
						this.checkFeedbacks('pip2_key')
						this.checkFeedbacks('logo_onair')
						this.checkFeedbacks('logo_key')
					}
					break
				}

				case 0x24: {
					if (payload.length >= 4) {
						isStatusPacket = true
						this.state.pip1 = {
							src: payload[0],
							size: payload[1],
							x: payload[2],
							y: payload[3],
						}
						this.checkFeedbacks('pip1_source_is')
					}
					break
				}
				case 0x25: {
					if (payload.length >= 4) {
						isStatusPacket = true
						this.state.pip2 = {
							src: payload[0],
							size: payload[1],
							x: payload[2],
							y: payload[3],
						}
						this.checkFeedbacks('pip2_source_is')
					}
					break
				}

				case 0x32: {
					if (payload.length >= 4) {
						isStatusPacket = true
						this.state.logo = {
							x: payload[0],
							y: payload[1],
							size: payload[2],
							opacity: payload[3],
						}
					}
					break
				}

				default:
					break
			}

			return isStatusPacket
		} catch (e) {
			return false
		}
	}

	setStillInput(inputIdx1to4, enable) {
		const i = inputIdx1to4 - 1
		if (i < 0 || i > 3) return
		this.state.still[i] = enable ? 1 : 0
		if (!Array.isArray(this.state.still) || this.state.still.length !== 16) {
			this.state.still = Array.from({ length: 16 }, (_, i) => (this.state.still?.[i] ?? 0))
		}
		this.sendCmd(0x14, this.state.still.slice(0, 16))
	}

	sendAudioSetting(chSelect) {
		const s = this.state.audio.ch[chSelect] || { sw: 1, vol: 60, delay: 0, mode: 0 }
		const delay = clampInt(s.delay, 0, 500)
		const dh = (delay >> 8) & 0xff
		const dl = delay & 0xff

		const sw = s.sw ? 1 : 0
		const vol = clampInt(s.vol, 0, 72)
		const mode = s.mode & 0xff

		if (chSelect === 0)		this.sendCmd(0x01, [chSelect & 0xff, sw, vol, dh, dl, mode])
	}

	sendKeyStatus() {
		const ks = this.state.keyStatus || [0, 0, 0, 0, 0, 0]
		this.sendCmd(0x20, [
			ks[0] & 0xff, ks[1] & 0xff, ks[2] & 0xff,
			ks[3] & 0xff, ks[4] & 0xff, ks[5] & 0xff,
		])
	}

	sendPip1() {
		const p = this.state.pip1
		this.sendCmd(0x24, [
			clampInt(p.src, 0, 8),
			clampInt(p.size, 0, 2),
			clampInt(p.x, 0, 100),
			clampInt(p.y, 0, 100),
		])
	}

	sendPip2() {
		const p = this.state.pip2
		this.sendCmd(0x25, [
			clampInt(p.src, 0, 8),
			clampInt(p.size, 0, 2),
			clampInt(p.x, 0, 100),
			clampInt(p.y, 0, 100),
		])
	}

	sendLogo() {
		const l = this.state.logo
		this.sendCmd(0x32, [
			clampInt(l.x, 0, 100),
			clampInt(l.y, 0, 100),
			clampInt(l.size, 50, 150),
			clampInt(l.opacity, 20, 100),
		])
	}
}

runEntrypoint(AVMatrixInstance, [])