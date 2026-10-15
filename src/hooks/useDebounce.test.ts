import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns the initial value immediately and delays the next value', () => {
		vi.useFakeTimers();
		const { rerender, result } = renderHook(
			({ value }: { value: string }) => useDebounce(value, 350),
			{ initialProps: { value: '' } },
		);

		expect(result.current).toBe('');
		rerender({ value: 'Morty' });
		expect(result.current).toBe('');

		act(() => vi.advanceTimersByTime(349));
		expect(result.current).toBe('');

		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe('Morty');
	});

	it('restarts the delay when the value changes again', () => {
		vi.useFakeTimers();
		const { rerender, result } = renderHook(
			({ value }: { value: string }) => useDebounce(value, 350),
			{ initialProps: { value: '' } },
		);

		rerender({ value: 'Mor' });
		act(() => vi.advanceTimersByTime(300));
		rerender({ value: 'Morty' });
		act(() => vi.advanceTimersByTime(349));

		expect(result.current).toBe('');
		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe('Morty');
	});

	it('clears its timer when unmounted', () => {
		vi.useFakeTimers();
		const clearTimeout = vi.spyOn(window, 'clearTimeout');
		const { unmount } = renderHook(() => useDebounce('Rick', 350));

		unmount();

		expect(clearTimeout).toHaveBeenCalledOnce();
	});
});
