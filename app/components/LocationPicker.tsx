
import { useEffect, useState, type ComponentType } from "react";
import LoadingState from "~/components/LoadingState";

export type Coordinates = {
    latitude: number;
    longitude: number;
};

type LocationPickerProps = {
    onChange: (coordinates: Coordinates) => void;
    initialPosition?: Coordinates;
};

export function LocationPicker(props: LocationPickerProps) {
    const [LeafletPicker, setLeafletPicker] =
        useState<ComponentType<LocationPickerProps>>();

    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function initialize() {
            try {
                const { configureLeaflet } = await import(
                    "../utils/leaflet-config"
                );

                configureLeaflet();

                const { default: component } = await import(
                    "./LeafletLocationPicker"
                );

                if (isMounted) {
                    setLeafletPicker(() => component);
                }
            } catch (error) {
                console.error(
                    "No se pudo cargar el selector de ubicación.",
                    error
                );

                if (isMounted) {
                    setLoadError(true);
                }
            }
        }

        initialize();

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
        return (
            <LoadingState
                variant="inline"
                label="Cargando el mapa..."
                className="py-2"
            />
        );
    }

    return <LeafletPicker {...props} />;
}
