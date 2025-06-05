"use client"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from "recharts"
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
import { DateTime } from "luxon"

// Define the interfaces for RegistroParo and ParetoData
interface RegistroParo {
  fecha_y_hora_de_paro: string
  especialidad: string
  causa: string
  horas_de_paro: number
  proceso: string
  detalle: string // Añadido campo detalle para cada paro
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
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
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
      const itemDateTime = DateTime.fromFormat(item.fecha_y_hora_de_paro, "yyyy-MM-dd HH:mm:ss", {
        zone: "America/Bogota",
      })

      if (timeRange === "custom") {
        const startDateTime = dateRange.startDate
          ? DateTime.fromISO(dateRange.startDate, {
              zone: "America/Bogota",
            }).startOf("day")
          : null

        const endDateTime = dateRange.endDate
          ? DateTime.fromISO(dateRange.endDate, {
              zone: "America/Bogota",
            }).endOf("day")
          : null

        if (startDateTime && endDateTime) {
          return itemDateTime >= startDateTime && itemDateTime <= endDateTime
        } else if (startDateTime) {
          return itemDateTime >= startDateTime
        } else if (endDateTime) {
          return itemDateTime <= endDateTime
        }
        return true
      }

      // Filtros predefinidos
      switch (timeRange) {
        case "day":
          return itemDateTime.toJSDate().toDateString() === now.toDateString()
        case "week": {
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(now.getDate() - 7)
          return itemDateTime.toJSDate() >= oneWeekAgo
        }
        case "month": {
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(now.getMonth() - 1)
          const oneWeekAgo = new Date()
          return itemDateTime.toJSDate() >= oneWeekAgo
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
      toast.info("Generando archivo Excel con gráfico y análisis por día...", {
        duration: 3000,
      })

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

      // Crear hoja para los datos de Pareto
      const worksheetData = workbook.addWorksheet("Datos de Pareto")

      // Añadir encabezados con estilo para la hoja de Pareto
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

      // Añadir datos de Pareto
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

      // ===== NUEVA HOJA: ANÁLISIS POR DÍA =====
      const worksheetDaily = workbook.addWorksheet("Análisis por Día")

      // Filtrar datos según los filtros aplicados (igual que en el análisis de Pareto)
      const now = new Date()
      const filteredByTime = data.filter((item) => {
        const itemDateTime = DateTime.fromFormat(item.fecha_y_hora_de_paro, "yyyy-MM-dd HH:mm:ss", {
          zone: "America/Bogota",
        })
      
        if (timeRange === "custom") {
          const startDateTime = dateRange.startDate 
            ? DateTime.fromISO(dateRange.startDate, { zone: "America/Bogota" }).startOf('day')
            : null
          
          const endDateTime = dateRange.endDate 
            ? DateTime.fromISO(dateRange.endDate, { zone: "America/Bogota" }).endOf('day')
            : null
      
          if (startDateTime && endDateTime) {
            return itemDateTime >= startDateTime && itemDateTime <= endDateTime
          } else if (startDateTime) {
            return itemDateTime >= startDateTime  // Incluye la fecha exacta
          } else if (endDateTime) {
            return itemDateTime <= endDateTime
          }
          return true
        }
      
        switch (timeRange) {
          case "day": {
            const today = DateTime.now().setZone("America/Bogota").startOf('day')
            const tomorrow = today.plus({ days: 1 })
            return itemDateTime >= today && itemDateTime < tomorrow
          }
          case "week": {
            const weekAgo = DateTime.now().setZone("America/Bogota").minus({ weeks: 1 }).startOf('day')
            return itemDateTime >= weekAgo
          }
          case "month": {
            const monthAgo = DateTime.now().setZone("America/Bogota").minus({ months: 1 }).startOf('day')
            return itemDateTime >= monthAgo
          }
          default:
            return true
        }
      })

      // Filtrar por especialidad y proceso si se han seleccionado
      const filteredData = filteredByTime.filter((item) => {
        const matchesEspecialidad = filtroEspecialidad === "todas" || item.especialidad === filtroEspecialidad
        const matchesProceso = filtroProceso === "todos" || item.proceso === filtroProceso
        return matchesEspecialidad && matchesProceso
      })

      // Definir las categorías de horas que queremos mostrar
      const horasCategories = [
        "Horas de operación",
        "Horas de paro operativo",
        "Horas de paro por fallas",
        "Horas de paro externo",
        "Horas Mtto Programado",
      ]

      // Estructura para almacenar los paros por día, especialidad y categoría
      interface ParoInfo {
        horas: number
        detalles: string[] // Lista de detalles de paros
      }

      // Agrupar datos por día y especialidad
      const dataByDay = filteredData.reduce<Record<string, Record<string, Record<string, ParoInfo>>>>((acc, item) => {
        const date = format(new Date(item.fecha_y_hora_de_paro), "dd/MM/yyyy")
        const especialidad = item.especialidad || "Sin especialidad"
        const categoria = mapCausaToCategory(item.causa) // Función para mapear causas a categorías
        const detalle = item.detalle || "Sin detalle"

        if (!acc[date]) {
          acc[date] = {}
        }

        if (!acc[date][especialidad]) {
          acc[date][especialidad] = {}
        }

        // Inicializar todas las categorías para esta especialidad si no existen
        horasCategories.forEach((cat) => {
          if (!acc[date][especialidad][cat]) {
            acc[date][especialidad][cat] = { horas: 0, detalles: [] }
          }
        })

        // Sumar las horas a la categoría correspondiente y añadir el detalle
        if (acc[date][especialidad][categoria]) {
          acc[date][especialidad][categoria].horas += item.horas_de_paro
          acc[date][especialidad][categoria].detalles.push(detalle)
        } else {
          acc[date][especialidad][categoria] = {
            horas: item.horas_de_paro,
            detalles: [detalle],
          }
        }

        return acc
      }, {})

      // Función para mapear causas a categorías
      function mapCausaToCategory(causa: string): string {
        // Esta es una función simplificada. En un caso real, necesitarías una lógica más compleja
        // basada en tus datos específicos para mapear causas a categorías
        const causaLower = causa.toLowerCase()

        if (causaLower.includes("operación") || causaLower.includes("operacion")) {
          return "Horas de operación"
        } else if (causaLower.includes("operativo") || causaLower.includes("operativa")) {
          return "Horas de paro operativo"
        } else if (causaLower.includes("falla") || causaLower.includes("avería") || causaLower.includes("averia")) {
          return "Horas de paro por fallas"
        } else if (causaLower.includes("externo") || causaLower.includes("externa")) {
          return "Horas de paro externo"
        } else if (
          causaLower.includes("mantenimiento") ||
          causaLower.includes("mtto") ||
          causaLower.includes("programado")
        ) {
          return "Horas Mtto Programado"
        } else {
          // Por defecto, asignar a paro por fallas
          return "Horas de paro por fallas"
        }
      }

      // Obtener todas las especialidades únicas
      const allEspecialidades = Array.from(
        new Set(filteredData.map((item) => item.especialidad || "Sin especialidad")),
      ).sort()

      // Ordenar fechas
      const sortedDates = Object.keys(dataByDay).sort((a, b) => {
        const dateA = parse(a, "dd/MM/yyyy", new Date())
        const dateB = parse(b, "dd/MM/yyyy", new Date())
        return dateA.getTime() - dateB.getTime()
      })

      let currentRow = 1

      // Título principal
      worksheetDaily.addRow(["ANÁLISIS DE PAROS POR DÍA Y ESPECIALIDAD"])
      worksheetDaily.getRow(currentRow).font = { bold: true, size: 16 }
      worksheetDaily.mergeCells(`A${currentRow}:F${currentRow}`)
      currentRow += 2

      // Crear tabla para cada día
      const dailyTotals: Record<string, Record<string, { horas: number; detalles: string[] }>> = {}
      horasCategories.forEach((cat) => {
        dailyTotals[cat] = {}
      })

      for (const date of sortedDates) {
        const dayData = dataByDay[date]

        // Título del día
        worksheetDaily.addRow([date])
        worksheetDaily.getRow(currentRow).font = { bold: true, size: 14 }
        worksheetDaily.getRow(currentRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E2F3" },
        }
        worksheetDaily.mergeCells(`A${currentRow}:F${currentRow}`)
        currentRow++

        // Encabezados de la tabla del día
        const dayHeaderRow = worksheetDaily.addRow(["", ...horasCategories, "Descripción"])
        dayHeaderRow.font = { bold: true }
        dayHeaderRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        }
        currentRow++

        // Datos del día por especialidad
        for (const especialidad of allEspecialidades) {
          if (dayData[especialidad]) {
            const rowData = [especialidad]
            let hasData = false
            let detallesPorEspecialidad: string[] = []

            // Añadir datos para cada categoría
            horasCategories.forEach((cat) => {
              const paroInfo = dayData[especialidad][cat] || {
                horas: 0,
                detalles: [],
              }
              const horas = paroInfo.horas
              rowData.push(horas)

              // Acumular para el total general
              if (!dailyTotals[cat][especialidad]) {
                dailyTotals[cat][especialidad] = { horas: 0, detalles: [] }
              }
              dailyTotals[cat][especialidad].horas += horas

              // Añadir detalles a la lista de detalles por especialidad
              if (paroInfo.detalles.length > 0) {
                detallesPorEspecialidad = detallesPorEspecialidad.concat(paroInfo.detalles)
                dailyTotals[cat][especialidad].detalles = dailyTotals[cat][especialidad].detalles.concat(
                  paroInfo.detalles,
                )
              }

              if (horas > 0) hasData = true
            })

            // Añadir descripción (detalles de los paros)
            const detallesUnicos = [...new Set(detallesPorEspecialidad)].filter(Boolean)
            rowData.push(detallesUnicos.join("; "))

            // Solo añadir la fila si tiene algún dato
            if (hasData) {
              const dataRow = worksheetDaily.addRow(rowData)

              // Formato de números para todas las columnas de horas
              for (let i = 0; i < horasCategories.length; i++) {
                dataRow.getCell(i + 2).numFmt = "0.00"
              }

              // Ajustar el ancho de la celda de descripción si es necesario
              if (detallesUnicos.join("; ").length > 50) {
                dataRow.getCell(horasCategories.length + 2).alignment = {
                  wrapText: true,
                }
              }

              currentRow++
            }
          }
        }

        // Total del día
        const totalRowData = ["TOTAL"]
        let dayTotalHours = 0

        // Calcular totales por categoría para este día
        horasCategories.forEach((cat) => {
          let categoryTotal = 0
          for (const especialidad of allEspecialidades) {
            if (dayData[especialidad] && dayData[especialidad][cat]) {
              categoryTotal += dayData[especialidad][cat].horas
            }
          }
          totalRowData.push(categoryTotal)
          dayTotalHours += categoryTotal
        })

        totalRowData.push("") // Descripción vacía para la fila de total

        const totalRow = worksheetDaily.addRow(totalRowData)
        totalRow.font = { bold: true }
        totalRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCE4D6" },
        }

        // Formato de números para todas las columnas de horas
        for (let i = 0; i < horasCategories.length; i++) {
          totalRow.getCell(i + 2).numFmt = "0.00"
        }

        currentRow += 2 // Espacio después de cada tabla diaria
      }

