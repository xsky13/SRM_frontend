import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

export default function AppLoadingIndicator() {
  const navigation = useNavigation();
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();
  const isBusy =
    navigation.state !== "idle" || fetchingCount > 0 || mutatingCount > 0;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setIsVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setIsVisible(true), 120);
    return () => window.clearTimeout(timeout);
  }, [isBusy]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-label="Cargando"
      className="app-loading-indicator fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-[#e28b68]/20"
    >
      <div className="app-loading-indicator__bar h-full w-1/3 bg-[#385347]" />
    </div>
  );
}
