import { useState } from 'react';
import { FavoriteButton } from '../../favorites/components/FavoriteButton';
import type { Character } from '../types/character.types';

interface CharacterCardProps {
	character: Character;
	favoriteReady: boolean;
	isFavorite: boolean;
	onToggleFavorite: (characterId: number) => void;
}

const statusLabels: Record<Character['status'], string> = {
	Alive: 'Vivo',
	Dead: 'Muerto',
	unknown: 'Desconocido',
};

export function CharacterCard({
	character,
	favoriteReady,
	isFavorite,
	onToggleFavorite,
}: CharacterCardProps) {
	const [imageAvailable, setImageAvailable] = useState(true);

	return (
		<article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-ui bg-surface shadow-(--app-shadow-raised) transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg motion-reduce:hover:translate-y-0">
			<div className="relative aspect-square bg-background">
				{imageAvailable ? (
					<img
						alt={`Retrato de ${character.name}`}
						className="h-full w-full object-cover"
						height="300"
						loading="lazy"
						onError={() => setImageAvailable(false)}
						src={character.image}
						width="300"
					/>
				) : (
					<div
						aria-label={`Imagen no disponible para ${character.name}`}
						className="flex h-full items-center justify-center p-4 text-center font-bold text-muted"
						role="img"
					>
						Imagen no disponible
					</div>
				)}
				<div className="absolute right-3 top-3">
					<FavoriteButton
						characterId={character.id}
						characterName={character.name}
						disabled={!favoriteReady}
						isFavorite={isFavorite}
						onToggle={onToggleFavorite}
					/>
				</div>
			</div>

			<div className="flex min-w-0 flex-1 flex-col items-start gap-2 border-t border-border p-4">
				<h2 className="wrap-break-word font-display text-lg font-normal leading-tight">
					{character.name}
				</h2>
				<p className="text-sm text-muted">
					{character.species} · {statusLabels[character.status]}
				</p>
				<p className="wrap-break-word text-sm leading-5 text-muted">
					<span className="text-foreground">Última ubicación:</span> {character.location}
				</p>
			</div>
		</article>
	);
}
