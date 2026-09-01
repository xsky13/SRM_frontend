export interface DepartamentoData {
	name: string;
	location: string;
	price: number;
	image: string;
	images?: string[];
	description?: string;
	address?: string;
	bedrooms?: number;
	bathrooms?: number;
	area?: number;
	features?: string[];
}

export class Departamento {
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly image: string;
	public readonly images: string[];
	public readonly description: string;
	public readonly address: string;
	public readonly bedrooms: number;
	public readonly bathrooms: number;
	public readonly area: number;
	public readonly features: string[];

	constructor({
		name,
		location,
		price,
		image,
		images = [image],
		description = "",
		address = "",
		bedrooms = 0,
		bathrooms = 0,
		area = 0,
		features = [],
	}: DepartamentoData) {
		this.name = name;
		this.location = location;
		this.price = price;
		this.image = image;
		this.images = images.length ? images : [image];
		this.description = description;
		this.address = address;
		this.bedrooms = bedrooms;
		this.bathrooms = bathrooms;
		this.area = area;
		this.features = features;
	}

	static fromDatabase(data: DepartamentoData): Departamento {
		return new Departamento(data);
	}

	get slug(): string {
		return this.name
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	}

	get formattedPrice(): string {
		return `$${this.price.toLocaleString("es-AR")}`;
	}
}
