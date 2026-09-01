export interface DepartamentoData {
	name: string;
	location: string;
	price: number;
	image: string;
}

export class Departamento {
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly image: string;

	constructor({ name, location, price, image }: DepartamentoData) {
		this.name = name;
		this.location = location;
		this.price = price;
		this.image = image;
	}

	static fromDatabase(data: DepartamentoData): Departamento {
		return new Departamento(data);
	}

	get formattedPrice(): string {
		return `$${this.price.toLocaleString("es-AR")}`;
	}
}
