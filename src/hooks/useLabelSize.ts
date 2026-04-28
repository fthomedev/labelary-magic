import { useCallback, useEffect, useState } from 'react';
import { LabelSize, DEFAULT_LABEL_SIZE, LABEL_SIZE_STORAGE_KEY } from '@/types/labelSize';

/**
 * O seletor de tamanho de etiqueta está temporariamente oculto em ZPLPreview
 * (Labelary não escala o conteúdo do ZPL). Enquanto isso, este hook força o
 * uso do tamanho padrão (10×15 cm) e remove qualquer valor antigo persistido
 * no localStorage — caso contrário, usuárias que mexeram nas medidas antes
 * da UI ser ocultada ficavam presas em um tamanho personalizado errado, sem
 * forma de voltar ao padrão.
 */
export function useLabelSize() {
  const [labelSize, setLabelSizeState] = useState<LabelSize>(DEFAULT_LABEL_SIZE);

  // Limpa resíduo da chave antiga em localStorage uma única vez por carregamento.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(LABEL_SIZE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Mantém a assinatura para não quebrar chamadores; só atualiza estado em
  // memória, sem persistir. O seletor está oculto, então isso não é exercido.
  const setLabelSize = useCallback((next: LabelSize) => {
    setLabelSizeState({ widthCm: next.widthCm, heightCm: next.heightCm });
  }, []);

  return { labelSize, setLabelSize };
}
