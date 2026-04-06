import { describe, it, expect } from 'vitest'
import { clampInt, isOnAir, isKey } from '../src/utils.js'

describe('clampInt', () => {
	it('returns the value when within range', () => {
		expect(clampInt(50, 0, 100)).toBe(50)
	})

	it('returns min when value is below min', () => {
		expect(clampInt(-10, 0, 100)).toBe(0)
	})

	it('returns max when value is above max', () => {
		expect(clampInt(150, 0, 100)).toBe(100)
	})

	it('returns min when value equals min', () => {
		expect(clampInt(0, 0, 100)).toBe(0)
	})

	it('returns max when value equals max', () => {
		expect(clampInt(100, 0, 100)).toBe(100)
	})

	it('parses a numeric string', () => {
		expect(clampInt('42', 0, 100)).toBe(42)
	})

	it('parses a string that exceeds max', () => {
		expect(clampInt('200', 0, 100)).toBe(100)
	})

	it('returns min for NaN input (non-numeric string)', () => {
		expect(clampInt('abc', 0, 100)).toBe(0)
	})

	it('returns min for undefined', () => {
		expect(clampInt(undefined, 0, 100)).toBe(0)
	})

	it('works with non-zero min', () => {
		expect(clampInt(10, 20, 150)).toBe(20)
		expect(clampInt(180, 20, 150)).toBe(150)
		expect(clampInt(75, 20, 150)).toBe(75)
	})
})

describe('isOnAir', () => {
	// KEY_MODES: 0=Off, 1=Key, 2=OnAir, 3=Key+OnAir
	// OnAir = bit 1 (0x02)

	it('returns false for mode 0 (Off)', () => {
		expect(isOnAir(0)).toBe(false)
	})

	it('returns false for mode 1 (Key only)', () => {
		expect(isOnAir(1)).toBe(false)
	})

	it('returns true for mode 2 (OnAir)', () => {
		expect(isOnAir(2)).toBe(true)
	})

	it('returns true for mode 3 (Key + OnAir)', () => {
		expect(isOnAir(3)).toBe(true)
	})

	it('handles higher values — true when bit 1 is set', () => {
		expect(isOnAir(6)).toBe(true) // 0b0110 — bit 1 set
	})

	it('handles higher values — false when bit 1 not set', () => {
		expect(isOnAir(5)).toBe(false) // 0b0101 — bit 1 not set
	})
})

describe('isKey', () => {
	// Key = bit 0 (0x01)

	it('returns false for mode 0 (Off)', () => {
		expect(isKey(0)).toBe(false)
	})

	it('returns true for mode 1 (Key only)', () => {
		expect(isKey(1)).toBe(true)
	})

	it('returns false for mode 2 (OnAir only)', () => {
		expect(isKey(2)).toBe(false)
	})

	it('returns true for mode 3 (Key + OnAir)', () => {
		expect(isKey(3)).toBe(true)
	})

	it('handles higher values — true when bit 0 is set', () => {
		expect(isKey(5)).toBe(true) // 0b0101 — bit 0 set
	})

	it('handles higher values — false when bit 0 not set', () => {
		expect(isKey(6)).toBe(false) // 0b0110 — bit 0 not set
	})
})
