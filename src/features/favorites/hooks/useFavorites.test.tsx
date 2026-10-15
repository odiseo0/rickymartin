import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FAVORITES_STORAGE_KEY } from '../services/favorites.storage';
import { useFavorites } from './useFavorites';

describe('useFavorites', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	});

	it('loads stored favorites and exposes their state', async () => {
		window.localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ version: 1, ids: [2, 1] }),
		);
		const { result } = renderHook(() => useFavorites());

		await waitFor(() => expect(result.current.isReady).toBe(true));
		expect(result.current.ids).toEqual([2, 1]);
		expect(result.current.isFavorite(2)).toBe(true);
	});

	it('adds newest favorites first without duplicates and removes them', async () => {
		const { result } = renderHook(() => useFavorites());
		await waitFor(() => expect(result.current.isReady).toBe(true));

		act(() => result.current.addFavorite(1));
		act(() => result.current.addFavorite(2));
		act(() => result.current.addFavorite(1));
		expect(result.current.ids).toEqual([2, 1]);

		act(() => result.current.removeFavorite(2));
		expect(result.current.ids).toEqual([1]);
		expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '')).toEqual({
			version: 1,
			ids: [1],
		});
	});

	it('toggles favorites', async () => {
		const { result } = renderHook(() => useFavorites());
		await waitFor(() => expect(result.current.isReady).toBe(true));

		act(() => result.current.toggleFavorite(4));
		expect(result.current.ids).toEqual([4]);
		act(() => result.current.toggleFavorite(4));
		expect(result.current.ids).toEqual([]);
	});

	it('keeps the session state and warns when writing fails', async () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Access denied');
		});
		const { result } = renderHook(() => useFavorites());
		await waitFor(() => expect(result.current.isReady).toBe(true));

		act(() => result.current.addFavorite(7));

		expect(setItem).toHaveBeenCalled();
		expect(result.current.ids).toEqual([7]);
		expect(result.current.persistenceStatus).toBe('unavailable');
	});

	it('continues in memory when storage is blocked from the initial read', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Access denied');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Access denied');
		});
		const { result } = renderHook(() => useFavorites());

		await waitFor(() => expect(result.current.isReady).toBe(true));
		expect(result.current.persistenceStatus).toBe('unavailable');
		act(() => result.current.addFavorite(8));
		expect(result.current.ids).toEqual([8]);
		expect(result.current.persistenceStatus).toBe('unavailable');
	});

	it('repairs damaged stored data after the next successful change', async () => {
		window.localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ version: 1, ids: [2, 'bad', 1] }),
		);
		const { result } = renderHook(() => useFavorites());

		await waitFor(() => expect(result.current.persistenceStatus).toBe('invalid'));
		expect(result.current.ids).toEqual([2, 1]);
		act(() => result.current.addFavorite(3));

		expect(result.current.persistenceStatus).toBe('available');
		expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '')).toEqual({
			version: 1,
			ids: [3, 2, 1],
		});
	});

	it('synchronizes a storage event from another tab', async () => {
		const { result } = renderHook(() => useFavorites());
		await waitFor(() => expect(result.current.isReady).toBe(true));

		act(() => {
			window.dispatchEvent(
				new StorageEvent('storage', {
					key: FAVORITES_STORAGE_KEY,
					newValue: JSON.stringify({ version: 1, ids: [9, 3] }),
				}),
			);
		});

		expect(result.current.ids).toEqual([9, 3]);
	});
});
