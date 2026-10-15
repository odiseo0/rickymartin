import { useEffect, useRef } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { InvalidPageState } from '../components/feedback/InvalidPageState';
import { LoadingState } from '../components/feedback/LoadingState';
import { CharacterRequestError } from '../features/characters/api/characters.api';
import { CharacterGrid } from '../features/characters/components/CharacterGrid';
import { CharacterPagination } from '../features/characters/components/CharacterPagination';
import { CharacterSearch } from '../features/characters/components/CharacterSearch';
import { useCharacterNavigation } from '../features/characters/hooks/useCharacterNavigation';
import { useCharacters } from '../features/characters/hooks/useCharacters';
import { PersistenceNotice } from '../features/favorites/components/PersistenceNotice';
import { useFavorites } from '../features/favorites/hooks/useFavorites';

export default function RickAndMortyApp() {
	const favorites = useFavorites();
	const navigation = useCharacterNavigation();
	const query = useCharacters(navigation.params, navigation.isReady);
	const resultsRef = useRef<HTMLElement>(null);
	const previousPageRef = useRef<number | null>(null);

	useEffect(() => {
		if (!navigation.isReady) return;

		if (previousPageRef.current === null) {
			previousPageRef.current = navigation.params.page;

			return;
		}

		if (previousPageRef.current !== navigation.params.page) {
			previousPageRef.current = navigation.params.page;
			resultsRef.current?.scrollIntoView({ block: 'start' });
		}
	}, [navigation.isReady, navigation.params.page]);

	const isUnavailablePage =
		query.status === 'error' &&
		navigation.params.page > 1 &&
		query.error instanceof CharacterRequestError &&
		query.error.status === 404;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader
				currentPage="characters"
				search={
					<CharacterSearch onChange={navigation.setSearchTerm} value={navigation.searchTerm} />
				}
			/>

			<main
				className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
				id="contenido-principal"
				tabIndex={-1}
			>
				<h1 className="font-display text-2xl font-normal tracking-tight sm:text-3xl">Personajes</h1>
				<p className="mt-1 text-sm text-muted">Explora el catálogo de Rick and Morty</p>
				<PersistenceNotice status={favorites.persistenceStatus} />

				<section
					aria-label="Resultados de personajes"
					className="mt-6 scroll-mt-4"
					ref={resultsRef}
				>
					{!navigation.isReady || navigation.isWaitingForSearch ? (
						<LoadingState message="Preparando búsqueda" />
					) : (
						<>
							{query.status === 'loading' && <LoadingState />}
							{query.status === 'success' && (
								<>
									<CharacterGrid
										characters={query.data.results}
										favoriteReady={favorites.isReady}
										isFavorite={favorites.isFavorite}
										onToggleFavorite={favorites.toggleFavorite}
									/>
									<CharacterPagination
										currentPage={navigation.params.page}
										onPageChange={navigation.setPage}
										totalPages={query.data.info.pages}
										totalResults={query.data.info.count}
									/>
								</>
							)}
							{query.status === 'empty' && <EmptyState />}
							{isUnavailablePage && (
								<InvalidPageState onReturn={navigation.returnToFirstPage} />
							)}
							{query.status === 'error' && !isUnavailablePage && (
								<ErrorState onRetry={query.retry} />
							)}
						</>
					)}
				</section>
			</main>
		</div>
	);
}
