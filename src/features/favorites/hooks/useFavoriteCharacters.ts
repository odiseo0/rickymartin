import { useCallback, useEffect, useState } from 'react';
import {
	CharacterRequestError,
	fetchCharactersByIds,
} from '../../characters/api/characters.api';
import type { Character } from '../../characters/types/character.types';

export type FavoriteCharactersState =
	| { status: 'loading' }
	| { status: 'success'; data: Character[] }
	| { status: 'empty' }
	| { status: 'error'; error: CharacterRequestError };

export type UseFavoriteCharactersResult = FavoriteCharactersState & {
	retry: () => void;
};

interface FavoriteCharactersSnapshot {
	requestKey: string;
	state: FavoriteCharactersState;
}

export function useFavoriteCharacters(ids: number[]): UseFavoriteCharactersResult {
	const requestKey = ids.join(',');
	const [requestVersion, setRequestVersion] = useState(0);
	const [snapshot, setSnapshot] = useState<FavoriteCharactersSnapshot>({
		requestKey,
		state: ids.length === 0 ? { status: 'empty' } : { status: 'loading' },
	});

	const retry = useCallback(() => {
		setRequestVersion((currentVersion) => currentVersion + 1);
	}, []);

	useEffect(() => {
		if (ids.length === 0) {
			setSnapshot({ requestKey, state: { status: 'empty' } });
			return;
		}

		const controller = new AbortController();
		let isCurrentRequest = true;
		setSnapshot({ requestKey, state: { status: 'loading' } });

		fetchCharactersByIds(ids, controller.signal)
			.then((data) => {
				if (!isCurrentRequest) return;
				setSnapshot({ requestKey, state: { status: 'success', data } });
			})
			.catch((error: unknown) => {
				if (!isCurrentRequest || controller.signal.aborted) return;

				const requestError =
					error instanceof CharacterRequestError
						? error
						: new CharacterRequestError('network', 'The favorite request failed.', {
								cause: error,
							});
				setSnapshot({ requestKey, state: { status: 'error', error: requestError } });
			});

		return () => {
			isCurrentRequest = false;
			controller.abort();
		};
	}, [requestKey, requestVersion]);

	const state =
		snapshot.requestKey === requestKey
			? snapshot.state
			: ids.length === 0
				? { status: 'empty' as const }
				: { status: 'loading' as const };

	return { ...state, retry };
}
