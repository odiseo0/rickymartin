interface FavoriteButtonProps {
	characterId: number;
	characterName: string;
	disabled?: boolean;
	isFavorite: boolean;
	onToggle: (characterId: number) => void;
}

export function FavoriteButton({
	characterId,
	characterName,
	disabled = false,
	isFavorite,
	onToggle,
}: FavoriteButtonProps) {
	const action = isFavorite ? 'Quitar' : 'Agregar';

	return (
		<button
			aria-label={`${action} a ${characterName} ${isFavorite ? 'de' : 'a'} favoritos`}
			aria-pressed={isFavorite}
			className="flex size-10 items-center justify-center rounded-full border-0 bg-surface text-accent shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
			disabled={disabled}
			onClick={() => onToggle(characterId)}
			type="button"
		>
			<svg aria-hidden="true" className="size-6" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24">
				<path
					d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="1.8"
				/>
			</svg>
			<span className="sr-only">{isFavorite ? 'Guardado' : 'Guardar'}</span>
		</button>
	);
}
