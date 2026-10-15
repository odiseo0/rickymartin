import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as charactersApi from '../../characters/api/characters.api';
import type { Character } from '../../characters/types/character.types';
import { FAVORITES_STORAGE_KEY } from '../services/favorites.storage';
import FavoritesPage from './FavoritesPage';

const character: Character = {
	id: 1,
	name: 'Rick Sanchez',
	status: 'Alive',
	species: 'Human',
	gender: 'Male',
	origin: 'Earth (C-137)',
	location: 'Citadel of Ricks',
	image: 'https://example.com/rick.jpeg',
};

function storeFavorites(ids: number[]) {
	window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, ids }));
}

describe('FavoritesPage', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	});

	it('shows an empty state without requesting characters', async () => {
		const request = vi.spyOn(charactersApi, 'fetchCharactersByIds');
		render(<FavoritesPage />);

		expect(await screen.findByRole('heading', { name: 'Aún no guardaste personajes' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Explorar personajes' }).getAttribute('href')).toBe('/');
		expect(request).not.toHaveBeenCalled();
	});

	it('loads saved characters and marks the current navigation page', async () => {
		storeFavorites([1]);
		vi.spyOn(charactersApi, 'fetchCharactersByIds').mockResolvedValue([character]);
		render(<FavoritesPage />);

		expect(screen.getByRole('status').textContent).toContain('Cargando personajes');
		expect(await screen.findByRole('heading', { name: 'Rick Sanchez' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Favoritos' }).getAttribute('aria-current')).toBe(
			'page',
		);
	});

	it('removes a favorite immediately and persists the change', async () => {
		storeFavorites([1]);
		vi.spyOn(charactersApi, 'fetchCharactersByIds').mockResolvedValue([character]);
		render(<FavoritesPage />);
		const removeButton = await screen.findByRole('button', {
			name: 'Quitar a Rick Sanchez de favoritos',
		});

		fireEvent.click(removeButton);

		expect(await screen.findByRole('heading', { name: 'Aún no guardaste personajes' })).toBeTruthy();
		expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '')).toEqual({
			version: 1,
			ids: [],
		});
	});

	it('shows an API error and retries without deleting the selection', async () => {
		storeFavorites([1]);
		const request = vi
			.spyOn(charactersApi, 'fetchCharactersByIds')
			.mockRejectedValueOnce(new charactersApi.CharacterRequestError('network', 'Failed'))
			.mockResolvedValueOnce([character]);
		render(<FavoritesPage />);

		const retry = await screen.findByRole('button', { name: 'Reintentar' });
		fireEvent.click(retry);

		expect(await screen.findByRole('heading', { name: 'Rick Sanchez' })).toBeTruthy();
		expect(request).toHaveBeenCalledTimes(2);
		expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '')).toEqual({
			version: 1,
			ids: [1],
		});
	});

	it('recovers valid identifiers from damaged storage and warns the user', async () => {
		window.localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ version: 1, ids: [1, 'bad'] }),
		);
		vi.spyOn(charactersApi, 'fetchCharactersByIds').mockResolvedValue([character]);
		render(<FavoritesPage />);

		expect(
			await screen.findByText(
				'Algunos favoritos guardados no eran válidos. Conservamos los que pudimos recuperar.',
			),
		).toBeTruthy();
		expect(await screen.findByRole('heading', { name: 'Rick Sanchez' })).toBeTruthy();
	});
});
