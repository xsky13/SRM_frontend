export interface DepartamentoData {
	name: string;
	location: string;
	price: number;
	coverImgUrl: string;
}

export class Departamento {
	public readonly name: string;
	public readonly location: string;
	public readonly price: number;
	public readonly coverImgUrl: string;

	constructor({ name, location, price, coverImgUrl }: DepartamentoData) {
		this.name = name;
		this.location = location;
		this.price = price;
		this.coverImgUrl = coverImgUrl;
	}

	static fromDatabase(data: DepartamentoData): Departamento {
		return new Departamento(data);
	}

	get formattedPrice(): string {
		return `$${this.price.toLocaleString("es-AR")}`;
	}
}
