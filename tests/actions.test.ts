import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({}))

import { initActions } from '../src/actions.js'
import type { AVMatrixInstance, AVMatrixState } from '../src/instance.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

function defaultState(): AVMatrixState {
	return {
		pgm: 1,
		pvw: 2,
		ftb: false,
		mute: false,
		still: Array(16).fill(0) as number[],
		keyStatus: [0, 0, 0, 0, 0, 0],
		pip1: { source: 4, x: 50, y: 50, size: 1 },
		pip2: { source: 5, x: 60, y: 60, size: 1 },
		logo: { source: 1, x: 50, y: 50, size: 100, opacity: 100 },
		audio: {
			ch: {
				0: { sw: 1, vol: 60, delay: 0, mode: 0 },
				1: { sw: 1, vol: 60, delay: 0, mode: 0 },
				2: { sw: 1, vol: 60, delay: 0, mode: 0 },
				3: { sw: 1, vol: 60, delay: 0, mode: 0 },
				4: { sw: 1, vol: 60, delay: 0, mode: 0 },
				5: { sw: 1, vol: 60, delay: 0, mode: 0 },
				6: { sw: 1, vol: 60, delay: 0, mode: 0 },
				7: { sw: 1, vol: 60, delay: 0, mode: 0 },
			},
		},
		outputPorts: { mv: 8, pgm: 4, usb: 4 },
	}
}

type ActCb = (action?: { options: Record<string, unknown> }) => Promise<void>

function setup() {
	const captured: Record<string, unknown> = {}
	const state = defaultState()
	const instance = {
		state,
		sendCmd: vi.fn(),
		checkFeedbacks: vi.fn(),
		setStillInput: vi.fn(),
		toggleStillInput: vi.fn(),
		sendKeyStatus: vi.fn(),
		sendPip1: vi.fn(),
		sendPip2: vi.fn(),
		sendLogo: vi.fn(),
		sendAudioSetting: vi.fn(),
		setMvOut: vi.fn(),
		setPgmOutPort: vi.fn(),
		setUsbOut: vi.fn(),
		setActionDefinitions: vi.fn((defs: Record<string, unknown>) => {
			Object.assign(captured, defs)
		}),
	} as unknown as AVMatrixInstance & {
		sendCmd: ReturnType<typeof vi.fn>
		checkFeedbacks: ReturnType<typeof vi.fn>
		setStillInput: ReturnType<typeof vi.fn>
		toggleStillInput: ReturnType<typeof vi.fn>
		sendKeyStatus: ReturnType<typeof vi.fn>
		sendPip1: ReturnType<typeof vi.fn>
		sendPip2: ReturnType<typeof vi.fn>
		sendLogo: ReturnType<typeof vi.fn>
		sendAudioSetting: ReturnType<typeof vi.fn>
		setMvOut: ReturnType<typeof vi.fn>
		setPgmOutPort: ReturnType<typeof vi.fn>
		setUsbOut: ReturnType<typeof vi.fn>
	}

	initActions(instance)

	const act = (id: string): ActCb => (captured[id] as { callback: ActCb }).callback

	return { instance, captured, act }
}

// ─── PGM / PVW ────────────────────────────────────────────────────────────────

describe('pgm_set', () => {
	it('sends cmd 0x12 with source byte', async () => {
		const { instance, act } = setup()
		await act('pgm_set')({ options: { source: 3 } })
		expect(instance.sendCmd).toHaveBeenCalledWith(0x12, [3])
	})

	it('updates state.pgm', async () => {
		const { instance, act } = setup()
		await act('pgm_set')({ options: { source: 4 } })
		expect(instance.state.pgm).toBe(4)
	})

	it('calls checkFeedbacks for pgm_is and pgm_still_on', async () => {
		const { instance, act } = setup()
		await act('pgm_set')({ options: { source: 2 } })
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('pgm_is')
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('pgm_still_on')
	})
})

describe('pvw_set', () => {
	it('sends cmd 0x13 with source byte', async () => {
		const { instance, act } = setup()
		await act('pvw_set')({ options: { source: 2 } })
		expect(instance.sendCmd).toHaveBeenCalledWith(0x13, [2])
	})

	it('updates state.pvw', async () => {
		const { instance, act } = setup()
		await act('pvw_set')({ options: { source: 1 } })
		expect(instance.state.pvw).toBe(1)
	})

	it('calls checkFeedbacks for pvw_is and pvw_still_on', async () => {
		const { instance, act } = setup()
		await act('pvw_set')({ options: { source: 3 } })
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('pvw_is')
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('pvw_still_on')
	})
})

