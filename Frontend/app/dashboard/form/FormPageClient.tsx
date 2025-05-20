"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Layers,
  ListFilter,
  Loader2,
  Save,
  Settings,
  Tag,
  PenToolIcon as Tool,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/api-config"
import { useMediaQuery } from "@/hooks/use-media-query"

// Interfaces para los tipos de datos
interface Categoria {
  id_categoria: number
  nombre_categoria: string
  codigo_categoria: string
}

interface Proceso {
  id_proceso: number
  nombre_proceso: string
  codigo_proceso: string
}

interface Especialidad {
  id_especialidad: number
  nombre_especialidad: string
  codigo_especialidad?: string
}

interface Tipo {
  [key: string]: any
  nombre_tipo: string
}

interface Causa {
  [key: string]: any
}

// Interfaz genérica para equipos
interface Equipo {
  [key: string]: any
}

export default function FormPageClient() {
  // Dentro del componente FormPageClient, añadir:
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estados para almacenar las opciones de los selects
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [causas, setCausas] = useState<Causa[]>([])
  const { user } = useAuth()

  // Media queries para responsividad
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)")

  // Campos detectados para equipos
  const [equipoFields, setEquipoFields] = useState<{
    idField: string | null
    nameField: string | null
    codeField: string | null
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  })

  // Campos detectados para especialidades
  const [tipoFields, setTipoFields] = useState<{
    idField: string | null
    nameField: string | null
    codeField: string | null
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  })
  const [causaFields, setCausaFields] = useState<{
    idField: string | null
    nameField: string | null
    codeField: string | null
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  })

  // Estados para controlar la carga y errores
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true)
  const [isLoadingProcesos, setIsLoadingProcesos] = useState(true)
  const [isLoadingEquipos, setIsLoadingEquipos] = useState(false)
  const [isLoadingEspecialidades, setIsLoadingEspecialidades] = useState(true)
  const [isLoadingTipos, setIsLoadingTipos] = useState(false)
  const [isLoadingCausas, setIsLoadingCausas] = useState(false)

  const [errorCategorias, setErrorCategorias] = useState<string | null>(null)
  const [errorProcesos, setErrorProcesos] = useState<string | null>(null)
  const [errorEquipos, setErrorEquipos] = useState<string | null>(null)
  const [errorEspecialidades, setErrorEspecialidades] = useState<string | null>(null)
  const [errorTipos, setErrorTipos] = useState<string | null>(null)
  const [errorCausas, setErrorCausas] = useState<string | null>(null)

  // Estado para el formulario
  const [formData, setFormData] = useState({
    category: "",
    process: "",
    equipment: "",
    specialty: "",
    type: "",
    cause: "",
    details: "",
    stopDate: "",
    startDate: "",
  })

  // Añadir un nuevo estado para controlar la alerta de validación
  const [validationAlert, setValidationAlert] = useState<string | null>(null)
  // Añadir estos estados para controlar la apertura/cierre de cada popover
  // Agregar después de la declaración de validationAlert
  const [openCategory, setOpenCategory] = useState(false)
  const [openProcess, setOpenProcess] = useState(false)
  const [openEquipment, setOpenEquipment] = useState(false)
  const [openSpecialty, setOpenSpecialty] = useState(false)
  const [openType, setOpenType] = useState(false)
  const [openCause, setOpenCause] = useState(false)
  const [cadencia, setCadencia] = useState(1)

  // Función para detectar los campos de un objeto de equipo
  const detectEquipoFields = (equipoSample: Equipo) => {
    // Inicializar campos detectados
    let detectedIdField: string | null = null
    let detectedNameField: string | null = null
    let detectedCodeField: string | null = null

    // Obtener el proceso seleccionado
    const procesoSeleccionado = procesos.find((p) => p.id_proceso.toString() === formData.process)
    const nombreProceso = procesoSeleccionado?.nombre_proceso.toLowerCase().replace(/ /g, "_") || ""

    // Buscar campos en el objeto
    Object.keys(equipoSample).forEach((key) => {
      // Buscar campo ID
      if (key.startsWith("id_") || key === "id") {
        detectedIdField = key
      }

      // Buscar campo nombre
      if (key.includes("nombre") || key.includes("name")) {
        detectedNameField = key
      }

      // Buscar campo código
      if (key.includes("codigo") || key.includes("code")) {
        detectedCodeField = key
      }
    })

    // Si no se encontró un campo ID específico, intentar construirlo
    if (!detectedIdField && nombreProceso) {
      const constructedIdField = `id_${nombreProceso}`
      if (constructedIdField in equipoSample) {
        detectedIdField = constructedIdField
      }
    }

    console.log("Campos detectados:", {
      detectedIdField,
      detectedNameField,
      detectedCodeField,
    })

    return {
      idField: detectedIdField,
      nameField: detectedNameField,
      codeField: detectedCodeField,
    }
  }

  // Cargar las categorías desde la API
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoadingCategorias(true)
      setErrorCategorias(null)

      try {
        const response = await fetch(API_ENDPOINTS.dynamic("Categoria"))

        if (!response.ok) {
          throw new Error(`Error al cargar categorías: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setCategorias(data)
      } catch (err) {
        console.error("Error fetching categorias:", err)
        setErrorCategorias(err instanceof Error ? err.message : "Error desconocido al cargar categorías")
      } finally {
        setIsLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  // Cargar los procesos desde la API
  useEffect(() => {
    const fetchProcesos = async () => {
      setIsLoadingProcesos(true)
      setErrorProcesos(null)

      try {
        const response = await fetch(API_ENDPOINTS.dynamic("Proceso"))

        if (!response.ok) {
          throw new Error(`Error al cargar procesos: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setProcesos(data)
      } catch (err) {
        console.error("Error fetching procesos:", err)
        setErrorProcesos(err instanceof Error ? err.message : "Error desconocido al cargar procesos")
      } finally {
        setIsLoadingProcesos(false)
      }
    }

    fetchProcesos()
  }, [])

  // Cargar los equipos cuando se selecciona un proceso
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!formData.process) return

      setIsLoadingEquipos(true)
      setErrorEquipos(null)
      setEquipos([]) // Limpiar equipos anteriores
      setEquipoFields({ idField: null, nameField: null, codeField: null }) // Resetear campos detectados

      try {
        // Obtener el nombre del proceso seleccionado
        const procesoSeleccionado = procesos.find((p) => p.id_proceso.toString() === formData.process)

        if (!procesoSeleccionado) {
          throw new Error("Proceso no encontrado")
        }

        // Convertir espacios a guiones bajos para la URL
        const nombreProcesoUrl = procesoSeleccionado.nombre_proceso.replace(/ /g, "_")

        const response = await fetch(API_ENDPOINTS.dynamic(nombreProcesoUrl))

        if (!response.ok) {
          throw new Error(`Error al cargar equipos: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Detectar campos si hay datos
        if (data.length > 0) {
          const detectedFields = detectEquipoFields(data[0])
          setEquipoFields(detectedFields)
        }

        setEquipos(data)

        const cadenciaResonse = await fetch(`${API_ENDPOINTS.cadencias}/${procesoSeleccionado.id_proceso}`)
        if (!cadenciaResonse.ok) {
          throw new Error(`Error al cargar cadencias: ${cadenciaResonse.status} ${cadenciaResonse.statusText}`)
        }
        const cadenciaData = await cadenciaResonse.json()

        setCadencia(cadenciaData.valor_cadencia)
      } catch (err) {
        console.error("Error fetching equipos:", err)
        setErrorEquipos(err instanceof Error ? err.message : "Error desconocido al cargar equipos")
      } finally {
        setIsLoadingEquipos(false)
      }
    }

    if (formData.process) {
      fetchEquipos()
    }
  }, [formData.process, procesos])

  // Cargar especialidades
  useEffect(() => {
    const fetchEspecialidades = async () => {
      setIsLoadingEspecialidades(true)
      setErrorEspecialidades(null)

      try {
        const response = await fetch(API_ENDPOINTS.dynamic("Especialidad"))
        if (!response.ok) {
          throw new Error(`Error al cargar especialidades: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setEspecialidades(data)
      } catch (err) {
        console.error("Error fetching especialidades:", err)
        setErrorEspecialidades(err instanceof Error ? err.message : "Error desconocido al cargar especialidades")
      } finally {
        setIsLoadingEspecialidades(false)
      }
    }

    fetchEspecialidades()
  }, [])

  // Manejar cambios en los campos del formulario
  const handleChange = (field: string, value: string) => {
    // Si cambia el proceso, resetear el equipo seleccionado
    if (field === "process") {
      setFormData({
        ...formData,
        [field]: value,
        equipment: "", // Resetear equipo
      })
    }
    // Si cambia la especialidad, resetear tipo y causa
    else if (field === "specialty") {
      setFormData({
        ...formData,
        [field]: value,
        type: "", // Resetear tipo
        cause: "", // Resetear causa
      })
    }
    // Si cambia el tipo, resetear causa
    else if (field === "type") {
      setFormData({
        ...formData,
        [field]: value,
        cause: "", // Resetear causa
      })
    } else {
      setFormData({
        ...formData,
        [field]: value,
      })
    }
  }

  // Función para obtener el ID de un equipo
  const getEquipoId = (equipo: Equipo) => {
    if (equipoFields.idField && equipo[equipoFields.idField] !== undefined) {
      return equipo[equipoFields.idField]
    }

    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(equipo).find((key) => key.startsWith("id_"))
    if (idField) {
      return equipo[idField]
    }

    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(equipo)[0]
    return equipo[firstKey]
  }

  // Función para obtener el nombre de un equipo
  const getEquipoName = (equipo: Equipo) => {
    if (equipoFields.nameField && equipo[equipoFields.nameField] !== undefined) {
      return equipo[equipoFields.nameField]
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(equipo).find(
      (key) => key.includes("nombre") || key.includes("name") || key.includes("descripcion"),
    )
    if (nameField) {
      return equipo[nameField]
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Equipo ${getEquipoId(equipo)}`
  }

  const getTipoId = (tipo: Tipo) => {
    if (tipoFields.idField && tipo[tipoFields.idField] !== undefined) {
      return tipo[tipoFields.idField]
    }

    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(tipo).find((key) => key.startsWith("id_"))
    if (idField) {
      return tipo[idField]
    }

    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(tipo)[0]
    return tipo[firstKey]
  }

  const getTipoName = (tipo: Tipo) => {
    if (tipoFields.nameField && tipo[tipoFields.nameField] !== undefined) {
      return tipo[tipoFields.nameField]
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(tipo).find(
      (key) => key.includes("nombre") || key.includes("name") || key.includes("descripcion"),
    )
    if (nameField) {
      return tipo[nameField]
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Tipo ${getTipoId(tipo)}`
  }

  const getCausaId = (causa: Causa) => {
    if (causaFields.idField && causa[causaFields.idField] !== undefined) {
      return causa[causaFields.idField]
    }
    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(causa).find((key) => key.startsWith("id_"))
    if (idField) {
      return causa[idField]
    }
    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(causa)[0]
    return causa[firstKey]
  }

  const getCausaName = (causa: Causa) => {
    if (causaFields.nameField && causa[causaFields.nameField] !== undefined) {
      return causa[causaFields.nameField]
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(causa).find(
      (key) => key.includes("nombre") || key.includes("name") || key.includes("descripcion"),
    )
    if (nameField) {
      return causa[nameField]
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Causa ${getCausaId(causa)}`
  }

  // Cargar los tipos cuando se selecciona una especialidad
  useEffect(() => {
    const fetchTipos = async () => {
      if (!formData.specialty) return

      setIsLoadingTipos(true)
      setErrorTipos(null)
      setTipos([])
      setTipoFields({ idField: null, nameField: null, codeField: null })

      try {
        const especialidadSeleccionada = especialidades.find((e) => e.id_especialidad.toString() === formData.specialty)

        if (!especialidadSeleccionada) {
          throw new Error("Especialidad no encontrado")
        }

        // Convertir espacios a guiones bajos para la URL
        const nombreEspecialidadUrl = especialidadSeleccionada.nombre_especialidad.replace(/ /g, "_")

        const response = await fetch(API_ENDPOINTS.dynamic(nombreEspecialidadUrl))

        if (!response.ok) {
          throw new Error(`Error al cargar tipos: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setTipos(data)
      } catch (err) {
        console.error("Error fetching tipos:", err)
        setErrorTipos(err instanceof Error ? err.message : "Error desconocido al cargar tipos")
      } finally {
        setIsLoadingTipos(false)
      }
    }

    if (formData.specialty) {
      fetchTipos()
    }
  }, [formData.specialty, especialidades])

  // Cargar las causas cuando se selecciona un tipo
  useEffect(() => {
    const fetchCausas = async () => {
      if (!formData.type) return

      setIsLoadingCausas(true)
      setErrorCausas(null)
      setCausas([])
      setCausaFields({ idField: null, nameField: null, codeField: null })

      try {
        // Obtener el nombre y el ID del tipo seleccionado
        const tipoSeleccionado = tipos.find((e) => getTipoId(e).toString() === formData.type)

        const nombrefield = tipoSeleccionado
          ? Object.keys(tipoSeleccionado).find((key) => key.startsWith("nombre_"))
          : undefined

        const nombreTipo = tipoSeleccionado?.[nombrefield!]?.toLowerCase().replace(/ /g, "_") || ""

        const response = await fetch(API_ENDPOINTS.dynamic(nombreTipo))

        if (!response.ok) {
          throw new Error(`Error al cargar causas: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setCausas(data)
      } catch (err) {
        console.error("Error fetching causas:", err)
        setErrorCausas(err instanceof Error ? err.message : "Error desconocido al cargar causas")
      } finally {
        setIsLoadingCausas(false)
      }
    }

    if (formData.type) {
      fetchCausas()
    }
  }, [formData.type, tipos])

  // Modificar la función validateForm para que también actualice el estado de la alerta
  const validateForm = () => {
    if (!formData.category) return "Debe seleccionar una categoría"
    if (!formData.process) return "Debe seleccionar un proceso"
    if (!formData.equipment) return "Debe seleccionar un equipo"
    if (!formData.specialty) return "Debe seleccionar una especialidad"
    if (!formData.type) return "Debe seleccionar un tipo"
    if (!formData.cause) return "Debe seleccionar una causa"
    if (!formData.details.trim()) return "Debe ingresar detalles del paro"
    if (!formData.stopDate) return "Debe ingresar fecha y hora de paro"
    if (!formData.startDate) return "Debe ingresar fecha y hora de arranque"

    // Validar que la fecha de arranque sea posterior a la fecha de paro
    const stopDate = new Date(formData.stopDate)
    const startDate = new Date(formData.startDate)
    if (startDate <= stopDate) {
      return "La fecha de arranque debe ser posterior a la fecha de paro"
    }

    return null
  }

  // Añadir una función para verificar si el formulario está completo
  const isFormComplete = () => {
    return (
      !!formData.category &&
      !!formData.process &&
      !!formData.equipment &&
      !!formData.specialty &&
      !!formData.type &&
      !!formData.cause &&
      !!formData.details.trim() &&
      !!formData.stopDate &&
      !!formData.startDate
    )
  }

  // Modificar la función handleSubmit para mostrar la alerta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar el formulario
    const validationError = validateForm()
    if (validationError) {
      setValidationAlert(validationError)
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setValidationAlert(null)
    setIsSubmitting(true)

    try {
      // Obtener los nombres de los elementos seleccionados
      const categoriaSeleccionada = categorias.find((cat) => cat.id_categoria.toString() === formData.category)

      const procesoSeleccionado = procesos.find((proc) => proc.id_proceso.toString() === formData.process)

      const equipoSeleccionado = equipos.find((equipo) => getEquipoId(equipo).toString() === formData.equipment)

      const especialidadSeleccionada = especialidades.find(
        (esp) => esp.id_especialidad.toString() === formData.specialty,
      )

      const tipoSeleccionado = tipos.find((tipo) => getTipoId(tipo).toString() === formData.type)

      const causaSeleccionada = causas.find((causa) => getCausaId(causa).toString() === formData.cause)

      // Calcular horas de paro
      const stopDate = new Date(formData.stopDate)
      const startDate = new Date(formData.startDate)
      //redondear a 3 decimales
      const horasDeParo = Math.round(((startDate.getTime() - stopDate.getTime()) / 3600000) * 1000) / 1000

      const perdidida = Math.round(horasDeParo * cadencia)

      // Crear el objeto de datos para enviar
      const dataToSend = {
        id_categoria: Number.parseInt(formData.category),
        categoria: categoriaSeleccionada?.nombre_categoria || "",
        id_proceso: Number.parseInt(formData.process),
        proceso: procesoSeleccionado?.nombre_proceso || "",
        id_equipo: Number.parseInt(formData.equipment),
        equipo: equipoSeleccionado ? getEquipoName(equipoSeleccionado) : "",
        id_especialidad: Number.parseInt(formData.specialty),
        especialidad: especialidadSeleccionada?.nombre_especialidad || "",
        id_tipo: Number.parseInt(formData.type),
        tipo: tipoSeleccionado ? getTipoName(tipoSeleccionado) : "",
        id_causa: Number.parseInt(formData.cause),
        causa: causaSeleccionada ? getCausaName(causaSeleccionada) : "",
        detalle: formData.details,
        fecha_y_hora_de_paro: formData.stopDate,
        fecha_y_hora_de_arranque: formData.startDate,
        horas_de_paro: horasDeParo,
        // Valores por defecto o calculados
        cadencia: cadencia,
        perdida_de_produccion: perdidida,
        id_usuario: user?.id_usuario || 1, // Usar el ID del usuario autenticado
        nombre_usuario: user?.nombre_usuario || "Usuario del sistema", // Usar el nombre del usuario autenticado
      }

      // Enviar los datos a la API
      const response = await fetch(API_ENDPOINTS.registros, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error(`Error al guardar el registro: ${response.status} ${response.statusText}`)
      }

      // Mostrar mensaje de éxito
      toast({
        title: "Registro guardado",
        description: "El paro ha sido registrado exitosamente",
      })

      // Redireccionar a la tabla de registros
      router.push("/dashboard/table")
    } catch (error) {
      console.error("Error al enviar el formulario:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al guardar el registro",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col space-y-4">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Registro de Paros
          </h1>

          {/* Mostrar alertas de error si existen */}
          {(errorCategorias || errorProcesos || errorEquipos || errorEspecialidades || errorTipos || errorCausas) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorCategorias || errorProcesos || errorEquipos || errorEspecialidades || errorTipos || errorCausas}
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de validación */}
          {validationAlert && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de validación</AlertTitle>
              <AlertDescription>{validationAlert}</AlertDescription>
            </Alert>
          )}

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-4 border-b">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <ListFilter className="h-5 w-5 text-primary" />
                Formulario de Registro
              </CardTitle>
              <CardDescription>Ingrese los detalles del paro industrial</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 p-4 sm:p-6">
                {/* Fechas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stop-date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Fecha y hora de paro
                    </Label>
                    <div className="relative">
                      <Input
                        id="stop-date"
                        name="stop-date"
                        type="datetime-local"
                        required
                        className="h-10 pl-9"
                        value={formData.stopDate}
                        onChange={(e) => handleChange("stopDate", e.target.value)}
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Fecha y hora de arranque
                    </Label>
                    <div className="relative">
                      <Input
                        id="start-date"
                        name="start-date"
                        type="datetime-local"
                        required
                        className="h-10 pl-9"
                        value={formData.startDate}
                        onChange={(e) => handleChange("startDate", e.target.value)}
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Categoría y Proceso */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Categoría
                    </Label>
                    {isLoadingCategorias ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openCategory} onOpenChange={setOpenCategory}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="category"
                            name="category"
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.category && "text-muted-foreground",
                            )}
                          >
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.category
                                ? categorias.find((cat) => cat.id_categoria.toString() === formData.category)
                                    ?.nombre_categoria || "Seleccione una categoría"
                                : "Seleccione una categoría"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput
                              placeholder="Buscar categoría..."
                              className="h-10 text-sm"
                              autoFocus={false}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {categorias.map((categoria) => (
                                  <CommandItem
                                    key={categoria.id_categoria}
                                    value={categoria.nombre_categoria}
                                    className="py-2 text-sm"
                                    onSelect={() => {
                                      handleChange("category", categoria.id_categoria.toString())
                                      setOpenCategory(false) // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    <span className="truncate flex-1">{categoria.nombre_categoria}</span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.category === categoria.id_categoria.toString()
                                          ? "opacity-100 text-primary"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="category" value={formData.category} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="process" className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Proceso
                    </Label>
                    {isLoadingProcesos ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openProcess} onOpenChange={setOpenProcess}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="process"
                            name="process"
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.process && "text-muted-foreground",
                            )}
                          >
                            <Settings className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.process
                                ? procesos.find((proc) => proc.id_proceso.toString() === formData.process)
                                    ?.nombre_proceso || "Seleccione un proceso"
                                : "Seleccione un proceso"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput placeholder="Buscar proceso..." className="h-10 text-sm" autoFocus={false} />
                            <CommandList>
                              <CommandEmpty>No se encontraron procesos.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {procesos.map((proceso) => (
                                  <CommandItem
                                    key={proceso.id_proceso}
                                    value={proceso.nombre_proceso}
                                    className="py-2 text-sm"
                                    onSelect={() => {
                                      handleChange("process", proceso.id_proceso.toString())
                                      setOpenProcess(false) // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    <span className="truncate flex-1">{proceso.nombre_proceso}</span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.process === proceso.id_proceso.toString()
                                          ? "opacity-100 text-primary"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="process" value={formData.process} />
                  </div>
                </div>

                {/* Equipo y Especialidad */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipment" className="flex items-center gap-2">
                      <Tool className="h-4 w-4 text-primary" />
                      Equipos
                    </Label>
                    {isLoadingEquipos ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openEquipment} onOpenChange={setOpenEquipment}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="equipment"
                            name="equipment"
                            disabled={!formData.process || isLoadingEquipos}
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.equipment && "text-muted-foreground",
                            )}
                          >
                            <Tool className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.equipment
                                ? equipos.find((equipo) => getEquipoId(equipo).toString() === formData.equipment)
                                  ? getEquipoName(
                                      equipos.find((equipo) => getEquipoId(equipo).toString() === formData.equipment)!,
                                    )
                                  : "Seleccione un equipo"
                                : formData.process
                                  ? "Seleccione un equipo"
                                  : "Seleccione un proceso primero"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput placeholder="Buscar equipo..." className="h-10 text-sm" autoFocus={false} />
                            <CommandList>
                              <CommandEmpty>No se encontraron equipos.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {equipos.map((equipo) => {
                                  const equipoId = getEquipoId(equipo).toString()
                                  const equipoName = getEquipoName(equipo)
                                  return (
                                    <CommandItem
                                      key={equipoId}
                                      value={equipoName}
                                      className="py-2 text-sm"
                                      onSelect={() => {
                                        handleChange("equipment", equipoId)
                                        setOpenEquipment(false) // Cerrar el popover después de seleccionar
                                      }}
                                    >
                                      <span className="truncate flex-1">{equipoName}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          formData.equipment === equipoId ? "opacity-100 text-primary" : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="equipment" value={formData.equipment} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty" className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Especialidades
                    </Label>
                    {isLoadingEspecialidades ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openSpecialty} onOpenChange={setOpenSpecialty}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="specialty"
                            name="specialty"
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.specialty && "text-muted-foreground",
                            )}
                          >
                            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.specialty
                                ? especialidades.find(
                                    (especialidad) => especialidad.id_especialidad.toString() === formData.specialty,
                                  )?.nombre_especialidad || "Seleccione una especialidad"
                                : "Seleccione una especialidad"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput
                              placeholder="Buscar especialidad..."
                              className="h-10 text-sm"
                              autoFocus={false}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron especialidades.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {especialidades.map((especialidad) => (
                                  <CommandItem
                                    key={especialidad.id_especialidad}
                                    value={especialidad.nombre_especialidad}
                                    className="py-2 text-sm"
                                    onSelect={() => {
                                      handleChange("specialty", especialidad.id_especialidad.toString())
                                      setOpenSpecialty(false) // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    <span className="truncate flex-1">{especialidad.nombre_especialidad}</span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.specialty === especialidad.id_especialidad.toString()
                                          ? "opacity-100 text-primary"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="specialty" value={formData.specialty} />
                  </div>
                </div>

                {/* Tipo y Causa */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      Tipos
                    </Label>
                    {isLoadingTipos ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openType} onOpenChange={setOpenType}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="type"
                            name="type"
                            disabled={!formData.specialty || isLoadingTipos}
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.type && "text-muted-foreground",
                            )}
                          >
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.type
                                ? tipos.find((tipo) => getTipoId(tipo).toString() === formData.type)
                                  ? getTipoName(tipos.find((tipo) => getTipoId(tipo).toString() === formData.type)!)
                                  : "Seleccione un tipo"
                                : formData.type
                                  ? "Seleccione un tipo"
                                  : "Seleccione una especialidad primero"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput placeholder="Buscar tipo..." className="h-10 text-sm" autoFocus={false} />
                            <CommandList>
                              <CommandEmpty>No se encontraron tipos.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {tipos.map((tipo) => {
                                  const tipoId = getTipoId(tipo).toString()
                                  const tipoName = getTipoName(tipo)
                                  return (
                                    <CommandItem
                                      key={tipoId}
                                      value={tipoName}
                                      className="py-2 text-sm"
                                      onSelect={() => {
                                        handleChange("type", tipoId)
                                        setOpenType(false) // Cerrar el popover después de seleccionar
                                      }}
                                    >
                                      <span className="truncate flex-1">{tipoName}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          formData.type === tipoId ? "opacity-100 text-primary" : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="type" value={formData.type} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cause" className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Causa
                    </Label>
                    {isLoadingCausas ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Popover open={openCause} onOpenChange={setOpenCause}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            id="cause"
                            name="cause"
                            disabled={!formData.type || isLoadingCausas}
                            className={cn(
                              "h-10 w-full justify-between text-sm md:text-base pl-9 relative",
                              !formData.cause && "text-muted-foreground",
                            )}
                          >
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {formData.cause
                                ? causas.find((causa) => getCausaId(causa).toString() === formData.cause)
                                  ? getCausaName(
                                      causas.find((causa) => getCausaId(causa).toString() === formData.cause)!,
                                    )
                                  : "Seleccione una causa"
                                : formData.cause
                                  ? "Seleccione una causa"
                                  : "Seleccione un tipo primero"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align={isTablet ? "start" : "center"}
                          side={isTablet ? "bottom" : undefined}
                        >
                          <Command>
                            <CommandInput placeholder="Buscar causa..." className="h-10 text-sm" autoFocus={false} />
                            <CommandList>
                              <CommandEmpty>No se encontro la causa.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {causas.map((causa) => {
                                  const causaId = getCausaId(causa).toString()
                                  const causaName = getCausaName(causa)
                                  return (
                                    <CommandItem
                                      key={causaId}
                                      value={causaName}
                                      className="py-2 text-sm"
                                      onSelect={() => {
                                        handleChange("cause", causaId)
                                        setOpenCause(false) // Cerrar el popover después de seleccionar
                                      }}
                                    >
                                      <span className="truncate flex-1">{causaName}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          formData.cause === causaId ? "opacity-100 text-primary" : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <input type="hidden" name="cause" value={formData.cause} />
                  </div>
                </div>

                {/* Detalles */}
                <div className="space-y-2">
                  <Label htmlFor="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Detalle del paro
                  </Label>
                  <Textarea
                    id="details"
                    name="details"
                    placeholder="Describa los detalles del paro"
                    className="min-h-[80px] sm:min-h-[100px]"
                    required
                    value={formData.details}
                    onChange={(e) => handleChange("details", e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end p-4 sm:p-6 border-t">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !isFormComplete()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      <span>Enviar y Registrar</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
