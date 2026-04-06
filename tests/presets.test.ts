import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { initPresets } from '../src/presets.js'
import { initFeedbacks } from '../src/feedbacks.js'
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

type ButtonPreset = {
	type: 'button'
	category: string
	name: string
	steps: Array<{ down: Array<{ actionId: string; options: Record<string, unknown> }> }>
	feedbacks: Array<{ feedbackId: string; options: Record<string, unknown> }>
}

function setup() {
	const presets: Record<string, ButtonPreset> = {}
	const actionDefs: Record<string, unknown> = {}
	const feedbackDefs: Record<string, unknown> = {}

	const instance = {
		state: defaultState(),
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
			Object.assign(actionDefs, defs)
		}),
		setFeedbackDefinitions: vi.fn((defs: Record<string, unknown>) => {
			Object.assign(feedbackDefs, defs)
		}),
		setPresetDefinitions: vi.fn((defs: Record<string, ButtonPreset>) => {
			Object.assign(presets, defs)
		}),
	} as unknown as AVMatrixInstance

	initActions(instance)
	initFeedbacks(instance)
	initPresets(instance)

	const allPresets = Object.values(presets)

	const byName = (name: string) => allPresets.find((p) => p.name === name)
	const byCategory = (cat: string) => allPresets.filter((p) => p.category === cat)

	return { presets, allPresets, actionDefs, feedbackDefs, byName, byCategory }
}

// ─── structural validation ────────────────────────────────────────────────────

describe('preset action/feedback ID validity', () => {
	it('every actionId in every preset step references a registered action', () => {
		const { allPresets, actionDefs } = setup()
		const validActionIds = new Set(Object.keys(actionDefs))

		for (const preset of allPresets) {
			for (const step of preset.steps) {
				for (const action of step.down) {
					expect(validActionIds, `unknown actionId "${action.actionId}" in preset "${preset.name}"`).toContain(
						action.actionId,
					)
				}
			}
		}
	})

	it('every feedbackId in every preset references a registered feedback', () => {
		const { allPresets, feedbackDefs } = setup()
		const validFeedbackIds = new Set(Object.keys(feedbackDefs))

		for (const preset of allPresets) {
			for (const fb of preset.feedbacks) {
				expect(validFeedbackIds, `unknown feedbackId "${fb.feedbackId}" in preset "${preset.name}"`).toContain(
					fb.feedbackId,
				)
			}
		}
	})

	it('all presets have type "button"', () => {
		const { allPresets } = setup()
		for (const p of allPresets) {
			expect(p.type).toBe('button')
		}
	})
})

// ─── input presets ────────────────────────────────────────────────────────────

describe('input presets (PGM / PVW / STILL × 4 inputs)', () => {
	it('creates PGM presets for all 4 inputs', () => {
		const { byName } = setup()
		for (let i = 1; i <= 4; i++) {
			const p = byName(`PGM IN${i}`)
			expect(p, `missing PGM IN${i}`).toBeDefined()
			expect(p?.steps[0]?.down[0]?.actionId).toBe('pgm_set')
			expect(p?.steps[0]?.down[0]?.options.source).toBe(i)
			expect(p?.feedbacks[0]?.feedbackId).toBe('pgm_is')
		}
	})

	it('creates PVW presets for all 4 inputs', () => {
		const { byName } = setup()
		for (let i = 1; i <= 4; i++) {
			const p = byName(`PVW IN${i}`)
			expect(p, `missing PVW IN${i}`).toBeDefined()
			expect(p?.steps[0]?.down[0]?.actionId).toBe('pvw_set')
			expect(p?.feedbacks[0]?.feedbackId).toBe('pvw_is')
		}
	})

	it('creates STILL presets for all 4 inputs', () => {
		const { byName } = setup()
		for (let i = 1; i <= 4; i++) {
			const p = byName(`STILL IN${i}`)
			expect(p, `missing STILL IN${i}`).toBeDefined()
			expect(p?.steps[0]?.down[0]?.actionId).toBe('still_input_toggle')
			expect(p?.feedbacks[0]?.feedbackId).toBe('still_input_on')
		}
	})
})

// ─── transition presets ───────────────────────────────────────────────────────

describe('transition presets', () => {
	it('has CUT preset with cut action and no feedbacks', () => {
		const { byName } = setup()
		const p = byName('CUT')
		expect(p).toBeDefined()
		expect(p?.steps[0]?.down[0]?.actionId).toBe('cut')
		expect(p?.feedbacks).toHaveLength(0)
		expect(p?.category).toBe('Transitions')
	})

	it('has AUTO preset with auto action and no feedbacks', () => {
		const { byName } = setup()
		const p = byName('AUTO')
		expect(p?.steps[0]?.down[0]?.actionId).toBe('auto')
		expect(p?.feedbacks).toHaveLength(0)
	})

	it('has FTB preset with ftb_toggle action and ftb_on feedback', () => {
		const { byName } = setup()
		const p = byName('FTB')
		expect(p?.steps[0]?.down[0]?.actionId).toBe('ftb_toggle')
		expect(p?.feedbacks[0]?.feedbackId).toBe('ftb_on')
	})
})

