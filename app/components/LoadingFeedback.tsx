import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={`animate-pulse rounded bg-gray-200 ${className}`}
		/>
	);
}

export function QueryErrorState({
	message,
	onRetry,
	className = "",
}: {
	message: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<div
			role="alert"
			className={`rounded-md border border-[#e8c9bf] bg-[#fff8f5] p-5 text-[#202722] ${className}`}
		>
			<div className="flex items-start gap-3">
				<AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#b74f3d]" />
				<div>
					<p className="font-semibold text-[#385347]">No pudimos cargar la información</p>
					<p className="mt-1 text-sm text-[#68716a]">{message}</p>
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#d3d0c6] px-3 py-2 text-sm font-semibold text-[#385347] transition hover:bg-[#edf2e8]"
						>
							<RefreshCw aria-hidden="true" className="size-4" />
							Reintentar
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export function LoadingState({
	label,
	children,
}: {
	label: string;
	children?: ReactNode;
}) {
	return (
		<div role="status" aria-label={label} className="space-y-4">
			<span className="sr-only">{label}</span>
			{children ?? (
				<div className="flex items-center gap-3 rounded-md border border-[#e0ded5] bg-[#fffdf9] p-5 text-sm text-[#68716a]">
					<div className="size-5 animate-spin rounded-full border-2 border-[#385347] border-t-transparent" />
					{label}
				</div>
			)}
		</div>
	);
}
