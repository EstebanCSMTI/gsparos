"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Función para actualizar el estado
    const updateMatches = () => {
      setMatches(media.matches)
    }

    // Establecer el valor inicial
    updateMatches()

    // Añadir listener para cambios
    media.addEventListener("change", updateMatches)

    // Limpiar listener al desmontar
    return () => {
      media.removeEventListener("change", updateMatches)
    }
  }, [query])

  return matches
}
