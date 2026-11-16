type LoadingStateProps = {
  label: string;
  variant?: "page" | "inline";
  className?: string;
};

export default function LoadingState({
  label,
  variant = "page",
  className = "",
}: LoadingStateProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-[#385347]/20 border-t-[#385347]"
      />
      <span>{label}</span>
    </>
  );

  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center justify-center gap-2 text-sm text-[#68716a] ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#f6f4ee] px-5 py-12 text-[#202722]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-[#e0ded5] bg-[#fffdf9] px-5 py-4 text-sm text-[#385347] shadow-sm"
      >
        {content}
      </div>
    </main>
  );
}
