import type { Image } from "~/types/images";

export interface DepartamentoData {
	id: string;
	name: string;
	location: string;
	price: number;
	coverImgUrl?: string;
	images: Image[];
}

export class Departamento {
	public readonly id: string;
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly coverImgUrl: string;
	public readonly images: Image[];

	constructor({ id, name, location, price, coverImgUrl, images }: DepartamentoData) {
		this.id = id;
		this.name = name;
		this.location = location;
		this.price = price;
		this.images = images;
		this.coverImgUrl = coverImgUrl ?? images[0]?.url ?? "";
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
