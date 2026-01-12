import { combineRgb } from '@companion-module/base'
import { VIDEO_SOURCES } from './constants'

export function initPresets(instance: any) {
	const presets: any[] = []

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

	const inputSources = VIDEO_SOURCES.filter((s: any) => s.id >= 1 && s.id <= 4)

	for (const s of inputSources) {
		presets.push({
			type: 'button',
			category: 'Inputs / PGM',
			name: `PGM ${s.label}`,
			style: { text: `PGM\n${s.label}`, size: 'auto', ...redOff },
			steps: [{ down: [{ actionId: 'pgm_set', options: { source: s.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'pgm_is', options: { source: s.id }, style: redOn }],
		})

		presets.push({
			type: 'button',
			category: 'Inputs / PVW',
			name: `PVW ${s.label}`,
			style: { text: `PVW\n${s.label}`, size: 'auto', ...greenOff },
			steps: [{ down: [{ actionId: 'pvw_set', options: { source: s.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'pvw_is', options: { source: s.id }, style: greenOn }],
		})

		presets.push({
			type: 'button',
			category: 'Inputs / STILL',
			name: `STILL ${s.label}`,
			style: { text: `STILL\n${s.label}`, size: 'auto', ...stillOff },
			steps: [{ down: [{ actionId: 'still_input_toggle', options: { input: s.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'still_input_on', options: { input: s.id }, style: stillOn }],
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

	const modeButtons = [
		{ cat: 'Keys / LUMA', label: 'LUMA', actionId: 'luma_mode_set', fbKey: 'luma_key', fbOnAir: 'luma_onair' },
		{ cat: 'Keys / CHROMA', label: 'CHROMA', actionId: 'chroma_mode_set', fbKey: 'chroma_key', fbOnAir: 'chroma_onair' },
		{ cat: 'Keys / DSK', label: 'DSK', actionId: 'dsk_mode_set', fbKey: 'dsk_key', fbOnAir: 'dsk_onair' },
		{ cat: 'PIP / PIP1', label: 'PIP1', actionId: 'pip1_mode_set', fbKey: 'pip1_key', fbOnAir: 'pip1_onair' },
		{ cat: 'PIP / PIP2', label: 'PIP2', actionId: 'pip2_mode_set', fbKey: 'pip2_key', fbOnAir: 'pip2_onair' },
		{ cat: 'Logo / LOGO', label: 'LOGO', actionId: 'logo_mode_set', fbKey: 'logo_key', fbOnAir: 'logo_onair' },
	]

	const modes = [
		{ name: 'OFF', mode: 0, fb: null as any },
		{ name: 'KEY', mode: 1, fb: 'key' as any },
		{ name: 'ON AIR', mode: 2, fb: 'onair' as any },
		{ name: 'KEY+ON', mode: 3, fb: 'both' as any },
	]

	for (const g of modeButtons) {
		for (const m of modes) {
			const fbList: any[] = []
			if (m.fb === 'key') fbList.push({ feedbackId: g.fbKey, options: {}, style: purpleOn })
			if (m.fb === 'onair') fbList.push({ feedbackId: g.fbOnAir, options: {}, style: purpleOn })
			if (m.fb === 'both') {
				fbList.push({ feedbackId: g.fbKey, options: {}, style: purpleOn })
				fbList.push({ feedbackId: g.fbOnAir, options: {}, style: purpleOn })
			}

			presets.push({
				type: 'button',
				category: g.cat,
				name: `${g.label} ${m.name}`,
				style: { text: `${g.label}\n${m.name}`, size: 'auto', ...purpleOff },
				steps: [{ down: [{ actionId: g.actionId, options: { mode: m.mode } }], up: [] }],
				feedbacks: fbList,
			})
		}
	}

	const onAirToggles = [
		{ category: 'Keys / LUMA', name: 'LUMA ON AIR TOGGLE', actionId: 'luma_onair_toggle', feedbackId: 'luma_onair' },
		{ category: 'Keys / CHROMA', name: 'CHROMA ON AIR TOGGLE', actionId: 'chroma_onair_toggle', feedbackId: 'chroma_onair' },
		{ category: 'Keys / DSK', name: 'DSK ON AIR TOGGLE', actionId: 'dsk_onair_toggle', feedbackId: 'dsk_onair' },
		{ category: 'PIP / PIP1', name: 'PIP1 ON AIR TOGGLE', actionId: 'pip1_onair_toggle', feedbackId: 'pip1_onair' },
		{ category: 'PIP / PIP2', name: 'PIP2 ON AIR TOGGLE', actionId: 'pip2_onair_toggle', feedbackId: 'pip2_onair' },
		{ category: 'Logo / LOGO', name: 'LOGO ON AIR TOGGLE', actionId: 'logo_onair_toggle', feedbackId: 'logo_onair' },
	]

	for (const b of onAirToggles) {
		presets.push({
			type: 'button',
			category: b.category,
			name: b.name,
			style: { text: b.name, size: '14', ...purpleOff },
			steps: [{ down: [{ actionId: b.actionId, options: {} }], up: [] }],
			feedbacks: [{ feedbackId: b.feedbackId, options: {}, style: purpleOn }],
		})
	}

	instance.setPresetDefinitions(presets)
}