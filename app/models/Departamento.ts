import type { Image } from "~/types/images";

export interface DepartamentoData {
	id: string;
	name: string;
	description: string;
	location: string;
	price: number;
	coverImgUrl?: string;
	images: Image[];
}

<<<<<<< HEAD
=======
export type ApartmentCreateInput = {
	name: string;
	description: string;
	price: number;
	location: string;
	images: File[];
	latitude: number;
	longitude: number;
};

export type ApartmentWriteInput = Omit<
	DepartamentoData,
	"id" | "images" | "isDeleted"
>;

>>>>>>> 26650ab4df7b7d50f4334a36ebdc4f5eeb9353e9
export class Departamento {
	public readonly id: string;
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly description: string;
	public readonly coverImgUrl: string;
	public readonly images: Image[];

<<<<<<< HEAD
	constructor({ id, name, location, price, coverImgUrl, images }: DepartamentoData) {
=======
	constructor({
		id,
		name,
		location,
		price,
		coverImgUrl,
		images,
		latitude,
		longitude,
		description
	}: DepartamentoData) {
>>>>>>> 26650ab4df7b7d50f4334a36ebdc4f5eeb9353e9
		this.id = id;
		this.name = name;
		this.location = location;
		this.price = price;
		this.images = images;
		this.coverImgUrl = coverImgUrl ?? images[0]?.url ?? "";
<<<<<<< HEAD
=======
		this.latitude = latitude;
		this.longitude = longitude;
		this.description = description;
>>>>>>> 26650ab4df7b7d50f4334a36ebdc4f5eeb9353e9
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
