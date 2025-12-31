import type { SomeCompanionConfigField } from '@companion-module/base'
import { DEVICE_UDP_PORT, LOCAL_UDP_PORT } from './constants'

export interface AVMatrixConfig {
	host: string
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [

		{
			type: 'static-text',
			id: 'info',
			label: 'AV Matrix UDP',
			width: 12,
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
