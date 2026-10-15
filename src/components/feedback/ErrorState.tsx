interface ErrorStateProps {
	onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
	return (
		<div
			aria-live="assertive"
			className="mx-auto max-w-2xl rounded-ui border border-border bg-surface p-6 text-center shadow-[var(--app-shadow-raised)] sm:p-8"
			role="alert"
		>
			<h2 className="font-display text-xl font-bold">No pudimos cargar los personajes</h2>
			<p className="mt-2 text-muted">Intenta nuevamente</p>
			<button
				className="mt-4 min-h-11 rounded-ui bg-accent px-5 font-bold text-surface transition-colors hover:brightness-95"
				onClick={onRetry}
				type="button"
			>
				Reintentar
			</button>
		</div>
	);
}
