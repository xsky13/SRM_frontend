import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import api from "~/utils/api";
import { ApiError } from "~/types/ApiError";
import { UserType, type User } from "~/types/User";

async function checkAuthentication(): Promise<User | null> {
  try {
    const response = await api.get("/api/user/me");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
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
  const user = authQuery.data;
  const isAdmin = user?.usertype === UserType.Admin;

  if (authQuery.isPending) {
    return <span className="text-sm text-[#68716a]">Verificando sesión...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link to="/reservas" className="ui-link">
          Mis reservas
        </Link>
        {isAdmin && (
          <Link to="/admin/departamentos" className="ui-link">
            Panel de Admin
          </Link>
        )}
        <Link to="/logout" className="ui-button ui-button-sm">
          Cerrar sesión
        </Link>
      </div>
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
