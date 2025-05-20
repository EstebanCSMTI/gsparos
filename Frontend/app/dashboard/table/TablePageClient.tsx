"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Clock,
  Database,
  Eye,
  Filter,
  Info,
  Layers,
  Search,
  Settings,
  Timer,
  PenToolIcon as Tool,
  X,
  Wrench,
  FileText,
  Tag,
  Edit,
  Trash2,
  Lock,
  Loader2,
  MoreVertical,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { API_ENDPOINTS } from "@/lib/api-config"

// Definir la interfaz para los datos de la API
interface RegistroParo {
  id_registro: number;
  id_categoria: number;
  categoria: string;
  id_proceso: number;
  proceso: string;
  id_equipo: number;
  equipo: string;
  id_especialidad: number;
  especialidad: string;
  id_tipo: number;
  tipo: string;
  id_causa: number;
  causa: string;
  detalle: string;
  fecha_y_hora_de_paro: string;
  fecha_y_hora_de_arranque: string;
  horas_de_paro: number;
  cadencia: number;
  perdida_de_produccion: number;
  id_usuario: number;
  nombre_usuario: string;
}

// Interfaces para los tipos de datos
interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  codigo_categoria: string;
}

interface Proceso {
  id_proceso: number;
  nombre_proceso: string;
  codigo_proceso: string;
}

interface Especialidad {
  id_especialidad: number;
  nombre_especialidad: string;
  codigo_especialidad?: string;
}

interface Tipo {
  [key: string]: any;
  nombre_tipo: string;
}

interface Causa {
  [key: string]: any;
}

// Interfaz genérica para equipos
interface Equipo {
  [key: string]: any;
}

