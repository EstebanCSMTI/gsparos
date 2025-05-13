"use server"

import { redirect } from "next/navigation"

export async function registerStop(formData: FormData) {
  // Aquí iría la lógica real de registro
  redirect("/dashboard/table")
}
