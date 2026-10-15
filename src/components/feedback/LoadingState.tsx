const SKELETON_COUNT = 8;

interface LoadingStateProps {
	message?: string;
}

export function LoadingState({ message = 'Cargando personajes' }: LoadingStateProps) {
	return (
		<div aria-busy="true" aria-live="polite" role="status">
			<span className="sr-only">{message}</span>
			<div
				aria-hidden="true"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
			>
				{Array.from({ length: SKELETON_COUNT }, (_, index) => (
					<div
						className="overflow-hidden rounded-ui bg-surface shadow-[var(--app-shadow-raised)]"
						key={index}
					>
						<div className="aspect-square animate-pulse bg-border" />
						<div className="space-y-3 border-t border-border p-4">
							<div className="h-5 w-3/4 animate-pulse rounded-ui bg-background" />
							<div className="h-4 w-1/2 animate-pulse rounded-ui bg-background" />
							<div className="h-4 w-2/3 animate-pulse rounded-ui bg-background" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
