import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "~/utils/api";
import { ApiError } from "~/types/ApiError";

type AuthMode = "login" | "register";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[0-9\s-]{7,20}$/;

type FormValues = {
	firstName: string;
	lastName: string;
	telefono: string;
	email: string;
	pwd: string;
	confirmPwd: string;
};

const initialValues: FormValues = {
	firstName: "",
	lastName: "",
	telefono: "",
	email: "",
	pwd: "",
	confirmPwd: "",
};

function validate(values: FormValues, mode: AuthMode) {
	const errors: Partial<Record<keyof FormValues, string>> = {};
	if (mode === "register") {
		if (!values.firstName.trim() || values.firstName.trim().length < 2) errors.firstName = "Ingresá un nombre válido.";
		if (!values.lastName.trim() || values.lastName.trim().length < 2) errors.lastName = "Ingresá un apellido válido.";
		if (!phonePattern.test(values.telefono.trim())) errors.telefono = "Ingresá un teléfono válido.";
	}
	if (!emailPattern.test(values.email.trim())) errors.email = "Ingresá un email válido.";
	if (values.pwd.length < 8) errors.pwd = "La contraseña debe tener al menos 8 caracteres.";
	if (mode === "register" && values.pwd !== values.confirmPwd) errors.confirmPwd = "Las contraseñas no coinciden.";
	return errors;
}

export function meta() {
	return [{ title: "Cuenta | Reservas Moreno" }];
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const [values, setValues] = useState(initialValues);
	const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
	const errors = validate(values, mode);
	const returnTo = (location.state as { returnTo?: unknown } | null)?.returnTo;
	const destination = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/";
	const mutation = useMutation({
		mutationFn: async () => {
			if (mode === "register") {
				return api.post("/api/user/register", {
					FirstName: values.firstName.trim(), LastName: values.lastName.trim(),
					Telefono: values.telefono.trim(), Email: values.email.trim(), Pwd: values.pwd,
				});
			}
			return api.post("/api/user/login", { Email: values.email.trim(), Pwd: values.pwd });
		},
		meta: { silent: true },
		onSuccess: () => {
			queryClient.setQueryData(["auth-user"], true);
			toast.success(mode === "register" ? "Cuenta creada correctamente" : "Sesión iniciada");
			navigate(destination);
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "No se pudo completar la operación")
		},
	});

	function updateField(field: keyof FormValues, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
		setTouched((current) => ({ ...current, [field]: true }));
	}

	function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setTouched({ firstName: true, lastName: true, telefono: true, email: true, pwd: true, confirmPwd: true });
		if (Object.keys(errors).length > 0) return;
		mutation.mutate();
	}

	const field = (name: keyof FormValues, label: string, type = "text", required = true) => (
		<label className="block text-sm text-[#385347]">
			<span className="mb-1.5 block font-semibold">{label}</span>
			<input
				className="w-full rounded-md border border-[#d3d0c6] bg-[#fffdf9] px-3 py-2.5 text-[#202722] outline-none transition focus:border-[#e28b68]"
				type={type} name={name} value={values[name]} required={required}
				autoComplete={name === "pwd" ? "new-password" : name}
				onChange={(event) => updateField(name, event.target.value)}
			/>
			{touched[name] && errors[name] && <span className="mt-1 block text-xs text-[#b74f3d]">{errors[name]}</span>}
		</label>
	);

	return (
		<main className="min-h-screen bg-[#f6f4ee] text-[#202722]">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
				<Link className="font-serif text-[23px] font-bold tracking-[-0.04em] text-[#385347]" to="/">reservas<span className="text-[#e28b68]">moreno</span></Link>
				<Link className="ui-link text-sm" to="/">Volver al inicio</Link>
			</header>
			<section className="mx-auto grid max-w-6xl gap-12 px-5 py-10 md:grid-cols-[.8fr_1fr] md:px-8 md:py-20">
				<div className="pt-4"><p className="mb-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#e28b68]">Reservas Moreno</p><h1 className="font-serif text-5xl font-normal leading-none tracking-[-.05em] text-[#385347]">{mode === "register" ? <>Tu próxima estadía<br /><em className="text-[#e28b68]">empieza acá.</em></> : <>Qué bueno<br /><em className="text-[#e28b68]">verte de nuevo.</em></>}</h1><p className="mt-6 max-w-sm leading-7 text-[#68716a]">{mode === "register" ? "Creá tu cuenta para reservar departamentos cómodos en Libertador San Martín." : "Ingresá para continuar con tus reservas."}</p></div>
				<form onSubmit={submit} noValidate className="rounded-md border border-[#e0ded5] bg-[#fffdf9] p-6 shadow-[0_18px_45px_rgba(56,83,71,.07)] md:p-8">
					<h2 className="font-serif text-3xl font-normal text-[#385347]">{mode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h2>
					<div className="mt-6 space-y-4">
						{mode === "register" && <div className="grid gap-4 sm:grid-cols-2">{field("firstName", "Nombre")} {field("lastName", "Apellido")}</div>}
						{mode === "register" && field("telefono", "Teléfono", "tel")}
						{field("email", "Email", "email")}{field("pwd", "Contraseña", "password")}
						{mode === "register" && field("confirmPwd", "Repetir contraseña", "password")}
					</div>
					<button className="ui-button ui-button-block ui-button-md mt-7 bg-[#385347] text-[#fffdf9]" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Iniciar sesión"}</button>
					<p className="mt-5 text-center text-sm text-[#68716a]">{mode === "register" ? "¿Ya tenés una cuenta? " : "¿Todavía no tenés cuenta? "}<Link className="ui-text-link" to={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Iniciá sesión" : "Registrate"}</Link></p>
				</form>
			</section>
		</main>
	);
}