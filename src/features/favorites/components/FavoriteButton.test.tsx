import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteButton } from './FavoriteButton';

describe('FavoriteButton', () => {
	it('adds a character with an accessible unpressed state', () => {
		const onToggle = vi.fn();
		render(
			<FavoriteButton
				characterId={1}
				characterName="Rick Sanchez"
				isFavorite={false}
				onToggle={onToggle}
			/>,
		);
		const button = screen.getByRole('button', { name: 'Agregar a Rick Sanchez a favoritos' });

		expect(button.getAttribute('aria-pressed')).toBe('false');
		fireEvent.click(button);
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('removes a saved character with a pressed state', () => {
		const onToggle = vi.fn();
		render(
			<FavoriteButton
				characterId={1}
				characterName="Rick Sanchez"
				isFavorite
				onToggle={onToggle}
			/>,
		);
		const button = screen.getByRole('button', { name: 'Quitar a Rick Sanchez de favoritos' });

		expect(button.getAttribute('aria-pressed')).toBe('true');
		expect(button.textContent).toBe('Guardado');
	});
});
