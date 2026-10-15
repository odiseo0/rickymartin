import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Character } from '../types/character.types';
import { CharacterCard } from './CharacterCard';

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

describe('CharacterCard', () => {
	it('shows the character data', () => {
		render(
			<CharacterCard
				character={character}
				favoriteReady
				isFavorite={false}
				onToggleFavorite={() => undefined}
			/>,
		);

		expect(screen.getByRole('heading', { name: 'Rick Sanchez' })).toBeTruthy();
		expect(screen.getByText('Human · Alive')).toBeTruthy();
		expect(screen.getByText('Citadel of Ricks')).toBeTruthy();
	});

	it('shows a stable alternative when the image fails', () => {
		render(
			<CharacterCard
				character={character}
				favoriteReady
				isFavorite={false}
				onToggleFavorite={() => undefined}
			/>,
		);
		fireEvent.error(screen.getByRole('img', { name: 'Retrato de Rick Sanchez' }));

		expect(screen.getByRole('img', { name: 'Imagen no disponible para Rick Sanchez' })).toBeTruthy();
	});
});
