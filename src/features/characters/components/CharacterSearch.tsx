import type { ChangeEvent } from 'react';

interface CharacterSearchProps {
	value: string;
	onChange: (value: string) => void;
}

const SEARCH_HELP_ID = 'character-search-help';

export function CharacterSearch({ value, onChange }: CharacterSearchProps) {
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value);
	};

	return (
		<div aria-label="Buscar personajes" className="w-full" role="search">
			<label className="sr-only" htmlFor="character-search">
				Buscar personajes
			</label>
			<div className="relative">
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						d="m21 21-4.35-4.35m2.35-5.15A7.5 7.5 0 1 1 4 11.5a7.5 7.5 0 0 1 15 0Z"
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth="2"
					/>
				</svg>
				<input
					aria-describedby={SEARCH_HELP_ID}
					autoComplete="off"
					className="min-h-10 w-full rounded-sm border-0 bg-surface py-2 pl-4 pr-12 text-foreground shadow-md placeholder:text-muted"
					id="character-search"
					onChange={handleChange}
					placeholder="Buscar personajes"
					type="search"
					value={value}
				/>
			</div>
			<p className="sr-only" id={SEARCH_HELP_ID}>
				Los resultados se actualizan al dejar de escribir
			</p>
		</div>
	);
}