const TablePageClient = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Añadir nuevos estados para los filtros de categoría, proceso y especialidad después de los estados de fecha
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [processFilter, setProcessFilter] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [openCategoryFilter, setOpenCategoryFilter] = useState(false);
  const [openProcessFilter, setOpenProcessFilter] = useState(false);
  const [openSpecialtyFilter, setOpenSpecialtyFilter] = useState(false);

  // Estados para manejar los datos de la API
  const [data, setData] = useState<RegistroParo[]>([]);
  const [filteredData, setFilteredData] = useState<RegistroParo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RegistroParo | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Estados para almacenar las opciones de los selects
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [causas, setCausas] = useState<Causa[]>([]);

  // Campos detectados para equipos
  const [equipoFields, setEquipoFields] = useState<{
    idField: string | null;
    nameField: string | null;
    codeField: string | null;
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  });

  // Campos detectados para tipos y causas
  const [tipoFields, setTipoFields] = useState<{
    idField: string | null;
    nameField: string | null;
    codeField: string | null;
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  });
  const [causaFields, setCausaFields] = useState<{
    idField: string | null;
    nameField: string | null;
    codeField: string | null;
  }>({
    idField: null,
    nameField: null,
    codeField: null,
  });

  // Estados para controlar la carga y errores de los selects
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  const [isLoadingProcesos, setIsLoadingProcesos] = useState(true);
  const [isLoadingEquipos, setIsLoadingEquipos] = useState(false);
  const [isLoadingEspecialidades, setIsLoadingEspecialidades] = useState(true);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [isLoadingCausas, setIsLoadingCausas] = useState(false);

  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);
  const [errorProcesos, setErrorProcesos] = useState<string | null>(null);
  const [errorEquipos, setErrorEquipos] = useState<string | null>(null);
  const [errorEspecialidades, setErrorEspecialidades] = useState<string | null>(
    null
  );
  const [errorTipos, setErrorTipos] = useState<string | null>(null);
  const [errorCausas, setErrorCausas] = useState<string | null>(null);

  // Estado para el formulario de edición
  const [formData, setFormData] = useState({
    id_registro: 0,
    category: "",
    process: "",
    equipment: "",
    specialty: "",
    type: "",
    cause: "",
    details: "",
    stopDate: "",
    startDate: "",
  });

  // Estados para controlar la apertura/cierre de cada popover
  const [openCategory, setOpenCategory] = useState(false);
  const [openProcess, setOpenProcess] = useState(false);
  const [openEquipment, setOpenEquipment] = useState(false);
  const [openSpecialty, setOpenSpecialty] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openCause, setOpenCause] = useState(false);

  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  // Función para cargar los datos de la API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.registros);

      if (!response.ok) {
        throw new Error(
          `Error al cargar los datos: ${response.status} ${response.statusText}`
        );
      }

      const apiData = await response.json();
      setData(apiData);
      setFilteredData(apiData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar los datos"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar las categorías desde la API
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoadingCategorias(true);
      setErrorCategorias(null);

      try {
        const response = await fetch(
          API_ENDPOINTS.dynamic("Categoria")
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar categorías: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setCategorias(data);
      } catch (err) {
        console.error("Error fetching categorias:", err);
        setErrorCategorias(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar categorías"
        );
      } finally {
        setIsLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  // Cargar los procesos desde la API
  useEffect(() => {
    const fetchProcesos = async () => {
      setIsLoadingProcesos(true);
      setErrorProcesos(null);

      try {
        const response = await fetch(
          API_ENDPOINTS.dynamic("Proceso")
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar procesos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setProcesos(data);
      } catch (err) {
        console.error("Error fetching procesos:", err);
        setErrorProcesos(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar procesos"
        );
      } finally {
        setIsLoadingProcesos(false);
      }
    };

    fetchProcesos();
  }, []);

  // Cargar especialidades
  useEffect(() => {
    const fetchEspecialidades = async () => {
      setIsLoadingEspecialidades(true);
      setErrorEspecialidades(null);

      try {
        const response = await fetch(
          API_ENDPOINTS.dynamic("Especialidad")
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar especialidades: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setEspecialidades(data);
      } catch (err) {
        console.error("Error fetching especialidades:", err);
        setErrorEspecialidades(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar especialidades"
        );
      } finally {
        setIsLoadingEspecialidades(false);
      }
    };

    fetchEspecialidades();
  }, []);

  // Cargar los equipos cuando se selecciona un proceso
  useEffect(() => {
    const fetchEquipos = async () => {
      if (!formData.process) return;

      setIsLoadingEquipos(true);
      setErrorEquipos(null);
      setEquipos([]); // Limpiar equipos anteriores
      setEquipoFields({ idField: null, nameField: null, codeField: null }); // Resetear campos detectados

      try {
        // Obtener el nombre del proceso seleccionado
        const procesoSeleccionado = procesos.find(
          (p) => p.id_proceso.toString() === formData.process
        );

        if (!procesoSeleccionado) {
          throw new Error("Proceso no encontrado");
        }

        // Convertir espacios a guiones bajos para la URL
        const nombreProcesoUrl = procesoSeleccionado.nombre_proceso.replace(
          / /g,
          "_"
        );
        const response = await fetch(
          API_ENDPOINTS.dynamic(nombreProcesoUrl)
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar equipos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // Detectar campos si hay datos
        if (data.length > 0) {
          const detectedFields = detectEquipoFields(data[0]);
          setEquipoFields(detectedFields);
        }

        setEquipos(data);
      } catch (err) {
        console.error("Error fetching equipos:", err);
        setErrorEquipos(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar equipos"
        );
      } finally {
        setIsLoadingEquipos(false);
      }
    };

    if (formData.process) {
      fetchEquipos();
    }
  }, [formData.process, procesos]);

  // Cargar los tipos cuando se selecciona una especialidad
  useEffect(() => {
    const fetchTipos = async () => {
      if (!formData.specialty) return;

      setIsLoadingTipos(true);
      setErrorTipos(null);
      setTipos([]);
      setTipoFields({ idField: null, nameField: null, codeField: null });

      try {
        const especialidadSeleccionada = especialidades.find(
          (e) => e.id_especialidad.toString() === formData.specialty
        );

        if (!especialidadSeleccionada) {
          throw new Error("Especialidad no encontrado");
        }

        // Convertir espacios a guiones bajos para la URL
        const nombreEspecialidadUrl =
          especialidadSeleccionada.nombre_especialidad.replace(/ /g, "_");
        const response = await fetch(
          API_ENDPOINTS.dynamic(nombreEspecialidadUrl)
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar tipos: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setTipos(data);
      } catch (err) {
        console.error("Error fetching tipos:", err);
        setErrorTipos(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar tipos"
        );
      } finally {
        setIsLoadingTipos(false);
      }
    };

    if (formData.specialty) {
      fetchTipos();
    }
  }, [formData.specialty, especialidades]);

  // Cargar las causas cuando se selecciona un tipo
  useEffect(() => {
    const fetchCausas = async () => {
      if (!formData.type) return;

      setIsLoadingCausas(true);
      setErrorCausas(null);
      setCausas([]);
      setCausaFields({ idField: null, nameField: null, codeField: null });

      try {
        // Obtener el nombre y el ID del tipo seleccionado
        const tipoSeleccionado = tipos.find(
          (e) => getTipoId(e).toString() === formData.type
        );

        const nombrefield = tipoSeleccionado
          ? Object.keys(tipoSeleccionado).find((key) =>
              key.startsWith("nombre_")
            )
          : undefined;

        const nombreTipo =
          tipoSeleccionado?.[nombrefield!]?.toLowerCase().replace(/ /g, "_") ||
          "";

        const response = await fetch(
          API_ENDPOINTS.dynamic(nombreTipo)
        );

        if (!response.ok) {
          throw new Error(
            `Error al cargar causas: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setCausas(data);
      } catch (err) {
        console.error("Error fetching causas:", err);
        setErrorCausas(
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar causas"
        );
      } finally {
        setIsLoadingCausas(false);
      }
    };

    if (formData.type) {
      fetchCausas();
    }
  }, [formData.type, tipos]);

  // Modificar la función applyDateFilter para incluir todos los filtros
  // Reemplazar la función applyDateFilter con esta nueva función applyFilters
  const applyFilters = () => {
    const newData = data.filter((item) => {
      // Date filtering
      const dateFilterPassed = (() => {
        // If no dates selected, pass this filter
        if (!startDate && !endDate) {
          return true;
        }

        const itemDate = new Date(item.fecha_y_hora_de_paro);

        // If only start date
        if (startDate && !endDate) {
          return itemDate >= new Date(startDate);
        }

        // If only end date
        if (!startDate && endDate) {
          return itemDate <= new Date(endDate);
        }

        // If both dates
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      })();

      // Category filtering
      const categoryFilterPassed =
        !categoryFilter ||
        categoryFilter === "all" ||
        item.categoria === categoryFilter;

      // Process filtering
      const processFilterPassed =
        !processFilter ||
        processFilter === "all" ||
        item.proceso === processFilter;

      // Specialty filtering
      const specialtyFilterPassed =
        !specialtyFilter ||
        specialtyFilter === "all" ||
        item.especialidad === specialtyFilter;

      // All filters must pass
      return (
        dateFilterPassed &&
        categoryFilterPassed &&
        processFilterPassed &&
        specialtyFilterPassed
      );
    });

    setFilteredData(newData);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCategoryFilter("");
    setProcessFilter("");
    setSpecialtyFilter("");
    setFilteredData(data);
    setCurrentPage(1);
  };

  // Añadir esta función para limpiar filtros individuales
  const clearFilter = (
    filterType: "category" | "process" | "specialty" | "date"
  ) => {
    switch (filterType) {
      case "category":
        setCategoryFilter("");
        break;
      case "process":
        setProcessFilter("");
        break;
      case "specialty":
        setSpecialtyFilter("");
        break;
      case "date":
        setStartDate("");
        setEndDate("");
        break;
    }

    // Re-apply remaining filters
    setTimeout(() => applyFilters(), 0);
  };

  // Filtrar datos basados en el término de búsqueda
  const searchedData = filteredData.filter((item) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (item.categoria?.toLowerCase() || "").includes(searchTermLower) ||
      (item.proceso?.toLowerCase() || "").includes(searchTermLower) ||
      (item.equipo?.toLowerCase() || "").includes(searchTermLower) ||
      (item.tipo?.toLowerCase() || "").includes(searchTermLower) ||
      (item.causa?.toLowerCase() || "").includes(searchTermLower) ||
      (item.detalle?.toLowerCase() || "").includes(searchTermLower) ||
      (item.nombre_usuario?.toLowerCase() || "").includes(searchTermLower) ||
      (item.id_registro.toString() || "").includes(searchTermLower)
    );
  });

  // Paginar los datos
  const totalPages = Math.ceil(searchedData.length / itemsPerPage);
  const paginatedData = searchedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Función para abrir el detalle de un registro
  const openRecordDetails = (record: RegistroParo) => {
    setSelectedRecord(record);
    setIsDialogOpen(true);
  };

  // Función para confirmar eliminación
  const confirmDelete = (id: number) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar registros.",
        variant: "destructive",
      });
      return;
    }

    setRecordToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Función para eliminar un registro
  const deleteRecord = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.registros}/${recordToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el registro");
      }

      // Actualizar los datos locales
      const updatedData = data.filter(
        (item) => item.id_registro !== recordToDelete
      );
      setData(updatedData);
      setFilteredData(updatedData);

      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado correctamente.",
      });
    } catch (err) {
      console.error("Error deleting record:", err);
      toast({
        title: "Error",
        description:
          "No se pudo eliminar el registro. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  // Función para formatear fechas para input datetime-local
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // Formato YYYY-MM-DDThh:mm
    } catch (error) {
      console.error("Error formatting date for input:", error);
      return "";
    }
  };

  // Función para detectar los campos de un objeto de equipo
  const detectEquipoFields = (equipoSample: Equipo) => {
    // Inicializar campos detectados
    let detectedIdField: string | null = null;
    let detectedNameField: string | null = null;
    let detectedCodeField: string | null = null;

    // Obtener el proceso seleccionado
    const procesoSeleccionado = procesos.find(
      (p) => p.id_proceso.toString() === formData.process
    );
    const nombreProceso =
      procesoSeleccionado?.nombre_proceso.toLowerCase().replace(/ /g, "_") ||
      "";

    // Buscar campos en el objeto
    Object.keys(equipoSample).forEach((key) => {
      // Buscar campo ID
      if (key.startsWith("id_") || key === "id") {
        detectedIdField = key;
      }

      // Buscar campo nombre
      if (key.includes("nombre") || key.includes("name")) {
        detectedNameField = key;
      }

      // Buscar campo código
      if (key.includes("codigo") || key.includes("code")) {
        detectedCodeField = key;
      }
    });

    // Si no se encontró un campo ID específico, intentar construirlo
    if (!detectedIdField && nombreProceso) {
      const constructedIdField = `id_${nombreProceso}`;
      if (constructedIdField in equipoSample) {
        detectedIdField = constructedIdField;
      }
    }

    return {
      idField: detectedIdField,
      nameField: detectedNameField,
      codeField: detectedCodeField,
    };
  };

  // Función para obtener el ID de un equipo
  const getEquipoId = (equipo: Equipo) => {
    if (equipoFields.idField && equipo[equipoFields.idField] !== undefined) {
      return equipo[equipoFields.idField];
    }

    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(equipo).find((key) => key.startsWith("id_"));
    if (idField) {
      return equipo[idField];
    }

    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(equipo)[0];
    return equipo[firstKey];
  };

  // Función para obtener el nombre de un equipo
  const getEquipoName = (equipo: Equipo) => {
    if (
      equipoFields.nameField &&
      equipo[equipoFields.nameField] !== undefined
    ) {
      return equipo[equipoFields.nameField];
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(equipo).find(
      (key) =>
        key.includes("nombre") ||
        key.includes("name") ||
        key.includes("descripcion")
    );
    if (nameField) {
      return equipo[nameField];
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Equipo ${getEquipoId(equipo)}`;
  };

  const getTipoId = (tipo: Tipo) => {
    if (tipoFields.idField && tipo[tipoFields.idField] !== undefined) {
      return tipo[tipoFields.idField];
    }

    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(tipo).find((key) => key.startsWith("id_"));
    if (idField) {
      return tipo[idField];
    }

    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(tipo)[0];
    return tipo[firstKey];
  };

  const getTipoName = (tipo: Tipo) => {
    if (tipoFields.nameField && tipo[tipoFields.nameField] !== undefined) {
      return tipo[tipoFields.nameField];
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(tipo).find(
      (key) =>
        key.includes("nombre") ||
        key.includes("name") ||
        key.includes("descripcion")
    );
    if (nameField) {
      return tipo[nameField];
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Tipo ${getTipoId(tipo)}`;
  };

  const getCausaId = (causa: Causa) => {
    if (causaFields.idField && causa[causaFields.idField] !== undefined) {
      return causa[causaFields.idField];
    }
    // Fallback: buscar cualquier campo que comience con 'id_'
    const idField = Object.keys(causa).find((key) => key.startsWith("id_"));
    if (idField) {
      return causa[idField];
    }
    // Si todo falla, usar la primera propiedad
    const firstKey = Object.keys(causa)[0];
    return causa[firstKey];
  };

  const getCausaName = (causa: Causa) => {
    if (causaFields.nameField && causa[causaFields.nameField] !== undefined) {
      return causa[causaFields.nameField];
    }

    // Fallback: buscar cualquier campo que contenga 'nombre'
    const nameField = Object.keys(causa).find(
      (key) =>
        key.includes("nombre") ||
        key.includes("name") ||
        key.includes("descripcion")
    );
    if (nameField) {
      return causa[nameField];
    }

    // Si todo falla, mostrar un valor genérico con el ID
    return `Causa ${getCausaId(causa)}`;
  };

  // Función para editar un registro
  const editRecord = (record: RegistroParo) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden editar registros.",
        variant: "destructive",
      });
      return;
    }

    // Buscar los IDs correspondientes a los nombres
    const categoriaId =
      categorias
        .find((cat) => cat.nombre_categoria === record.categoria)
        ?.id_categoria.toString() || "";
    const procesoId =
      procesos
        .find((proc) => proc.nombre_proceso === record.proceso)
        ?.id_proceso.toString() || "";
    const especialidadId =
      especialidades
        .find((esp) => esp.nombre_especialidad === record.especialidad)
        ?.id_especialidad.toString() || "";

    // Preparar el formulario con los datos del registro
    setFormData({
      id_registro: record.id_registro,
      category: categoriaId,
      process: procesoId,
      equipment: "", // Se llenará después de cargar los equipos
      specialty: especialidadId,
      type: "", // Se llenará después de cargar los tipos
      cause: "", // Se llenará después de cargar las causas
      details: record.detalle,
      stopDate: formatDateForInput(record.fecha_y_hora_de_paro),
      startDate: formatDateForInput(record.fecha_y_hora_de_arranque),
    });

    // Guardar el registro seleccionado para referencia
    setSelectedRecord(record);

    // Abrir el modal de edición
    setIsEditModalOpen(true);
  };

  // Añadir efectos para cargar equipos, tipos y causas basados en los nombres cuando se abre el modal
  useEffect(() => {
    // Este efecto se ejecuta cuando se abre el modal de edición y tenemos un registro seleccionado
    if (isEditModalOpen && selectedRecord && formData.process) {
      // Cargar equipos y luego seleccionar el equipo correcto
      const loadEquipoId = async () => {
        // Esperar a que los equipos se carguen
        if (equipos.length > 0) {
          // Buscar el equipo por nombre
          const equipoSeleccionado = equipos.find(
            (eq) => getEquipoName(eq) === selectedRecord.equipo
          );
          if (equipoSeleccionado) {
            // Actualizar el formulario con el ID del equipo
            setFormData((prev) => ({
              ...prev,
              equipment: getEquipoId(equipoSeleccionado).toString(),
            }));
          }
        }
      };

      loadEquipoId();
    }
  }, [isEditModalOpen, selectedRecord, formData.process, equipos]);

  // Efecto similar para tipos
  useEffect(() => {
    if (isEditModalOpen && selectedRecord && formData.specialty) {
      // Cargar tipos y luego seleccionar el tipo correcto
      const loadTipoId = async () => {
        if (tipos.length > 0) {
          // Buscar el tipo por nombre
          const tipoSeleccionado = tipos.find(
            (t) => getTipoName(t) === selectedRecord.tipo
          );
          if (tipoSeleccionado) {
            // Actualizar el formulario con el ID del tipo
            setFormData((prev) => ({
              ...prev,
              type: getTipoId(tipoSeleccionado).toString(),
            }));
          }
        }
      };

      loadTipoId();
    }
  }, [isEditModalOpen, selectedRecord, formData.specialty, tipos]);

  // Efecto similar para causas
  useEffect(() => {
    if (isEditModalOpen && selectedRecord && formData.type) {
      // Cargar causas y luego seleccionar la causa correcta
      const loadCausaId = async () => {
        if (causas.length > 0) {
          // Buscar la causa por nombre
          const causaSeleccionada = causas.find(
            (c) => getCausaName(c) === selectedRecord.causa
          );
          if (causaSeleccionada) {
            // Actualizar el formulario con el ID de la causa
            setFormData((prev) => ({
              ...prev,
              cause: getCausaId(causaSeleccionada).toString(),
            }));
          }
        }
      };

      loadCausaId();
    }
  }, [isEditModalOpen, selectedRecord, formData.type, causas]);

  // Manejar cambios en los campos del formulario
  const handleChange = (field: string, value: string) => {
    // Si cambia el proceso, resetear equipo y limpiar la lista de equipos
    if (field === "process") {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
        equipment: "", // Resetear equipo
      }));
      setEquipos([]); // Limpiar lista de equipos
      setOpenEquipment(false); // Cerrar el popover de equipos
    }
    // Si cambia la especialidad, resetear tipo y causa
    else if (field === "specialty") {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
        type: "", // Resetear tipo
        cause: "", // Resetear causa
      }));
      setTipos([]); // Limpiar lista de tipos
      setCausas([]); // Limpiar lista de causas
      setOpenType(false); // Cerrar el popover de tipos
      setOpenCause(false); // Cerrar el popover de causas
    }
    // Si cambia el tipo, resetear causa
    else if (field === "type") {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
        cause: "", // Resetear causa
      }));
      setCausas([]); // Limpiar lista de causas
      setOpenCause(false); // Cerrar el popover de causas
    }
    // Para otros campos, actualización normal
    else {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  // Validar el formulario
  const validateForm = () => {
    if (!formData.category) return "Debe seleccionar una categoría";
    if (!formData.process) return "Debe seleccionar un proceso";
    if (!formData.equipment) return "Debe seleccionar un equipo";
    if (!formData.specialty) return "Debe seleccionar una especialidad";
    if (!formData.type) return "Debe seleccionar un tipo";
    if (!formData.cause) return "Debe seleccionar una causa";
    if (!formData.details.trim()) return "Debe ingresar detalles del paro";
    if (!formData.stopDate) return "Debe ingresar fecha y hora de paro";
    if (!formData.startDate) return "Debe ingresar fecha y hora de arranque";

    // Validar que la fecha de arranque sea posterior a la fecha de paro
    const stopDate = new Date(formData.stopDate);
    const startDate = new Date(formData.startDate);
    if (startDate <= stopDate) {
      return "La fecha de arranque debe ser posterior a la fecha de paro";
    }

    return null;
  };

  // Verificar si el formulario está completo
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
    );
  };

  // Manejar el envío del formulario de edición
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar el formulario
    const validationError = validateForm();
    if (validationError) {
      setValidationAlert(validationError);
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setValidationAlert(null);
    setIsSubmitting(true);

    try {
      // Obtener los nombres de los elementos seleccionados
      const categoriaSeleccionada = categorias.find(
        (cat) => cat.id_categoria.toString() === formData.category
      );
      const procesoSeleccionado = procesos.find(
        (proc) => proc.id_proceso.toString() === formData.process
      );
      const equipoSeleccionado = equipos.find(
        (equipo) => getEquipoId(equipo).toString() === formData.equipment
      );
      const especialidadSeleccionada = especialidades.find(
        (esp) => esp.id_especialidad.toString() === formData.specialty
      );
      const tipoSeleccionado = tipos.find(
        (tipo) => getTipoId(tipo).toString() === formData.type
      );
      const causaSeleccionada = causas.find(
        (causa) => getCausaId(causa).toString() === formData.cause
      );

      // Calcular horas de paro
      const stopDate = new Date(formData.stopDate);
      const startDate = new Date(formData.startDate);
      const horasDeParo =
        (startDate.getTime() - stopDate.getTime()) / (1000 * 60 * 60);

      // Crear el objeto de datos para enviar
      const dataToSend = {
        id_registro: formData.id_registro,
        categoria: categoriaSeleccionada?.nombre_categoria || "",
        proceso: procesoSeleccionado?.nombre_proceso || "",
        equipo: equipoSeleccionado ? getEquipoName(equipoSeleccionado) : "",
        especialidad: especialidadSeleccionada?.nombre_especialidad || "",
        tipo: tipoSeleccionado ? getTipoName(tipoSeleccionado) : "",
        causa: causaSeleccionada ? getCausaName(causaSeleccionada) : "",
        detalle: formData.details,
        fecha_y_hora_de_paro: formData.stopDate,
        fecha_y_hora_de_arranque: formData.startDate,
        horas_de_paro: horasDeParo,
        // Mantener los valores originales para estos campos
        cadencia: selectedRecord?.cadencia || 1,
        perdida_de_produccion: horasDeParo * (selectedRecord?.cadencia || 1),
        id_usuario: selectedRecord?.id_usuario || user?.id_usuario || 1,
        nombre_usuario:
          selectedRecord?.nombre_usuario ||
          user?.nombre_usuario ||
          "Usuario del sistema",
      };

      // Enviar los datos a la API
      const response = await fetch(
        `${API_ENDPOINTS.registros}/${formData.id_registro}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error al actualizar el registro: ${response.status} ${response.statusText}`
        );
      }

      // Actualizar los datos locales
      const updatedData = data.map((item) =>
        item.id_registro === formData.id_registro
          ? {
              ...dataToSend,
              id_categoria: categoriaSeleccionada?.id_categoria || 0,
              id_proceso: procesoSeleccionado?.id_proceso || 0,
              id_equipo: equipoSeleccionado ? getEquipoId(equipoSeleccionado) : 0,
              id_especialidad: especialidadSeleccionada?.id_especialidad || 0,
              id_tipo: tipoSeleccionado ? getTipoId(tipoSeleccionado) : 0,
              id_causa: causaSeleccionada ? getCausaId(causaSeleccionada) : 0,
            }
          : item
      );
      setData(updatedData);
      setFilteredData(updatedData);

      // Mostrar mensaje de éxito
      toast({
        title: "Registro actualizado",
        description: "El paro ha sido actualizado exitosamente",
      });

      // Cerrar el modal
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error desconocido al actualizar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Componente para el menú de acciones
  const ActionMenu = ({ record }: { record: RegistroParo }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors focus-visible:ring-primary"
        >
          <MoreVertical className="h-4 w-4 text-primary" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-1 border-primary/20 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <DropdownMenuItem
          onClick={() => openRecordDetails(record)}
          className="flex items-center py-2 px-3 cursor-pointer rounded-md hover:bg-primary/10 focus:bg-primary/10"
        >
          <Eye className="mr-2 h-5 w-5 text-primary" />
          <span className="font-medium">Ver detalles</span>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator className="my-1 h-px bg-primary/10" />
            <DropdownMenuItem
              onClick={() => editRecord(record)}
              className="flex items-center py-2 px-3 cursor-pointer rounded-md hover:bg-blue-50 focus:bg-blue-50"
            >
              <Edit className="mr-2 h-5 w-5 text-blue-500" />
              <span className="font-medium text-blue-600">Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => confirmDelete(record.id_registro)}
              className="flex items-center py-2 px-3 cursor-pointer rounded-md hover:bg-red-50 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-5 w-5 text-red-500" />
              <span className="font-medium text-red-600">Eliminar</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="mx-auto max-w-6xl flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Registros de Paros
          </h1>
        </div>

        {!isAdmin && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Acceso limitado</AlertTitle>
            <AlertDescription>
              Solo los administradores pueden editar o eliminar registros. Usted
              tiene permisos de solo lectura.
            </AlertDescription>
          </Alert>
        )}

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2 sm:pb-4 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
                <Input
                  className="w-full pl-8 h-10 border-primary/30 focus-visible:ring-primary/30"
                  placeholder="Buscar registros..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                />
              </div>

              {/* Filtros para escritorio */}
              <div className="hidden sm:flex gap-2 flex-wrap">
                {/* Menú de filtros unificado */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 border-primary/30 hover:bg-primary/10 hover:text-primary flex items-center gap-1"
                      disabled={isLoading}
                    >
                      <Filter className="h-4 w-4 text-primary" />
                      Filtros
                      {(categoryFilter ||
                        processFilter ||
                        specialtyFilter ||
                        startDate ||
                        endDate) && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 px-1.5 bg-primary/20 text-primary"
                        >
                          {(categoryFilter ? 1 : 0) +
                            (processFilter ? 1 : 0) +
                            (specialtyFilter ? 1 : 0) +
                            (startDate || endDate ? 1 : 0)}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-3">
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">
                        Filtros de búsqueda
                      </h3>

                      {/* Categoría */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="category-filter"
                          className="text-xs flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3 text-primary" />
                          Categoría
                        </Label>
                        <Select
                          value={categoryFilter}
                          onValueChange={(value) => {
                            setCategoryFilter(value === "all" ? "" : value);
                            setTimeout(() => applyFilters(), 0);
                          }}
                        >
                          <SelectTrigger
                            id="category-filter"
                            className="w-full h-8 text-xs"
                          >
                            <SelectValue placeholder="Todas las categorías" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            <SelectItem value="all">
                              Todas las categorías
                            </SelectItem>
                            {categorias.map((cat) => (
                              <SelectItem
                                key={cat.id_categoria}
                                value={cat.nombre_categoria}
                              >
                                {cat.nombre_categoria}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Proceso */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="process-filter"
                          className="text-xs flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3 text-primary" />
                          Proceso
                        </Label>
                        <Select
                          value={processFilter}
                          onValueChange={(value) => {
                            setProcessFilter(value === "all" ? "" : value);
                            setTimeout(() => applyFilters(), 0);
                          }}
                        >
                          <SelectTrigger
                            id="process-filter"
                            className="w-full h-8 text-xs"
                          >
                            <SelectValue placeholder="Todos los procesos" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            <SelectItem value="all">
                              Todos los procesos
                            </SelectItem>
                            {procesos.map((proc) => (
                              <SelectItem
                                key={proc.id_proceso}
                                value={proc.nombre_proceso}
                              >
                                {proc.nombre_proceso}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Especialidad */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="specialty-filter"
                          className="text-xs flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3 text-primary" />
                          Especialidad
                        </Label>
                        <Select
                          value={specialtyFilter}
                          onValueChange={(value) => {
                            setSpecialtyFilter(value === "all" ? "" : value);
                            setTimeout(() => applyFilters(), 0);
                          }}
                        >
                          <SelectTrigger
                            id="specialty-filter"
                            className="w-full h-8 text-xs"
                          >
                            <SelectValue placeholder="Todas las especialidades" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            <SelectItem value="all">
                              Todas las especialidades
                            </SelectItem>
                            {especialidades.map((esp) => (
                              <SelectItem
                                key={esp.id_especialidad}
                                value={esp.nombre_especialidad}
                              >
                                {esp.nombre_especialidad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rango de fechas */}
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          Rango de fechas
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="start-date" className="text-xs">
                              Desde
                            </Label>
                            <Input
                              id="start-date"
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label htmlFor="end-date" className="text-xs">
                              Hasta
                            </Label>
                            <Input
                              id="end-date"
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="text-xs h-7 px-2"
                        >
                          Limpiar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            applyFilters();
                            document.body.click(); // Cerrar el popover
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Active filters display */}
                {(categoryFilter ||
                  processFilter ||
                  specialtyFilter ||
                  startDate ||
                  endDate) && (
                  <div className="flex gap-2 items-center flex-wrap">
                    {categoryFilter && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 px-3 py-1.5 border-primary/30"
                      >
                        <Tag className="h-3 w-3 text-primary" />
                        {categoryFilter}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => clearFilter("category")}
                        />
                      </Badge>
                    )}
                    {processFilter && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 px-3 py-1.5 border-primary/30"
                      >
                        <Settings className="h-3 w-3 text-primary" />
                        {processFilter}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => clearFilter("process")}
                        />
                      </Badge>
                    )}
                    {specialtyFilter && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 px-3 py-1.5 border-primary/30"
                      >
                        <Wrench className="h-3 w-3 text-primary" />
                        {specialtyFilter}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => clearFilter("specialty")}
                        />
                      </Badge>
                    )}
                    {(startDate || endDate) && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 px-3 py-1.5 border-primary/30"
                      >
                        <Calendar className="h-3 w-3 text-primary" />
                        {startDate && endDate
                          ? `${startDate} - ${endDate}`
                          : startDate
                          ? `Desde ${startDate}`
                          : `Hasta ${endDate}`}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => clearFilter("date")}
                        />
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={clearFilters}
                      className="h-8 w-8 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 text-primary" />
                      <span className="sr-only">Limpiar filtros</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Botón de filtros para móvil */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="sm:hidden w-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                    disabled={isLoading}
                  >
                    <Filter className="h-4 w-4 mr-2 text-primary" />
                    Filtros
                    {(startDate ||
                      endDate ||
                      categoryFilter ||
                      processFilter ||
                      specialtyFilter) && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 px-1.5 bg-primary/20 text-primary"
                      >
                        {(startDate || endDate ? 1 : 0) +
                          (categoryFilter ? 1 : 0) +
                          (processFilter ? 1 : 0) +
                          (specialtyFilter ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[80vh] sm:h-[60vh] overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Filtra los registros por diferentes criterios
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-3 py-3 pb-16">
                    {/* Category filter */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="category-filter-mobile"
                        className="text-sm"
                      >
                        Categoría
                      </Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setCategoryFilter(value === "all" ? "" : value);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      >
                        <SelectTrigger
                          id="category-filter-mobile"
                          className="h-9"
                        >
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="all">
                            Todas las categorías
                          </SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem
                              key={cat.id_categoria}
                              value={cat.nombre_categoria}
                            >
                              {cat.nombre_categoria}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Process filter */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="process-filter-mobile"
                        className="text-sm"
                      >
                        Proceso
                      </Label>
                      <Select
                        value={processFilter}
                        onValueChange={(value) => {
                          setProcessFilter(value === "all" ? "" : value);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      >
                        <SelectTrigger
                          id="process-filter-mobile"
                          className="h-9"
                        >
                          <SelectValue placeholder="Seleccionar proceso" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="all">
                            Todos los procesos
                          </SelectItem>
                          {procesos.map((proc) => (
                            <SelectItem
                              key={proc.id_proceso}
                              value={proc.nombre_proceso}
                            >
                              {proc.nombre_proceso}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Specialty filter */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="specialty-filter-mobile"
                        className="text-sm"
                      >
                        Especialidad
                      </Label>
                      <Select
                        value={specialtyFilter}
                        onValueChange={(value) => {
                          setSpecialtyFilter(value === "all" ? "" : value);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      >
                        <SelectTrigger
                          id="specialty-filter-mobile"
                          className="h-9"
                        >
                          <SelectValue placeholder="Seleccionar especialidad" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="all">
                            Todas las especialidades
                          </SelectItem>
                          {especialidades.map((esp) => (
                            <SelectItem
                              key={esp.id_especialidad}
                              value={esp.nombre_especialidad}
                            >
                              {esp.nombre_especialidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date range */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Rango de fechas</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor="start-date-mobile"
                            className="text-sm"
                          >
                            Desde
                          </Label>
                          <Input
                            id="start-date-mobile"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="end-date-mobile" className="text-sm">
                            Hasta
                          </Label>
                          <Input
                            id="end-date-mobile"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active filters */}
                    {(categoryFilter ||
                      processFilter ||
                      specialtyFilter ||
                      startDate ||
                      endDate) && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Filtros activos</h3>
                        <div className="flex flex-wrap gap-2">
                          {categoryFilter && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 px-2 py-1 text-xs border-primary/30"
                            >
                              <Tag className="h-3 w-3 text-primary" />
                              {categoryFilter}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => clearFilter("category")}
                              />
                            </Badge>
                          )}
                          {processFilter && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 px-2 py-1 text-xs border-primary/30"
                            >
                              <Settings className="h-3 w-3 text-primary" />
                              {processFilter}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => clearFilter("process")}
                              />
                            </Badge>
                          )}
                          {specialtyFilter && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 px-2 py-1 text-xs border-primary/30"
                            >
                              <Wrench className="h-3 w-3 text-primary" />
                              {specialtyFilter}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => clearFilter("specialty")}
                              />
                            </Badge>
                          )}
                          {(startDate || endDate) && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 px-2 py-1 text-xs border-primary/30"
                            >
                              <Calendar className="h-3 w-3 text-primary" />
                              {startDate && endDate
                                ? `${startDate} - ${endDate}`
                                : startDate
                                ? `Desde ${startDate}`
                                : `Hasta ${endDate}`}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => clearFilter("date")}
                              />
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <SheetFooter className="sticky bottom-0 bg-white border-t pt-3 pb-2 px-4 -mx-4">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full sm:w-auto"
                    >
                      Limpiar filtros
                    </Button>
                    <SheetClose asChild>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={applyFilters}
                      >
                        Aplicar filtros
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            {/* Mensaje de error */}
            {error && (
              <Alert variant="destructive" className="mx-4 my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Estado de carga */}
            {isLoading ? (
              <div className="flex-1 p-4 space-y-4">
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Vista para dispositivos grandes */}
                <div className="hidden md:flex flex-col h-full">
                  <div className="overflow-y-auto flex-1 border-t">
                    <div className="min-w-full table-fixed">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="w-[10%]">
                              <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4 text-primary" />
                                <span>ID</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[18%]">
                              <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4 text-primary" />
                                <span>Categoría</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[18%]">
                              <div className="flex items-center gap-1">
                                <Settings className="h-4 w-4 text-primary" />
                                <span>Proceso</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[18%]">
                              <div className="flex items-center gap-1">
                                <Tool className="h-4 w-4 text-primary" />
                                <span>Equipo</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[18%]">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>Fecha de paro</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[18%]">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>Horas</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[10%] text-center">
                              <div className="flex items-center justify-center">
                                <Info className="h-4 w-4 text-primary" />
                                <span className="ml-1">Acciones</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.length > 0 ? (
                            paginatedData.map((row) => (
                              <TableRow key={row.id_registro}>
                                <TableCell className="truncate">
                                  {row.id_registro}
                                </TableCell>
                                <TableCell className="truncate">
                                  {row.categoria}
                                </TableCell>
                                <TableCell className="truncate">
                                  {row.proceso}
                                </TableCell>
                                <TableCell className="truncate">
                                  {row.equipo}
                                </TableCell>
                                <TableCell className="truncate">
                                  {formatDate(row.fecha_y_hora_de_paro)}
                                </TableCell>
                                <TableCell className="truncate">
                                  {row.horas_de_paro}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <ActionMenu record={row} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="h-24 text-center"
                              >
                                No se encontraron registros.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Vista para dispositivos móviles y tablets */}
                <div className="md:hidden flex-1 overflow-auto h-full border-t">
                  <div className="px-4 py-4">
                    {paginatedData.length > 0 ? (
                      <div className="space-y-3">
                        {paginatedData.map((row) => (
                          <Card
                            key={row.id_registro}
                            className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
                          >
                            <CardHeader className="p-3 pb-0 bg-primary/5 flex flex-row items-start justify-between">
                              <div>
                                <Badge
                                  variant={
                                    row.tipo === "Correctivo"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className={
                                    row.tipo === "Correctivo"
                                      ? "mb-2 bg-red-500"
                                      : "mb-2 bg-secondary text-white"
                                  }
                                >
                                  {row.tipo}
                                </Badge>
                                <CardTitle className="text-base text-primary">
                                  {row.equipo}
                                </CardTitle>
                                <CardDescription className="text-xs flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(row.fecha_y_hora_de_paro)} •
                                  <Clock className="h-3 w-3 ml-1" />
                                  {row.horas_de_paro}h
                                </CardDescription>
                              </div>
                              <ActionMenu record={row} />
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                              <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Categoría:
                                </div>
                                <div className="truncate">{row.categoria}</div>

                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Settings className="h-3 w-3" />
                                  Proceso:
                                </div>
                                <div className="truncate">{row.proceso}</div>

                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  Causa:
                                </div>
                                <div className="truncate">{row.causa}</div>

                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Settings className="h-3 w-3" />
                                  Registrado por:
                                </div>
                                <div className="truncate">
                                  {row.nombre_usuario}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No se encontraron registros.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>

          {/* Paginación */}
          {!isLoading && filteredData.length > itemsPerPage && (
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 3) }).map(
                    (_, i) => {
                      let pageNumber;

                      if (totalPages <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 2) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNumber = totalPages - 2 + i;
                      } else {
                        pageNumber = currentPage - 1 + i;
                      }

                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  )}

                  {totalPages > 3 && currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {selectedRecord
                ? "Detalles del registro"
                : "Cargando detalles..."}
            </DialogTitle>
            {selectedRecord && (
              <DialogDescription>
                Información completa del paro industrial
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedRecord ? (
            <>
              <div className="grid grid-cols-2 gap-y-2 text-sm overflow-y-auto pr-1 py-2">
                <div className="font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" />
                  Categoría:
                </div>
                <div>{selectedRecord.categoria}</div>

                <div className="font-medium flex items-center gap-1">
                  <Settings className="h-3 w-3 text-primary" />
                  Proceso:
                </div>
                <div>{selectedRecord.proceso}</div>

                <div className="font-medium flex items-center gap-1">
                  <Tool className="h-3 w-3 text-primary" />
                  Equipo:
                </div>
                <div>{selectedRecord.equipo}</div>

                <div className="font-medium flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-primary" />
                  Especialidad:
                </div>
                <div>{selectedRecord.especialidad}</div>

                <div className="font-medium flex items-center gap-1">
                  <Filter className="h-3 w-3 text-primary" />
                  Tipo:
                </div>
                <div>{selectedRecord.tipo}</div>

                <div className="font-medium flex items-center gap-1">
                  <Layers className="h-3 w-3 text-primary" />
                  Causa:
                </div>
                <div>{selectedRecord.causa}</div>

                <div className="font-medium col-span-2 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-primary" />
                  Detalle:
                </div>
                <div className="min-h-[50px] col-span-2 mb-2 break-words whitespace-pre-wrap max-h-[150px] overflow-y-auto border rounded-md p-2 border-primary/20">
                  {selectedRecord.detalle}
                </div>

                <div className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  Fecha de paro:
                </div>
                <div>{formatDate(selectedRecord.fecha_y_hora_de_paro)}</div>

                <div className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  Fecha de arranque:
                </div>
                <div>{formatDate(selectedRecord.fecha_y_hora_de_arranque)}</div>

                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  Horas de paro:
                </div>
                <div>{selectedRecord.horas_de_paro}</div>

                <div className="font-medium flex items-center gap-1">
                  <Timer className="h-3 w-3 text-primary" />
                  Cadencia:
                </div>
                <div>{selectedRecord.cadencia}</div>

                <div className="font-medium flex items-center gap-1">
                  <ChevronDown className="h-3 w-3 text-primary" />
                  Pérdida:
                </div>
                <div>{selectedRecord.perdida_de_produccion}</div>

                <div className="font-medium flex items-center gap-1">
                  <Settings className="h-3 w-3 text-primary" />
                  Registrado por:
                </div>
                <div>{selectedRecord.nombre_usuario}</div>
              </div>
              <DialogFooter className="sm:justify-end border-t pt-2">
                {isAdmin && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        setIsDialogOpen(false);
                        editRecord(selectedRecord);
                      }}
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500"
                    >
                      <Edit className="h-4 w-4 mr-1 text-blue-500" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDialogOpen(false);
                        confirmDelete(selectedRecord.id_registro);
                      }}
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                      Eliminar
                    </Button>
                  </div>
                )}
                <DialogClose asChild>
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Cerrar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Está seguro de eliminar este registro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado
              permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteRecord();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar registro
            </DialogTitle>
            <DialogDescription>
              Modifique los datos del paro industrial
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4">
            {/* Alerta de validación */}
            {validationAlert && (
              <Alert
                variant="destructive"
                className="mb-4 animate-in fade-in-50"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de validación</AlertTitle>
                <AlertDescription>{validationAlert}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="stop-date"
                    className="flex items-center gap-2"
                  >
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
                  <Label
                    htmlFor="start-date"
                    className="flex items-center gap-2"
                  >
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
                      onChange={(e) =>
                        handleChange("startDate", e.target.value)
                      }
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.category && "text-muted-foreground"
                          )}
                        >
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.category
                            ? categorias.find(
                                (cat) =>
                                  cat.id_categoria.toString() ===
                                  formData.category
                              )?.nombre_categoria || "Seleccione una categoría"
                            : "Seleccione una categoría"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar categoría..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron categorías.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {categorias.map((categoria) => (
                                <CommandItem
                                  key={categoria.id_categoria}
                                  value={categoria.nombre_categoria}
                                  className="py-3 text-base"
                                  onSelect={() => {
                                    handleChange(
                                      "category",
                                      categoria.id_categoria.toString()
                                    );
                                    setOpenCategory(false); // Cerrar el popover después de seleccionar
                                  }}
                                >
                                  {categoria.nombre_categoria}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      formData.category ===
                                        categoria.id_categoria.toString()
                                        ? "opacity-100 text-primary"
                                        : "opacity-0"
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
                  <input
                    type="hidden"
                    name="category"
                    value={formData.category}
                  />
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
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.process && "text-muted-foreground"
                          )}
                        >
                          <Settings className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.process
                            ? procesos.find(
                                (proc) =>
                                  proc.id_proceso.toString() ===
                                  formData.process
                              )?.nombre_proceso || "Seleccione un proceso"
                            : "Seleccione un proceso"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar proceso..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron procesos.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {procesos.map((proceso) => (
                                <CommandItem
                                  key={proceso.id_proceso}
                                  value={proceso.nombre_proceso}
                                  className="py-3 text-base"
                                  onSelect={() => {
                                    handleChange(
                                      "process",
                                      proceso.id_proceso.toString()
                                    );
                                    setOpenProcess(false); // Cerrar el popover después de seleccionar
                                  }}
                                >
                                  {proceso.nombre_proceso}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      formData.process ===
                                        proceso.id_proceso.toString()
                                        ? "opacity-100 text-primary"
                                        : "opacity-0"
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
                  <input
                    type="hidden"
                    name="process"
                    value={formData.process}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="equipment"
                    className="flex items-center gap-2"
                  >
                    <Tool className="h-4 w-4 text-primary" />
                    Equipos
                  </Label>
                  {isLoadingEquipos ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover
                      open={openEquipment}
                      onOpenChange={setOpenEquipment}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          id="equipment"
                          name="equipment"
                          disabled={!formData.process || isLoadingEquipos}
                          className={cn(
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.equipment && "text-muted-foreground"
                          )}
                        >
                          <Tool className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.equipment
                            ? equipos.find(
                                (equipo) =>
                                  getEquipoId(equipo).toString() ===
                                  formData.equipment
                              )
                              ? getEquipoName(
                                  equipos.find(
                                    (equipo) =>
                                      getEquipoId(equipo).toString() ===
                                      formData.equipment
                                  )!
                                )
                              : "Seleccione un equipo"
                            : formData.process
                            ? "Seleccione un equipo"
                            : "Seleccione un proceso primero"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar equipo..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron equipos.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {equipos.map((equipo) => {
                                const equipoId = getEquipoId(equipo).toString();
                                const equipoName = getEquipoName(equipo);
                                return (
                                  <CommandItem
                                    key={equipoId}
                                    value={equipoName}
                                    className="py-3 text-base"
                                    onSelect={() => {
                                      handleChange("equipment", equipoId);
                                      setOpenEquipment(false); // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    {equipoName}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.equipment === equipoId
                                          ? "opacity-100 text-primary"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <input
                    type="hidden"
                    name="equipment"
                    value={formData.equipment}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="specialty"
                    className="flex items-center gap-2"
                  >
                    <Wrench className="h-4 w-4 text-primary" />
                    Especialidades
                  </Label>
                  {isLoadingEspecialidades ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Popover
                      open={openSpecialty}
                      onOpenChange={setOpenSpecialty}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          id="specialty"
                          name="specialty"
                          className={cn(
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.specialty && "text-muted-foreground"
                          )}
                        >
                          <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.specialty
                            ? especialidades.find(
                                (especialidad) =>
                                  especialidad.id_especialidad.toString() ===
                                  formData.specialty
                              )?.nombre_especialidad ||
                              "Seleccione una especialidad"
                            : "Seleccione una especialidad"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar especialidad..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron especialidades.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {especialidades.map((especialidad) => (
                                <CommandItem
                                  key={especialidad.id_especialidad}
                                  value={especialidad.nombre_especialidad}
                                  className="py-3 text-base"
                                  onSelect={() => {
                                    handleChange(
                                      "specialty",
                                      especialidad.id_especialidad.toString()
                                    );
                                    setOpenSpecialty(false); // Cerrar el popover después de seleccionar
                                  }}
                                >
                                  {especialidad.nombre_especialidad}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      formData.specialty ===
                                        especialidad.id_especialidad.toString()
                                        ? "opacity-100 text-primary"
                                        : "opacity-0"
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
                  <input
                    type="hidden"
                    name="specialty"
                    value={formData.specialty}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.type && "text-muted-foreground"
                          )}
                        >
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.type
                            ? tipos.find(
                                (tipo) =>
                                  getTipoId(tipo).toString() === formData.type
                              )
                              ? getTipoName(
                                  tipos.find(
                                    (tipo) =>
                                      getTipoId(tipo).toString() ===
                                      formData.type
                                  )!
                                )
                              : "Seleccione un tipo"
                            : formData.type
                            ? "Seleccione un tipo"
                            : "Seleccione una especialidad primero"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar tipo..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontraron tipos.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {tipos.map((tipo) => {
                                const tipoId = getTipoId(tipo).toString();
                                const tipoName = getTipoName(tipo);
                                return (
                                  <CommandItem
                                    key={tipoId}
                                    value={tipoName}
                                    className="py-3 text-base"
                                    onSelect={() => {
                                      handleChange("type", tipoId);
                                      setOpenType(false); // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    {tipoName}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.type === tipoId
                                          ? "opacity-100 text-primary"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                );
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
                            "h-12 w-full justify-between text-base pl-9 relative",
                            !formData.cause && "text-muted-foreground"
                          )}
                        >
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {formData.cause
                            ? causas.find(
                                (causa) =>
                                  getCausaId(causa).toString() ===
                                  formData.cause
                              )
                              ? getCausaName(
                                  causas.find(
                                    (causa) =>
                                      getCausaId(causa).toString() ===
                                      formData.cause
                                  )!
                                )
                              : "Seleccione una causa"
                            : formData.cause
                            ? "Seleccione una causa"
                            : "Seleccione un tipo primero"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar causa..."
                            className="h-10 text-base"
                            autoFocus={false}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No se encontró la causa.
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {causas.map((causa) => {
                                const causaId = getCausaId(causa).toString();
                                const causaName = getCausaName(causa);
                                return (
                                  <CommandItem
                                    key={causaId}
                                    value={causaName}
                                    className="py-3 text-base"
                                    onSelect={() => {
                                      handleChange("cause", causaId);
                                      setOpenCause(false); // Cerrar el popover después de seleccionar
                                    }}
                                  >
                                    {causaName}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.cause === causaId
                                          ? "opacity-100 text-primary"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                );
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
            </div>
          </form>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting || !isFormComplete()}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TablePageClient;