      // Tabla resumen final
      if (sortedDates.length > 0) {
        const startDate = sortedDates[0]
        const endDate = sortedDates[sortedDates.length - 1]
        const dateRangeText = sortedDates.length > 1 ? `${startDate} - ${endDate}` : startDate

        worksheetDaily.addRow([`RESUMEN TOTAL (${dateRangeText})`])
        worksheetDaily.getRow(currentRow).font = { bold: true, size: 14 }
        worksheetDaily.getRow(currentRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD5E8D4" },
        }
        worksheetDaily.mergeCells(`A${currentRow}:F${currentRow}`)
        currentRow++

        // Encabezados del resumen
        const summaryHeaderRow = worksheetDaily.addRow(["", ...horasCategories, "Descripción"])
        summaryHeaderRow.font = { bold: true }
        summaryHeaderRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        }
        currentRow++

        // Datos del resumen por especialidad
        for (const especialidad of allEspecialidades) {
          const rowData = [especialidad]
          let hasData = false
          let detallesResumen: string[] = []

          // Añadir datos para cada categoría
          horasCategories.forEach((cat) => {
            const paroInfo = dailyTotals[cat][especialidad] || {
              horas: 0,
              detalles: [],
            }
            const totalHoras = paroInfo.horas
            rowData.push(totalHoras)

            // Recopilar detalles únicos para esta especialidad y categoría
            if (paroInfo.detalles.length > 0) {
              detallesResumen = detallesResumen.concat(paroInfo.detalles)
            }

            if (totalHoras > 0) hasData = true
          })

          // Añadir descripción (detalles únicos de todos los paros)
          const detallesUnicos = [...new Set(detallesResumen)].filter(Boolean)
          rowData.push(detallesUnicos.join("; "))

          // Solo añadir la fila si tiene algún dato
          if (hasData) {
            const dataRow = worksheetDaily.addRow(rowData)

            // Formato de números para todas las columnas de horas
            for (let i = 0; i < horasCategories.length; i++) {
              dataRow.getCell(i + 2).numFmt = "0.00"
            }

            // Ajustar el ancho de la celda de descripción si es necesario
            if (detallesUnicos.join("; ").length > 50) {
              dataRow.getCell(horasCategories.length + 2).alignment = {
                wrapText: true,
              }
            }

            currentRow++
          }
        }

