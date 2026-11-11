import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LeafletApartmentLocationMapProps = {
	latitude: number;
	longitude: number;
	apartmentName: string;
	location: string;
};

export default function LeafletApartmentLocationMap({
	latitude,
	longitude,
	apartmentName,
	location,
}: LeafletApartmentLocationMapProps) {
	return (
		<MapContainer
			key={`${latitude},${longitude}`}
			center={[latitude, longitude]}
			zoom={15}
			className="h-80 w-full overflow-hidden rounded-md border border-[#e5e7eb]"
			aria-label={`Mapa de ubicación de ${apartmentName}`}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker position={[latitude, longitude]}>
				<Popup>
					<strong>{apartmentName}</strong>
					<p>{location}</p>
				</Popup>
			</Marker>
		</MapContainer>
	);
}
