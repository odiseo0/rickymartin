import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as charactersApi from '../api/characters.api';
import type { CharacterPage, CharacterSearchParams } from '../types/character.types';
import { useCharacters } from './useCharacters';

const characterPage: CharacterPage = {
	info: { count: 1, pages: 1, next: null, prev: null },
	results: [
		{
			id: 1,
			name: 'Rick Sanchez',
			status: 'Alive',
			species: 'Human',
			gender: 'Male',
			origin: 'Earth (C-137)',
			location: 'Citadel of Ricks',
			image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
		},
	],
};

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});

	return { promise, reject, resolve };
}

describe('useCharacters', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('changes from loading to success', async () => {
		vi.spyOn(charactersApi, 'fetchCharacters').mockResolvedValue(characterPage);

		const { result } = renderHook(() => useCharacters({ name: '', page: 1 }));

		expect(result.current.status).toBe('loading');
		await waitFor(() => expect(result.current.status).toBe('success'));
	});

	it('does not request until it is enabled', async () => {
		const request = vi.spyOn(charactersApi, 'fetchCharacters').mockResolvedValue(characterPage);
		const { rerender, result } = renderHook(
			({ enabled }: { enabled: boolean }) =>
				useCharacters({ name: 'morty', page: 2 }, enabled),
			{ initialProps: { enabled: false } },
		);

		expect(result.current.status).toBe('loading');
		expect(request).not.toHaveBeenCalled();
		rerender({ enabled: true });
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(request).toHaveBeenCalledOnce();
	});

	it('returns the empty state when no characters exist', async () => {
		vi.spyOn(charactersApi, 'fetchCharacters').mockResolvedValue({
			info: { count: 0, pages: 0, next: null, prev: null },
			results: [],
		});

		const { result } = renderHook(() => useCharacters({ name: 'missing', page: 1 }));

		await waitFor(() => expect(result.current.status).toBe('empty'));
	});

	it('retries after an error', async () => {
		const request = vi
			.spyOn(charactersApi, 'fetchCharacters')
			.mockRejectedValueOnce(
				new charactersApi.CharacterRequestError('network', 'Network unavailable'),
			)
			.mockResolvedValueOnce(characterPage);
		const { result } = renderHook(() => useCharacters({ name: '', page: 1 }));

		await waitFor(() => expect(result.current.status).toBe('error'));
		act(() => result.current.retry());
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('cancels the old request and ignores its result', async () => {
		const firstRequest = deferred<CharacterPage>();
		let firstSignal: AbortSignal | undefined;
		const request = vi
			.spyOn(charactersApi, 'fetchCharacters')
			.mockImplementationOnce((_params, signal) => {
				firstSignal = signal;
				return firstRequest.promise;
			})
			.mockResolvedValueOnce(characterPage);

		const { rerender, result } = renderHook(
			({ params }: { params: CharacterSearchParams }) => useCharacters(params),
			{ initialProps: { params: { name: 'rick', page: 1 } } },
		);

		rerender({ params: { name: 'morty', page: 1 } });
		expect(firstSignal?.aborted).toBe(true);
		await waitFor(() => expect(result.current.status).toBe('success'));

		await act(async () => {
			firstRequest.resolve({
				...characterPage,
				results: [{ ...characterPage.results[0], id: 2, name: 'Old result' }],
			});
			await firstRequest.promise;
		});

		expect(result.current.status).toBe('success');
		if (result.current.status === 'success') {
			expect(result.current.data.results[0].name).toBe('Rick Sanchez');
		}
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('hides previous data as soon as the parameters change', async () => {
		const secondRequest = deferred<CharacterPage>();
		vi.spyOn(charactersApi, 'fetchCharacters')
			.mockResolvedValueOnce(characterPage)
			.mockImplementationOnce(() => secondRequest.promise);

		const { rerender, result } = renderHook(
			({ params }: { params: CharacterSearchParams }) => useCharacters(params),
			{ initialProps: { params: { name: 'rick', page: 1 } } },
		);

		await waitFor(() => expect(result.current.status).toBe('success'));
		rerender({ params: { name: 'morty', page: 1 } });

		expect(result.current.status).toBe('loading');
	});

	it('does not expose an error after unmounting an active request', () => {
		const activeRequest = deferred<CharacterPage>();
		let activeSignal: AbortSignal | undefined;
		vi.spyOn(charactersApi, 'fetchCharacters').mockImplementation((_params, signal) => {
			activeSignal = signal;
			return activeRequest.promise;
		});

		const { unmount } = renderHook(() => useCharacters({ name: '', page: 1 }));
		unmount();

		expect(activeSignal?.aborted).toBe(true);
	});
});