// ─── transitions ──────────────────────────────────────────────────────────────

describe('cut', () => {
	it('sends cmd 0x11 [0x02, 0x00]', async () => {
		const { instance, act } = setup()
		await act('cut')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x02, 0x00])
	})
})

describe('auto', () => {
	it('sends cmd 0x11 [0x01, 0x00]', async () => {
		const { instance, act } = setup()
		await act('auto')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x01, 0x00])
	})
})

// ─── FTB ──────────────────────────────────────────────────────────────────────

describe('ftb_on', () => {
	it('sends cmd 0x11 [0x03, 0x01] and sets state.ftb = true', async () => {
		const { instance, act } = setup()
		await act('ftb_on')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x03, 0x01])
		expect(instance.state.ftb).toBe(true)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('ftb_on')
	})
})

describe('ftb_off', () => {
	it('sends cmd 0x11 [0x03, 0x00] and sets state.ftb = false', async () => {
		const { instance, act } = setup()
		instance.state.ftb = true
		await act('ftb_off')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x03, 0x00])
		expect(instance.state.ftb).toBe(false)
	})
})

describe('ftb_toggle', () => {
	it('turns FTB on when currently off', async () => {
		const { instance, act } = setup()
		instance.state.ftb = false
		await act('ftb_toggle')()
		expect(instance.state.ftb).toBe(true)
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x03, 0x01])
	})

	it('turns FTB off when currently on', async () => {
		const { instance, act } = setup()
		instance.state.ftb = true
		await act('ftb_toggle')()
		expect(instance.state.ftb).toBe(false)
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x03, 0x00])
	})
})

// ─── STILL ────────────────────────────────────────────────────────────────────

describe('still_input_on', () => {
	it('calls setStillInput(input, true)', async () => {
		const { instance, act } = setup()
		await act('still_input_on')({ options: { input: 3 } })
		expect(instance.setStillInput).toHaveBeenCalledWith(3, true)
	})
})

describe('still_input_off', () => {
	it('calls setStillInput(input, false)', async () => {
		const { instance, act } = setup()
		await act('still_input_off')({ options: { input: 2 } })
		expect(instance.setStillInput).toHaveBeenCalledWith(2, false)
	})
})

describe('still_input_toggle', () => {
	it('calls toggleStillInput(input)', async () => {
		const { instance, act } = setup()
		await act('still_input_toggle')({ options: { input: 1 } })
		expect(instance.toggleStillInput).toHaveBeenCalledWith(1)
	})
})

// ─── keyer mode set ───────────────────────────────────────────────────────────

type KeyerModeSpec = {
	actionId: string
	statusIndex: number
	fbOnAir: string
	fbKey: string
}

const keyerModeActions: KeyerModeSpec[] = [
	{ actionId: 'luma_mode_set', statusIndex: 0, fbOnAir: 'luma_onair', fbKey: 'luma_key' },
	{ actionId: 'chroma_mode_set', statusIndex: 1, fbOnAir: 'chroma_onair', fbKey: 'chroma_key' },
	{ actionId: 'pip1_mode_set', statusIndex: 2, fbOnAir: 'pip1_onair', fbKey: 'pip1_key' },
	{ actionId: 'pip2_mode_set', statusIndex: 3, fbOnAir: 'pip2_onair', fbKey: 'pip2_key' },
	{ actionId: 'dsk_mode_set', statusIndex: 4, fbOnAir: 'dsk_onair', fbKey: 'dsk_key' },
	{ actionId: 'logo_mode_set', statusIndex: 5, fbOnAir: 'logo_onair', fbKey: 'logo_key' },
]

