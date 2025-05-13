"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#f2f2f2]">
        <Sidebar />
        <main className="container flex-1 py-10">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
