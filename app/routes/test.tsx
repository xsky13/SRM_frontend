
import type { Route } from "./+types/test";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "~/utils/api";
import { QueryErrorState, Skeleton } from "~/components/LoadingFeedback";

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

    if (query.isPending) {
        return (
            <main className="min-h-screen bg-[#f6f4ee] p-8">
                <div role="status" aria-label="Cargando información" className="mx-auto max-w-3xl space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </main>
        );
    }

    if (query.isError) {
        return (
            <main className="min-h-screen bg-[#f6f4ee] p-8">
                <div className="mx-auto max-w-xl">
                    <QueryErrorState
                        message="No pudimos cargar la información de prueba."
                        onRetry={() => void query.refetch()}
                    />
                </div>
            </main>
        );
    }

	return (
        <>

		</>
	);
}
