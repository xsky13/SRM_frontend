import { MapPin } from "lucide-react";
import type { Departamento } from "~/models/Departamento";

interface DepartamentoCardProps {
	departamento: Departamento;
}

export default function TarjetaDepartamento(props: DepartamentoCardProps) {
	const { departamento } = props;

	return (
		<article className="overflow-hidden rounded border border-[#e0ded5] bg-[#fffdf9] transition duration-300 hover:-translate-y-1 hover:shadow-xl">
			<div className="relative h-60 overflow-hidden bg-[#ede9dc]">
				<img
					className="h-full w-full object-cover transition duration-500 hover:scale-105"
					src={departamento.image}
					alt={`Interior de ${departamento.name}`}
				/>
			</div>
			<div className="p-4">
				<h3 className="font-serif text-2xl font-normal text-[#385347]">{departamento.name}</h3>
				<p className="my-3 flex items-center gap-1 text-xs text-[#68716a]">
					<MapPin size={14} /> {departamento.location}
				</p>
				<div className="flex items-center justify-between gap-2 border-t border-[#e6e3db] pt-4">
					<p className="text-[#385347]">
						<strong className="text-lg">{departamento.formattedPrice}</strong>
						<small className="text-[11px] text-[#68716a]"></small>
					</p>
					<button className="border-b border-[#e28b68] py-1 text-xs font-bold text-[#385347]" type="button">
						Ver departamento
					</button>
				</div>
			</div>
		</article>
	);
}
