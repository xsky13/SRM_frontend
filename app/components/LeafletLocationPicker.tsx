import { useState } from "react";
import { LatLng } from "leaflet";
import {
	MapContainer,
	Marker,
	TileLayer,
	useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates } from "~/components/LocationPicker";

type LocationPickerProps = {
	onChange: (coordinates: Coordinates) => void;
	initialPosition?: Coordinates;
};

function MapClickHandler({
	onChange,
}: {
	onChange: (coordinates: Coordinates) => void;
}) {
	useMapEvents({
		click(event) {
			onChange({
				latitude: event.latlng.lat,
				longitude: event.latlng.lng,
			});
		},
	});

	return null;
}

export default function LeafletLocationPicker({
	onChange,
	initialPosition,
}: LocationPickerProps) {
	const defaultPosition = {
		latitude: -34.6037,
		longitude: -58.3816,
	};
	const [position, setPosition] = useState<LatLng | null>(
		() =>
			initialPosition
				? new LatLng(initialPosition.latitude, initialPosition.longitude)
				: null,
	);

	function handleMapClick(coordinates: Coordinates) {
		setPosition(new LatLng(coordinates.latitude, coordinates.longitude));
		onChange(coordinates);
	}

	return (
		<div>
			<MapContainer
				center={[
					(initialPosition ?? defaultPosition).latitude,
					(initialPosition ?? defaultPosition).longitude,
				]}
				zoom={13}
				style={{ height: 400, width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapClickHandler onChange={handleMapClick} />
				{position && <Marker position={position} />}
			</MapContainer>

			{position && (
				<p>
					Latitud: {position.lat.toFixed(6)}
					<br />
					Longitud: {position.lng.toFixed(6)}
				</p>
			)}
		</div>
	);
}
