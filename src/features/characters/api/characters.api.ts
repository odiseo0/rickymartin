import type {
	ApiCharacter,
	ApiCharacterPageResponse,
	ApiPageInfo,
	ApiResourceReference,
	Character,
	CharacterGender,
	CharacterPage,
	CharacterSearchParams,
	CharacterStatus,
} from '../types/character.types';

const CHARACTERS_URL = 'https://rickandmortyapi.com/api/character';

export type CharacterRequestErrorKind = 'http' | 'invalid-request' | 'invalid-response' | 'network';

export class CharacterRequestError extends Error {
	readonly kind: CharacterRequestErrorKind;
	readonly status: number | null;

	constructor(
		kind: CharacterRequestErrorKind,
		message: string,
		options: { cause?: unknown; status?: number } = {},
	) {
		super(message, { cause: options.cause });
		this.name = 'CharacterRequestError';
		this.kind = kind;
		this.status = options.status ?? null;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isResourceReference(value: unknown): value is ApiResourceReference {
	return isRecord(value) && typeof value.name === 'string' && typeof value.url === 'string';
}

function isCharacterStatus(value: unknown): value is CharacterStatus {
	return value === 'Alive' || value === 'Dead' || value === 'unknown';
}

function isCharacterGender(value: unknown): value is CharacterGender {
	return value === 'Female' || value === 'Male' || value === 'Genderless' || value === 'unknown';
}

function isApiCharacter(value: unknown): value is ApiCharacter {
	return (
		isRecord(value) &&
		typeof value.id === 'number' &&
		typeof value.name === 'string' &&
		isCharacterStatus(value.status) &&
		typeof value.species === 'string' &&
		typeof value.type === 'string' &&
		isCharacterGender(value.gender) &&
		isResourceReference(value.origin) &&
		isResourceReference(value.location) &&
		typeof value.image === 'string' &&
		Array.isArray(value.episode) &&
		value.episode.every((episode) => typeof episode === 'string') &&
		typeof value.url === 'string' &&
		typeof value.created === 'string'
	);
}

function isPageInfo(value: unknown): value is ApiPageInfo {
	return (
		isRecord(value) &&
		typeof value.count === 'number' &&
		typeof value.pages === 'number' &&
		(value.next === null || typeof value.next === 'string') &&
		(value.prev === null || typeof value.prev === 'string')
	);
}

function isCharacterPageResponse(value: unknown): value is ApiCharacterPageResponse {
	return (
		isRecord(value) &&
		isPageInfo(value.info) &&
		Array.isArray(value.results) &&
		value.results.every(isApiCharacter)
	);
}

function mapCharacter(character: ApiCharacter): Character {
	return {
		id: character.id,
		name: character.name,
		status: character.status,
		species: character.species,
		gender: character.gender,
		origin: character.origin.name,
		location: character.location.name,
		image: character.image,
	};
}

function emptyCharacterPage(): CharacterPage {
	return {
		info: {
			count: 0,
			pages: 0,
			next: null,
			prev: null,
		},
		results: [],
	};
}

export async function fetchCharacters(
	params: CharacterSearchParams,
	signal: AbortSignal,
): Promise<CharacterPage> {
	const name = params.name.trim();

	if (!Number.isInteger(params.page) || params.page < 1) {
		throw new CharacterRequestError('invalid-request', 'Character page must be a positive integer.');
	}

	const url = new URL(CHARACTERS_URL);
	url.searchParams.set('page', String(params.page));

	if (name) {
		url.searchParams.set('name', name);
	}

	try {
		const response = await fetch(url, { signal });

		if (response.status === 404 && name && params.page === 1) {
			return emptyCharacterPage();
		}

		if (!response.ok) {
			throw new CharacterRequestError('http', 'The character request failed.', {
				status: response.status,
			});
		}

		let body: unknown;

		try {
			body = await response.json();
		} catch (error) {
			throw new CharacterRequestError('invalid-response', 'The character response is invalid.', {
				cause: error,
				status: response.status,
			});
		}

		if (!isCharacterPageResponse(body)) {
			throw new CharacterRequestError('invalid-response', 'The character response is invalid.', {
				status: response.status,
			});
		}

		return {
			info: body.info,
			results: body.results.map(mapCharacter),
		};
	} catch (error) {
		if (signal.aborted || error instanceof CharacterRequestError) {
			throw error;
		}

		throw new CharacterRequestError('network', 'The character request could not be completed.', {
			cause: error,
		});
	}
}

export async function fetchCharactersByIds(
	ids: number[],
	signal: AbortSignal,
): Promise<Character[]> {
	const uniqueIds: number[] = [];
	const seenIds = new Set<number>();

	for (const id of ids) {
		if (!Number.isInteger(id) || id < 1) {
			throw new CharacterRequestError(
				'invalid-request',
				'Character identifiers must be positive integers.',
			);
		}

		if (!seenIds.has(id)) {
			seenIds.add(id);
			uniqueIds.push(id);
		}
	}

	if (uniqueIds.length === 0) return [];

	const url = new URL(`${CHARACTERS_URL}/${uniqueIds.join(',')}`);

	try {
		const response = await fetch(url, { signal });

		if (!response.ok) {
			throw new CharacterRequestError('http', 'The character request failed.', {
				status: response.status,
			});
		}

		let body: unknown;

		try {
			body = await response.json();
		} catch (error) {
			throw new CharacterRequestError('invalid-response', 'The character response is invalid.', {
				cause: error,
				status: response.status,
			});
		}

		const apiCharacters = Array.isArray(body) ? body : [body];
		if (!apiCharacters.every(isApiCharacter)) {
			throw new CharacterRequestError('invalid-response', 'The character response is invalid.', {
				status: response.status,
			});
		}

		const charactersById = new Map(
			apiCharacters.map((character) => [character.id, mapCharacter(character)]),
		);
		const orderedCharacters = uniqueIds.map((id) => charactersById.get(id));

		if (
			charactersById.size !== uniqueIds.length ||
			orderedCharacters.some((character) => character === undefined)
		) {
			throw new CharacterRequestError('invalid-response', 'The character response is invalid.', {
				status: response.status,
			});
		}

		return orderedCharacters as Character[];
	} catch (error) {
		if (signal.aborted || error instanceof CharacterRequestError) {
			throw error;
		}

		throw new CharacterRequestError('network', 'The character request could not be completed.', {
			cause: error,
		});
	}
}
