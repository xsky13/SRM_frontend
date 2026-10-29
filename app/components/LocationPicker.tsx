import { useEffect, useState, type ComponentType } from "react";

export type Coordinates = {
	latitude: number;
	longitude: number;
};

type LocationPickerProps = {
	onChange: (coordinates: Coordinates) => void;
	initialPosition?: Coordinates;
};

export function LocationPicker(props: LocationPickerProps) {
	const [LeafletPicker, setLeafletPicker] = useState<ComponentType<LocationPickerProps>>();
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let isMounted = true;

		import("./LeafletLocationPicker")
			.then(({ default: component }) => {
				if (isMounted) setLeafletPicker(() => component);
			})
			.catch((error: unknown) => {
				console.error("No se pudo cargar el selector de ubicación.", error);
				if (isMounted) setLoadError(true);
			});

		return () => {
			isMounted = false;
		};
	}, []);

	if (loadError) {
		return (
			<p role="alert" className="text-sm text-[#b74f3d]">
				No se pudo cargar el mapa. Actualizá la página para volver a intentarlo.
			</p>
		);
	}

	if (!LeafletPicker) {
		return <p className="text-sm text-[#68716a]">Cargando el mapa...</p>;
	}

	return <LeafletPicker {...props} />;
}
