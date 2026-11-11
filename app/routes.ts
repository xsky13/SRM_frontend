import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
<<<<<<< HEAD
	route("departamento/:id", "routes/departamento.tsx"),
	route("test", "routes/test.tsx")
=======
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	route("cuenta/editar", "routes/cuenta.editar.tsx"),
	route("logout", "routes/logout.tsx"),
	route("reservas/:id", "routes/reserva.tsx"),
	route("reservas", "routes/mis-reservas.tsx"),
	route("departamento/:id", "routes/departamento.tsx"),
	route("test", "routes/test.tsx"),
	// NUEVO: Layout protegido de administración y su página inicial de departamentos.
	route("admin", "routes/admin.tsx", [
		route("departamentos", "routes/admin.departamentos.tsx"),
		route("departamentos/nuevo", "routes/admin.departamentos.nuevo.tsx"),
		route("departamentos/:id/editar", "routes/admin.departamentos.editar.tsx"),
		route("reservas", "routes/admin.reservas.tsx"),
	])
>>>>>>> 26650ab4df7b7d50f4334a36ebdc4f5eeb9353e9
] satisfies RouteConfig;
