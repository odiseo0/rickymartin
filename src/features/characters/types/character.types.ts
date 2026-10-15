export type CharacterStatus = 'Alive' | 'Dead' | 'unknown';

export type CharacterGender = 'Female' | 'Male' | 'Genderless' | 'unknown';

export interface ApiResourceReference {
	name: string;
	url: string;
}

export interface ApiCharacter {
	id: number;
	name: string;
	status: CharacterStatus;
	species: string;
	type: string;
	gender: CharacterGender;
	origin: ApiResourceReference;
	location: ApiResourceReference;
	image: string;
	episode: string[];
	url: string;
	created: string;
}

export interface ApiPageInfo {
	count: number;
	pages: number;
	next: string | null;
	prev: string | null;
}

export interface ApiCharacterPageResponse {
	info: ApiPageInfo;
	results: ApiCharacter[];
}

export interface Character {
	id: number;
	name: string;
	status: CharacterStatus;
	species: string;
	gender: CharacterGender;
	origin: string;
	location: string;
	image: string;
}

export interface CharacterPage {
	info: ApiPageInfo;
	results: Character[];
}

export interface CharacterSearchParams {
	name: string;
	page: number;
}
