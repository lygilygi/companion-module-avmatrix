import { describe, it, expect, vi } from 'vitest'

vi.mock('@companion-module/base', () => ({
	combineRgb: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
}))

import { initFeedbacks } from '../src/feedbacks.js'
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

type FbCb = (fb?: { options: Record<string, unknown> }) => boolean

function setup(stateOverrides: Partial<AVMatrixState> = {}) {
	const captured: Record<string, unknown> = {}
	const state: AVMatrixState = { ...defaultState(), ...stateOverrides }
	const instance = {
		state,
		setFeedbackDefinitions: vi.fn((defs: Record<string, unknown>) => {
			Object.assign(captured, defs)
		}),
	} as unknown as AVMatrixInstance

	initFeedbacks(instance)

	const cb = (id: string): FbCb => (captured[id] as { callback: FbCb }).callback

	return { instance, captured, cb }
}

// ─── pgm_is ───────────────────────────────────────────────────────────────────

describe('pgm_is', () => {
	it('returns true when pgm matches source', () => {
		const { cb } = setup({ pgm: 3 })
		expect(cb('pgm_is')({ options: { source: 3 } })).toBe(true)
	})

	it('returns false when pgm does not match source', () => {
		const { cb } = setup({ pgm: 1 })
		expect(cb('pgm_is')({ options: { source: 3 } })).toBe(false)
	})

	it('handles Pattern source (id 5)', () => {
		const { cb } = setup({ pgm: 5 })
		expect(cb('pgm_is')({ options: { source: 5 } })).toBe(true)
	})
})

// ─── pvw_is ───────────────────────────────────────────────────────────────────

describe('pvw_is', () => {
	it('returns true when pvw matches source', () => {
		const { cb } = setup({ pvw: 2 })
		expect(cb('pvw_is')({ options: { source: 2 } })).toBe(true)
	})

	it('returns false when pvw does not match source', () => {
		const { cb } = setup({ pvw: 2 })
		expect(cb('pvw_is')({ options: { source: 4 } })).toBe(false)
	})
})

// ─── still_input_on ───────────────────────────────────────────────────────────

describe('still_input_on', () => {
	it('returns true when still is active for the input', () => {
		const still = Array(16).fill(0) as number[]
		still[1] = 1 // input 2 → index 1
		const { cb } = setup({ still })
		expect(cb('still_input_on')({ options: { input: 2 } })).toBe(true)
	})

	it('returns false when still is inactive for the input', () => {
		const { cb } = setup()
		expect(cb('still_input_on')({ options: { input: 1 } })).toBe(false)
	})

	it('returns false for out-of-range input (0)', () => {
		const { cb } = setup()
		expect(cb('still_input_on')({ options: { input: 0 } })).toBe(false)
	})

	it('returns false for out-of-range input (5)', () => {
		const { cb } = setup()
		expect(cb('still_input_on')({ options: { input: 5 } })).toBe(false)
	})
})

// ─── pgm_still_on ─────────────────────────────────────────────────────────────

describe('pgm_still_on', () => {
	it('returns true when pgm source has still active', () => {
		const still = Array(16).fill(0) as number[]
		still[0] = 1 // input 1 → index 0
		const { cb } = setup({ pgm: 1, still })
		expect(cb('pgm_still_on')()).toBe(true)
	})

	it('returns false when pgm source has still inactive', () => {
		const { cb } = setup({ pgm: 1 })
		expect(cb('pgm_still_on')()).toBe(false)
	})

	it('returns false when pgm is Pattern (id 5, not a still input)', () => {
		const { cb } = setup({ pgm: 5 })
		expect(cb('pgm_still_on')()).toBe(false)
	})
})

// ─── pvw_still_on ─────────────────────────────────────────────────────────────

describe('pvw_still_on', () => {
	it('returns true when pvw source has still active', () => {
		const still = Array(16).fill(0) as number[]
		still[2] = 1 // input 3 → index 2
		const { cb } = setup({ pvw: 3, still })
		expect(cb('pvw_still_on')()).toBe(true)
	})

	it('returns false when pvw source has still inactive', () => {
		const { cb } = setup({ pvw: 2 })
		expect(cb('pvw_still_on')()).toBe(false)
	})

	it('returns false when pvw is out of still range', () => {
		const { cb } = setup({ pvw: 5 })
		expect(cb('pvw_still_on')()).toBe(false)
	})
})

// ─── ftb_on ───────────────────────────────────────────────────────────────────

describe('ftb_on', () => {
	it('returns true when ftb is true', () => {
		const { cb } = setup({ ftb: true })
		expect(cb('ftb_on')()).toBe(true)
	})

	it('returns false when ftb is false', () => {
		const { cb } = setup({ ftb: false })
		expect(cb('ftb_on')()).toBe(false)
	})
})

// ─── mute_on ──────────────────────────────────────────────────────────────────

describe('mute_on', () => {
	it('returns true when mute is true', () => {
		const { cb } = setup({ mute: true })
		expect(cb('mute_on')()).toBe(true)
	})

	it('returns false when mute is false', () => {
		const { cb } = setup({ mute: false })
		expect(cb('mute_on')()).toBe(false)
	})
})

// ─── audio_on ─────────────────────────────────────────────────────────────────

