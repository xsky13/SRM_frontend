import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import {
    MutationCache,
    QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import type { Route } from "./+types/root";
import "./styles/app.css";
import { useEffect } from "react";
import { MyToastRegion, queue } from "./components/ui/Toast";
import { ApiError } from "./types/ApiError";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap",
	},
];

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            if (query.meta?.silent) return; // si la query ya define un onError, salir
            const customMessage = query.meta?.errorMessage as string | undefined;
            const message = customMessage ?? (error instanceof ApiError ? error.message : 'Error al cargar los datos');
            queue.add({ title: 'Error', description: message }, { timeout: 3000})
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, _vars, _ctx, mutation) => {
            if (mutation.meta?.silent) return; // si la mutacion ya define un onError, salir
            const message = error instanceof ApiError ? error.message : 'Error al cargar los datos';
            queue.add({ title: 'Error', description: message }, { timeout: 3000 });
        }
    }),
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // no reintentar errores de negocio
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    return false;
                }
                return failureCount < 2;
            }
        },
        mutations: { retry: false }
    }
})

export function Layout({ children }: { children: React.ReactNode }) {
    /** PARA EL MOMENTO EN QUE SE IMPLEMENTE AUTH */
    // useEffect(() => {
    //     const handleUnauthorized = () => {
    //         queryClient.clear(); // limpia cache
    //         setUser(null);
    //         navigate('/login');
    //     };
    //     window.addEventListener('auth:unauthorized', handleUnauthorized);
    //     return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    // }, []);

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
                <QueryClientProvider client={queryClient}>
                    {children}
    				<ScrollRestoration />
                    <Scripts />
                    <MyToastRegion />
				</QueryClientProvider>
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "Ocurrio un error inesperado de nuestro lado.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "La pagina que buscaba no pudo ser encontrada."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
    }

    // useEffect(() => document.title = "Error", []);

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p className="mt-5">{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
