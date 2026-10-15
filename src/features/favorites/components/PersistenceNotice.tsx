import type { FavoritesPersistenceStatus } from '../services/favorites.storage';

interface PersistenceNoticeProps {
	status: FavoritesPersistenceStatus;
}

export function PersistenceNotice({ status }: PersistenceNoticeProps) {
	if (status === 'available') return null;

	return (
		<div
			aria-live="polite"
			className="mt-6 rounded-ui border border-border bg-surface p-4 text-sm shadow-(--app-shadow-raised)"
			role="status"
		>
			{status === 'invalid'
				? 'Algunos favoritos guardados no eran válidos. Conservamos los que pudimos recuperar.'
				: 'No pudimos guardar tus favoritos. Los cambios solo estarán disponibles en esta pestaña.'}
		</div>
	);
}
