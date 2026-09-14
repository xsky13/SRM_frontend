
import type { Route } from "./+types/test";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";

export function meta({ }: Route.MetaArgs) {
	return [
		{ title: "Reservas Moreno" },
		{ name: "description", content: "Reserve departamentos para su estadia en Libertador San Martin." },
	];
}

export default function Test() {

	let [tabs, setTabs] = useState([
		{ id: 1, title: 'Tab 1', content: 'Tab body 1' },
		{ id: 2, title: 'Tab 2', content: 'Tab body 2' },
		{ id: 3, title: 'Tab 3', content: 'Tab body 3' }
	]);

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
