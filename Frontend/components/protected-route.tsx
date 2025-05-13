"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/")
      } else if (adminOnly && !isAdmin) {
        // Si la ruta es solo para administradores y el usuario no es admin
        router.push("/dashboard/form")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, adminOnly])

  // Mientras verifica la autenticación, muestra un indicador de carga
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si no está autenticado o necesita ser admin y no lo es, no muestra nada (redirección en proceso)
  if (!isAuthenticated || (adminOnly && !isAdmin)) {
    return null
  }

  // Si está autenticado y tiene los permisos necesarios, muestra el contenido
  return <>{children}</>
}
