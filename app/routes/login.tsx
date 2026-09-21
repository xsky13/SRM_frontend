import AuthPage from "./auth";

export function meta() {
	return [{ title: "Iniciar sesión | Reservas Moreno" }];
}

export default function LoginRoute() {
	return <AuthPage mode="login" />;
}