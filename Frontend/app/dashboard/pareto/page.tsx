"use client"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { API_ENDPOINTS } from "@/lib/api-config"

// Definir la interfaz para los datos de la API
interface RegistroParo {
  id_registro: number
  categoria: string
  proceso: string
  equipo: string
  especialidad: string
  tipo: string
  causa: string
  detalle: string
  fecha_y_hora_de_paro: string
  fecha_y_hora_de_arranque: string
  horas_de_paro: number
  cadencia: number
  perdida_de_produccion: number
  nombre_usuario: string
}

// Interfaz para los datos procesados de Pareto
interface ParetoData {
  causa: string
  horas: number
  porcentaje: number
  porcentajeAcumulado: number
}

export default function ParetoPage() {
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week" | "day">("all")
  const [data, setData] = useState<RegistroParo[]>([])
  const [paretoData, setParetoData] = useState<ParetoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todas")
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [librariesLoaded, setLibrariesLoaded] = useState({
    html2canvas: false,
    exceljs: false,
  })

  // Detectar si estamos en un dispositivo móvil
  const isMobile = useIsMobile()

  // Referencias para los elementos que queremos exportar
  const chartRef = useRef<HTMLDivElement>(null)

  // Cargar bibliotecas dinámicamente (solo en el cliente)
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        // Cargar html2canvas
        await import("html2canvas")
        setLibrariesLoaded((prev) => ({ ...prev, html2canvas: true }))

        // Cargar ExcelJS
        await import("exceljs")
        setLibrariesLoaded((prev) => ({ ...prev, exceljs: true }))
      } catch (err) {
        console.error("Error loading libraries:", err)
        toast.error("Error al cargar las bibliotecas necesarias para la exportación")
      }
    }
    loadLibraries()
  }, [])

  // Cargar datos de la API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(API_ENDPOINTS.registros)

        if (!response.ok) {
          throw new Error(`Error al cargar los datos: ${response.status} ${response.statusText}`)
        }

        const apiData: RegistroParo[] = await response.json()
        setData(apiData)

        // Extraer especialidades únicas
        const uniqueEspecialidades = Array.from(new Set(apiData.map((item) => item.especialidad)))
          .filter(Boolean)
          .sort()
        setEspecialidades(uniqueEspecialidades)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Error desconocido al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Procesar datos para el análisis de Pareto cuando cambian los filtros
  useEffect(() => {
    if (data.length === 0) return

    // Filtrar datos según el rango de tiempo seleccionado
    const now = new Date()
    const filteredByTime = data.filter((item) => {
      const itemDate = new Date(item.fecha_y_hora_de_paro)

      switch (timeRange) {
        case "day":
          return itemDate.toDateString() === now.toDateString()
        case "week": {
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(now.getDate() - 7)
          return itemDate >= oneWeekAgo
        }
        case "month": {
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(now.getMonth() - 1)
          return itemDate >= oneMonthAgo
        }
        default:
          return true // "all" - no filter
      }
    })

    // Filtrar por especialidad si se ha seleccionado una
    const filteredByEspecialidad =
      filtroEspecialidad === "todas"
        ? filteredByTime
        : filteredByTime.filter((item) => item.especialidad === filtroEspecialidad)

    // Agrupar por causa y sumar horas de paro
    const causaGroups = filteredByEspecialidad.reduce<Record<string, number>>((acc, item) => {
      const causa = item.causa || "Sin especificar"
      acc[causa] = (acc[causa] || 0) + item.horas_de_paro
      return acc
    }, {})

    // Convertir a array y ordenar por horas (de mayor a menor)
    const sortedCausas = Object.entries(causaGroups)
      .map(([causa, horas]) => ({ causa, horas }))
      .sort((a, b) => b.horas - a.horas)

    // Calcular el total de horas
    const totalHoras = sortedCausas.reduce((sum, item) => sum + item.horas, 0)

    // Calcular porcentajes y porcentaje acumulado
    let acumulado = 0
    const paretoDataCalculated = sortedCausas.map((item) => {
      const porcentaje = (item.horas / totalHoras) * 100
      acumulado += porcentaje
      return {
        causa: item.causa,
        horas: item.horas,
        porcentaje: porcentaje,
        porcentajeAcumulado: acumulado,
      }
    })

    setParetoData(paretoDataCalculated)
  }, [data, timeRange, filtroEspecialidad])

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (paretoData.length === 0) return

    // Crear contenido CSV
    const headers = ["Causa", "Horas de Paro", "Porcentaje (%)", "Porcentaje Acumulado (%)"]
    const csvContent = [
      headers.join(","),
      ...paretoData.map((row) =>
        [`"${row.causa}"`, row.horas.toFixed(2), row.porcentaje.toFixed(2), row.porcentajeAcumulado.toFixed(2)].join(
          ",",
        ),
      ),
    ].join("\n")

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pareto_analisis_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para exportar datos a Excel con gráfico incrustado
  const exportToExcel = async () => {
    if (
      paretoData.length === 0 ||
      !librariesLoaded.html2canvas ||
      !librariesLoaded.exceljs ||
      !chartRef.current ||
      isExporting
    ) {
      toast.error("No se puede exportar. Faltan datos o bibliotecas necesarias.")
      return
    }

    try {
      setIsExporting(true)
      toast.info("Generando archivo Excel con gráfico...", { duration: 3000 })

      // Importar bibliotecas dinámicamente
      const html2canvas = (await import("html2canvas")).default
      const ExcelJS = (await import("exceljs")).default

      // Capturar el gráfico como imagen
      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Mayor calidad
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Convertir canvas a imagen base64
      const imgData = canvas.toDataURL("image/png")

      // Crear un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook()

      // Añadir metadatos
      workbook.creator = "Sistema de Paros Industriales"
      workbook.lastModifiedBy = "Usuario"
      workbook.created = new Date()
      workbook.modified = new Date()

      // Crear hoja para los datos
      const worksheetData = workbook.addWorksheet("Datos de Pareto")

      // Añadir encabezados con estilo
      worksheetData.columns = [
        { header: "Causa", key: "causa", width: 40 },
        { header: "Horas de Paro", key: "horas", width: 15 },
        { header: "Porcentaje (%)", key: "porcentaje", width: 15 },
        { header: "Porcentaje Acumulado (%)", key: "porcentajeAcumulado", width: 20 },
      ]

      // Estilo para encabezados
      const headerRow = worksheetData.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }

      // Añadir datos
      paretoData.forEach((row, index) => {
        const dataRow = worksheetData.addRow({
          causa: row.causa,
          horas: row.horas,
          porcentaje: Number(row.porcentaje.toFixed(2)),
          porcentajeAcumulado: Number(row.porcentajeAcumulado.toFixed(2)),
        })

        // Destacar las primeras 3 filas (causas principales)
        if (index < 3) {
          dataRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5FF" },
          }
        }

        // Formato de números
        dataRow.getCell("horas").numFmt = "0.00"
        dataRow.getCell("porcentaje").numFmt = '0.00"%"'
        dataRow.getCell("porcentajeAcumulado").numFmt = '0.00"%"'
      })

      // Crear hoja para el gráfico
      const worksheetChart = workbook.addWorksheet("Gráfico de Pareto")

      // Añadir título
      worksheetChart.addRow(["Análisis de Pareto - Gráfico"])
      worksheetChart.getRow(1).font = { bold: true, size: 16 }
      worksheetChart.getRow(1).height = 30

      // Añadir información de filtros
      worksheetChart.addRow([])
      worksheetChart.addRow(["Filtros aplicados:"])
      worksheetChart.getRow(3).font = { bold: true }

      const timeRangeText = {
        all: "Todo el tiempo",
        month: "Último mes",
        week: "Última semana",
        day: "Hoy",
      }[timeRange]

      worksheetChart.addRow([`Rango de tiempo: ${timeRangeText}`])
      worksheetChart.addRow([`Especialidad: ${filtroEspecialidad === "todas" ? "Todas" : filtroEspecialidad}`])
      worksheetChart.addRow([])

      // Añadir imagen
      // Extraer la parte base64 de la URL de datos
      const base64Data = imgData.split(",")[1]
      const imageId = workbook.addImage({
        base64: base64Data,
        extension: "png",
      })

      // Insertar imagen en la hoja
      worksheetChart.addRow([])
      worksheetChart.addImage(imageId, {
        tl: { col: 1, row: 7 },
        ext: { width: 800, height: 450 },
      })

      // Ajustar ancho de columnas para la hoja del gráfico
      worksheetChart.columns.forEach((column) => {
        column.width = 20
      })

      // Generar archivo y descargar
      const timeRangeFileName = {
        all: "todo_tiempo",
        month: "ultimo_mes",
        week: "ultima_semana",
        day: "hoy",
      }[timeRange]

      const especialidadFileName =
        filtroEspecialidad === "todas" ? "todas_especialidades" : filtroEspecialidad.replace(/\s+/g, "_").toLowerCase()

      const fileName = `pareto_analisis_${timeRangeFileName}_${especialidadFileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer()

      // Crear blob y descargar
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Archivo Excel con gráfico generado correctamente")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast.error("Error al exportar a Excel. Por favor, inténtelo de nuevo.")
    } finally {
      setIsExporting(false)
    }
  }

  // Preparar datos para el gráfico (limitar a top 10 para mejor visualización)
  // En móvil, mostrar solo top 5 con nombres más cortos
  const chartData = paretoData.slice(0, isMobile ? 5 : 10).map((item) => ({
    causa: isMobile
      ? item.causa.length > 10
        ? item.causa.substring(0, 10) + "..."
        : item.causa
      : item.causa.length > 15
        ? item.causa.substring(0, 15) + "..."
        : item.causa,
    horas: item.horas,
    porcentajeAcumulado: item.porcentajeAcumulado,
  }))

  return (
    <div className="container mx-auto max-w-5xl px-2 sm:px-4">
      <div className="flex flex-col space-y-4">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Análisis de Pareto</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Visualización de causas de paros industriales según el principio de Pareto (80/20)
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="time-range">Rango de tiempo</Label>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as "all" | "month" | "week" | "day")}
            >
              <SelectTrigger id="time-range" className="w-full">
                <SelectValue placeholder="Seleccionar rango de tiempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="day">Hoy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="especialidad">Especialidad</Label>
            <Select value={filtroEspecialidad} onValueChange={setFiltroEspecialidad}>
              <SelectTrigger id="especialidad" className="w-full">
                <SelectValue placeholder="Seleccionar especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las especialidades</SelectItem>
                {especialidades.map((esp) => (
                  <SelectItem key={esp} value={esp}>
                    {esp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={isLoading || paretoData.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar a CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={
              isLoading ||
              paretoData.length === 0 ||
              !librariesLoaded.html2canvas ||
              !librariesLoaded.exceljs ||
              isExporting
            }
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExporting ? (
              <span className="hidden sm:inline">Exportando...</span>
            ) : (
              <>
                <span className="hidden sm:inline">Exportar a Excel</span>
                <span className="sm:hidden">Excel</span>
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Tabla de Pareto</CardTitle>
            <CardDescription>
              Distribución de causas de paros ordenadas por horas de paro (de mayor a menor)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : paretoData.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Causa</TableHead>
                        <TableHead className="text-right">Horas de Paro</TableHead>
                        <TableHead className="text-right">Porcentaje (%)</TableHead>
                        <TableHead className="text-right">% Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paretoData.map((row, index) => (
                        <TableRow key={index} className={index < 3 ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium">{row.causa}</TableCell>
                          <TableCell className="text-right">{row.horas.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{row.porcentaje.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{row.porcentajeAcumulado.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos disponibles para el análisis de Pareto.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Gráfico de Pareto</CardTitle>
            <CardDescription>
              Visualización de las principales causas de paros ({isMobile ? "Top 5" : "Top 10"}) y su porcentaje
              acumulado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] sm:h-[450px] w-full" />
            ) : chartData.length > 0 ? (
              <div className="h-[350px] sm:h-[450px] w-full" ref={chartRef}>
                <ChartContainer
                  config={{
                    horas: {
                      label: "Horas de Paro",
                      color: "hsl(22, 100%, 50%)",
                    },
                    porcentajeAcumulado: {
                      label: "Porcentaje acumulado",
                      color: "hsl(217, 100%, 30%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={
                        isMobile
                          ? { top: 20, right: 30, left: 0, bottom: 60 }
                          : { top: 20, right: 40, left: 20, bottom: 80 }
                      }
                      barGap={0}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="causa"
                        angle={-45}
                        textAnchor="end"
                        height={isMobile ? 60 : 80}
                        tickMargin={isMobile ? 15 : 25}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        interval={0}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="hsl(22, 100%, 50%)"
                        width={isMobile ? 40 : 60}
                        tickFormatter={isMobile ? (value) => value.toFixed(0) : undefined}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="hsl(217, 100%, 30%)"
                        tickFormatter={(value) => `${isMobile ? value.toFixed(0) : value}%`}
                        width={isMobile ? 40 : 60}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="horas" yAxisId="left" fill="hsl(22, 100%, 50%)" radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="porcentajeAcumulado"
                        yAxisId="right"
                        stroke="hsl(217, 100%, 30%)"
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground h-[350px] sm:h-[450px] flex items-center justify-center">
                No hay suficientes datos para generar el gráfico de Pareto.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
