import dgram from 'node:dgram'
import type { Socket } from 'node:dgram'

import { InstanceBase, InstanceStatus } from '@companion-module/base'

import type { AVMatrixConfig } from './config'
import { getConfigFields } from './config'
import { initActions } from './actions'
import { initFeedbacks } from './feedbacks'
import { initPresets } from './presets'
import {
	DEVICE_UDP_PORT,
	LOCAL_UDP_PORT,
	PING_INTERVAL_MS,
	SYNC_KEEPALIVE_MS,
	ANY_RX_OK_MS,
	STATUS_RX_OK_MS,
	STATUS_TICK_MS,
	MISS_TO_WARNING,
} from './constants'
import { clampInt } from './utils'

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

export interface KeyerStatusState {
	pgm: number
	pvw: number
	ftb: boolean
	mute: boolean
	still: number[]
	audio: { ch: Record<number, { sw: number; vol: number; delay: number; mode: number }> }
	keyStatus: number[]
	pip1: { source: number; x: number; y: number; size: number }
	pip2: { source: number; x: number; y: number; size: number }
	logo: { source: number; x: number; y: number; size: number; opacity: number }
}

export class AVMatrixInstance extends InstanceBase<AVMatrixConfig> {
	public config: AVMatrixConfig
	private udp: Socket | null = null
	private pingTimer: NodeJS.Timeout | null = null
	private syncTimer: NodeJS.Timeout | null = null
	private statusTimer: NodeJS.Timeout | null = null
	private lastAnyRxAt = 0
	private lastStatusRxAt = 0
	private rxMissCount = 0
	private lastStatusKey = ''
	public state: KeyerStatusState

	constructor(internal: any) {
	super(internal)
	this.config = { host: '' }
	this.state = {
			pgm: 1,
			pvw: 1,
			ftb: false,
			mute: false,

			still: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

			keyStatus: [0, 0, 0, 0, 0, 0],

			pip1: { source: 4, size: 1, x: 50, y: 50 },
			pip2: { source: 5, size: 1, x: 60, y: 60 },

			logo: { source: 1, x: 50, y: 50, size: 100, opacity: 100 },

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
		return getConfigFields()
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
		initActions(this)
	}


	initFeedbacks() {
		initFeedbacks(this)
	}



	initPresets() {
		initPresets(this)
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

			await new Promise<void>((resolve, reject) => {
				let done = false
				const onErr = (e: any) => { if (done) return; done = true; reject(e) }
				const onListen = () => { if (done) return; done = true; resolve() }
				this.udp?.once('error', onErr as any)
				this.udp?.once('listening', onListen as any)
				this.udp?.bind(LOCAL_UDP_PORT)
			})

			this.lastAnyRxAt = 0
			this.lastStatusRxAt = 0
			this.rxMissCount = 0
			this.setStatusOnce(InstanceStatus.Connecting, `Waiting for device RX (${host})…`)

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
					this.setStatusOnce(InstanceStatus.Connecting, `No RX from ${host}`)
				}
				return
			}

			if (this.rxMissCount >= (MISS_TO_WARNING * 2)) {
				this.setStatusOnce(InstanceStatus.Connecting, `Connected, waiting for status (${host})…`)
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
							source: payload[0],
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
							source: payload[0],
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
							source: this.state.logo.source,
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
			clampInt(p.source, 0, 8),
			clampInt(p.size, 0, 2),
			clampInt(p.x, 0, 100),
			clampInt(p.y, 0, 100),
		])
	}

	sendPip2() {
		const p = this.state.pip2
		this.sendCmd(0x25, [
			clampInt(p.source, 0, 8),
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