const requestProgressEvent = "app:request-progress";
let activeRequestCount = 0;

function publishRequestCount() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<number>(requestProgressEvent, { detail: activeRequestCount }),
    );
  }
}

export function getActiveRequestCount(): number {
  return activeRequestCount;
}

export function beginTrackedRequest(): () => void {
  if (typeof window === "undefined") return () => undefined;

  activeRequestCount += 1;
  publishRequestCount();
  let completed = false;

  return () => {
    if (completed) return;
    completed = true;
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    publishRequestCount();
  };
}

export function subscribeToTrackedRequests(
  listener: (count: number) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleRequestProgress = (event: Event) => {
    listener((event as CustomEvent<number>).detail);
  };
  window.addEventListener(requestProgressEvent, handleRequestProgress);

  return () => window.removeEventListener(requestProgressEvent, handleRequestProgress);
}

export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const completeRequest = beginTrackedRequest();
  try {
    return await fetch(input, init);
  } finally {
    completeRequest();
  }
}
