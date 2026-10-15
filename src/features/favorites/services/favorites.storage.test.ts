import { describe, expect, it, vi } from 'vitest';
import {
	FAVORITES_STORAGE_KEY,
	parseFavoriteIds,
	readFavoriteIds,
	writeFavoriteIds,
} from './favorites.storage';

function createStorage(value: string | null = null): Storage {
	let storedValue = value;

	return {
		clear: vi.fn(() => {
			storedValue = null;
		}),
		getItem: vi.fn((key: string) => (key === FAVORITES_STORAGE_KEY ? storedValue : null)),
		key: vi.fn(() => null),
		get length() {
			return storedValue === null ? 0 : 1;
		},
		removeItem: vi.fn(() => {
			storedValue = null;
		}),
		setItem: vi.fn((key: string, nextValue: string) => {
			if (key === FAVORITES_STORAGE_KEY) storedValue = nextValue;
		}),
	};
}

describe('favorites storage', () => {
	it('returns an empty available list when no data exists', () => {
		expect(readFavoriteIds(createStorage())).toEqual({ ids: [], status: 'available' });
	});

	it('reads valid identifiers in their saved order', () => {
		const storage = createStorage(JSON.stringify({ version: 1, ids: [35, 2, 1] }));

		expect(readFavoriteIds(storage)).toEqual({ ids: [35, 2, 1], status: 'available' });
	});

	it('recovers valid identifiers and removes duplicates from partial damage', () => {
		const value = JSON.stringify({ version: 1, ids: [4, 'bad', 4, -1, 2.5, 2] });

		expect(parseFavoriteIds(value)).toEqual({ ids: [4, 2], status: 'invalid' });
	});

	it.each([
		'{not-json',
		JSON.stringify({ version: 2, ids: [1] }),
		JSON.stringify({ version: 1, ids: '1' }),
	])('uses an empty invalid state for unsupported data', (value) => {
		expect(parseFavoriteIds(value)).toEqual({ ids: [], status: 'invalid' });
	});

	it('returns unavailable when reading fails', () => {
		const storage = createStorage();
		vi.mocked(storage.getItem).mockImplementation(() => {
			throw new DOMException('Access denied');
		});

		expect(readFavoriteIds(storage)).toEqual({ ids: [], status: 'unavailable' });
	});

	it('writes the versioned document after normalizing identifiers', () => {
		const storage = createStorage();

		expect(writeFavoriteIds([3, 3, -1, 1], storage)).toBe(true);
		expect(storage.setItem).toHaveBeenCalledWith(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ version: 1, ids: [3, 1] }),
		);
	});

	it('reports a failed write without throwing', () => {
		const storage = createStorage();
		vi.mocked(storage.setItem).mockImplementation(() => {
			throw new DOMException('Quota exceeded');
		});

		expect(writeFavoriteIds([1], storage)).toBe(false);
	});
});
