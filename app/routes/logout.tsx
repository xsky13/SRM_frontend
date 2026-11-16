import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "~/utils/api";

export default function LogoutRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: () => api.post("/api/user/logout"),
		onSuccess: () => {
			queryClient.setQueryData(["auth-user"], false);
			toast.success("Sesión cerrada");
			navigate("/");
		},
		onError: () => { toast.error("No se pudo cerrar la sesión"); navigate("/"); },
	});

	useEffect(() => { mutation.mutate(); }, []);

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#f6f4ee] p-8 text-[#385347]">
			<div role="status" className="inline-flex items-center gap-3 rounded-md border border-[#e0ded5] bg-[#fffdf9] px-5 py-4">
				<span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-[#385347] border-t-transparent" />
				Cerrando sesión...
			</div>
		</main>
	);
}