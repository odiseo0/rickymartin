import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CharacterSearch } from './CharacterSearch';

describe('CharacterSearch', () => {
	it('has an accessible label and reports the written value', () => {
		const onChange = vi.fn();
		render(<CharacterSearch onChange={onChange} value="" />);

		const input = screen.getByRole('searchbox', { name: 'Buscar personajes' });
		fireEvent.change(input, { target: { value: 'Morty' } });

		expect(onChange).toHaveBeenCalledWith('Morty');
		expect(input.getAttribute('aria-describedby')).toBe('character-search-help');
	});
});
