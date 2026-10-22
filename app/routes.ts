import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	route("logout", "routes/logout.tsx"),
	route("reserva/:id", "routes/reserva.tsx"),
	route("mis-reservas", "routes/mis-reservas.tsx"),
	route("departamento/:id", "routes/departamento.tsx"),
	route("test", "routes/test.tsx"),
	// NUEVO: Layout protegido de administración y su página inicial de departamentos.
	route("admin", "routes/admin.tsx", [
		route("departamentos", "routes/admin.departamentos.tsx"),
	])
] satisfies RouteConfig;
