import { Departamento } from "~/models/Departamento";

export const departamentos = [
	new Departamento({
		name: "Limonero",
		location: "Libertador San Martín",
		price: 42000,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Departamento luminoso y moderno en una zona tranquila, ideal para viajes de trabajo o estadías largas con estilo y comodidad.",
		address: "Av. San Martín 1234, Libertador San Martín",
		bedrooms: 2,
		bathrooms: 1,
		area: 56,
		features: ["Cocina equipada", "Wi‑Fi", "Aire acondicionado", "Lavarropas"],
	}),
	new Departamento({
		name: "La Estación",
		location: "A 3 cuadras del centro",
		price: 28500,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Ambiente cálido con buen acceso al centro, perfecto para quienes buscan practicidad, confort y una ubicación muy conveniente.",
		address: "Calle Belgrano 987, centro",
		bedrooms: 1,
		bathrooms: 1,
		area: 42,
		features: ["Estacionamiento", "Gimnasio", "Seguridad", "Terraza"],
	}),
	new Departamento({
		name: "El Jacarandá",
		location: "Barrio Norte",
		price: 58000,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Espacio premium con diseño cuidado, detalles modernos y una excelente vista para disfrutar de una estadía relajada.",
		address: "Bv. San Lorenzo 234, Barrio Norte",
		bedrooms: 3,
		bathrooms: 2,
		area: 75,
		features: ["Pileta", "Cochera", "Vista panorámica", "Limpieza incluida"],
	}),
	new Departamento({
		name: "Patio Verde",
		location: "Zona residencial",
		price: 39000,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Ideal para familias o viajes prolongados, con un patio de uso compartido y una propuesta muy tranquila en una zona residencial.",
		address: "Calle Italia 145, zona residencial",
		bedrooms: 2,
		bathrooms: 2,
		area: 61,
		features: ["Patio", "Jardín", "Cocina completa", "Internet"],
	}),
	new Departamento({
		name: "El Mirador",
		location: "Vista al parque",
		price: 46000,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Departamento con muy buena luz natural y vistas destacadas, pensado para quienes valoran una experiencia más premium.",
		address: "Los Álamos 896, vista al parque",
		bedrooms: 2,
		bathrooms: 2,
		area: 68,
		features: ["Vista al parque", "Balcón", "Aire acondicionado", "Seguridad 24hs"],
	}),
	new Departamento({
		name: "Los Tilos",
		location: "Cerca de la universidad",
		price: 30000,
		image: "/fuap.jpg",
		images: [
			"/fuap.jpg",
			"/fuap.jpg",
			"/fuap.jpg",
		],
		description:
			"Opción práctica y moderna para estudiantes o viajeros, con acceso sencillo a servicios y transporte cercano.",
		address: "Ruta 14 y Av. Universidad, cerca del centro",
		bedrooms: 1,
		bathrooms: 1,
		area: 39,
		features: ["Transporte cercano", "Wifi", "Limpieza", "Balcón"],
	}),
];

export function getDepartamentoBySlug(slug: string | undefined): Departamento | undefined {
	if (!slug) return undefined;
	return departamentos.find((departamento) => departamento.slug === slug);
}
