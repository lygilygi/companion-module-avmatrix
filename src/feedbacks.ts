import { combineRgb } from '@companion-module/base'
import { AUDIO_CHANNELS, VIDEO_SOURCES, PIP_SOURCES } from './constants'
import { isOnAir, isKey } from './utils'

export function initFeedbacks(instance: any) {
	const videoChoices = VIDEO_SOURCES.map((s) => ({ id: s.id, label: s.label }))
	const audioChoices = AUDIO_CHANNELS.map((c) => ({ id: c.id, label: c.label }))
	const pipSrcChoices = PIP_SOURCES.map((s) => ({ id: s.id, label: s.label }))

	const input14Choices = [
		{ id: 1, label: 'IN 1' },
		{ id: 2, label: 'IN 2' },
		{ id: 3, label: 'IN 3' },
		{ id: 4, label: 'IN 4' },
	]

	const isStillActive = (input1to4: number) => {
		const i = input1to4 - 1
		if (i < 0 || i > 3) return false
		return (instance.state?.still?.[i] ?? 0) === 1
	}

	const isBusStillActive = (busVal: number) => {
		if (busVal < 1 || busVal > 4) return false
		return isStillActive(busVal)
	}

	instance.setFeedbackDefinitions({
		pgm_is: {
			type: 'boolean',
			name: 'PGM is Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => {
				const src = Number(fb.options.source)
				return instance.state.pgm === src
			},
		},

		pvw_is: {
			type: 'boolean',
			name: 'PVW is Source',
			options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
			defaultStyle: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
			callback: (fb) => {
				const src = Number(fb.options.source)
				return instance.state.pvw === src
			},
		},

		still_input_on: {
			type: 'boolean',
			name: 'STILL is ON for Input',
			options: [{ id: 'input', type: 'dropdown', label: 'Input', default: 1, choices: input14Choices }],
			defaultStyle: { bgcolor: combineRgb(255, 140, 0), color: combineRgb(0, 0, 0) },
			callback: (fb) => {
				const input = Number(fb.options.input)
				return isStillActive(input)
			},
		},

		pgm_still_on: {
			type: 'boolean',
			name: 'PGM STILL is ON (current input)',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 140, 0), color: combineRgb(0, 0, 0) },
			callback: () => isBusStillActive(instance.state.pgm),
		},

		pvw_still_on: {
			type: 'boolean',
			name: 'PVW STILL is ON (current input)',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 140, 0), color: combineRgb(0, 0, 0) },
			callback: () => isBusStillActive(instance.state.pvw),
		},

		ftb_on: {
			type: 'boolean',
			name: 'FTB is ON',
			options: [],
			defaultStyle: { bgcolor: combineRgb(255, 180, 0), color: combineRgb(0, 0, 0) },
			callback: () => !!instance.state.ftb,
		},

		mute_on: {
			type: 'boolean',
			name: 'Audio MUTE is ON',
			options: [],
			defaultStyle: { bgcolor: combineRgb(0, 120, 255), color: combineRgb(255, 255, 255) },
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

		pip1_onair: {
			type: 'boolean',
			name: 'PIP1 is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[2] || 0
				return m === 2 || m === 3
			},
		},
		pip1_key: {
			type: 'boolean',
			name: 'PIP1 KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[2] || 0
				return m === 1 || m === 3
			},
		},

		pip2_onair: {
			type: 'boolean',
			name: 'PIP2 is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[3] || 0
				return m === 2 || m === 3
			},
		},
		pip2_key: {
			type: 'boolean',
			name: 'PIP2 KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[3] || 0
				return m === 1 || m === 3
			},
		},

		logo_onair: {
			type: 'boolean',
			name: 'LOGO is ON AIR',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
			callback: () => {
				const m = instance.state.keyStatus[5] || 0
				return m === 2 || m === 3
			},
		},
		logo_key: {
			type: 'boolean',
			name: 'LOGO KEY enabled',
			options: [],
			defaultStyle: { bgcolor: combineRgb(160, 0, 200), color: combineRgb(255, 255, 255) },
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
			callback: (fb) => instance.state.pip1.source === Number(fb.options.src),
		},

		pip2_source_is: {
			type: 'boolean',
			name: 'PIP2 Source is …',
			options: [{ id: 'src', type: 'dropdown', label: 'Source', default: 5, choices: pipSrcChoices }],
			defaultStyle: { bgcolor: combineRgb(40, 40, 40), color: combineRgb(255, 255, 255) },
			callback: (fb) => instance.state.pip2.source === Number(fb.options.src),
		},
	})
}