describe('audio_on', () => {
	it('returns true when channel sw is 1', () => {
		const state = defaultState()
		state.audio.ch[3] = { sw: 1, vol: 60, delay: 0, mode: 0 }
		const { cb } = setup(state)
		expect(cb('audio_on')({ options: { ch: 3 } })).toBe(true)
	})

	it('returns false when channel sw is 0', () => {
		const state = defaultState()
		state.audio.ch[2] = { sw: 0, vol: 60, delay: 0, mode: 0 }
		const { cb } = setup(state)
		expect(cb('audio_on')({ options: { ch: 2 } })).toBe(false)
	})

	it('returns false when channel is missing from state', () => {
		const state = defaultState()
		delete (state.audio.ch as Record<number, unknown>)[9]
		const { cb } = setup(state)
		expect(cb('audio_on')({ options: { ch: 9 } })).toBe(false)
	})
})

// ─── keyer feedbacks (luma / chroma / dsk / pip1 / pip2 / logo) ───────────────

type KeyerSpec = { onairId: string; keyId: string; statusIndex: number }

const keyers: KeyerSpec[] = [
	{ onairId: 'luma_onair', keyId: 'luma_key', statusIndex: 0 },
	{ onairId: 'chroma_onair', keyId: 'chroma_key', statusIndex: 1 },
	{ onairId: 'pip1_onair', keyId: 'pip1_key', statusIndex: 2 },
	{ onairId: 'pip2_onair', keyId: 'pip2_key', statusIndex: 3 },
	{ onairId: 'dsk_onair', keyId: 'dsk_key', statusIndex: 4 },
	{ onairId: 'logo_onair', keyId: 'logo_key', statusIndex: 5 },
]

for (const { onairId, keyId, statusIndex } of keyers) {
	describe(`${onairId} / ${keyId} (keyStatus[${statusIndex}])`, () => {
		function setupKeyer(mode: number) {
			const keyStatus = [0, 0, 0, 0, 0, 0]
			keyStatus[statusIndex] = mode
			return setup({ keyStatus })
		}

		it(`${onairId}: false for mode 0 (Off)`, () => {
			expect(setupKeyer(0).cb(onairId)()).toBe(false)
		})

		it(`${onairId}: false for mode 1 (Key only)`, () => {
			expect(setupKeyer(1).cb(onairId)()).toBe(false)
		})

		it(`${onairId}: true for mode 2 (OnAir)`, () => {
			expect(setupKeyer(2).cb(onairId)()).toBe(true)
		})

		it(`${onairId}: true for mode 3 (Key + OnAir)`, () => {
			expect(setupKeyer(3).cb(onairId)()).toBe(true)
		})

		it(`${keyId}: false for mode 0 (Off)`, () => {
			expect(setupKeyer(0).cb(keyId)()).toBe(false)
		})

		it(`${keyId}: true for mode 1 (Key only)`, () => {
			expect(setupKeyer(1).cb(keyId)()).toBe(true)
		})

		it(`${keyId}: false for mode 2 (OnAir only)`, () => {
			expect(setupKeyer(2).cb(keyId)()).toBe(false)
		})

		it(`${keyId}: true for mode 3 (Key + OnAir)`, () => {
			expect(setupKeyer(3).cb(keyId)()).toBe(true)
		})
	})
}

// ─── pip source feedbacks ─────────────────────────────────────────────────────

describe('pip1_source_is', () => {
	it('returns true when pip1 source matches', () => {
		const { cb } = setup({ pip1: { source: 4, x: 50, y: 50, size: 1 } })
		expect(cb('pip1_source_is')({ options: { src: 4 } })).toBe(true)
	})

	it('returns false when pip1 source does not match', () => {
		const { cb } = setup({ pip1: { source: 4, x: 50, y: 50, size: 1 } })
		expect(cb('pip1_source_is')({ options: { src: 2 } })).toBe(false)
	})
})

describe('pip2_source_is', () => {
	it('returns true when pip2 source matches', () => {
		const { cb } = setup({ pip2: { source: 5, x: 60, y: 60, size: 1 } })
		expect(cb('pip2_source_is')({ options: { src: 5 } })).toBe(true)
	})

	it('returns false when pip2 source does not match', () => {
		const { cb } = setup({ pip2: { source: 5, x: 60, y: 60, size: 1 } })
		expect(cb('pip2_source_is')({ options: { src: 1 } })).toBe(false)
	})
})

// ─── completeness ─────────────────────────────────────────────────────────────

describe('initFeedbacks', () => {
	it('registers all 20 feedback IDs', () => {
		const { captured } = setup()
		const ids = Object.keys(captured)
		const expected = [
			'pgm_is',
			'pvw_is',
			'still_input_on',
			'pgm_still_on',
			'pvw_still_on',
			'ftb_on',
			'mute_on',
			'audio_on',
			'luma_onair',
			'luma_key',
			'chroma_onair',
			'chroma_key',
			'dsk_onair',
			'dsk_key',
			'pip1_onair',
			'pip1_key',
			'pip2_onair',
			'pip2_key',
			'logo_onair',
			'logo_key',
			'pip1_source_is',
			'pip2_source_is',
		]
		for (const id of expected) expect(ids).toContain(id)
		expect(ids).toHaveLength(expected.length)
	})

	it('state changes are reflected in subsequent feedback calls', () => {
		const { instance, cb } = setup({ ftb: false })
		expect(cb('ftb_on')()).toBe(false)
		instance.state.ftb = true
		expect(cb('ftb_on')()).toBe(true)
	})
})
