export function clampInt(val: any, min: number, max: number): number {
	const n = typeof val === 'number' ? val : parseInt(String(val), 10)
	if (Number.isNaN(n)) return min
	return Math.min(max, Math.max(min, n))
}

export function isOnAir(v: number): boolean {
	return (v & 0x01) === 0x01
}

export function isKey(v: number): boolean {
	return (v & 0x02) === 0x02
}
