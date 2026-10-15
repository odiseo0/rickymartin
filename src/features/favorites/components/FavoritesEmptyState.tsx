export function FavoritesEmptyState() {
	return (
		<div
			aria-live="polite"
			className="mx-auto max-w-2xl rounded-ui border border-border bg-surface p-6 text-center shadow-(--app-shadow-raised) sm:p-8"
			role="status"
		>
			<h2 className="font-display text-xl font-bold">Aún no guardaste personajes</h2>
			<p className="mt-2 text-muted">Guarda personajes para encontrarlos aquí.</p>
			<a
				className="mt-4 inline-flex min-h-11 items-center rounded-ui bg-accent px-5 font-bold text-surface no-underline transition-colors hover:brightness-95"
				href="/"
			>
				Explorar personajes
			</a>
		</div>
	);
}
