import sql from 'mssql';
import { poolPromise } from '../config/db.js';

export const getAllCadencias = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT C.*, P.nombre_proceso 
            FROM Cadencia C
            LEFT JOIN Proceso P ON C.id_proceso = P.id_proceso
        `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error fetching cadencias: ' + error.message);
    }
};

export const getCadenciaById = async (id) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_proceso', sql.Int, id)
            .query(`
                SELECT C.*, P.nombre_proceso 
                FROM Cadencia C
                LEFT JOIN Proceso P ON C.id_proceso = P.id_proceso
                WHERE C.id_proceso = @id_proceso
            `);
        return result.recordset[0];
    } catch (error) {
        throw new Error('Error fetching cadencia: ' + error.message);
    }
};

export const createCadencia = async (cadenciaData) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_proceso', sql.Int, cadenciaData.id_proceso)
            .input('valor_cadencia', sql.Float, cadenciaData.valor_cadencia)
            .query(`
                INSERT INTO Cadencia (id_proceso, valor_cadencia)
                OUTPUT INSERTED.*
                VALUES (@id_proceso, @valor_cadencia)
            `);
        return result.recordset[0];
    } catch (error) {
        throw new Error('Error creating cadencia: ' + error.message);
    }
};

export const updateCadencia = async (id, cadenciaData) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_cadencia', sql.Int, id)
            .input('valor_cadencia', sql.Float, cadenciaData.valor_cadencia)
            .query(`
                UPDATE Cadencia 
                SET
                    valor_cadencia = @valor_cadencia
                OUTPUT INSERTED.*
                WHERE id_cadencia = @id_cadencia
            `);
        return result.recordset[0];
    } catch (error) {
        throw new Error('Error updating cadencia: ' + error.message);
    }
};

export const deleteCadencia = async (id) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id_cadencia', sql.Int, id)
            .query('DELETE FROM Cadencia WHERE id_cadencia = @id_cadencia');
        return true;
    } catch (error) {
        throw new Error('Error deleting cadencia: ' + error.message);
    }
};