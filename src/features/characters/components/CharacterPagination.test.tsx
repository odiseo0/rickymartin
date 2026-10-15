import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CharacterPagination } from './CharacterPagination';

describe('CharacterPagination', () => {
	it('shows the current page and total results', () => {
		render(
			<CharacterPagination currentPage={2} onPageChange={vi.fn()} totalPages={3} totalResults={60} />,
		);

		expect(screen.getByRole('navigation', { name: 'Paginación de personajes' })).toBeTruthy();
		expect(screen.getByText('Página 2 de 3')).toBeTruthy();
		expect(screen.getByText('60 personajes')).toBeTruthy();
	});

	it('requests the previous and next pages', () => {
		const onPageChange = vi.fn();
		render(
			<CharacterPagination
				currentPage={2}
				onPageChange={onPageChange}
				totalPages={3}
				totalResults={60}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

		expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
		expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
	});

	it('disables the limits', () => {
		const { rerender } = render(
			<CharacterPagination currentPage={1} onPageChange={vi.fn()} totalPages={3} totalResults={60} />,
		);

		expect((screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement).disabled).toBe(
			true,
		);
		expect((screen.getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement).disabled).toBe(
			false,
		);

		rerender(
			<CharacterPagination currentPage={3} onPageChange={vi.fn()} totalPages={3} totalResults={60} />,
		);

		expect((screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement).disabled).toBe(
			false,
		);
		expect((screen.getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it('uses the singular result label', () => {
		render(
			<CharacterPagination currentPage={1} onPageChange={vi.fn()} totalPages={1} totalResults={1} />,
		);

		expect(screen.getByText('1 personaje')).toBeTruthy();
	});
});
