"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./lib/queryClient";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
