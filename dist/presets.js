"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPresets = initPresets;
const base_1 = require("@companion-module/base");
function initPresets(instance) {
    const presets = [];
    const redOn = { bgcolor: (0, base_1.combineRgb)(200, 0, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const redOff = { bgcolor: (0, base_1.combineRgb)(60, 0, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const greenOn = { bgcolor: (0, base_1.combineRgb)(0, 140, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const greenOff = { bgcolor: (0, base_1.combineRgb)(0, 40, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const stillOn = { bgcolor: (0, base_1.combineRgb)(255, 140, 0), color: (0, base_1.combineRgb)(0, 0, 0) };
    const stillOff = { bgcolor: (0, base_1.combineRgb)(60, 35, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const yellowOn = { bgcolor: (0, base_1.combineRgb)(255, 180, 0), color: (0, base_1.combineRgb)(0, 0, 0) };
    const yellowOff = { bgcolor: (0, base_1.combineRgb)(35, 25, 0), color: (0, base_1.combineRgb)(255, 255, 255) };
    const blueOn = { bgcolor: (0, base_1.combineRgb)(0, 120, 255), color: (0, base_1.combineRgb)(255, 255, 255) };
    const blueOff = { bgcolor: (0, base_1.combineRgb)(0, 20, 45), color: (0, base_1.combineRgb)(255, 255, 255) };
    const purpleOn = { bgcolor: (0, base_1.combineRgb)(160, 0, 200), color: (0, base_1.combineRgb)(255, 255, 255) };
    const purpleOff = { bgcolor: (0, base_1.combineRgb)(35, 0, 45), color: (0, base_1.combineRgb)(255, 255, 255) };
    for (let i = 1; i <= 16; i++) {
        presets.push({
            type: 'button',
            category: 'Inputs / PGM',
            name: `PGM IN${i}`,
            style: { text: `PGM\nIN${i}`, size: 'auto', ...redOff },
            steps: [{ down: [{ actionId: 'pgm_set', options: { source: i } }], up: [] }],
            feedbacks: [{ feedbackId: 'pgm_is', options: { source: i }, style: redOn }],
        });
        presets.push({
            type: 'button',
            category: 'Inputs / PVW',
            name: `PVW IN${i}`,
            style: { text: `PVW\nIN${i}`, size: 'auto', ...greenOff },
            steps: [{ down: [{ actionId: 'pvw_set', options: { source: i } }], up: [] }],
            feedbacks: [{ feedbackId: 'pvw_is', options: { source: i }, style: greenOn }],
        });
        presets.push({
            type: 'button',
            category: 'Stills / PGM',
            name: `PGM STILL ${i}`,
            style: { text: `PGM\nSTILL${i}`, size: 'auto', ...stillOff },
            steps: [{ down: [{ actionId: 'still_to_pgm', options: { still: i } }], up: [] }],
            feedbacks: [{ feedbackId: 'pgm_still_is', options: { still: i }, style: stillOn }],
        });
        presets.push({
            type: 'button',
            category: 'Stills / PVW',
            name: `PVW STILL ${i}`,
            style: { text: `PVW\nSTILL${i}`, size: 'auto', ...stillOff },
            steps: [{ down: [{ actionId: 'still_to_pvw', options: { still: i } }], up: [] }],
            feedbacks: [{ feedbackId: 'pvw_still_is', options: { still: i }, style: stillOn }],
        });
    }
    presets.push({
        type: 'button',
        category: 'Transitions',
        name: 'CUT',
        style: { text: 'CUT', size: 'auto', bgcolor: (0, base_1.combineRgb)(0, 0, 0), color: (0, base_1.combineRgb)(255, 255, 255) },
        steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }],
        feedbacks: [],
    });
    presets.push({
        type: 'button',
        category: 'Transitions',
        name: 'AUTO',
        style: { text: 'AUTO', size: 'auto', bgcolor: (0, base_1.combineRgb)(0, 0, 0), color: (0, base_1.combineRgb)(255, 255, 255) },
        steps: [{ down: [{ actionId: 'auto', options: {} }], up: [] }],
        feedbacks: [],
    });
    presets.push({
        type: 'button',
        category: 'Transitions',
        name: 'FTB',
        style: { text: 'FTB', size: 'auto', ...yellowOff },
        steps: [{ down: [{ actionId: 'ftb_toggle', options: {} }], up: [] }],
        feedbacks: [{ feedbackId: 'ftb_on', options: {}, style: yellowOn }],
    });
    presets.push({
        type: 'button',
        category: 'Audio',
        name: 'MUTE',
        style: { text: 'MUTE', size: 'auto', ...blueOff },
        steps: [{ down: [{ actionId: 'audio_mute_toggle', options: {} }], up: [] }],
        feedbacks: [{ feedbackId: 'mute_on', options: {}, style: blueOn }],
    });
    presets.push({
        type: 'button',
        category: 'Audio',
        name: 'AFV',
        style: { text: 'AFV', size: 'auto', ...blueOff },
        steps: [{ down: [{ actionId: 'audio_afv_on', options: { state: 1 } }], up: [] }],
        feedbacks: [{ feedbackId: 'afv_on', options: {}, style: blueOn }],
    });
    const onAirButtons = [
        { category: 'Keys', name: 'LUMA ON AIR', actionId: 'luma_onair_toggle', feedbackId: 'luma_onair' },
        { category: 'Keys', name: 'CHROMA ON AIR', actionId: 'chroma_onair_toggle', feedbackId: 'chroma_onair' },
        { category: 'Keys', name: 'DSK ON AIR', actionId: 'dsk_onair_toggle', feedbackId: 'dsk_onair' },
        { category: 'PIP', name: 'PIP1 ON AIR', actionId: 'pip1_onair_toggle', feedbackId: 'pip1_onair' },
        { category: 'PIP', name: 'PIP2 ON AIR', actionId: 'pip2_onair_toggle', feedbackId: 'pip2_onair' },
        { category: 'Logo', name: 'LOGO ON AIR', actionId: 'logo_onair_toggle', feedbackId: 'logo_onair' },
    ];
    for (const b of onAirButtons) {
        presets.push({
            type: 'button',
            category: b.category,
            name: b.name,
            style: { text: b.name, size: '14', ...purpleOff },
            steps: [{ down: [{ actionId: b.actionId, options: {} }], up: [] }],
            feedbacks: [{ feedbackId: b.feedbackId, options: {}, style: purpleOn }],
        });
    }
    instance.setPresetDefinitions(presets);
}