// ─── audio preset ─────────────────────────────────────────────────────────────

describe('audio presets', () => {
	it('has MUTE preset with audio_mute_toggle action and mute_on feedback', () => {
		const { byName } = setup()
		const p = byName('MUTE')
		expect(p).toBeDefined()
		expect(p?.steps[0]?.down[0]?.actionId).toBe('audio_mute_toggle')
		expect(p?.feedbacks[0]?.feedbackId).toBe('mute_on')
		expect(p?.category).toBe('Audio')
	})
})

// ─── keyer mode presets ───────────────────────────────────────────────────────

const keyerGroups = ['LUMA', 'CHROMA', 'DSK', 'PIP1', 'PIP2', 'LOGO']
const modes = ['OFF', 'KEY', 'ON AIR', 'KEY+ON']

describe('keyer mode presets (6 groups × 4 modes = 24)', () => {
	it('creates 4 mode presets for each keyer group', () => {
		const { allPresets } = setup()
		for (const keyer of keyerGroups) {
			for (const mode of modes) {
				const name = `${keyer} ${mode}`
				const found = allPresets.find((p) => p.name === name)
				expect(found, `missing preset "${name}"`).toBeDefined()
			}
		}
	})

	it('LUMA OFF preset uses luma_mode_set with mode 0 and no feedbacks', () => {
		const { byName } = setup()
		const p = byName('LUMA OFF')
		expect(p?.steps[0]?.down[0]?.actionId).toBe('luma_mode_set')
		expect(p?.steps[0]?.down[0]?.options.mode).toBe(0)
		expect(p?.feedbacks).toHaveLength(0)
	})

	it('LUMA KEY preset uses luma_mode_set with mode 1 and luma_key feedback', () => {
		const { byName } = setup()
		const p = byName('LUMA KEY')
		expect(p?.steps[0]?.down[0]?.options.mode).toBe(1)
		expect(p?.feedbacks[0]?.feedbackId).toBe('luma_key')
	})

	it('LUMA ON AIR preset uses mode 2 and luma_onair feedback', () => {
		const { byName } = setup()
		const p = byName('LUMA ON AIR')
		expect(p?.steps[0]?.down[0]?.options.mode).toBe(2)
		expect(p?.feedbacks[0]?.feedbackId).toBe('luma_onair')
	})

	it('LUMA KEY+ON preset uses mode 3 and both luma_key + luma_onair feedbacks', () => {
		const { byName } = setup()
		const p = byName('LUMA KEY+ON')
		expect(p?.steps[0]?.down[0]?.options.mode).toBe(3)
		const fbIds = p?.feedbacks.map((f) => f.feedbackId)
		expect(fbIds).toContain('luma_key')
		expect(fbIds).toContain('luma_onair')
	})
})

// ─── onair toggle presets ─────────────────────────────────────────────────────

describe('ON AIR toggle presets', () => {
	it('creates onair toggle for each keyer group', () => {
		const { allPresets } = setup()
		const toggleActionIds = [
			'luma_onair_toggle',
			'chroma_onair_toggle',
			'dsk_onair_toggle',
			'pip1_onair_toggle',
			'pip2_onair_toggle',
			'logo_onair_toggle',
		]
		for (const actionId of toggleActionIds) {
			const found = allPresets.find((p) => p.steps[0]?.down[0]?.actionId === actionId)
			expect(found, `missing toggle preset for ${actionId}`).toBeDefined()
		}
	})

	it('LUMA ON AIR TOGGLE preset has luma_onair feedback', () => {
		const { byName } = setup()
		const p = byName('LUMA ON AIR TOGGLE')
		expect(p).toBeDefined()
		expect(p?.feedbacks[0]?.feedbackId).toBe('luma_onair')
	})
})

// ─── total count ──────────────────────────────────────────────────────────────

describe('total preset count', () => {
	it('produces the expected number of presets', () => {
		const { allPresets } = setup()
		// 4 inputs × 3 (PGM/PVW/STILL) = 12
		// CUT + AUTO + FTB = 3
		// MUTE = 1
		// 6 keyers × 4 modes = 24
		// 6 keyers × 1 toggle = 6
		// total = 46
		expect(allPresets).toHaveLength(46)
	})
})
