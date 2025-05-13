import sql from 'mssql';
import { poolPromise } from '../config/db.js';

export const getTableData = async (tableName) => {
    try {

        const pool = await poolPromise;
        // Using regular query string instead of template literal
        const result = await pool.request()
            .query(`SELECT * FROM ${tableName}`);
        
        return result.recordset;
    } catch (error) {
        throw new Error('Error fetching table data: ' + error.message);
    }
};