import { useState } from "react";
import { Link, useParams } from "react-router";
import { MapPin, ArrowLeft, Sparkles } from "lucide-react";
import type { Route } from "./+types/departamento.$slug";
import { useQuery } from "@tanstack/react-query";
import type { Departamento } from "~/models/Departamento";
import CalendarioDisponibilidad from "~/components/CalendarioDisponibilidad";
import type { Reserva } from "~/types/Reserva";
import api from "~/utils/api";

export default function DepartamentoDetallePage() {
	const { id } = useParams<Route.ComponentProps["params"]>();
	const [selectedImageId, setSelectedImageId] = useState<string>();
	const [showCalendar, setShowCalendar] = useState(false);
	const query = useQuery<Departamento>({
		queryKey: ["apartment", id],
		queryFn: async () => (await api.get(`/api/apartment/${id}`)).data,
		enabled: Boolean(id),
	});
	const reservationsQuery = useQuery<Reserva[]>({
		queryKey: ["reservations", id],
		queryFn: async () => {
			const { data } = await api.get(`/api/apartment/${id}`);
			return Array.isArray(data) ? data : data.reservations ?? [];
		},
		enabled: Boolean(id),
		meta: { errorMessage: "No pudimos cargar la disponibilidad de este departamento" },
	});
	const departamento = query.data;

	if (query.isPending) return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Cargando...</main>;
	if (!departamento) return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Departamento no encontrado.</main>;

	const formattedPrice = `$${departamento.price.toLocaleString("es-AR")}`;
	const images = departamento.images ?? [];
	const galleryImages = images.length > 0
		? images
		: [{ id: "cover", url: departamento.coverImgUrl, apartmentId: departamento.id }];
	const selectedImage = galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0];

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
				<Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">
					reservas<span className="text-[#e28b68]">moreno</span>
				</Link>
				<Link
					to="/"
					className="inline-flex items-center gap-2 rounded-full border border-[#d3d0c6] bg-white px-4 py-2 text-sm text-[#385347] shadow-sm"
				>
					<ArrowLeft size={16} />
					Volver
				</Link>
			</header>

			<section className="mx-auto max-w-7xl px-5 pb-8 md:px-8">
				<div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#6a726a]">
					<MapPin size={14} />
					{departamento.location}
				</div>

				<div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
					<div className="space-y-6">
						<div className="aspect-[4/3] overflow-hidden rounded-[28px] border border-[#e0ded5] bg-[#ede9dc] shadow-[0_18px_48px_rgba(56,83,71,0.08)] md:aspect-[16/10]">
							<img
								className="h-full w-full object-cover"
								src={selectedImage.url}
								alt={`${departamento.name}, imagen principal`}
							/>
						</div>

						<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
							{galleryImages.map((image, index) => (
								<button
									key={image.id}
									type="button"
									onClick={() => setSelectedImageId(image.id)}
									className={`aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-[#ede9dc] transition hover:-translate-y-0.5 hover:shadow-md ${
										selectedImage.id === image.id ? "border-[#e28b68]" : "border-transparent"
									}`}
									aria-label={`Mostrar imagen ${index + 1} de ${departamento.name}`}
								>
									<img className="h-full w-full object-cover" src={image.url} alt={`${departamento.name}, vista ${index + 1}`} />
								</button>
							))}
						</div>

					</div>

					<aside className="rounded-[28px] border border-[#e0ded5] bg-[#fffdf9] p-6 shadow-[0_18px_48px_rgba(56,83,71,0.08)]">
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e28b68]">Desde</p>
						<div className="mt-3 flex items-end gap-2">
							<h1 className="font-serif text-4xl tracking-[-0.05em] text-[#385347]">{formattedPrice}</h1>
							<span className="pb-2 text-sm text-[#68716a]">/ día</span>
						</div>

						<div className="mt-6">
							<button
								type="button"
								onClick={() => setShowCalendar(true)}
								className="w-full rounded-full bg-[#385347] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d453d]"
							>
								Reservar Departamento
							</button>
						</div>
					</aside>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-5 pb-14 md:px-8">
				<div className="rounded-[28px] border border-[#e0ded5] bg-white p-6 md:p-8">
					<div className="mb-5 flex items-center gap-2 text-[#385347]">
						<Sparkles size={18} className="text-[#e28b68]" />
						<h2 className="font-serif text-3xl tracking-[-0.05em]">{departamento.name}</h2>
					</div>

					<p className="max-w-3xl text-base leading-7 text-[#4d5b55]">
						Ubicado en {departamento.location}, este departamento está disponible para tu estadía.
					</p>
				</div>
			</section>

			{showCalendar && (
				<CalendarioDisponibilidad
					reservas={reservationsQuery.data ?? []}
					pricePerDay={departamento.price}
					onClose={() => setShowCalendar(false)}
				/>
			)}
		</main>
	);
}
