import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterRequestError } from '../features/characters/api/characters.api';
import type { UseCharacterNavigationResult } from '../features/characters/hooks/useCharacterNavigation';
import type { CharacterPage } from '../features/characters/types/character.types';
import RickAndMortyApp from './RickAndMortyApp';

const { mockUseCharacterNavigation, mockUseCharacters, mockUseFavorites } = vi.hoisted(() => ({
	mockUseCharacterNavigation: vi.fn(),
	mockUseCharacters: vi.fn(),
	mockUseFavorites: vi.fn(),
}));

vi.mock('../features/characters/hooks/useCharacterNavigation', () => ({
	useCharacterNavigation: mockUseCharacterNavigation,
}));

vi.mock('../features/characters/hooks/useCharacters', () => ({
	useCharacters: mockUseCharacters,
}));

vi.mock('../features/favorites/hooks/useFavorites', () => ({
	useFavorites: mockUseFavorites,
}));

const characterPage: CharacterPage = {
	info: { count: 60, pages: 3, next: 'https://example.com/page/2', prev: null },
	results: [
		{
			id: 1,
			name: 'Rick Sanchez',
			status: 'Alive',
			species: 'Human',
			gender: 'Male',
			origin: 'Earth (C-137)',
			location: 'Citadel of Ricks',
			image: 'https://example.com/rick.jpeg',
		},
	],
};

function navigation(
	overrides: Partial<UseCharacterNavigationResult> = {},
): UseCharacterNavigationResult {
	return {
		isReady: true,
		isWaitingForSearch: false,
		params: { name: '', page: 1 },
		returnToFirstPage: vi.fn(),
		searchTerm: '',
		setPage: vi.fn(),
		setSearchTerm: vi.fn(),
		...overrides,
	};
}

