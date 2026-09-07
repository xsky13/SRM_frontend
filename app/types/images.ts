export interface ImageData {
	id: string;
	url: string;
	apartmentId: string;
}

export class Image {
	public readonly id: string;
	public readonly url: string;
	public readonly apartmentId: string;

	constructor({ id, url, apartmentId }: ImageData) {
		this.id = id;
		this.url = url;
		this.apartmentId = apartmentId;
	}

	static fromDatabase(data: ImageData): Image {
		return new Image(data);
	}
}
