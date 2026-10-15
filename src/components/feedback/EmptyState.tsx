export function EmptyState() {
	return (
		<div
			aria-live="polite"
			className="mx-auto max-w-2xl rounded-ui border border-border bg-surface p-6 text-center shadow-[var(--app-shadow-raised)] sm:p-8"
			role="status"
		>
			<h2 className="font-display text-xl font-bold">No encontramos personajes con ese nombre</h2>
			<p className="mt-2 text-muted">Prueba con otro nombre</p>
		</div>
	);
}