describe('RickAndMortyApp', () => {
	const originalScrollIntoView = Element.prototype.scrollIntoView;

	beforeEach(() => {
		mockUseCharacterNavigation.mockReset();
		mockUseCharacters.mockReset();
		mockUseFavorites.mockReset();
		mockUseCharacterNavigation.mockReturnValue(navigation());
		mockUseFavorites.mockReturnValue({
			ids: [],
			isReady: true,
			persistenceStatus: 'available',
			addFavorite: vi.fn(),
			isFavorite: vi.fn(() => false),
			removeFavorite: vi.fn(),
			toggleFavorite: vi.fn(),
		});
	});

	afterEach(() => {
		if (originalScrollIntoView) {
			Element.prototype.scrollIntoView = originalScrollIntoView;
		} else {
			Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
		}
	});

	it('waits until navigation is ready before showing request results', () => {
		mockUseCharacterNavigation.mockReturnValue(navigation({ isReady: false }));
		mockUseCharacters.mockReturnValue({ status: 'loading', retry: vi.fn() });
		render(<RickAndMortyApp />);

		expect(screen.getByRole('status').textContent).toContain('Preparando búsqueda');
		expect(mockUseCharacters).toHaveBeenLastCalledWith({ name: '', page: 1 }, false);
	});

	it('announces the loading state', () => {
		mockUseCharacters.mockReturnValue({ status: 'loading', retry: vi.fn() });
		render(<RickAndMortyApp />);

		expect(screen.getByRole('status').textContent).toContain('Cargando personajes');
	});

	it('shows characters and pagination after a successful request', () => {
		mockUseCharacters.mockReturnValue({ status: 'success', data: characterPage, retry: vi.fn() });
		render(<RickAndMortyApp />);

		expect(screen.getByRole('heading', { name: 'Rick Sanchez' })).toBeTruthy();
		expect(screen.getByText('Página 1 de 3')).toBeTruthy();
		expect(screen.getByText('60 personajes')).toBeTruthy();
	});

	it('delegates searches and page changes to navigation', () => {
		const setPage = vi.fn();
		const setSearchTerm = vi.fn();
		mockUseCharacterNavigation.mockReturnValue(navigation({ setPage, setSearchTerm }));
		mockUseCharacters.mockReturnValue({ status: 'success', data: characterPage, retry: vi.fn() });
		render(<RickAndMortyApp />);

		fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar personajes' }), {
			target: { value: 'Morty' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

		expect(setSearchTerm).toHaveBeenCalledWith('Morty');
		expect(setPage).toHaveBeenCalledWith(2);
	});

	it('uses the active search parameters', () => {
		mockUseCharacterNavigation.mockReturnValue(
			navigation({ params: { name: 'Morty', page: 2 }, searchTerm: 'Morty' }),
		);
		mockUseCharacters.mockReturnValue({ status: 'loading', retry: vi.fn() });
		render(<RickAndMortyApp />);

		expect(mockUseCharacters).toHaveBeenLastCalledWith({ name: 'Morty', page: 2 }, true);
	});

	it('keeps the loading state while waiting for a search', () => {
		mockUseCharacterNavigation.mockReturnValue(
			navigation({ isWaitingForSearch: true, searchTerm: 'Morty' }),
		);
		mockUseCharacters.mockReturnValue({ status: 'success', data: characterPage, retry: vi.fn() });
		render(<RickAndMortyApp />);

		expect(screen.getByRole('status').textContent).toContain('Preparando búsqueda');
		expect(screen.queryByRole('heading', { name: 'Rick Sanchez' })).toBeNull();
	});

	it('toggles a character from its card', () => {
		const toggleFavorite = vi.fn();
		mockUseFavorites.mockReturnValue({
			ids: [],
			isReady: true,
			persistenceStatus: 'available',
			addFavorite: vi.fn(),
			isFavorite: vi.fn(() => false),
			removeFavorite: vi.fn(),
			toggleFavorite,
		});
		mockUseCharacters.mockReturnValue({ status: 'success', data: characterPage, retry: vi.fn() });
		render(<RickAndMortyApp />);

		fireEvent.click(screen.getByRole('button', { name: 'Agregar a Rick Sanchez a favoritos' }));
		expect(toggleFavorite).toHaveBeenCalledWith(1);
	});

	it('announces the empty state', () => {
		mockUseCharacters.mockReturnValue({
			status: 'empty',
			data: { info: { count: 0, pages: 0, next: null, prev: null }, results: [] },
			retry: vi.fn(),
		});
		render(<RickAndMortyApp />);

		expect(screen.getByRole('status').textContent).toContain(
			'No encontramos personajes con ese nombre',
		);
	});

	it('shows an error and retries the request', () => {
		const retry = vi.fn();
		mockUseCharacters.mockReturnValue({
			status: 'error',
			error: new CharacterRequestError('network', 'Network unavailable'),
			retry,
		});
		render(<RickAndMortyApp />);

		expect(screen.getByRole('alert').textContent).toContain('No pudimos cargar los personajes');
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(retry).toHaveBeenCalledOnce();
	});

	it('returns from an unavailable page without adding history', () => {
		const returnToFirstPage = vi.fn();
		mockUseCharacterNavigation.mockReturnValue(
			navigation({ params: { name: 'Morty', page: 999 }, returnToFirstPage }),
		);
		mockUseCharacters.mockReturnValue({
			status: 'error',
			error: new CharacterRequestError('http', 'Not found', { status: 404 }),
			retry: vi.fn(),
		});
		render(<RickAndMortyApp />);

		expect(screen.getByRole('alert').textContent).toContain('Esta página no está disponible');
		fireEvent.click(screen.getByRole('button', { name: 'Volver a la primera página' }));
		expect(returnToFirstPage).toHaveBeenCalledOnce();
	});

	it('scrolls to the results when the active page changes', () => {
		const scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
		mockUseCharacters.mockReturnValue({ status: 'success', data: characterPage, retry: vi.fn() });
		const { rerender } = render(<RickAndMortyApp />);

		mockUseCharacterNavigation.mockReturnValue(navigation({ params: { name: '', page: 2 } }));
		rerender(<RickAndMortyApp />);

		expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
	});
});
