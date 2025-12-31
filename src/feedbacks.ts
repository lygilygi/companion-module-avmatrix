import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import { combineRgb } from '@companion-module/base'
import { AUDIO_CHANNELS } from './constants'
import { isOnAir, isKey } from './utils'
import type { AVMatrixInstance } from './instance'

import { VIDEO_SOURCES, STILL_INPUTS, PIP_SOURCES, KEY_MODES, HP_SOURCES } from './constants'

export function initFeedbacks(instance: any) {
	const videoChoices = VIDEO_SOURCES.map((s) => ({ id: s.id, label: s.label }))
	const stillChoices = STILL_INPUTS.map((s) => ({ id: s.id, label: s.label }))
	const audioChoices = AUDIO_CHANNELS.map((c) => ({ id: c.id, label: c.label }))
	const pipSrcChoices = PIP_SOURCES.map((s) => ({ id: s.id, label: s.label }))

	instance.setFeedbackDefinitions({
		pgm_is: {
			type: 'boolean',
			name: 'PGM is Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => instance.state.pgm === Number(fb.options.source),
		},
		pvw_is: {
			type: 'boolean',
			name: 'PVW is Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
			defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => instance.state.pvw === Number(fb.options.source),
		},

		ftb_on: {
			type: 'boolean',
			name: 'FTB is ON',
			options: [],
			defaultStyle: { bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) },
			callback: () => !!instance.state.ftb,
		},

		pgm_still_is: {
			type: 'boolean',
			name: 'PGM is STILL (1–4)',
			options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => {
				const idx = Number(fb.options.still)
				return instance.state.pgm === idx && instance.state.still[idx - 1] === 1
			},
		},
		pvw_still_is: {
			type: 'boolean',
			name: 'PVW is STILL (1–4)',
			options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
			defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => {
				const idx = Number(fb.options.still)
				return instance.state.pvw === idx && instance.state.still[idx - 1] === 1
			},
		},

		mute_on: {
			type: 'boolean',
			name: 'Audio MUTE is ON',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 180, 0), color: combineRgb(0, 0, 0) },
			callback: () => !!instance.state.mute,
		},
		audio_on: {
			type: 'boolean',
			name: 'Audio Channel is ON',
			options: [{ id: 'ch', type: 'dropdown', label: 'Channel', default: 0, choices: audioChoices }],
			defaultStyle: { bgcolor: combineRgb(0, 120, 255), color: combineRgb(255, 255, 255) },
			callback: (fb) => {
				const ch = Number(fb.options.ch)
				return (instance.state.audio.ch[ch]?.sw ?? 0) === 1
			},
		},

		
		pip1_onair: {
			type: 'boolean',
			name: 'PIP1 is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[2] || 0
				return m === 2 || m === 3
			},
		},
		pip1_key: {
			type: 'boolean',
			name: 'PIP1 KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[2] || 0
				return m === 1 || m === 3
			},
		},
		pip2_onair: {
			type: 'boolean',
			name: 'PIP2 is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[3] || 0
				return m === 2 || m === 3
			},
		},
		pip2_key: {
			type: 'boolean',
			name: 'PIP2 KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[3] || 0
				return m === 1 || m === 3
			},
		},
		logo_onair: {
			type: 'boolean',
			name: 'LOGO is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 0, 255), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[5] || 0
				return m === 2 || m === 3
			},
		},
		logo_key: {
			type: 'boolean',
			name: 'LOGO KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[5] || 0
				return m === 1 || m === 3
			},
		},

		pip1_source_is: {
			type: 'boolean',
			name: 'PIP1 Source is …',
			options: [{ id: 'src', type: 'dropdown', label: 'Source', default: 4, choices: pipSrcChoices }],
			defaultStyle: { bgcolor: combineRgb(40, 40, 40), color: combineRgb(255, 255, 255) },
			callback: (fb) => instance.state.pip1.src === Number(fb.options.src),
		},
		pip2_source_is: {
			type: 'boolean',
			name: 'PIP2 Source is …',
			options: [{ id: 'src', type: 'dropdown', label: 'Source', default: 5, choices: pipSrcChoices }],
			defaultStyle: { bgcolor: combineRgb(40, 40, 40), color: combineRgb(255, 255, 255) },
			callback: (fb) => instance.state.pip2.src === Number(fb.options.src),
		},

		luma_onair: {
			type: 'boolean',
			name: 'LUMA is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isOnAir(instance.state.keyStatus[0]),
		},
		luma_key: {
			type: 'boolean',
			name: 'LUMA KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isKey(instance.state.keyStatus[0]),
		},
		chroma_onair: {
			type: 'boolean',
			name: 'CHROMA is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isOnAir(instance.state.keyStatus[1]),
		},
		chroma_key: {
			type: 'boolean',
			name: 'CHROMA KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isKey(instance.state.keyStatus[1]),
		},
		dsk_onair: {
			type: 'boolean',
			name: 'DSK is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isOnAir(instance.state.keyStatus[4]),
		},
		dsk_key: {
			type: 'boolean',
			name: 'DSK KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => isKey(instance.state.keyStatus[4]),
		},
	})
}