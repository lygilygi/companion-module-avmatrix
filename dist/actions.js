"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initActions = initActions;
const utils_1 = require("./utils");
const constants_1 = require("./constants");
function initActions(instance) {
    const videoChoices = constants_1.VIDEO_SOURCES.map((s) => ({ id: s.id, label: s.label }));
    const stillChoices = constants_1.STILL_INPUTS.map((s) => ({ id: s.id, label: s.label }));
    const audioChoices = constants_1.AUDIO_CHANNELS.map((c) => ({ id: c.id, label: c.label }));
    const hpChoices = constants_1.HP_SOURCES.map((c) => ({ id: c.id, label: c.label }));
    const keyModeChoices = constants_1.KEY_MODES.map((m) => ({ id: m.id, label: m.label }));
    const pipSrcChoices = constants_1.PIP_SOURCES.map((s) => ({ id: s.id, label: s.label }));
    const pipSizeChoices = constants_1.PIP_SIZES.map((s) => ({ id: s.id, label: s.label }));
    instance.setActionDefinitions({
        pgm_set: {
            name: 'Set PGM Source',
            options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
            callback: async (action) => {
                const src = Number(action.options.source);
                instance.sendCmd(0x12, [src]);
                instance.state.pgm = src;
                instance.checkFeedbacks('pgm_is');
                instance.checkFeedbacks('pgm_still_is');
            },
        },
        pvw_set: {
            name: 'Set PVW Source',
            options: [{ id: 'source', type: 'dropdown', label: 'Source', default: 1, choices: videoChoices }],
            callback: async (action) => {
                const src = Number(action.options.source);
                instance.sendCmd(0x13, [src]);
                instance.state.pvw = src;
                instance.checkFeedbacks('pvw_is');
                instance.checkFeedbacks('pvw_still_is');
            },
        },
        cut: { name: 'CUT', options: [], callback: async () => instance.sendCmd(0x11, [0x02, 0x00]) },
        auto: { name: 'AUTO', options: [], callback: async () => instance.sendCmd(0x11, [0x01, 0x00]) },
        ftb_on: {
            name: 'FTB ON',
            options: [],
            callback: async () => {
                instance.sendCmd(0x11, [0x03, 0x01]);
                instance.state.ftb = true;
                instance.checkFeedbacks('ftb_on');
            },
        },
        ftb_off: {
            name: 'FTB OFF',
            options: [],
            callback: async () => {
                instance.sendCmd(0x11, [0x03, 0x00]);
                instance.state.ftb = false;
                instance.checkFeedbacks('ftb_on');
            },
        },
        ftb_toggle: {
            name: 'FTB TOGGLE',
            options: [],
            callback: async () => {
                const next = !instance.state.ftb;
                instance.sendCmd(0x11, [0x03, next ? 0x01 : 0x00]);
                instance.state.ftb = next;
                instance.checkFeedbacks('ftb_on');
            },
        },
        still_to_pgm: {
            name: 'STILL → PGM',
            options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
            callback: async (action) => {
                const idx = Number(action.options.still);
                instance.setStillInput(idx, true);
                instance.sendCmd(0x12, [idx]);
                instance.state.pgm = idx;
                instance.checkFeedbacks('pgm_is');
                instance.checkFeedbacks('pgm_still_is');
            },
        },
        still_to_pvw: {
            name: 'STILL → PVW',
            options: [{ id: 'still', type: 'dropdown', label: 'Still', default: 1, choices: stillChoices }],
            callback: async (action) => {
                const idx = Number(action.options.still);
                instance.setStillInput(idx, true);
                instance.sendCmd(0x13, [idx]);
                instance.state.pvw = idx;
                instance.checkFeedbacks('pvw_is');
                instance.checkFeedbacks('pvw_still_is');
            },
        },
        luma_mode_set: {
            name: 'LUMA: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[0] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('luma_onair');
                instance.checkFeedbacks('luma_key');
            },
        },
        chroma_mode_set: {
            name: 'CHROMA: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[1] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('chroma_onair');
                instance.checkFeedbacks('chroma_key');
            },
        },
        dsk_mode_set: {
            name: 'DSK: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[4] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('dsk_onair');
                instance.checkFeedbacks('dsk_key');
            },
        },
        luma_onair_on: {
            name: 'ON AIR: LUMA ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[0] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('luma_onair');
                instance.checkFeedbacks('luma_key');
            },
        },
        luma_onair_off: {
            name: 'ON AIR: LUMA OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[0] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('luma_onair');
                instance.checkFeedbacks('luma_key');
            },
        },
        luma_onair_toggle: {
            name: 'ON AIR: LUMA TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[0] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[0] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('luma_onair');
                instance.checkFeedbacks('luma_key');
            },
        },
        chroma_onair_on: {
            name: 'ON AIR: CHROMA ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[1] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('chroma_onair');
                instance.checkFeedbacks('chroma_key');
            },
        },
        chroma_onair_off: {
            name: 'ON AIR: CHROMA OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[1] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('chroma_onair');
                instance.checkFeedbacks('chroma_key');
            },
        },
        chroma_onair_toggle: {
            name: 'ON AIR: CHROMA TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[1] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[1] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('chroma_onair');
                instance.checkFeedbacks('chroma_key');
            },
        },
        dsk_onair_on: {
            name: 'ON AIR: DSK ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[4] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('dsk_onair');
                instance.checkFeedbacks('dsk_key');
            },
        },
        dsk_onair_off: {
            name: 'ON AIR: DSK OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[4] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('dsk_onair');
                instance.checkFeedbacks('dsk_key');
            },
        },
        dsk_onair_toggle: {
            name: 'ON AIR: DSK TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[4] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[4] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('dsk_onair');
                instance.checkFeedbacks('dsk_key');
            },
        },
        pip1_mode_set: {
            name: 'PIP1: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[2] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip1_onair');
                instance.checkFeedbacks('pip1_key');
            },
        },
        pip2_mode_set: {
            name: 'PIP2: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[3] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip2_onair');
                instance.checkFeedbacks('pip2_key');
            },
        },
        logo_mode_set: {
            name: 'LOGO: Set Mode (Off/Key/OnAir/Key+OnAir)',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mode', default: 0, choices: keyModeChoices }],
            callback: async (action) => {
                instance.state.keyStatus[5] = Number(action.options.mode);
                instance.sendKeyStatus();
                instance.checkFeedbacks('logo_onair');
                instance.checkFeedbacks('logo_key');
            },
        },
        pip1_onair_on: {
            name: 'ON AIR: PIP1 ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[2] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip1_onair');
                instance.checkFeedbacks('pip1_key');
            },
        },
        pip1_onair_off: {
            name: 'ON AIR: PIP1 OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[2] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip1_onair');
                instance.checkFeedbacks('pip1_key');
            },
        },
        pip1_onair_toggle: {
            name: 'ON AIR: PIP1 TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[2] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[2] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip1_onair');
                instance.checkFeedbacks('pip1_key');
            },
        },
        pip2_onair_on: {
            name: 'ON AIR: PIP2 ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[3] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip2_onair');
                instance.checkFeedbacks('pip2_key');
            },
        },
        pip2_onair_off: {
            name: 'ON AIR: PIP2 OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[3] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip2_onair');
                instance.checkFeedbacks('pip2_key');
            },
        },
        pip2_onair_toggle: {
            name: 'ON AIR: PIP2 TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[3] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[3] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('pip2_onair');
                instance.checkFeedbacks('pip2_key');
            },
        },
        logo_onair_on: {
            name: 'ON AIR: LOGO ON',
            options: [],
            callback: async () => {
                instance.state.keyStatus[5] = 2;
                instance.sendKeyStatus();
                instance.checkFeedbacks('logo_onair');
                instance.checkFeedbacks('logo_key');
            },
        },
        logo_onair_off: {
            name: 'ON AIR: LOGO OFF',
            options: [],
            callback: async () => {
                instance.state.keyStatus[5] = 0;
                instance.sendKeyStatus();
                instance.checkFeedbacks('logo_onair');
                instance.checkFeedbacks('logo_key');
            },
        },
        logo_onair_toggle: {
            name: 'ON AIR: LOGO TOGGLE',
            options: [],
            callback: async () => {
                const cur = instance.state.keyStatus[5] || 0;
                const next = (cur === 2 || cur === 3) ? 0 : 2;
                instance.state.keyStatus[5] = next;
                instance.sendKeyStatus();
                instance.checkFeedbacks('logo_onair');
                instance.checkFeedbacks('logo_key');
            },
        },
        pip1_set: {
            name: 'PIP1: Set Source/Size/X/Y',
            options: [
                { id: 'src', type: 'dropdown', label: 'Source', default: instance.state.pip1.src, choices: pipSrcChoices },
                { id: 'size', type: 'dropdown', label: 'Size', default: instance.state.pip1.size, choices: pipSizeChoices },
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.pip1.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.pip1.y },
            ],
            callback: async (action) => {
                instance.state.pip1.src = Number(action.options.src);
                instance.state.pip1.size = Number(action.options.size);
                instance.state.pip1.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.pip1.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.sendPip1();
                instance.checkFeedbacks('pip1_source_is');
            },
        },
        pip1_source_set: {
            name: 'PIP1: Set Source',
            options: [{ id: 'src', type: 'dropdown', label: 'Source', default: instance.state.pip1.src, choices: pipSrcChoices }],
            callback: async (action) => {
                instance.state.pip1.src = Number(action.options.src);
                instance.sendPip1();
                instance.checkFeedbacks('pip1_source_is');
            },
        },
        pip1_size_set: {
            name: 'PIP1: Set Size',
            options: [{ id: 'size', type: 'dropdown', label: 'Size', default: instance.state.pip1.size, choices: pipSizeChoices }],
            callback: async (action) => {
                instance.state.pip1.size = Number(action.options.size);
                instance.sendPip1();
            },
        },
        pip1_pos_set: {
            name: 'PIP1: Set Position (X/Y)',
            options: [
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.pip1.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.pip1.y },
            ],
            callback: async (action) => {
                instance.state.pip1.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.pip1.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.sendPip1();
            },
        },
        pip2_set: {
            name: 'PIP2: Set Source/Size/X/Y',
            options: [
                { id: 'src', type: 'dropdown', label: 'Source', default: instance.state.pip2.src, choices: pipSrcChoices },
                { id: 'size', type: 'dropdown', label: 'Size', default: instance.state.pip2.size, choices: pipSizeChoices },
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.pip2.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.pip2.y },
            ],
            callback: async (action) => {
                instance.state.pip2.src = Number(action.options.src);
                instance.state.pip2.size = Number(action.options.size);
                instance.state.pip2.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.pip2.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.sendPip2();
                instance.checkFeedbacks('pip2_source_is');
            },
        },
        pip2_source_set: {
            name: 'PIP2: Set Source',
            options: [{ id: 'src', type: 'dropdown', label: 'Source', default: instance.state.pip2.src, choices: pipSrcChoices }],
            callback: async (action) => {
                instance.state.pip2.src = Number(action.options.src);
                instance.sendPip2();
                instance.checkFeedbacks('pip2_source_is');
            },
        },
        pip2_size_set: {
            name: 'PIP2: Set Size',
            options: [{ id: 'size', type: 'dropdown', label: 'Size', default: instance.state.pip2.size, choices: pipSizeChoices }],
            callback: async (action) => {
                instance.state.pip2.size = Number(action.options.size);
                instance.sendPip2();
            },
        },
        pip2_pos_set: {
            name: 'PIP2: Set Position (X/Y)',
            options: [
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.pip2.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.pip2.y },
            ],
            callback: async (action) => {
                instance.state.pip2.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.pip2.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.sendPip2();
            },
        },
        logo_set: {
            name: 'LOGO: Set Position/Size/Opacity',
            options: [
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.logo.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.logo.y },
                { id: 'size', type: 'number', label: 'Size (50–150)', min: 50, max: 150, default: instance.state.logo.size },
                { id: 'opacity', type: 'number', label: 'Opacity (20–100)', min: 20, max: 100, default: instance.state.logo.opacity },
            ],
            callback: async (action) => {
                instance.state.logo.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.logo.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.state.logo.size = (0, utils_1.clampInt)(action.options.size, 50, 150);
                instance.state.logo.opacity = (0, utils_1.clampInt)(action.options.opacity, 20, 100);
                instance.sendLogo();
            },
        },
        logo_pos_set: {
            name: 'LOGO: Set Position (X/Y)',
            options: [
                { id: 'x', type: 'number', label: 'X (0–100)', min: 0, max: 100, default: instance.state.logo.x },
                { id: 'y', type: 'number', label: 'Y (0–100)', min: 0, max: 100, default: instance.state.logo.y },
            ],
            callback: async (action) => {
                instance.state.logo.x = (0, utils_1.clampInt)(action.options.x, 0, 100);
                instance.state.logo.y = (0, utils_1.clampInt)(action.options.y, 0, 100);
                instance.sendLogo();
            },
        },
        logo_size_set: {
            name: 'LOGO: Set Size',
            options: [{ id: 'size', type: 'number', label: 'Size (50–150)', min: 50, max: 150, default: instance.state.logo.size }],
            callback: async (action) => {
                instance.state.logo.size = (0, utils_1.clampInt)(action.options.size, 50, 150);
                instance.sendLogo();
            },
        },
        logo_opacity_set: {
            name: 'LOGO: Set Opacity',
            options: [{ id: 'opacity', type: 'number', label: 'Opacity (20–100)', min: 20, max: 100, default: instance.state.logo.opacity }],
            callback: async (action) => {
                instance.state.logo.opacity = (0, utils_1.clampInt)(action.options.opacity, 20, 100);
                instance.sendLogo();
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
                const ch = Number(action.options.ch);
                const sw = Number(action.options.sw);
                const vol = (0, utils_1.clampInt)(action.options.vol, 0, 72);
                const delay = (0, utils_1.clampInt)(action.options.delay, 0, 500);
                const st = instance.state.audio.ch[ch] || { sw: 1, vol: 60, delay: 0, mode: 0 };
                st.sw = sw;
                st.vol = vol;
                st.delay = delay;
                instance.state.audio.ch[ch] = st;
                instance.sendAudioSetting(ch);
                instance.checkFeedbacks('audio_on');
                if (ch === 0) {
                    instance.state.mute = sw === 0;
                    instance.checkFeedbacks('mute_on');
                }
            },
        },
        audio_mute_on: {
            name: 'Audio: MUTE ON',
            options: [],
            callback: async () => {
                instance.sendCmd(0x11, [0x05, 0x01]);
                instance.state.mute = true;
                instance.checkFeedbacks('mute_on');
            },
        },
        audio_mute_off: {
            name: 'Audio: MUTE OFF',
            options: [],
            callback: async () => {
                instance.sendCmd(0x11, [0x05, 0x00]);
                instance.state.mute = false;
                instance.checkFeedbacks('mute_on');
            },
        },
        audio_mute_toggle: {
            name: 'Audio: MUTE TOGGLE',
            options: [],
            callback: async () => {
                const next = !instance.state.mute;
                instance.sendCmd(0x11, [0x05, next ? 0x01 : 0x00]);
                instance.state.mute = next;
                instance.checkFeedbacks('mute_on');
            },
        },
        audio_hp_select: {
            name: 'Audio: HeadPhones Select Source',
            options: [{ id: 'src', type: 'dropdown', label: 'HeadPhones Source', default: 0, choices: hpChoices }],
            callback: async (action) => {
                const src = Number(action.options.src);
                instance.state.audio.ch[7].mode = src;
                instance.sendAudioSetting(7);
            },
        },
        audio_mic1_mode: {
            name: 'Audio: Mic1 Mode',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mic Mode', default: 0, choices: [{ id: 0, label: 'Line' }, { id: 1, label: 'Mic' }] }],
            callback: async (action) => {
                instance.state.audio.ch[5].mode = Number(action.options.mode);
                instance.sendAudioSetting(5);
            },
        },
        audio_mic2_mode: {
            name: 'Audio: Mic2 Mode',
            options: [{ id: 'mode', type: 'dropdown', label: 'Mic Mode', default: 0, choices: [{ id: 0, label: 'Line' }, { id: 1, label: 'Mic' }] }],
            callback: async (action) => {
                instance.state.audio.ch[6].mode = Number(action.options.mode);
                instance.sendAudioSetting(6);
            },
        },
    });
}
