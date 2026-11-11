import { useEffect, useState, type ComponentType } from "react";

type ApartmentLocationMapProps = {
	latitude: number;
	longitude: number;
	apartmentName: string;
	location: string;
};

export default function ApartmentLocationMap(props: ApartmentLocationMapProps) {
	const [LeafletMap, setLeafletMap] = useState<ComponentType<ApartmentLocationMapProps>>();
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let isMounted = true;

		import("./LeafletApartmentLocationMap")
			.then(({ default: component }) => {
				if (isMounted) setLeafletMap(() => component);
			})
			.catch((error: unknown) => {
				console.error("No se pudo cargar el mapa del departamento.", error);
				if (isMounted) setLoadError(true);
			});

		return () => {
			isMounted = false;
		};
	}, []);

	if (loadError) {
		return (
			<p role="alert" className="rounded-md bg-[#f5f2ec] px-4 py-6 text-sm text-[#b74f3d]">
				No se pudo cargar el mapa de ubicación.
			</p>
		);
	}

	if (!LeafletMap) {
		return (
			<div
				className="h-80 w-full animate-pulse rounded-md border border-[#e5e7eb] bg-[#f5f2ec]"
				aria-label="Cargando mapa de ubicación"
			/>
		);
	}

	return <LeafletMap {...props} />;
}
