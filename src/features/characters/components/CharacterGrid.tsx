import type { Character } from '../types/character.types';
import { CharacterCard } from './CharacterCard';

interface CharacterGridProps {
	characters: Character[];
	favoriteReady: boolean;
	isFavorite: (characterId: number) => boolean;
	onToggleFavorite: (characterId: number) => void;
}

export function CharacterGrid({
	characters,
	favoriteReady,
	isFavorite,
	onToggleFavorite,
}: CharacterGridProps) {
	return (
		<ul
			aria-label="Lista de personajes"
			className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
		>
			{characters.map((character) => (
				<li key={character.id}>
					<CharacterCard
						character={character}
						favoriteReady={favoriteReady}
						isFavorite={isFavorite(character.id)}
						onToggleFavorite={onToggleFavorite}
					/>
				</li>
			))}
		</ul>
	);
}
