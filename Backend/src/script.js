import sql from 'mssql';
import { poolPromise } from './config/db.js';

/**
 * Inserta múltiples registros en una tabla SQL Server.
 * @param {string} tableName - Nombre de la tabla.
 * @param {Array<Object>} data - Lista de objetos con los datos a insertar.
 */
export const insertData = async (tableName, data) => {
    if (!data || data.length === 0) {
        throw new Error('No hay datos para insertar');
    }

    // Obtener nombres de columnas desde las claves del primer objeto
    const columns = Object.keys(data[0]);
    const columnNames = columns.map(col => `[${col}]`).join(', ');

    // Construir los valores con parámetros
    const values = data.map((_, idx) =>
        `(${columns.map((__, colIdx) => `@val${idx}_${colIdx}`).join(', ')})`
    ).join(', ');

    // Crear consulta SQL
    console.log(`INSERT INTO [${tableName}] (${columnNames}) VALUES ${values}`); // Log de la consulta para depuración
    const query = `INSERT INTO [${tableName}] (${columnNames}) VALUES ${values}`;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Agregar todos los parámetros
        data.forEach((row, rowIdx) => {
            columns.forEach((col, colIdx) => {
                request.input(`val${rowIdx}_${colIdx}`, row[col]);
            });
        });

        await request.query(query);
        console.log(`Datos insertados en la tabla ${tableName}`);
    } catch (error) {
        throw new Error('Error insertando datos: ' + error.message);
    }
};

const parosEnOtrosProcesos = [
    { nombre_paros_en_otros_procesos: 'Paro de explotación', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_EXP' },
    { nombre_paros_en_otros_procesos: 'Paro de trituración', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_TRI' },
    { nombre_paros_en_otros_procesos: 'Paro de molienda de harina', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_MOL_HAR' },
    { nombre_paros_en_otros_procesos: 'Paro de clinkerización', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_CLI' },
    { nombre_paros_en_otros_procesos: 'Paro de molienda de cemento', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_MOL_CEM' },
    { nombre_paros_en_otros_procesos: 'Paro de empaque', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_EMP' },
    { nombre_paros_en_otros_procesos: 'Paro de materias primas', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_MAT_PRI' },
    { nombre_paros_en_otros_procesos: 'Paro de molienda carbón', codigo_paros_en_otros_procesos: 'PAR_OTR_PRO_PAR_MOL_CAR' }
  ];
  
  try {
    await insertData('Paros_en_otros_procesos', parosEnOtrosProcesos);
    console.log('Inserción completada');
  } catch (err) {
    console.error(err.message);
  }