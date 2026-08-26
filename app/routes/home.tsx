import type { Route } from "./+types/home";
import { MapPin, BedDouble, Users, Star } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Home() {
	const apartments = [
		{ name: "Limonero", location: "Libertador San Martín", beds: 2, guests: 4, price: 42000, rating: "4.9", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85" },
		{ name: "La Estación", location: "A 3 cuadras del centro", beds: 1, guests: 2, price: 28500, rating: "4.8", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85" },
		{ name: "El Jacarandá", location: "Barrio Norte", beds: 3, guests: 6, price: 58000, rating: "5.0", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85" },
		{ name: "Patio Verde", location: "Zona residencial", beds: 2, guests: 4, price: 39000, rating: "4.7", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85" },
		{ name: "El Mirador", location: "Vista al parque", beds: 2, guests: 3, price: 46000, rating: "4.9", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85" },
		{ name: "Los Tilos", location: "Cerca de la universidad", beds: 1, guests: 2, price: 30000, rating: "4.6", image: "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85" },
	];

	return (
		<main className="min-h-screen bg-[#f6f4ee] font-sans text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8"><a className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" href="/">reservas<span className="text-[#e28b68]">moreno</span></a><nav className="flex items-center gap-4 md:gap-8"><a className="hidden text-sm text-[#202722] md:inline" href="#departamentos">Departamentos</a><a className="hidden text-sm text-[#202722] md:inline" href="#ayuda">Ayuda</a><button className="rounded border border-[#bfc5b9] bg-transparent px-3 py-2 text-sm" type="button">Iniciar sesión</button></nav></header>
			<section className="relative overflow-hidden bg-gradient-to-br from-[#dbe1d2] via-[#e4e7db] to-[#f0dbc7] px-5 py-16 md:px-8 md:py-24"><div className="relative z-10 mx-auto max-w-7xl"><div className="max-w-2xl"><p className="mb-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Tu próxima estadía empieza acá</p><h1 className="font-serif text-[clamp(42px,5vw,70px)] font-normal leading-[.99] tracking-[-.045em] text-[#385347]">Encontrá tu lugar en <em className="text-[#e28b68]">Libertador.</em></h1><p className="mt-6 text-base text-[#58675c] md:text-lg">Departamentos cómodos, equipados y listos para recibirte.</p></div></div></section>
			<section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20" id="departamentos"><div className="mb-8"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">La colección Moreno</p><h2 className="font-serif text-[32px] font-normal tracking-[-.035em] text-[#385347] md:text-[40px]">Todos los departamentos</h2><p className="mt-2 text-sm text-[#68716a]">{apartments.length} espacios disponibles para tu estadía</p></div><div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">{apartments.map((apartment) => <article className="overflow-hidden rounded border border-[#e0ded5] bg-[#fffdf9] transition duration-300 hover:-translate-y-1 hover:shadow-xl" key={apartment.name}><div className="relative h-60 overflow-hidden bg-[#ede9dc]"><img className="h-full w-full object-cover transition duration-500 hover:scale-105" src={apartment.image} alt={`Interior de ${apartment.name}`} /></div><div className="p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-serif text-2xl font-normal text-[#385347]">{apartment.name}</h3><span className="flex items-center gap-1 text-xs text-[#bd7b4e]"><Star size={14} fill="currentColor" /> {apartment.rating}</span></div><p className="my-2 flex items-center gap-1 text-xs text-[#68716a]"><MapPin size={14} /> {apartment.location}</p><div className="flex gap-4 border-t border-[#e6e3db] pt-3 text-xs text-[#68716a]"><span className="flex items-center gap-1"><BedDouble size={15} /> {apartment.beds} {apartment.beds === 1 ? "dormitorio" : "dormitorios"}</span><span className="flex items-center gap-1"><Users size={15} /> Hasta {apartment.guests}</span></div><div className="mt-5 flex items-center justify-between gap-2"><p className="text-[#385347]"><strong className="text-lg">${apartment.price.toLocaleString("es-AR")}</strong> <small className="text-[11px] text-[#68716a]">/ noche</small></p><button className="border-b border-[#e28b68] py-1 text-xs font-bold text-[#385347]" type="button">Ver departamento</button></div></div></article>)}</div></section>
		</main>
	);
}
