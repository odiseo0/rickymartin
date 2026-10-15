interface InvalidPageStateProps {
	onReturn: () => void;
}

export function InvalidPageState({ onReturn }: InvalidPageStateProps) {
	return (
		<div
			aria-live="assertive"
			className="mx-auto max-w-2xl rounded-ui border border-border bg-surface p-6 text-center shadow-(--app-shadow-raised) sm:p-8"
			role="alert"
		>
			<h2 className="font-display text-xl font-bold">Esta página no está disponible</h2>
			<p className="mt-2 text-muted">Vuelve a la primera página para continuar</p>
			<button
				className="mt-4 min-h-11 rounded-ui bg-accent px-5 font-bold text-surface transition-colors hover:brightness-95"
				onClick={onReturn}
				type="button"
			>
				Volver a la primera página
			</button>
		</div>
	);
}
