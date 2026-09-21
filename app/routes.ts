import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	route("register", "routes/register.tsx"),
	route("logout", "routes/logout.tsx"),
	route("reserva", "routes/reserva.tsx"),
	route("departamento/:id", "routes/departamento.tsx"),
	route("test", "routes/test.tsx")
] satisfies RouteConfig;
