type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  summary: string;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  ariaLabel: string;
};

const PAGE_WINDOW_SIZE = 5;

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const visibleCount = Math.min(PAGE_WINDOW_SIZE, totalPages);
  const lastStart = totalPages - visibleCount + 1;
  const start = Math.max(
    1,
    Math.min(currentPage - Math.floor(visibleCount / 2), lastStart),
  );

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export default function PaginationControls({
  currentPage,
  totalPages,
  summary,
  onPageChange,
  isDisabled = false,
  ariaLabel,
}: PaginationControlsProps) {
  if (totalPages <= 0) return null;

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePages = getVisiblePages(page, totalPages);
  const firstVisiblePage = visiblePages[0];
  const lastVisiblePage = visiblePages[visiblePages.length - 1];
  const buttonClassName =
    "rounded-md border px-3 py-1.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#68716a]">
      <span>{summary}</span>
      <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isDisabled}
          className={`${buttonClassName} border-[#d8d5ca] hover:bg-[#edf2e8]`}
        >
          Anterior
        </button>
        {firstVisiblePage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={isDisabled}
              aria-label="Ir a la página 1"
              className={`${buttonClassName} border-[#d8d5ca] hover:bg-[#edf2e8]`}
            >
              1
            </button>
            {firstVisiblePage > 2 && <span aria-hidden="true">…</span>}
          </>
        )}
        {visiblePages.map((visiblePage) => (
          <button
            key={visiblePage}
            type="button"
            onClick={() => onPageChange(visiblePage)}
            disabled={isDisabled}
            aria-label={`Ir a la página ${visiblePage}`}
            aria-current={page === visiblePage ? "page" : undefined}
            className={`${buttonClassName} ${
              page === visiblePage
                ? "border-[#385347] bg-[#385347] text-white"
                : "border-[#d8d5ca] hover:bg-[#edf2e8]"
            }`}
          >
            {visiblePage}
          </button>
        ))}
        {lastVisiblePage < totalPages && (
          <>
            {lastVisiblePage < totalPages - 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={isDisabled}
              aria-label={`Ir a la página ${totalPages}`}
              className={`${buttonClassName} border-[#d8d5ca] hover:bg-[#edf2e8]`}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isDisabled}
          className={`${buttonClassName} border-[#d8d5ca] hover:bg-[#edf2e8]`}
        >
          Siguiente
        </button>
      </nav>
    </div>
  );
}
