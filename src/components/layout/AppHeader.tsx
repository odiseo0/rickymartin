import type { ReactNode } from 'react';

interface AppHeaderProps {
	currentPage: 'characters' | 'favorites';
	search?: ReactNode;
}

const navigationLinkClass =
	'inline-flex min-h-10 items-center border-b-2 px-2 py-2 text-sm text-foreground no-underline transition-colors';

export function AppHeader({ currentPage, search }: AppHeaderProps) {
	return (
		<header className="bg-header shadow-sm">
			<a
				className="sr-only z-50 rounded-ui bg-accent px-4 py-3 font-bold text-surface no-underline focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
				href="#contenido-principal"
			>
				Saltar al contenido
			</a>
			<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
				<div
					className={
						search
							? 'grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-2 sm:grid-cols-[max-content_minmax(0,1fr)_max-content] sm:gap-x-8'
							: 'flex min-h-16 items-center justify-between gap-4 py-2'
					}
				>
					<a
						className="inline-flex min-w-0 items-center gap-2 rounded-ui font-display text-lg font-bold leading-none tracking-tight text-foreground no-underline"
						href="/"
					>
						<span className="hidden sm:inline">Rick and Morty</span>
					</a>
					{search && <div className="order-3 col-span-full sm:order-0 sm:col-span-1">{search}</div>}
					<nav aria-label="Navegación principal" className="flex items-center gap-2">
						<a
							aria-current={currentPage === 'characters' ? 'page' : undefined}
							className={`${navigationLinkClass} ${
								currentPage === 'characters'
									? 'border-foreground font-bold'
									: 'border-transparent hover:border-foreground'
							}`}
							href="/"
						>
							Personajes
						</a>
						<a
							aria-current={currentPage === 'favorites' ? 'page' : undefined}
							className={`${navigationLinkClass} ${
								currentPage === 'favorites'
									? 'border-foreground font-bold'
									: 'border-transparent hover:border-foreground'
							}`}
							href="/favoritos"
						>
							Favoritos
						</a>
					</nav>
				</div>
			</div>
		</header>
	);
}
