import { Link, useLoaderData } from "react-router";
import { MapPin, Bath, BedDouble, Ruler, ArrowLeft, Sparkles } from "lucide-react";
import type { Route } from "./+types/departamento.$slug";
import { getDepartamentoBySlug } from "~/lib/departamentos";

export async function loader({ params }: Route.LoaderArgs) {
	const departamento = getDepartamentoBySlug(params.slug);

	if (!departamento) {
		throw new Response("Departamento no encontrado", { status: 404 });
	}

	return { departamento };
}

export default function DepartamentoDetallePage() {
	const { departamento } = useLoaderData<typeof loader>();

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
						<div className="overflow-hidden rounded-[28px] border border-[#e0ded5] bg-white shadow-[0_18px_48px_rgba(56,83,71,0.08)]">
							<img
								className="h-[420px] w-full object-cover"
								src={departamento.image}
								alt={departamento.name}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							{departamento.images.map((image, index) => (
								<div key={`${departamento.slug}-image-${index}`} className="overflow-hidden rounded-2xl border border-[#e0ded5] bg-white">
									<img className="h-32 w-full object-cover" src={image} alt={`${departamento.name} vista ${index + 1}`} />
								</div>
							))}
						</div>
					</div>

					<aside className="rounded-[28px] border border-[#e0ded5] bg-[#fffdf9] p-6 shadow-[0_18px_48px_rgba(56,83,71,0.08)]">
						<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e28b68]">Desde</p>
						<div className="mt-3 flex items-end gap-2">
							<h1 className="font-serif text-4xl tracking-[-0.05em] text-[#385347]">{departamento.formattedPrice}</h1>
							<span className="pb-2 text-sm text-[#68716a]">/ día</span>
						</div>

						<div className="mt-6 space-y-4 border-y border-[#ece7df] py-5">
							<div className="flex items-center gap-3 text-[#385347]">
								<BedDouble size={18} className="text-[#e28b68]" />
								<span>{departamento.bedrooms} dormitorios</span>
							</div>
							<div className="flex items-center gap-3 text-[#385347]">
								<Bath size={18} className="text-[#e28b68]" />
								<span>{departamento.bathrooms} baños</span>
							</div>
							<div className="flex items-center gap-3 text-[#385347]">
								<Ruler size={18} className="text-[#e28b68]" />
								<span>{departamento.area} m²</span>
							</div>
						</div>

						<div className="mt-6">
							<button
								type="button"
								className="w-full rounded-full bg-[#385347] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d453d]"
							>
								Crear Reserva
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

					<p className="max-w-3xl text-base leading-7 text-[#4d5b55]">{departamento.description}</p>

					<div className="mt-7 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
						<div>
							<h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#385347]">Ubicación</h3>
							<p className="flex items-start gap-2 text-[#4d5b55]">
								<MapPin size={18} className="mt-0.5 text-[#e28b68]" />
								<span>{departamento.address}</span>
							</p>
						</div>

						<div>
							<h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#385347]">Incluye</h3>
							<ul className="space-y-2 text-[#4d5b55]">
								{departamento.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-[#e28b68]" />
										{feature}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
