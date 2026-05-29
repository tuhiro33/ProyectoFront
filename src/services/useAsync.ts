import { useState } from 'react';

export function useAsync() {
  const [isLoading, setIsLoading] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    if (isLoading) return; // ← bloquea si ya hay una acción en curso
    setIsLoading(true);
    try {
      await fn();
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, run };
}