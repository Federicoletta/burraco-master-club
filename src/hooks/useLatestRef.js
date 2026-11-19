import { useRef, useEffect } from 'react';

/**
 * Mantiene un ref sempre sincronizzato con il valore più recente senza boilerplate ripetitivo.
 */
export function useLatestRef(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
