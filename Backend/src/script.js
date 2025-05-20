import fs from 'fs';
import csv from 'csv-parser';
import sql from 'mssql';
import { poolPromise } from './config/db.js';

// 🔧 Configurable
const CSV_FILE_PATH = './src/data.csv';
const TABLE_NAME = 'Registro';
const BATCH_SIZE = 100;

// 🔤 Normaliza texto: elimina tildes, guiones bajos, pone mayúscula inicial y lo demás en minúscula
function normalizeText(str) {
    if (!str || typeof str !== 'string') return '';

    return str
        .normalize('NFD')                             // separa letras y acentos
        .replace(/[\u0300-\u036f]/g, '')              // elimina los acentos
        .replace(/_/g, ' ')                           // reemplaza guión bajo por espacio
        .toLowerCase()
        .replace(/\s+/g, ' ')                         // elimina espacios dobles
        .trim()
        .replace(/^./, c => c.toUpperCase());         // primera letra en mayúscula
}

// 🔁 Utilidades
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    dateStr = dateStr.trim().replace(',', '.');

    // mm/dd/yy hh:mm
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}) (\d{1,2}):(\d{2})$/);
    if (!match) return null;

    let [, month, day, year, hour, minute] = match;

    month = parseInt(month, 10);
    day = parseInt(day, 10);
    year = parseInt('20' + year, 10); // año 20xx
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    const date = new Date(iso);
    return isNaN(date.getTime()) ? null : date;
}


function parseNumber(numStr) {
    return typeof numStr === 'string' ? parseFloat(numStr.replace(',', '.')) || 0 : 0;
}

function normalizeHeader(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // elimina tildes
        .replace(/[^a-z0-9]/g, '_') // reemplaza caracteres no válidos
        .replace(/_+/g, '_') // evita "__"
        .replace(/^_+|_+$/g, ''); // quita guiones al inicio y fin
}

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', data => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

async function insertBatch(tableName, data) {
    const columns = Object.keys(data[0]);
    const columnNames = columns.map(col => `[${col}]`).join(', ');
    const values = data.map((_, idx) =>
        `(${columns.map((__, colIdx) => `@val${idx}_${colIdx}`).join(', ')})`
    ).join(', ');
    const query = `INSERT INTO [${tableName}] (${columnNames}) VALUES ${values}`;

    const pool = await poolPromise;
    const request = pool.request();

    data.forEach((row, rowIdx) => {
        columns.forEach((col, colIdx) => {
            request.input(`val${rowIdx}_${colIdx}`, row[col]);
        });
    });

    await request.query(query);
}

(async () => {
    try {
        const rawData = await parseCSV(CSV_FILE_PATH);

        const processedData = rawData.map(row => {
            const normalized = {};
            for (const key in row) {
                const cleanKey = normalizeHeader(key);
                normalized[cleanKey] = row[key];
            }

            return {
                categoria: normalizeText(normalized['categoria']),
                proceso: normalizeText(normalized['proceso']),
                equipo: normalizeText(normalized['equipo']),
                especialidad: normalizeText(normalized['especialidad']),
                tipo: normalizeText(normalized['tipo']),
                causa: normalizeText(normalized['causa']),
                detalle: normalized['detalle']?.trim() || '',
                fecha_y_hora_de_paro: parseDate(normalized['fecha_y_hora_de_paro']),
                fecha_y_hora_de_arranque: parseDate(normalized['fecha_y_hora_de_arranque']),
                horas_de_paro: parseNumber(normalized['horas_de_paro']),
                cadencia: parseNumber(normalized['cadencia']),
                perdida_de_produccion: parseNumber(normalized['perdida_de_produccion']),
                id_usuario: parseInt(normalized['id_usuario']) || 0
            };
        });

        console.log(`🚀 Insertando ${processedData.length} registros en lotes de ${BATCH_SIZE}...`);

        for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
            const batch = processedData.slice(i, i + BATCH_SIZE);
            await insertBatch(TABLE_NAME, batch);
            console.log(`✅ Lote ${i / BATCH_SIZE + 1} insertado (${batch.length} registros)`);
        }

        console.log('🎉 Inserción completa');
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
})();
