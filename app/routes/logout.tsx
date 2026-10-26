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

	return <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#385347]">Cerrando sesión...</main>;
}