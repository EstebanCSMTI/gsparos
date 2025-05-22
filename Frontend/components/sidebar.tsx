"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ChevronLeft, ClipboardList, FormInput, LogOut, Menu, Gauge, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Guardar el estado del menú en localStorage cuando cambie
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const routes = [
    {
      name: "Formulario",
      path: "/dashboard/form",
      icon: FormInput,
    },
    {
      name: "Tabla de Registros",
      path: "/dashboard/table",
      icon: ClipboardList,
    },
    {
      name: "Análisis de Pareto",
      path: "/dashboard/pareto",
      icon: BarChart3,
    },
    {
      name: "Cadencia",
      path: "/dashboard/cadencia",
      icon: Gauge,
    },
    {
      name: "Guia de uso",
      path: "https://drive.google.com/file/d/17zHGWj7P7BRKufTq1M6GsztfDCECKzYn/view?usp=drive_link",
      icon: Info,
    },
  ]

  return (
    <>
      {/* Botón flotante para abrir/cerrar el sidebar */}
      <Button variant="outline" size="icon" className="fixed left-4 top-4 z-50 shadow-sm" onClick={toggleSidebar}>
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{isOpen ? "Cerrar menú" : "Abrir menú"}</span>
      </Button>

      {/* Sidebar flotante */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex items-center space-x-2 pl-10">
              <Image src="/logo.png" alt="Logo" width={30} height={30} />
              <span className="font-medium">Sistema de Paros</span>
            </div>
          </div>
          <nav className="flex-1 overflow-auto p-2">
            <ul className="grid gap-1">
              {routes.map((route) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    target={route.path.startsWith("http") ? "_blank" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted ${
                      pathname === route.path ? "bg-muted" : ""
                    }`}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t p-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar el sidebar en dispositivos móviles */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50" onClick={toggleSidebar} aria-hidden="true" />}
    </>
  )
}
