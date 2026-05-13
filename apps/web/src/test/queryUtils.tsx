import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function withQuery(ui: ReactNode, client?: QueryClient) {
  const qc = client ?? createTestQueryClient();
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}
