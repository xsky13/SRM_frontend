import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import api from "~/utils/api";
import { ApiError } from "~/types/ApiError";

async function checkAuthentication(): Promise<boolean> {
  try {
    await api.get("/api/user/me");
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return false;
    }
    throw error;
  }
}

export function useAuthentication() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: checkAuthentication,
    meta: { silent: true },
    staleTime: 0,
  });
}

export default function NavegacionUsuario() {
  const authQuery = useAuthentication();
  const location = useLocation();

  if (authQuery.isPending) {
    return <span className="text-sm text-[#68716a]">Verificando sesión...</span>;
  }

  if (authQuery.data) {
    return (
      <Link to="/logout" className="ui-button ui-button-sm">
        Cerrar sesión
      </Link>
    );
  }

  return (
    <>
      <Link
        to="/register"
        state={{ returnTo: location.pathname }}
        className="ui-link"
      >
        Crear cuenta
      </Link>
      <Link
        to="/login"
        state={{ returnTo: location.pathname }}
        className="ui-button ui-button-sm"
      >
        Iniciar sesión
      </Link>
    </>
  );
}