for (const { actionId, statusIndex, fbOnAir, fbKey } of keyerModeActions) {
	describe(actionId, () => {
		it(`sets keyStatus[${statusIndex}] and calls sendKeyStatus + checkFeedbacks`, async () => {
			const { instance, act } = setup()
			await act(actionId)({ options: { mode: 2 } })
			expect(instance.state.keyStatus[statusIndex]).toBe(2)
			expect(instance.sendKeyStatus).toHaveBeenCalledOnce()
			expect(instance.checkFeedbacks).toHaveBeenCalledWith(fbOnAir)
			expect(instance.checkFeedbacks).toHaveBeenCalledWith(fbKey)
		})

		it('sets mode 0 (Off)', async () => {
			const { instance, act } = setup()
			instance.state.keyStatus[statusIndex] = 3
			await act(actionId)({ options: { mode: 0 } })
			expect(instance.state.keyStatus[statusIndex]).toBe(0)
		})
	})
}

// ─── onair toggles ────────────────────────────────────────────────────────────

type ToggleSpec = { actionId: string; statusIndex: number }

const onAirToggleActions: ToggleSpec[] = [
	{ actionId: 'luma_onair_toggle', statusIndex: 0 },
	{ actionId: 'chroma_onair_toggle', statusIndex: 1 },
	{ actionId: 'pip1_onair_toggle', statusIndex: 2 },
	{ actionId: 'pip2_onair_toggle', statusIndex: 3 },
	{ actionId: 'dsk_onair_toggle', statusIndex: 4 },
	{ actionId: 'logo_onair_toggle', statusIndex: 5 },
]

for (const { actionId, statusIndex } of onAirToggleActions) {
	describe(actionId, () => {
		it('sets to 2 (OnAir) when currently 0 (Off)', async () => {
			const { instance, act } = setup()
			instance.state.keyStatus[statusIndex] = 0
			await act(actionId)()
			expect(instance.state.keyStatus[statusIndex]).toBe(2)
			expect(instance.sendKeyStatus).toHaveBeenCalledOnce()
		})

		it('sets to 0 (Off) when currently 2 (OnAir)', async () => {
			const { instance, act } = setup()
			instance.state.keyStatus[statusIndex] = 2
			await act(actionId)()
			expect(instance.state.keyStatus[statusIndex]).toBe(0)
		})

		it('sets to 0 (Off) when currently 3 (Key+OnAir)', async () => {
			const { instance, act } = setup()
			instance.state.keyStatus[statusIndex] = 3
			await act(actionId)()
			expect(instance.state.keyStatus[statusIndex]).toBe(0)
		})

		it('sets to 2 when currently 1 (Key only)', async () => {
			const { instance, act } = setup()
			instance.state.keyStatus[statusIndex] = 1
			await act(actionId)()
			expect(instance.state.keyStatus[statusIndex]).toBe(2)
		})
	})
}

// ─── audio mute ───────────────────────────────────────────────────────────────

describe('audio_mute_on', () => {
	it('sends cmd 0x11 [0x05, 0x01] and sets state.mute = true', async () => {
		const { instance, act } = setup()
		await act('audio_mute_on')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x05, 0x01])
		expect(instance.state.mute).toBe(true)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('mute_on')
	})
})

describe('audio_mute_off', () => {
	it('sends cmd 0x11 [0x05, 0x00] and sets state.mute = false', async () => {
		const { instance, act } = setup()
		instance.state.mute = true
		await act('audio_mute_off')()
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x05, 0x00])
		expect(instance.state.mute).toBe(false)
	})
})

describe('audio_mute_toggle', () => {
	it('unmutes when currently muted', async () => {
		const { instance, act } = setup()
		instance.state.mute = true
		await act('audio_mute_toggle')()
		expect(instance.state.mute).toBe(false)
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x05, 0x00])
	})

	it('mutes when currently unmuted', async () => {
		const { instance, act } = setup()
		instance.state.mute = false
		await act('audio_mute_toggle')()
		expect(instance.state.mute).toBe(true)
		expect(instance.sendCmd).toHaveBeenCalledWith(0x11, [0x05, 0x01])
	})
})

// ─── audio_set ────────────────────────────────────────────────────────────────

