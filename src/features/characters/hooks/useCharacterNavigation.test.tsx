import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createCharacterUrl,
	parseCharacterSearchParams,
	useCharacterNavigation,
} from './useCharacterNavigation';

describe('character URL helpers', () => {
	it.each([
		['', { name: '', page: 1 }],
		['?q=%20Morty%20&page=2', { name: 'Morty', page: 2 }],
		['?page=', { name: '', page: 1 }],
		['?page=0', { name: '', page: 1 }],
		['?page=-2', { name: '', page: 1 }],
		['?page=1.5', { name: '', page: 1 }],
		['?page=abc', { name: '', page: 1 }],
	])('parses and normalizes %s', (search, expected) => {
		expect(parseCharacterSearchParams(search)).toEqual(expected);
	});

	it('creates clean URLs and encodes the search', () => {
		expect(createCharacterUrl({ name: '', page: 1 })).toBe('/');
		expect(createCharacterUrl({ name: 'Rick & Morty', page: 1 })).toBe(
			'/?q=Rick+%26+Morty',
		);
		expect(createCharacterUrl({ name: 'Morty', page: 2 })).toBe('/?q=Morty&page=2');
	});
});

describe('useCharacterNavigation', () => {
	beforeEach(() => {
		window.history.replaceState(null, '', '/');
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('loads and canonicalizes the current URL', () => {
		window.history.replaceState(null, '', '/?q=%20Morty%20&page=02&unknown=yes');
		const replaceState = vi.spyOn(window.history, 'replaceState');

		const { result } = renderHook(() => useCharacterNavigation());

		expect(result.current.isReady).toBe(true);
		expect(result.current.searchTerm).toBe('Morty');
		expect(result.current.params).toEqual({ name: 'Morty', page: 2 });
		expect(window.location.search).toBe('?q=Morty&page=2');
		expect(replaceState).toHaveBeenCalled();
	});

	it('replaces the URL after the debounced search and resets the page', () => {
		window.history.replaceState(null, '', '/?q=Rick&page=3');
		const replaceState = vi.spyOn(window.history, 'replaceState');
		const { result } = renderHook(() => useCharacterNavigation());
		replaceState.mockClear();

		act(() => result.current.setSearchTerm('  Rick & Morty  '));
		act(() => vi.advanceTimersByTime(349));
		expect(result.current.params).toEqual({ name: 'Rick', page: 3 });

		act(() => vi.advanceTimersByTime(1));
		expect(result.current.params).toEqual({ name: 'Rick & Morty', page: 1 });
		expect(window.location.search).toBe('?q=Rick+%26+Morty');
		expect(replaceState).toHaveBeenCalledTimes(1);
	});

	it('pushes a new history entry when the page changes', () => {
		window.history.replaceState(null, '', '/?q=Morty');
		const pushState = vi.spyOn(window.history, 'pushState');
		const { result } = renderHook(() => useCharacterNavigation());

		act(() => result.current.setPage(2));

		expect(result.current.params).toEqual({ name: 'Morty', page: 2 });
		expect(window.location.search).toBe('?q=Morty&page=2');
		expect(pushState).toHaveBeenCalledTimes(1);
	});

	it('restores search and page on popstate without writing another entry', () => {
		const replaceState = vi.spyOn(window.history, 'replaceState');
		const pushState = vi.spyOn(window.history, 'pushState');
		const { result } = renderHook(() => useCharacterNavigation());
		replaceState.mockClear();

		window.history.replaceState(null, '', '/?q=Summer&page=3');
		replaceState.mockClear();
		act(() => window.dispatchEvent(new PopStateEvent('popstate')));
		act(() => vi.advanceTimersByTime(350));

		expect(result.current.searchTerm).toBe('Summer');
		expect(result.current.params).toEqual({ name: 'Summer', page: 3 });
		expect(replaceState).not.toHaveBeenCalled();
		expect(pushState).not.toHaveBeenCalled();
	});

	it('replaces an unavailable page with page one', () => {
		window.history.replaceState(null, '', '/?q=Morty&page=999');
		const replaceState = vi.spyOn(window.history, 'replaceState');
		const { result } = renderHook(() => useCharacterNavigation());
		replaceState.mockClear();

		act(() => result.current.returnToFirstPage());

		expect(result.current.params).toEqual({ name: 'Morty', page: 1 });
		expect(window.location.search).toBe('?q=Morty');
		expect(replaceState).toHaveBeenCalledTimes(1);
	});
});