        // Gran total
        const grandTotalRowData = ["GRAN TOTAL"]
        let grandTotalHours = 0

        // Calcular totales por categoría
        horasCategories.forEach((cat) => {
          let categoryTotal = 0
          for (const especialidad of allEspecialidades) {
            if (dailyTotals[cat][especialidad]) {
              categoryTotal += dailyTotals[cat][especialidad].horas
            }
          }
          grandTotalRowData.push(categoryTotal)
          grandTotalHours += categoryTotal
        })

        grandTotalRowData.push("") // Descripción vacía para el gran total

        const grandTotalRow = worksheetDaily.addRow(grandTotalRowData)
        grandTotalRow.font = { bold: true, size: 12 }
        grandTotalRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF6B6B" },
        }

        // Formato de números para todas las columnas de horas
        for (let i = 0; i < horasCategories.length; i++) {
          grandTotalRow.getCell(i + 2).numFmt = "0.00"
        }
      }

      // Ajustar ancho de columnas para la hoja diaria
      worksheetDaily.columns = [
        { width: 25 }, // Especialidad
        { width: 15 }, // Horas de operación
        { width: 15 }, // Horas de paro operativo
        { width: 15 }, // Horas de paro por fallas
        { width: 15 }, // Horas de paro externo
        { width: 15 }, // Horas Mtto Programado
        { width: 50 }, // Descripción - Ancho mayor para mostrar detalles
      ]

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

      toast.success("Archivo Excel con gráfico y análisis por día generado correctamente")
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
                <Bar dataKey="horas" yAxisId="left" fill="hsl(22, 100%, 50%)" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="horas"
                    position="top"
                    fill="hsl(22, 100%, 50%)"
                    fontSize={isMobile ? 10 : isLargeScreen ? 12 : 11}
                    fontWeight="bold"
                    formatter={(value: number) => {
                      // Solo mostrar etiqueta si el valor es mayor a 0
                      if (value > 0) {
                        return isMobile ? Math.round(value).toString() : value.toFixed(1)
                      }
                      return ""
                    }}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="porcentajeAcumulado"
                  yAxisId="right"
                  stroke="hsl(217, 100%, 30%)"
                  strokeWidth={2}
                />
                {/* Línea horizontal en el 80%  */}
                <Line
                  yAxisId="right"
                  data={[
                    { causa: chartData[0]?.causa, porcentajeAcumulado: 80 },
                    {
                      causa: chartData[chartData.length - 1]?.causa,
                      porcentajeAcumulado: 80,
                    },
                  ]}
                  dataKey="porcentajeAcumulado"
                  stroke="hsl(217, 100%, 30%)"
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

  // Función para renderizar mensaje de descarga en pantallas muy pequeñas
  function renderMensajeDescarga() {
    return (
      <div className="text-center py-8 text-muted-foreground h-[200px] flex flex-col items-center justify-center gap-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="mb-2">La pantalla es demasiado pequeña para mostrar el gráfico.</p>
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
            {isExporting ? "Exportando..." : "Exportar a Excel"}
          </Button>
        </div>
      </div>
    )
  }
}
