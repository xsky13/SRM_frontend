
import type { Route } from "./+types/test";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingState from "~/components/LoadingState";
import api from "~/utils/api";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Prueba | Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Test() {
    const query = useQuery({
        queryKey: ["todos"],
        queryFn: () => api.get("/info"),
        meta: { errorMessage: 'No pudimos cargar las reservas de esta propiedad' },
    });

    if (query.isPending) return <LoadingState label="Cargando..." />;

    if (query.isError) return JSON.stringify(query.error)

	return (
        <>

		</>
	);
}
