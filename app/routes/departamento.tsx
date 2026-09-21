import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { Departamento } from "~/models/Departamento";
import type { Reserva } from "~/types/Reserva";
import CalendarioDisponibilidad from "~/components/CalendarioDisponibilidad";
import NavegacionUsuario, { useAuthentication } from "~/components/NavegacionUsuario";
import api from "~/utils/api";
import type { Route } from "./+types/departamento";

export default function DepartamentoDetallePage() {
	const { id } = useParams<Route.ComponentProps["params"]>();
	const [selectedImageId, setSelectedImageId] = useState<string>();
	const [showCalendar, setShowCalendar] = useState(false);
	const authQuery = useAuthentication();

	const query = useQuery<Departamento>({
		queryKey: ["apartment", id],
		queryFn: async () => (await api.get(`/api/apartment/${id}`)).data,
		enabled: Boolean(id),
	});

	const reservationsQuery = useQuery<Reserva[]>({
		queryKey: ["reservations", id],
		queryFn: async () => {
			const { data } = await api.get(`/api/reservation/apartment/${id}`);
			return Array.isArray(data) ? data : data.reservations ?? [];
		},
		enabled: Boolean(id),
		meta: { errorMessage: "No pudimos cargar la disponibilidad de este departamento" },
  });

	const departamento = query.data;

	if (query.isPending) {
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Cargando...</main>;
	}

	if (!departamento) {
		return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">Departamento no encontrado.</main>;
	}

	const formattedPrice = `$${departamento.price.toLocaleString("es-AR")}`;
	const images = departamento.images ?? [];
	const galleryImages =
		images.length > 0
			? images
			: [{ id: "cover", url: departamento.coverImgUrl, apartmentId: departamento.id }];

	const selectedImage =
		galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0];

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
				<div className="flex items-center gap-3">
					<Link
						className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]"
						to="/"
					>
						reservas<span className="text-[#e28b68]">moreno</span>
					</Link>
				</div>

				<div className="flex items-center gap-4 text-sm text-[#385347]">
					<Link to="/" className="ui-link">
						Legal
					</Link>
					<NavegacionUsuario />
				</div>
			</header>

      <section className="mx-auto max-w-7xl px-5 pb-8 md:px-8 mt-14">
        <div className="pb-4">
				<Link
					className="ui-button px-3 py-1.5 text-xs uppercase tracking-[0.12em]"
					to="/"
				>
					Volver al listado
				</Link>
			</div>
				<div className="grid items-start gap-16 lg:grid-cols-[0.95fr_1.35fr]">
					<div className="flex flex-col justify-center">
						<h1 className="font-serif text-5xl tracking-[-0.05em] text-[#202722] md:text-6xl">
							{departamento.name} en {departamento.location}
						</h1>

						{/* <p className="mt-4 max-w-md text-base leading-7 text-[#4d5b55]">
							Lorem ipsum{departamento.descrip}
						</p> */}

						<div className="mt-8 rounded-[.8rem] border border-dashed border-[#c8c2b8] bg-[#f5f2ec] p-5">
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e28b68]">Desde</p>
							<div className="mt-3 flex items-end gap-2">
								<span className="font-serif text-5xl tracking-[-0.05em] text-[#385347]">
									{formattedPrice}
								</span>
								<span className="pb-2 text-sm text-[#68716a]">la estadía por día</span>
							</div>
						</div>

						<div className="mt-6">
							<button
								type="button"
								onClick={() => setShowCalendar(true)}
								className="ui-button ui-button-md ui-button-block bg-primary text-primary-foreground"
							>
								Reservar departamento
							</button>
						</div>
					</div>

					<div className="space-y-4">

						<div className="ui-border rounded-md bg-[#fffdf9] p-3">
							<div className="ui-border overflow-hidden rounded-md bg-[#ede9dc]">
								<img
									className="h-[400px] w-full object-cover"
									src={departamento.coverImgUrl}
									alt={`${departamento.name}, imagen de portada`}
								/>
							</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
							{galleryImages.slice(0, 3).map((image, index) => (
								<button
									key={image.id}
									type="button"
									onClick={() => setSelectedImageId(image.id)}
									className={`aspect-[4/3] overflow-hidden rounded-md border-2 bg-[#ede9dc] transition ${
										selectedImage.id === image.id ? "border-[#e28b68]" : "border-transparent"
									}`}
									aria-label={`Mostrar imagen ${index + 1} de ${departamento.name}`}
								>
									<img
										className="h-full w-full object-cover"
										src={image.url}
										alt={`${departamento.name}, vista ${index + 1}`}
									/>
								</button>
							))}
						</div>
					</div>
				</div>
			</section>

			{showCalendar && (
				<CalendarioDisponibilidad
					reservas={reservationsQuery.data ?? []}
					pricePerDay={departamento.price}
					apartmentId={departamento.id}
					isAuthenticated={authQuery.data === true}
					onClose={() => setShowCalendar(false)}
				/>
			)}
		</main>
	);
}
