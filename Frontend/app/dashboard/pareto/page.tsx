"use client"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar, Download, FileSpreadsheet, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, isAfter, isBefore, isValid, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { API_ENDPOINTS } from "@/lib/api-config"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the interfaces for RegistroParo and ParetoData
interface RegistroParo {
  fecha_y_hora_de_paro: string
  especialidad: string
  causa: string
  horas_de_paro: number
  proceso: string
}

interface ParetoData {
  causa: string
  horas: number
  porcentaje: number
  porcentajeAcumulado: number
}

// Update the component to include date range filters
export default function ParetoPage() {
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week" | "day" | "custom">("all")
  const [data, setData] = useState<RegistroParo[]>([])
  const [paretoData, setParetoData] = useState<ParetoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todas")
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [filtroProceso, setFiltroProceso] = useState<string>("todos")
  const [procesos, setProcesos] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [librariesLoaded, setLibrariesLoaded] = useState({
    html2canvas: false,
    exceljs: false,
  })
  const [activeTab, setActiveTab] = useState<"tabla" | "grafico">("tabla")

  // Add date range filter state
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  })
  const [dateRangeError, setDateRangeError] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)

  // Detectar si estamos en un dispositivo móvil
  const isMobile = useIsMobile()

  // Detectar pantallas grandes
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false)

  // Referencia para el contenedor del gráfico
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280) // xl breakpoint
      setIsVerySmallScreen(window.innerWidth < 480) // muy pequeño
    }

    // Comprobar al cargar
    checkScreenSize()

    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkScreenSize)

    return () => {
      window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

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
        const uniqueProcesos = Array.from(new Set(apiData.map((item) => item.proceso)))
          .filter(Boolean)
          .sort()

        setEspecialidades(uniqueEspecialidades)
        setProcesos(uniqueProcesos)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Error desconocido al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Validar el rango de fechas
  const validateDateRange = (): boolean => {
    setDateRangeError(null)

    // Si ambas fechas están vacías, es válido (no hay filtro)
    if (!dateRange.startDate && !dateRange.endDate) {
      return true
    }

    // Si solo una fecha está establecida, es válido
    if ((!dateRange.startDate && dateRange.endDate) || (dateRange.startDate && !dateRange.endDate)) {
      return true
    }

    // Validar formato de fechas
    const startDate = parse(dateRange.startDate, "yyyy-MM-dd", new Date())
    const endDate = parse(dateRange.endDate, "yyyy-MM-dd", new Date())

    if (!isValid(startDate) || !isValid(endDate)) {
      setDateRangeError("Formato de fecha inválido")
      return false
    }

    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (isAfter(startDate, endDate)) {
      setDateRangeError("La fecha de inicio debe ser anterior a la fecha de fin")
      return false
    }

    return true
  }

  // Procesar datos para el análisis de Pareto cuando cambian los filtros
  useEffect(() => {
    if (data.length === 0) return

    if (!validateDateRange()) return

    // Filtrar datos según el rango de tiempo seleccionado
    const now = new Date()
    const filteredByTime = data.filter((item) => {
      const itemDate = new Date(item.fecha_y_hora_de_paro)

      // Si estamos usando un rango de fechas personalizado
      if (timeRange === "custom") {
        const startDateFilter = dateRange.startDate ? parse(dateRange.startDate, "yyyy-MM-dd", new Date()) : null
        const endDateFilter = dateRange.endDate ? parse(dateRange.endDate, "yyyy-MM-dd", new Date()) : null

        // Ajustar la fecha de fin para incluir todo el día
        if (endDateFilter) {
          endDateFilter.setHours(23, 59, 59, 999)
        }

        if (startDateFilter && endDateFilter) {
          return isAfter(itemDate, startDateFilter) && isBefore(itemDate, endDateFilter)
        } else if (startDateFilter) {
          return isAfter(itemDate, startDateFilter)
        } else if (endDateFilter) {
          return isBefore(itemDate, endDateFilter)
        }
        return true
      }

      // Filtros predefinidos
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

    // Filtrar por especialidad y proceso si se han seleccionado
    const filteredByEspecialidadAndProceso = filteredByTime.filter((item) => {
      const matchesEspecialidad = filtroEspecialidad === "todas" || item.especialidad === filtroEspecialidad
      const matchesProceso = filtroProceso === "todos" || item.proceso === filtroProceso
      return matchesEspecialidad && matchesProceso
    })

    // Agrupar por causa y sumar horas de paro
    const causaGroups = filteredByEspecialidadAndProceso.reduce<Record<string, number>>((acc, item) => {
      const causa = item.causa.toLowerCase() || "Sin especificar"
      acc[causa] = (acc[causa] || 0) + item.horas_de_paro
      return acc
    }, {})

    // Convertir a array y ordenar por horas (de mayor a menor)
    const sortedCausas = Object.entries(causaGroups)
      .map(([causa, horas]) => ({ causa, horas }))
      .sort((a, b) => b.horas - a.horas)

    // Calcular el total de horas
    const totalHoras = sortedCausas.reduce((sum, item) => sum + item.horas, 0)
    console.log("Total de horas calculado:", totalHoras)

    // Calcular porcentajes y porcentaje acumulado
    let acumulado = 0
    const paretoDataCalculated = sortedCausas.map((item) => {
      // Asegurarse de que no haya división por cero y que los valores sean números
      const porcentaje = totalHoras > 0 ? Number((item.horas / totalHoras) * 100) : 0
      acumulado += porcentaje

      // Registrar los valores para depuración
      console.log(`Causa: ${item.causa}, Horas: ${item.horas}, Porcentaje: ${porcentaje}, Acumulado: ${acumulado}`)

      return {
        causa: item.causa,
        horas: Number(item.horas),
        porcentaje: porcentaje,
        porcentajeAcumulado: acumulado,
      }
    })

    // Verificar los datos calculados
    console.log("Datos de Pareto calculados:", paretoDataCalculated)

    setParetoData(paretoDataCalculated)

    // Calcular el número total de páginas
    setTotalPages(Math.ceil(paretoDataCalculated.length / itemsPerPage))

    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1)
  }, [data, timeRange, filtroEspecialidad, filtroProceso, itemsPerPage, dateRange])

  // Manejar cambios en el rango de tiempo
  const handleTimeRangeChange = (value: string) => {
    const newTimeRange = value as "all" | "month" | "week" | "day" | "custom"
    setTimeRange(newTimeRange)

    // Si cambiamos a un rango predefinido, limpiar el rango de fechas personalizado
    if (newTimeRange !== "custom") {
      setDateRange({ startDate: "", endDate: "" })
    }
  }

  // Manejar cambios en el rango de fechas
  const handleDateRangeChange = (field: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Si establecemos fechas, cambiar automáticamente a rango personalizado
    if (timeRange !== "custom") {
      setTimeRange("custom")
    }
  }

  // Limpiar filtros de fecha
  const clearDateRange = () => {
    setDateRange({ startDate: "", endDate: "" })
    setDateRangeError(null)

    // Si estamos en modo personalizado sin fechas, volver a "all"
    if (timeRange === "custom") {
      setTimeRange("all")
    }
  }

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

    // Incluir información del filtro en el nombre del archivo
    let fileName = `pareto_analisis_${format(new Date(), "yyyy-MM-dd")}`

    if (timeRange === "custom" && (dateRange.startDate || dateRange.endDate)) {
      fileName += `_${dateRange.startDate || "inicio"}_a_${dateRange.endDate || "fin"}`
    } else if (timeRange !== "all") {
      fileName += `_${timeRange}`
    }

    link.setAttribute("download", `${fileName}.csv`)
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
        {
          header: "Porcentaje Acumulado (%)",
          key: "porcentajeAcumulado",
          width: 20,
        },
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
        custom: "Rango personalizado",
      }[timeRange]

      worksheetChart.addRow([`Rango de tiempo: ${timeRangeText}`])

      // Añadir información del rango de fechas si es personalizado
      if (timeRange === "custom" && (dateRange.startDate || dateRange.endDate)) {
        worksheetChart.addRow([`Fechas: ${dateRange.startDate || "Inicio"} a ${dateRange.endDate || "Fin"}`])
      }

      worksheetChart.addRow([`Especialidad: ${filtroEspecialidad === "todas" ? "Todas" : filtroEspecialidad}`])
      worksheetChart.addRow([`Proceso: ${filtroProceso === "todos" ? "Todos" : filtroProceso}`])
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
      let timeRangeFileName = {
        all: "todo_tiempo",
        month: "ultimo_mes",
        week: "ultima_semana",
        day: "hoy",
        custom: "personalizado",
      }[timeRange]

      // Añadir fechas al nombre si es personalizado
      if (timeRange === "custom" && (dateRange.startDate || dateRange.endDate)) {
        timeRangeFileName = `${dateRange.startDate || "inicio"}_a_${dateRange.endDate || "fin"}`
      }

      const especialidadFileName =
        filtroEspecialidad === "todas" ? "todas_especialidades" : filtroEspecialidad.replace(/\s+/g, "_").toLowerCase()

      const procesoFileName =
        filtroProceso === "todos" ? "todos_procesos" : filtroProceso.replace(/\s+/g, "_").toLowerCase()

      const fileName = `pareto_analisis_${timeRangeFileName}_${especialidadFileName}_${procesoFileName}_${format(
        new Date(),
        "yyyy-MM-dd",
      )}.xlsx`

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer()

      // Crear blob y descargar
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
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

  // Función para truncar texto largo
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text || ""
    return text.substring(0, maxLength) + "..."
  }

  // Preparar datos para el gráfico - mostrar menos elementos en móviles
  const chartData = paretoData.slice(0, isMobile ? 3 : isLargeScreen ? 8 : 6).map((item) => ({
    causa: truncateText(item.causa, isMobile ? 10 : isLargeScreen ? 25 : 15),
    horas: item.horas,
    porcentajeAcumulado: item.porcentajeAcumulado,
  }))

  // Obtener los datos para la página actual
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return paretoData.slice(startIndex, endIndex)
  }

  // Generar los números de página para la paginación
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = isMobile ? 3 : 5

    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Mostrar un subconjunto de páginas con elipsis
      if (currentPage <= 3) {
        // Estamos cerca del inicio
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pageNumbers.push(i)
        }
        if (totalPages > 4) pageNumbers.push("ellipsis")
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Estamos cerca del final
        pageNumbers.push(1)
        pageNumbers.push("ellipsis")
        for (let i = Math.max(totalPages - 3, 1); i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // Estamos en el medio
        pageNumbers.push(1)
        pageNumbers.push("ellipsis")
        pageNumbers.push(currentPage - 1)
        pageNumbers.push(currentPage)
        pageNumbers.push(currentPage + 1)
        pageNumbers.push("ellipsis")
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  // Cambiar el número de elementos por página
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number.parseInt(value)
    setItemsPerPage(newItemsPerPage)
    // Ajustar la página actual para que no exceda el nuevo total de páginas
    const newTotalPages = Math.ceil(paretoData.length / newItemsPerPage)
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1)
    }
  }

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

        {dateRangeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error en el rango de fechas</AlertTitle>
            <AlertDescription>{dateRangeError}</AlertDescription>
          </Alert>
        )}

        {/* Filtros en acordeón para móviles */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-range" className="text-sm font-medium">
                Rango de tiempo
              </Label>
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger id="time-range" className="w-full">
                  <SelectValue placeholder="Seleccionar rango de tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="day">Hoy</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidad" className="text-sm font-medium">
                Especialidad
              </Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="proceso" className="text-sm font-medium">
                Proceso
              </Label>
              <Select value={filtroProceso} onValueChange={setFiltroProceso}>
                <SelectTrigger id="proceso" className="w-full">
                  <SelectValue placeholder="Seleccionar proceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los procesos</SelectItem>
                  {procesos.map((proc) => (
                    <SelectItem key={proc} value={proc}>
                      {proc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rango de fechas personalizado */}
          {timeRange === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Fecha de inicio
                </Label>
                <div className="relative">
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                    className="w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  Fecha de fin
                </Label>
                <div className="relative">
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                    className="w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mostrar filtros activos */}
        <div className="flex flex-wrap gap-2">
          {timeRange !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 border-primary/30">
              <Calendar className="h-3 w-3 text-primary" />
              {timeRange === "custom"
                ? "Rango personalizado"
                : timeRange === "month"
                  ? "Último mes"
                  : timeRange === "week"
                    ? "Última semana"
                    : "Hoy"}
              <X
                className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                onClick={() => setTimeRange("all")}
              />
            </Badge>
          )}

          {timeRange === "custom" && (dateRange.startDate || dateRange.endDate) && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 border-primary/30">
              <Calendar className="h-3 w-3 text-primary" />
              {dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate} - ${dateRange.endDate}`
                : dateRange.startDate
                  ? `Desde ${dateRange.startDate}`
                  : `Hasta ${dateRange.endDate}`}
              <X
                className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                onClick={clearDateRange}
              />
            </Badge>
          )}

          {filtroEspecialidad !== "todas" && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 border-primary/30">
              <span className="text-primary">Especialidad:</span>
              {filtroEspecialidad}
              <X
                className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                onClick={() => setFiltroEspecialidad("todas")}
              />
            </Badge>
          )}

          {filtroProceso !== "todos" && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5 border-primary/30">
              <span className="text-primary">Proceso:</span>
              {filtroProceso}
              <X
                className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                onClick={() => setFiltroProceso("todos")}
              />
            </Badge>
          )}
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

        {/* Contenido principal con tabs en móvil */}
        {isMobile ? (
          <Tabs
            defaultValue="tabla"
            className="w-full"
            onValueChange={(value) => setActiveTab(value as "tabla" | "grafico")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tabla">Tabla</TabsTrigger>
              <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            </TabsList>
            <TabsContent value="tabla" className="mt-2">
              {/* Tabla de Pareto */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tabla de Pareto</CardTitle>
                </CardHeader>
                <CardContent>{renderTablaPareto()}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="grafico" className="mt-2">
              {/* Gráfico de Pareto o mensaje de descarga */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Gráfico de Pareto</CardTitle>
                  <CardDescription>
                    Visualización de las principales causas de paros (Top 3) y su porcentaje acumulado
                  </CardDescription>
                </CardHeader>
                <CardContent>{isVerySmallScreen ? renderMensajeDescarga() : renderGraficoPareto()}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Vista de escritorio: mostrar ambos componentes
          <>
            {/* Tabla de Pareto */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Tabla de Pareto</CardTitle>
              </CardHeader>
              <CardContent>{renderTablaPareto()}</CardContent>
            </Card>

            {/* Gráfico de Pareto */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Gráfico de Pareto</CardTitle>
                <CardDescription>
                  Visualización de las principales causas de paros (
                  {isMobile ? "Top 3" : isLargeScreen ? "Top 8" : "Top 6"}) y su porcentaje acumulado
                </CardDescription>
              </CardHeader>
              <CardContent>{renderGraficoPareto()}</CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )

  // Función para renderizar la tabla de Pareto
  function renderTablaPareto() {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      )
    }

    if (paretoData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No hay datos disponibles para el análisis de Pareto.
        </div>
      )
    }

    return (
      <>
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="items-per-page" className="text-sm whitespace-nowrap">
              Filas por página:
            </Label>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger id="items-per-page" className="w-20">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Causa</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">% Acum.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageData().map((row, index) => {
                  // Calcular el índice real para destacar las primeras 3 causas globales
                  const globalIndex = (currentPage - 1) * itemsPerPage + index
                  return (
                    <TableRow key={index} className={globalIndex < 3 ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        {isMobile ? truncateText(row.causa, 20) : row.causa}
                      </TableCell>
                      <TableCell className="text-right">{row.horas.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.porcentaje.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{row.porcentajeAcumulado.toFixed(2)}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, index) => (
                  <PaginationItem
                    key={index}
                    className={
                      isMobile &&
                      typeof pageNum === "number" &&
                      pageNum !== currentPage &&
                      pageNum !== 1 &&
                      pageNum !== totalPages
                        ? "hidden"
                        : ""
                    }
                  >
                    {pageNum === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => typeof pageNum === "number" && setCurrentPage(pageNum)}
                        className={typeof pageNum === "number" ? "cursor-pointer" : ""}
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="mt-2 text-center text-sm text-muted-foreground">
          Mostrando {Math.min(paretoData.length, (currentPage - 1) * itemsPerPage + 1)} a{" "}
          {Math.min(currentPage * itemsPerPage, paretoData.length)} de {paretoData.length} causas
        </div>
      </>
    )
  }

  // Función para renderizar el gráfico de Pareto
  function renderGraficoPareto() {
    if (isLoading) {
      return <Skeleton className="h-[300px] sm:h-[400px] w-full" />
    }

    if (paretoData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground h-[300px] sm:h-[400px] flex items-center justify-center">
          No hay suficientes datos para generar el gráfico de Pareto.
        </div>
      )
    }

    return (
      <div className="h-[300px] sm:h-[400px] xl:h-[500px] w-full" ref={chartContainerRef}>
        <div ref={chartRef} className="w-full h-full">
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
                    ? { top: 20, right: 30, left: 5, bottom: 70 }
                    : isLargeScreen
                      ? { top: 20, right: 40, left: 20, bottom: 100 }
                      : { top: 20, right: 40, left: 20, bottom: 80 }
                }
                barSize={isMobile ? 30 : isLargeScreen ? 25 : 30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="causa"
                  angle={isMobile ? -40 : isLargeScreen ? -60 : -45}
                  textAnchor="end"
                  height={isMobile ? 70 : isLargeScreen ? 100 : 80}
                  tickMargin={isMobile ? 20 : isLargeScreen ? 30 : 25}
                  tick={{
                    fontSize: isMobile ? 9 : isLargeScreen ? 11 : 12,
                    width: isMobile ? 60 : isLargeScreen ? 100 : 80,
                    overflow: "hidden",
                  }}
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="hsl(22, 100%, 50%)"
                  width={isMobile ? 35 : 40}
                  tickCount={isMobile ? 3 : 5}
                  tickFormatter={(value) => (isMobile ? `${Math.round(value)}` : `${value}`)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(217, 100%, 30%)"
                  tickFormatter={(value) => `${Math.round(value)}%`}
                  width={isMobile ? 35 : 40}
                  tickCount={isMobile ? 3 : 5}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "horas") return [`${Number(value).toFixed(2)} horas`, "Horas de paro"]
                    if (name === "porcentajeAcumulado") return [`${Number(value).toFixed(2)}%`, "% Acumulado"]
                    return [value, name]
                  }}
                  wrapperStyle={isMobile ? { fontSize: "12px" } : undefined}
                />
                <Bar dataKey="horas" yAxisId="left" fill="hsl(22, 100%, 50%)" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="porcentajeAcumulado"
                  yAxisId="right"
                  stroke="hsl(217, 100%, 30%)"
                  strokeWidth={2}
                />
                {/* Línea horizontal en el 80% para visualizar el principio de Pareto */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={() => 80}
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    )
  }

  // Función para renderizar el mensaje de descarga en pantallas muy pequeñas
  function renderMensajeDescarga() {
    if (isLoading) {
      return <Skeleton className="h-[200px] w-full" />
    }

    if (paretoData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No hay datos disponibles para el análisis de Pareto.
        </div>
      )
    }

    return (
      <div className="py-6 flex flex-col items-center justify-center space-y-4">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-primary/50" />
          <p>El gráfico no está disponible en pantallas muy pequeñas.</p>
          <p className="mt-2">Puede descargar los datos para visualizarlos en otro dispositivo.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            disabled={!librariesLoaded.exceljs || !librariesLoaded.html2canvas || isExporting}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Descargar Excel"}
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
    )
  }
}