describe('audio_set', () => {
	it('updates channel state and calls sendAudioSetting', async () => {
		const { instance, act } = setup()
		await act('audio_set')({ options: { ch: 2, sw: 0, vol: 40, delay: 50 } })
		expect(instance.state.audio.ch[2]).toMatchObject({ sw: 0, vol: 40, delay: 50 })
		expect(instance.sendAudioSetting).toHaveBeenCalledWith(2)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('audio_on')
	})

	it('updates master mute state when ch 0 sw is set to 0', async () => {
		const { instance, act } = setup()
		await act('audio_set')({ options: { ch: 0, sw: 0, vol: 60, delay: 0 } })
		expect(instance.state.mute).toBe(true)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('mute_on')
	})

	it('clears master mute when ch 0 sw is set to 1', async () => {
		const { instance, act } = setup()
		instance.state.mute = true
		await act('audio_set')({ options: { ch: 0, sw: 1, vol: 60, delay: 0 } })
		expect(instance.state.mute).toBe(false)
	})

	it('does not touch mute when ch is not 0', async () => {
		const { instance, act } = setup()
		instance.state.mute = false
		await act('audio_set')({ options: { ch: 3, sw: 0, vol: 30, delay: 0 } })
		expect(instance.state.mute).toBe(false)
	})
})

// ─── audio misc ───────────────────────────────────────────────────────────────

describe('audio_hp_select', () => {
	it('updates ch[7].mode and calls sendAudioSetting(7)', async () => {
		const { instance, act } = setup()
		await act('audio_hp_select')({ options: { src: 3 } })
		expect(instance.state.audio.ch[7]?.mode).toBe(3)
		expect(instance.sendAudioSetting).toHaveBeenCalledWith(7)
	})
})

describe('audio_mic1_mode', () => {
	it('updates ch[5].mode and calls sendAudioSetting(5)', async () => {
		const { instance, act } = setup()
		await act('audio_mic1_mode')({ options: { mode: 1 } })
		expect(instance.state.audio.ch[5]?.mode).toBe(1)
		expect(instance.sendAudioSetting).toHaveBeenCalledWith(5)
	})
})

describe('audio_mic2_mode', () => {
	it('updates ch[6].mode and calls sendAudioSetting(6)', async () => {
		const { instance, act } = setup()
		await act('audio_mic2_mode')({ options: { mode: 1 } })
		expect(instance.state.audio.ch[6]?.mode).toBe(1)
		expect(instance.sendAudioSetting).toHaveBeenCalledWith(6)
	})
})

// ─── output routing ───────────────────────────────────────────────────────────

describe('output_mv_set', () => {
	it('calls setMvOut with source', async () => {
		const { instance, act } = setup()
		await act('output_mv_set')({ options: { src: 8 } })
		expect(instance.setMvOut).toHaveBeenCalledWith(8)
	})
})

describe('output_pgm_set', () => {
	it('calls setPgmOutPort with source', async () => {
		const { instance, act } = setup()
		await act('output_pgm_set')({ options: { src: 4 } })
		expect(instance.setPgmOutPort).toHaveBeenCalledWith(4)
	})
})

describe('output_usb_set', () => {
	it('calls setUsbOut with source', async () => {
		const { instance, act } = setup()
		await act('output_usb_set')({ options: { src: 6 } })
		expect(instance.setUsbOut).toHaveBeenCalledWith(6)
	})
})

// ─── completeness ─────────────────────────────────────────────────────────────

describe('initActions', () => {
	it('registers all expected action IDs', () => {
		const { captured } = setup()
		const ids = Object.keys(captured)
		const expected = [
			'pgm_set',
			'pvw_set',
			'cut',
			'auto',
			'ftb_on',
			'ftb_off',
			'ftb_toggle',
			'still_input_on',
			'still_input_off',
			'still_input_toggle',
			'luma_mode_set',
			'chroma_mode_set',
			'pip1_mode_set',
			'pip2_mode_set',
			'dsk_mode_set',
			'logo_mode_set',
			'luma_onair_toggle',
			'chroma_onair_toggle',
			'pip1_onair_toggle',
			'pip2_onair_toggle',
			'dsk_onair_toggle',
			'logo_onair_toggle',
			'pip1_set',
			'pip2_set',
			'logo_set',
			'audio_set',
			'audio_mute_on',
			'audio_mute_off',
			'audio_mute_toggle',
			'audio_hp_select',
			'audio_mic1_mode',
			'audio_mic2_mode',
			'output_mv_set',
			'output_pgm_set',
			'output_usb_set',
		]
		for (const id of expected) expect(ids, `missing action: ${id}`).toContain(id)
		expect(ids).toHaveLength(expected.length)
	})
})
