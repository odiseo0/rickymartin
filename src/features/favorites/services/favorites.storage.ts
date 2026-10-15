export const FAVORITES_STORAGE_KEY = 'rickmorty:favorites:v1';

const FAVORITES_STORAGE_VERSION = 1;

export type FavoritesPersistenceStatus = 'available' | 'invalid' | 'unavailable';

export interface FavoritesStorageReadResult {
	ids: number[];
	status: FavoritesPersistenceStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function normalizeIds(value: unknown[]): { ids: number[]; repaired: boolean } {
	const ids: number[] = [];
	const seenIds = new Set<number>();
	let repaired = false;

	for (const candidate of value) {
		if (!Number.isInteger(candidate) || (candidate as number) < 1) {
			repaired = true;
			continue;
		}

		const id = candidate as number;
		if (seenIds.has(id)) {
			repaired = true;
			continue;
		}

		seenIds.add(id);
		ids.push(id);
	}

	return { ids, repaired };
}

export function parseFavoriteIds(value: string | null): FavoritesStorageReadResult {
	if (value === null) {
		return { ids: [], status: 'available' };
	}

	try {
		const parsed: unknown = JSON.parse(value);

		if (
			!isRecord(parsed) ||
			parsed.version !== FAVORITES_STORAGE_VERSION ||
			!Array.isArray(parsed.ids)
		) {
			return { ids: [], status: 'invalid' };
		}

		const normalized = normalizeIds(parsed.ids);
		return {
			ids: normalized.ids,
			status: normalized.repaired ? 'invalid' : 'available',
		};
	} catch {
		return { ids: [], status: 'invalid' };
	}
}

export function readFavoriteIds(storage?: Storage): FavoritesStorageReadResult {
	try {
		const targetStorage = storage ?? window.localStorage;
		return parseFavoriteIds(targetStorage.getItem(FAVORITES_STORAGE_KEY));
	} catch {
		return { ids: [], status: 'unavailable' };
	}
}

export function writeFavoriteIds(ids: number[], storage?: Storage): boolean {
	try {
		const targetStorage = storage ?? window.localStorage;
		const normalized = normalizeIds(ids);
		targetStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ version: FAVORITES_STORAGE_VERSION, ids: normalized.ids }),
		);
		return true;
	} catch {
		return false;
	}
}
