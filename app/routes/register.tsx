import AuthPage from "./auth";

export function meta() {
	return [{ title: "Crear cuenta | Reservas Moreno" }];
}

export default function RegisterRoute() {
	return <AuthPage mode="register" />;
}