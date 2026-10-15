import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import type { CharacterSearchParams } from '../types/character.types';

const SEARCH_DELAY_MS = 350;
const INITIAL_PARAMS: CharacterSearchParams = { name: '', page: 1 };

export function parseCharacterSearchParams(search: string): CharacterSearchParams {
	const searchParams = new URLSearchParams(search);
	const name = searchParams.get('q')?.trim() ?? '';
	const pageValue = searchParams.get('page');
	const parsedPage = pageValue === null || pageValue.trim() === '' ? 1 : Number(pageValue);
	const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

	return { name, page };
}

export function createCharacterUrl(
	params: CharacterSearchParams,
	pathname = '/',
	hash = '',
): string {
	const searchParams = new URLSearchParams();

	if (params.name) searchParams.set('q', params.name);
	if (params.page > 1) searchParams.set('page', String(params.page));

  const search = searchParams.toString();

	return `${pathname}${search ? `?${search}` : ''}${hash}`;
}

export interface UseCharacterNavigationResult {
	isReady: boolean;
	isWaitingForSearch: boolean;
	params: CharacterSearchParams;
	returnToFirstPage: () => void;
	searchTerm: string;
	setPage: (page: number) => void;
	setSearchTerm: (value: string) => void;
}

export function useCharacterNavigation(): UseCharacterNavigationResult {
	const [isReady, setIsReady] = useState(false);
	const [searchTerm, setSearchTermState] = useState('');
	const [params, setParams] = useState<CharacterSearchParams>(INITIAL_PARAMS);
	const paramsRef = useRef<CharacterSearchParams>(INITIAL_PARAMS);
	const ignoredDebouncedNameRef = useRef<string | null>(null);
	const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DELAY_MS);

	const writeUrl = useCallback((nextParams: CharacterSearchParams, mode: 'push' | 'replace') => {
		const url = createCharacterUrl(nextParams, window.location.pathname, window.location.hash);
		const method = mode === 'push' ? 'pushState' : 'replaceState';
		window.history[method](window.history.state, '', url);
	}, []);

	const applyLocation = useCallback(() => {
		const nextParams = parseCharacterSearchParams(window.location.search);
		const canonicalUrl = createCharacterUrl(
			nextParams,
			window.location.pathname,
			window.location.hash,
		);
		const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

		if (canonicalUrl !== currentUrl) {
			window.history.replaceState(window.history.state, '', canonicalUrl);
		}

		paramsRef.current = nextParams;
		ignoredDebouncedNameRef.current = nextParams.name;
		setSearchTermState(nextParams.name);
		setParams(nextParams);
		setIsReady(true);
	}, []);

	useEffect(() => {
		applyLocation();
    window.addEventListener('popstate', applyLocation);

		return () => window.removeEventListener('popstate', applyLocation);
	}, [applyLocation]);

	useEffect(() => {
		if (!isReady) return;

    const name = debouncedSearchTerm.trim();

		if (ignoredDebouncedNameRef.current !== null) {
			if (name === ignoredDebouncedNameRef.current) {
				ignoredDebouncedNameRef.current = null;
			}

      return;
		}

		if (name === paramsRef.current.name) return;

		const nextParams = { name, page: 1 };
		paramsRef.current = nextParams;
		setParams(nextParams);
		writeUrl(nextParams, 'replace');
	}, [debouncedSearchTerm, isReady, writeUrl]);

	const setSearchTerm = useCallback((value: string) => {
		ignoredDebouncedNameRef.current = null;
		setSearchTermState(value);
	}, []);

	const setPage = useCallback(
		(page: number) => {
			if (!Number.isInteger(page) || page < 1 || page === paramsRef.current.page) return;

			const nextParams = { ...paramsRef.current, page };
			paramsRef.current = nextParams;
			setParams(nextParams);
			writeUrl(nextParams, 'push');
		},
		[writeUrl],
	);

	const returnToFirstPage = useCallback(() => {
		const nextParams = { ...paramsRef.current, page: 1 };
		paramsRef.current = nextParams;
		setParams(nextParams);
		writeUrl(nextParams, 'replace');
	}, [writeUrl]);

	return {
		isReady,
		isWaitingForSearch: searchTerm.trim() !== params.name,
		params,
		returnToFirstPage,
		searchTerm,
		setPage,
		setSearchTerm,
	};
}
