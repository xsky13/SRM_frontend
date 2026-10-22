/// <reference types="google.maps" />

import { useEffect, useRef, useState } from "react";
import {
	APIProvider,
	Map,
	Marker,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { MapMouseEvent as GoogleMapMouseEvent } from "@vis.gl/react-google-maps";

export type SelectedLocation = {
	location: string;
	latitude: string;
	longitude: string;
};

type LocationPickerProps = {
	location: string;
	latitude: string;
	longitude: string;
	onLocationChange: (selectedLocation: SelectedLocation) => void;
};

const initialMapCenter = { lat: -32.4, lng: -60.5 };

function InteractiveMap({
	latitude,
	longitude,
	onLocationChange,
}: LocationPickerProps) {
	const places = useMapsLibrary("places");
	const geocoding = useMapsLibrary("geocoding");
	const map = useMap();
	const autocompleteContainer = useRef<HTMLDivElement>(null);
	const onLocationChangeRef = useRef(onLocationChange);
	const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);
	const [error, setError] = useState("");

	onLocationChangeRef.current = onLocationChange;

	useEffect(() => {
		const lat = Number(latitude);
		const lng = Number(longitude);
		if (latitude.trim() && longitude.trim() && Number.isFinite(lat) && Number.isFinite(lng)) {
			setSelectedPosition({ lat, lng });
		}
	}, [latitude, longitude]);

	useEffect(() => {
		if (map && selectedPosition) map.panTo(selectedPosition);
	}, [map, selectedPosition]);

	useEffect(() => {
		if (!places || !autocompleteContainer.current) return;

		const autocomplete = new places.PlaceAutocompleteElement({
			requestedLanguage: "es",
			requestedRegion: "AR",
			placeholder: "Buscá una dirección",
		});
		autocomplete.style.width = "100%";

		const handleSelection = async (event: google.maps.places.PlacePredictionSelectEvent) => {
			try {
				const place = event.placePrediction.toPlace();
				await place.fetchFields({ fields: ["formattedAddress", "location"] });
				const address = place.formattedAddress;
				const coordinates = place.location?.toJSON();
				if (!address || !coordinates) {
					setError("No se pudo obtener la dirección y las coordenadas del lugar seleccionado.");
					return;
				}

				setError("");
				setSelectedPosition(coordinates);
				onLocationChangeRef.current({
					location: address,
					latitude: String(coordinates.lat),
					longitude: String(coordinates.lng),
				});
			} catch (selectionError) {
				setError(
					selectionError instanceof Error
						? selectionError.message
						: "No se pudo obtener el lugar seleccionado.",
				);
			}
		};

		autocomplete.addEventListener("gmp-select", handleSelection);
		autocompleteContainer.current.replaceChildren(autocomplete);

		return () => {
			autocomplete.removeEventListener("gmp-select", handleSelection);
			autocomplete.remove();
		};
	}, [places]);

	async function handleMapClick(event: GoogleMapMouseEvent) {
		const coordinates = event.detail.latLng;
		if (!coordinates) return;
		if (!geocoding) {
			setError("El servicio de búsqueda de direcciones todavía está cargando.");
			return;
		}

		const previousPosition = selectedPosition;
		setSelectedPosition(coordinates);
		setError("");

		try {
			const response = await new geocoding.Geocoder().geocode({ location: coordinates });
			const address = response.results[0]?.formatted_address;
			if (!address) {
				setSelectedPosition(previousPosition);
				setError("No se encontró una dirección para el punto seleccionado.");
				return;
			}

			onLocationChangeRef.current({
				location: address,
				latitude: String(coordinates.lat),
				longitude: String(coordinates.lng),
			});
		} catch (geocodingError) {
			setSelectedPosition(previousPosition);
			setError(
				geocodingError instanceof Error
					? geocodingError.message
					: "No se pudo obtener la dirección del punto seleccionado.",
			);
		}
	}

	if (!places || !geocoding) {
		return <p className="text-sm text-[#68716a]">Cargando el buscador y el mapa...</p>;
	}

	return (
		<div className="space-y-3">
			<div ref={autocompleteContainer} className="min-h-12" />
			<p className="text-xs text-[#68716a]">
				Seleccioná una sugerencia o hacé clic en el mapa para definir la ubicación.
			</p>
			<Map
				defaultCenter={selectedPosition ?? initialMapCenter}
				defaultZoom={13}
				mapTypeId="roadmap"
				className="h-80 w-full overflow-hidden rounded-md border border-[#e5e7eb]"
				onClick={handleMapClick}
			>
				{selectedPosition && <Marker position={selectedPosition} />}
			</Map>
			{error && <p role="alert" className="text-sm text-[#b74f3d]">{error}</p>}
		</div>
	);
}

export default function LocationPicker(props: LocationPickerProps) {
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

	if (!apiKey) {
		return (
			<p role="alert" className="rounded-md border border-[#e5e7eb] bg-[#fffdf9] p-3 text-sm text-[#b74f3d]">
				Configurá VITE_GOOGLE_MAPS_API_KEY en .env para habilitar el mapa y el buscador de direcciones.
			</p>
		);
	}

	return (
		<APIProvider apiKey={apiKey} libraries={["places", "geocoding"]}>
			<InteractiveMap {...props} />
		</APIProvider>
	);
}
