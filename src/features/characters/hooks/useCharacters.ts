import { useCallback, useEffect, useState } from 'react';
import {
	CharacterRequestError,
	fetchCharacters,
} from '../api/characters.api';
import type { CharacterPage, CharacterSearchParams } from '../types/character.types';

export type CharactersQueryState =
	| { status: 'loading' }
	| { status: 'success'; data: CharacterPage }
	| { status: 'empty'; data: CharacterPage }
	| { status: 'error'; error: CharacterRequestError };

export type UseCharactersResult = CharactersQueryState & {
	retry: () => void;
};

interface CharactersQuerySnapshot {
	requestKey: string;
	state: CharactersQueryState;
}

export function useCharacters(params: CharacterSearchParams, enabled = true): UseCharactersResult {
	const requestKey = `${params.name}\u0000${params.page}`;
	const [requestVersion, setRequestVersion] = useState(0);
	const [snapshot, setSnapshot] = useState<CharactersQuerySnapshot>({
		requestKey,
		state: { status: 'loading' },
	});

	const retry = useCallback(() => {
		setRequestVersion((currentVersion) => currentVersion + 1);
	}, []);

	useEffect(() => {
		if (!enabled) return;

		const controller = new AbortController();
		let isCurrentRequest = true;

		setSnapshot({ requestKey, state: { status: 'loading' } });

		fetchCharacters(params, controller.signal)
			.then((data) => {
				if (!isCurrentRequest) return;

				setSnapshot({
					requestKey,
					state: {
						status: data.results.length === 0 ? 'empty' : 'success',
						data,
					},
				});
			})
			.catch((error: unknown) => {
				if (!isCurrentRequest || controller.signal.aborted) return;

				const requestError =
					error instanceof CharacterRequestError
						? error
						: new CharacterRequestError('network', 'The character request failed.', {
								cause: error,
							});

				setSnapshot({ requestKey, state: { status: 'error', error: requestError } });
			});

		return () => {
			isCurrentRequest = false;
			controller.abort();
		};
	}, [enabled, params.name, params.page, requestKey, requestVersion]);

	const state =
		enabled && snapshot.requestKey === requestKey
			? snapshot.state
			: { status: 'loading' as const };

	return { ...state, retry };
}
