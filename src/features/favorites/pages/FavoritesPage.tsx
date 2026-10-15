import { AppHeader } from '../../../components/layout/AppHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { CharacterGrid } from '../../characters/components/CharacterGrid';
import { FavoritesEmptyState } from '../components/FavoritesEmptyState';
import { PersistenceNotice } from '../components/PersistenceNotice';
import { useFavoriteCharacters } from '../hooks/useFavoriteCharacters';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoritesPage() {
	const favorites = useFavorites();
	const query = useFavoriteCharacters(favorites.isReady ? favorites.ids : []);
	const visibleCharacters =
		query.status === 'success'
			? query.data.filter((character) => favorites.isFavorite(character.id))
			: [];

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader currentPage="favorites" />

			<main
				className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
				id="contenido-principal"
				tabIndex={-1}
			>
				<h1 className="font-display text-2xl font-normal tracking-tight sm:text-3xl">Favoritos</h1>
				<p className="mt-1 text-sm text-muted">Los personajes que guardaste</p>
				<PersistenceNotice status={favorites.persistenceStatus} />

				<section aria-label="Personajes favoritos" className="mt-6">
					{!favorites.isReady || query.status === 'loading' ? (
						<LoadingState />
					) : query.status === 'error' ? (
						<ErrorState onRetry={query.retry} />
					) : query.status === 'empty' || visibleCharacters.length === 0 ? (
						<FavoritesEmptyState />
					) : (
						<CharacterGrid
							characters={visibleCharacters}
							favoriteReady={favorites.isReady}
							isFavorite={favorites.isFavorite}
							onToggleFavorite={favorites.toggleFavorite}
						/>
					)}
				</section>
			</main>
		</div>
	);
}
