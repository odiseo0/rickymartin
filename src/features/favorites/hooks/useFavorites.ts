import { useCallback, useEffect, useRef, useState } from 'react';
import {
	FAVORITES_STORAGE_KEY,
	parseFavoriteIds,
	readFavoriteIds,
	writeFavoriteIds,
	type FavoritesPersistenceStatus,
} from '../services/favorites.storage';

interface FavoritesState {
	ids: number[];
	isReady: boolean;
	persistenceStatus: FavoritesPersistenceStatus;
}

export interface UseFavoritesResult extends FavoritesState {
	addFavorite: (characterId: number) => void;
	isFavorite: (characterId: number) => boolean;
	removeFavorite: (characterId: number) => void;
	toggleFavorite: (characterId: number) => void;
}

export function useFavorites(): UseFavoritesResult {
	const idsRef = useRef<number[]>([]);
	const [state, setState] = useState<FavoritesState>({
		ids: [],
		isReady: false,
		persistenceStatus: 'available',
	});

	useEffect(() => {
		const storedFavorites = readFavoriteIds();
    idsRef.current = storedFavorites.ids;

    setState({
			ids: storedFavorites.ids,
			isReady: true,
			persistenceStatus: storedFavorites.status,
		});

		const handleStorage = (event: StorageEvent) => {
			if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;

			const nextFavorites = parseFavoriteIds(event.key === null ? null : event.newValue);
      idsRef.current = nextFavorites.ids;

      setState({
				ids: nextFavorites.ids,
				isReady: true,
				persistenceStatus: nextFavorites.status,
			});
		};

		window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
	}, []);

	const commit = useCallback((ids: number[]) => {
		idsRef.current = ids;
		const persisted = writeFavoriteIds(ids);
		setState({
			ids,
			isReady: true,
			persistenceStatus: persisted ? 'available' : 'unavailable',
		});
	}, []);

	const addFavorite = useCallback(
		(characterId: number) => {
			if (!Number.isInteger(characterId) || characterId < 1 || idsRef.current.includes(characterId)) {
				return;
			}

			commit([characterId, ...idsRef.current]);
    },
		[commit],
	);

	const removeFavorite = useCallback(
		(characterId: number) => {
			if (!idsRef.current.includes(characterId)) return;
			commit(idsRef.current.filter((id) => id !== characterId));
    },

		[commit],
	);

	const toggleFavorite = useCallback(
		(characterId: number) => {
			if (idsRef.current.includes(characterId)) {
				removeFavorite(characterId);
			} else {
				addFavorite(characterId);
			}
    },

		[addFavorite, removeFavorite],
	);

	const isFavorite = useCallback((characterId: number) => idsRef.current.includes(characterId), []);

	return { ...state, addFavorite, isFavorite, removeFavorite, toggleFavorite };
}
