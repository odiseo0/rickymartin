import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiCharacter, ApiCharacterPageResponse } from '../types/character.types';
import {
	CharacterRequestError,
	fetchCharacters,
	fetchCharactersByIds,
} from './characters.api';

const apiCharacter: ApiCharacter = {
	id: 1,
	name: 'Rick Sanchez',
	status: 'Alive',
	species: 'Human',
	type: '',
	gender: 'Male',
	origin: { name: 'Earth (C-137)', url: 'https://rickandmortyapi.com/api/location/1' },
	location: {
		name: 'Citadel of Ricks',
		url: 'https://rickandmortyapi.com/api/location/3',
	},
	image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
	episode: ['https://rickandmortyapi.com/api/episode/1'],
	url: 'https://rickandmortyapi.com/api/character/1',
	created: '2017-11-04T18:48:46.250Z',
};

const apiPage: ApiCharacterPageResponse = {
	info: { count: 1, pages: 1, next: null, prev: null },
	results: [apiCharacter],
};

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}

describe('fetchCharacters', () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('builds the request and maps the API response', async () => {
		fetchMock.mockResolvedValue(jsonResponse(apiPage));
		const controller = new AbortController();

		const result = await fetchCharacters({ name: '  rick  ', page: 2 }, controller.signal);

		const [requestUrl, requestOptions] = fetchMock.mock.calls[0];
		expect(requestUrl).toBeInstanceOf(URL);
		expect(String(requestUrl)).toBe(
			'https://rickandmortyapi.com/api/character?page=2&name=rick',
		);
		expect(requestOptions).toEqual({ signal: controller.signal });
		expect(result).toEqual({
			info: apiPage.info,
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
		});
	});

	it('returns an empty page for a missing name on page one', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ error: 'There is nothing here' }, 404));

		const result = await fetchCharacters(
			{ name: 'not-a-character', page: 1 },
			new AbortController().signal,
		);

		expect(result).toEqual({
			info: { count: 0, pages: 0, next: null, prev: null },
			results: [],
		});
	});

	it('throws an HTTP error for server failures', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ error: 'Server error' }, 500));

		await expect(
			fetchCharacters({ name: '', page: 1 }, new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'http', status: 500 });
	});

	it('throws a network error when fetch fails', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network unavailable'));

		await expect(
			fetchCharacters({ name: '', page: 1 }, new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'network', status: null });
	});

	it('rejects an invalid API response', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ info: {}, results: [] }));

		await expect(
			fetchCharacters({ name: '', page: 1 }, new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-response' });
	});

	it('rejects a response with invalid JSON', async () => {
		fetchMock.mockResolvedValue(new Response('not-json', { status: 200 }));

		await expect(
			fetchCharacters({ name: '', page: 1 }, new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-response', status: 200 });
	});

	it('rejects an invalid page before making a request', async () => {
		await expect(
			fetchCharacters({ name: '', page: 0 }, new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-request' });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('fetchCharactersByIds', () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('normalizes one character into a list', async () => {
		fetchMock.mockResolvedValue(jsonResponse(apiCharacter));
		const signal = new AbortController().signal;

		const result = await fetchCharactersByIds([1], signal);

		expect(String(fetchMock.mock.calls[0][0])).toBe(
			'https://rickandmortyapi.com/api/character/1',
		);
		expect(fetchMock.mock.calls[0][1]).toEqual({ signal });
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Rick Sanchez');
	});

	it('normalizes several characters and preserves the requested order', async () => {
		const secondCharacter: ApiCharacter = { ...apiCharacter, id: 2, name: 'Morty Smith' };
		fetchMock.mockResolvedValue(jsonResponse([apiCharacter, secondCharacter]));

		const result = await fetchCharactersByIds([2, 1, 2], new AbortController().signal);

		expect(String(fetchMock.mock.calls[0][0])).toBe(
			'https://rickandmortyapi.com/api/character/2,1',
		);
		expect(result.map((character) => character.id)).toEqual([2, 1]);
	});

	it('returns an empty list without a request when no identifiers exist', async () => {
		await expect(fetchCharactersByIds([], new AbortController().signal)).resolves.toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects invalid identifiers before making a request', async () => {
		await expect(
			fetchCharactersByIds([0], new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-request' });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects missing characters and server failures as HTTP errors', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ error: 'Character not found' }, 404));

		await expect(
			fetchCharactersByIds([999_999], new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'http', status: 404 });
	});

	it('rejects invalid or incomplete responses', async () => {
		fetchMock.mockResolvedValue(jsonResponse([apiCharacter]));

		await expect(
			fetchCharactersByIds([1, 2], new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-response' });
	});

	it('rejects invalid JSON', async () => {
		fetchMock.mockResolvedValue(new Response('not-json', { status: 200 }));

		await expect(
			fetchCharactersByIds([1], new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'invalid-response', status: 200 });
	});

	it('wraps network failures', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network unavailable'));

		await expect(
			fetchCharactersByIds([1], new AbortController().signal),
		).rejects.toMatchObject<CharacterRequestError>({ kind: 'network' });
	});

	it('preserves an abort error', async () => {
		const controller = new AbortController();
		const abortError = new DOMException('Aborted', 'AbortError');
		controller.abort();
		fetchMock.mockRejectedValue(abortError);

		await expect(fetchCharactersByIds([1], controller.signal)).rejects.toBe(abortError);
	});
});
