import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as charactersApi from '../../characters/api/characters.api';
import type { Character } from '../../characters/types/character.types';
import { useFavoriteCharacters } from './useFavoriteCharacters';

const characters: Character[] = [
	{
		id: 2,
		name: 'Morty Smith',
		status: 'Alive',
		species: 'Human',
		gender: 'Male',
		origin: 'Earth',
		location: 'Citadel of Ricks',
		image: 'https://example.com/morty.jpeg',
	},
];

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((promiseResolve) => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
}

describe('useFavoriteCharacters', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns empty without requesting when no favorites exist', () => {
		const request = vi.spyOn(charactersApi, 'fetchCharactersByIds');
		const { result } = renderHook(() => useFavoriteCharacters([]));

		expect(result.current.status).toBe('empty');
		expect(request).not.toHaveBeenCalled();
	});

	it('loads favorite characters', async () => {
		vi.spyOn(charactersApi, 'fetchCharactersByIds').mockResolvedValue(characters);
		const { result } = renderHook(() => useFavoriteCharacters([2]));

		expect(result.current.status).toBe('loading');
		await waitFor(() => expect(result.current.status).toBe('success'));
	});

	it('retries after an error', async () => {
		const request = vi
			.spyOn(charactersApi, 'fetchCharactersByIds')
			.mockRejectedValueOnce(new charactersApi.CharacterRequestError('network', 'Failed'))
			.mockResolvedValueOnce(characters);
		const { result } = renderHook(() => useFavoriteCharacters([2]));

		await waitFor(() => expect(result.current.status).toBe('error'));
		act(() => result.current.retry());
		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('cancels an old request and ignores its result', async () => {
		const firstRequest = deferred<Character[]>();
		let firstSignal: AbortSignal | undefined;
		const request = vi
			.spyOn(charactersApi, 'fetchCharactersByIds')
			.mockImplementationOnce((_ids, signal) => {
				firstSignal = signal;
				return firstRequest.promise;
			})
			.mockResolvedValueOnce(characters);
		const { rerender, result } = renderHook(
			({ ids }: { ids: number[] }) => useFavoriteCharacters(ids),
			{ initialProps: { ids: [1] } },
		);

		rerender({ ids: [2] });
		expect(firstSignal?.aborted).toBe(true);
		await waitFor(() => expect(result.current.status).toBe('success'));

		await act(async () => {
			firstRequest.resolve([{ ...characters[0], id: 1, name: 'Old result' }]);
			await firstRequest.promise;
		});

		if (result.current.status === 'success') {
			expect(result.current.data[0].name).toBe('Morty Smith');
		}
		expect(request).toHaveBeenCalledTimes(2);
	});
});
