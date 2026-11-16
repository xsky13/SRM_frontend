import { useNavigation } from "react-router";

export default function NavigationProgress() {
	const navigation = useNavigation();

	if (navigation.state !== "loading") return null;

	return (
		<div
			role="status"
			aria-label="Cargando página"
			className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-[#385347]/15"
		>
			<div className="h-full w-1/3 animate-pulse rounded-r-full bg-[#385347]" />
			<span className="sr-only">Cargando página...</span>
		</div>
	);
}
