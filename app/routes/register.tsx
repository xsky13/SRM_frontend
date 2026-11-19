import { useAuthentication } from "~/components/NavegacionUsuario";
import AuthPage from "./auth";
import { Navigate } from "react-router";
import LoadingState from "~/components/LoadingState";

export function meta() {
	return [{ title: "Crear cuenta | Reservas Moreno" }];
}

export default function RegisterRoute() {
	const authQuery = useAuthentication();

	if (authQuery.isLoading)
		return (
			<div className="flex justify-center pt-20">
				<LoadingState variant="inline" label="Verificando sesión..." />
			</div>
		);

	if (!authQuery.isError)
		return (
			<div className="flex justify-center pt-20">
				Ocurrió un error inesperado. Por favor, intentá nuevamente.
			</div>
		);

	if (authQuery.data?.id) return <Navigate to={"/"} replace />;


	return <AuthPage mode="register" />;
}