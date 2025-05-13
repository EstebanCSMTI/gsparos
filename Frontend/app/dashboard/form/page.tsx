import type { Metadata } from "next"
import FormPageClient from "./FormPageClient"

export const metadata: Metadata = {
  title: "Registro de Paros - Sistema de Registro de Paros",
  description: "Formulario para registrar paros industriales",
}

export default function FormPage() {
  return <FormPageClient />
}