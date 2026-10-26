
import type { Route } from "./+types/test";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Test() {
    const query = useQuery({
        queryKey: ["todos"],
        queryFn: () => api.get("/info"),
        meta: { errorMessage: 'No pudimos cargar las reservas de esta propiedad' },
    });

    useEffect(() => {
        console.log(query.data)
    }, [query])

    if (query.isPending) return 'Loading...'

    if (query.isError) return JSON.stringify(query.error)

	return (
        <>

		</>
	);
}
