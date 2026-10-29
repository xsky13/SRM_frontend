import type { Image } from "~/types/images";

export interface DepartamentoData {
	id: string;
	name: string;
	description: string;
	location: string;
	price: number;
	coverImgUrl?: string;
	images: Image[];
	isDeleted?: boolean;
	latitude?: number;
	longitude?: number;
	[key: string]: unknown;
}

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

export class Departamento {
	public readonly id: string;
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly description: string;
	public readonly coverImgUrl: string;
	public readonly images: Image[];
	public readonly latitude?: number;
	public readonly longitude?: number;

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
		this.id = id;
		this.name = name;
		this.location = location;
		this.price = price;
		this.images = images;
		this.coverImgUrl = coverImgUrl ?? images[0]?.url ?? "";
		this.latitude = latitude;
		this.longitude = longitude;
		this.description = description;
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
