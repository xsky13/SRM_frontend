import { useEffect, useState } from "react";
import { LatLng } from "leaflet";
import {
	MapContainer,
	Marker,
	TileLayer,
	useMap,
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

function InitialPositionHandler({
	initialPosition,
	disabled,
}: {
	initialPosition?: Coordinates;
	disabled: boolean;
}) {
	const map = useMap();

	useEffect(() => {
		if (!initialPosition || disabled) return;
		map.setView([initialPosition.latitude, initialPosition.longitude], map.getZoom());
	}, [disabled, initialPosition, map]);

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
	const [hasSelectedPosition, setHasSelectedPosition] = useState(false);

	useEffect(() => {
		if (!initialPosition || hasSelectedPosition) return;
		setPosition(new LatLng(initialPosition.latitude, initialPosition.longitude));
	}, [hasSelectedPosition, initialPosition]);

	function handleMapClick(coordinates: Coordinates) {
		setHasSelectedPosition(true);
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
				<InitialPositionHandler
					initialPosition={initialPosition}
					disabled={hasSelectedPosition}
				/>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapClickHandler onChange={handleMapClick} />
				{position && <Marker position={position} />}
			</MapContainer>
		</div>
	);
}
