"use client"

import { useState, useEffect } from "react"
import { Gauge, Save, Loader2, Factory, AlertCircle, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { API_ENDPOINTS } from "@/lib/api-config"

interface Cadencia {
  id_cadencia: number
  id_proceso: number
  valor_cadencia: number
  nombre_proceso: string
}

export default function CadenciaPageClient() {
  const [cadencias, setCadencias] = useState<Cadencia[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<number, number>>({})
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchCadencias()
  }, [])

  const fetchCadencias = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_ENDPOINTS.cadencias)
      if (!response.ok) {
        throw new Error("Error al cargar los datos de cadencia")
      }
      const data = await response.json()
      setCadencias(data)

      // Inicializar los valores de edición
      const initialValues: Record<number, number> = {}
      data.forEach((cadencia: Cadencia) => {
        initialValues[cadencia.id_cadencia] = cadencia.valor_cadencia
      })
      setEditValues(initialValues)
    } catch (err) {
      console.error("Error fetching cadencias:", err)
      setError("No se pudieron cargar los datos de cadencia. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (id: number, value: string) => {
    // Permitir solo números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, "")
    setEditValues({
      ...editValues,
      [id]: numericValue === "" ? 0 : Number.parseFloat(numericValue),
    })
  }

  const handleSave = async (cadencia: Cadencia) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden editar los valores de cadencia.",
        variant: "destructive",
      })
      return
    }

    setSaving(cadencia.id_cadencia)
    try {
      const response = await fetch(`${API_ENDPOINTS.cadencias}/${cadencia.id_cadencia}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ valor_cadencia: editValues[cadencia.id_cadencia] }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar la cadencia")
      }

      // Actualizar el estado local con el nuevo valor
      setCadencias(
        cadencias.map((c) =>
          c.id_cadencia === cadencia.id_cadencia ? { ...c, valor_cadencia: editValues[cadencia.id_cadencia] } : c,
        ),
      )

      toast({
        title: "Cadencia actualizada",
        description: `La cadencia para ${cadencia.nombre_proceso} ha sido actualizada correctamente.`,
      })
    } catch (err) {
      console.error("Error updating cadencia:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar la cadencia. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const handleRefresh = () => {
    fetchCadencias()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadencia</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Visualiza y edita los valores de cadencia para cada proceso."
              : "Visualiza los valores de cadencia para cada proceso."}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar"}
        </Button>
      </div>

      {!isAdmin && (
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertTitle>Acceso limitado</AlertTitle>
          <AlertDescription>
            Solo los administradores pueden editar los valores de cadencia. Usted tiene permisos de solo lectura.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? // Esqueletos de carga
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))
          : cadencias.map((cadencia) => (
              <Card key={cadencia.id_cadencia} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-primary" />
                    {cadencia.nombre_proceso}
                  </CardTitle>
                  <CardDescription>ID Proceso: {cadencia.id_proceso}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor={`cadencia-${cadencia.id_cadencia}`} className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      Valor de Cadencia
                    </Label>
                    <Input
                      id={`cadencia-${cadencia.id_cadencia}`}
                      type="text"
                      value={editValues[cadencia.id_cadencia] ?? cadencia.valor_cadencia}
                      onChange={(e) => handleInputChange(cadencia.id_cadencia, e.target.value)}
                      className="text-lg font-medium"
                      disabled={!isAdmin}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  {isAdmin ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSave(cadencia)}
                      disabled={
                        saving === cadencia.id_cadencia || editValues[cadencia.id_cadencia] === cadencia.valor_cadencia
                      }
                    >
                      {saving === cadencia.id_cadencia ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Solo administradores pueden editar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
      </div>

      {!loading && cadencias.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="mb-2 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-medium">No hay datos de cadencia disponibles</h3>
            <p className="text-sm text-muted-foreground">No se encontraron registros de cadencia en el sistema.</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              Intentar nuevamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
