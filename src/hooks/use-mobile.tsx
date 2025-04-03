
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Definir o estado inicial baseado no tamanho da janela atual
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Usar o addEventListener para melhor compatibilidade
    mql.addEventListener("change", onChange)
    
    // Limpar o listener quando o componente for desmontado
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Retornar falso como padrão até que o useEffect seja executado no cliente
  return isMobile === undefined ? false : isMobile
}
