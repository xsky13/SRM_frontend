import type { Route } from "./+types/home";
import TarjetaDepartamento from "~/components/DepartamentoCard";
// import { List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";
import type { Departamento } from "~/models/Departamento";
import { QueryErrorState, Skeleton } from "~/components/LoadingFeedback";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Home() {

const query = useQuery<Departamento[]>({
    queryKey: ["apartments"],
    queryFn: async () =>
      await api.get("/api/apartment").then((res) => res.data),
  });
	return (
		<main className="min-h-screen bg-[#f6f4ee] font-sans text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
    <a className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" href="/">
        reservas<span className="text-[#e28b68]">moreno</span>
    </a>

    <div className="flex items-center gap-4 text-sm text-[#385347]">
		<a href="/" className="ui-link">
            Legal
        </a>
		<a href="/" className="ui-link">
            Crear cuenta
        </a>
        <button
            type="button"
			className="ui-button ui-button-sm"
        >
            Iniciar sesión
        </button>
    </div>
</header>
			<section className="relative overflow-hidden bg-gradient-to-br from-[#dbe1d2] via-[#e4e7db] to-[#f0dbc7] px-5 py-16 md:px-8 md:py-24"><div className="relative z-10 mx-auto max-w-7xl"><div className="max-w-2xl"><p className="mb-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">Tu próxima estadía empieza acá</p><h1 className="font-serif text-[clamp(42px,5vw,70px)] font-normal leading-[.99] tracking-[-.045em] text-[#385347]">Encontrá tu lugar en <em className="text-[#e28b68]">Libertador.</em></h1><p className="mt-6 text-base text-[#58675c] md:text-lg">Departamentos cómodos, equipados y listos para recibirte.</p></div></div></section>
			<section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20" id="departamentos">
				<div className="mb-8">
					<p className="mb-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#385347]">La colección Moreno</p>
					<h2 className="font-serif text-[32px] font-normal tracking-[-.035em] text-[#385347] md:text-[40px]">Todos los departamentos</h2>
					<p className="mt-2 text-sm text-[#68716a]">
						{query.isSuccess ? `${query.data.length} espacios disponibles para tu estadía` : "Espacios disponibles para tu estadía"}
					</p>
				</div>
				{query.isPending ? (
					<div role="status" aria-label="Cargando departamentos" className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
						{Array.from({ length: 6 }, (_, index) => (
							<article key={index} aria-hidden="true" className="overflow-hidden rounded-md border border-[#e0ded5] bg-[#fffdf9]">
								<Skeleton className="h-60 rounded-none" />
								<div className="space-y-4 p-4">
									<Skeleton className="h-7 w-3/5" />
									<Skeleton className="h-4 w-2/5" />
									<div className="flex items-center justify-between border-t border-[#e6e3db] pt-4">
										<Skeleton className="h-6 w-1/3" />
										<Skeleton className="h-5 w-1/3" />
									</div>
								</div>
							</article>
						))}
					</div>
				) : query.isError ? (
					<QueryErrorState
						message="No se pudo cargar el catálogo de departamentos."
						onRetry={() => void query.refetch()}
					/>
				) : (
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
						{query.data.map((apartment) => <TarjetaDepartamento departamento={apartment} key={apartment.name} />)}
					</div>
				)}
			</section>
		</main>
	);
}
