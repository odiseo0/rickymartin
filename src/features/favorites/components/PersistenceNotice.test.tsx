import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersistenceNotice } from './PersistenceNotice';

describe('PersistenceNotice', () => {
	it('stays hidden while persistence is available', () => {
		const { container } = render(<PersistenceNotice status="available" />);
		expect(container.textContent).toBe('');
	});

	it('explains that unavailable storage only preserves the current tab', () => {
		render(<PersistenceNotice status="unavailable" />);
		expect(screen.getByRole('status').textContent).toContain(
			'Los cambios solo estarán disponibles en esta pestaña',
		);
	});
});
