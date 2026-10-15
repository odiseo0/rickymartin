interface CharacterPaginationProps {
	currentPage: number;
	onPageChange: (page: number) => void;
	totalPages: number;
	totalResults: number;
}

export function CharacterPagination({
	currentPage,
	onPageChange,
	totalPages,
	totalResults,
}: CharacterPaginationProps) {
	const resultLabel = totalResults === 1 ? '1 personaje' : `${totalResults} personajes`;

	return (
		<nav
			aria-label="Paginación de personajes"
			className="mt-8 flex flex-col gap-4 rounded-ui bg-surface p-4 shadow-(--app-shadow-raised) sm:flex-row sm:items-center sm:justify-between sm:p-5"
		>
			<div aria-live="polite" className="text-sm">
				<p className="font-bold">
					Página {currentPage} de {totalPages}
				</p>
				<p className="text-muted">{resultLabel}</p>
			</div>

			<div className="grid grid-cols-2 gap-2 sm:min-w-64">
				<button
					className="min-h-11 rounded-ui border border-transparent bg-surface px-4 font-bold text-accent transition-colors hover:bg-background disabled:cursor-not-allowed disabled:text-muted"
					disabled={currentPage <= 1}
					onClick={() => onPageChange(currentPage - 1)}
					type="button"
				>
					Anterior
				</button>
				<button
					className="min-h-11 rounded-ui border border-transparent bg-surface px-4 font-bold text-accent transition-colors hover:bg-background disabled:cursor-not-allowed disabled:text-muted"
					disabled={currentPage >= totalPages}
					onClick={() => onPageChange(currentPage + 1)}
					type="button"
				>
					Siguiente
				</button>
			</div>
		</nav>
	);
}
