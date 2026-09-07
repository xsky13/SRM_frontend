import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("departamento/:id", "routes/departamento.$slug.tsx"),
	route("test", "routes/test.tsx")
] satisfies RouteConfig;
