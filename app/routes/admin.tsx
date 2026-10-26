// NUEVO: Layout del área de administración, protegido por el rol del usuario.
import { Link, Navigate, NavLink, Outlet } from "react-router";
import { useAuthentication } from "~/components/NavegacionUsuario";
import { UserType } from "~/types/User";

export default function AdminLayout() {
  const authQuery = useAuthentication();
  const isAdmin = authQuery.data?.usertype === UserType.Admin;

  if (authQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-8 text-[#202722]">
        Verificando sesión...
      </main>
    );
  }

  if (!authQuery.data || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabClassName = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "border-[#385347] text-[#385347]"
        : "border-transparent text-[#68716a] hover:text-[#385347]"
    }`;

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
      <header className="border-b border-[#e0ded5] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
          <h1 className="font-serif text-3xl tracking-[-0.04em] text-[#385347]">
            Panel de Administración
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/" className="ui-link">
              Volver al inicio
            </Link>
            <Link to="/logout" className="ui-button ui-button-sm">
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Menú de administración"
        className="border-b border-[#e0ded5] bg-[#fffdf9]"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 md:px-8">
          <NavLink to="/admin/departamentos" className={tabClassName}>
            Departamentos
          </NavLink>
          <NavLink to="/admin/reservas" className={tabClassName}>
            Reservas
          </NavLink>
          <NavLink to="/admin/usuarios" className={tabClassName}>
            Usuarios
          </NavLink>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <Outlet />
      </section>
    </main>
  );
}