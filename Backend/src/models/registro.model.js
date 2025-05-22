import sql from "mssql";
import { poolPromise } from "../config/db.js";

import { DateTime } from "luxon";

export const getAllRegistros = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
    R.id_registro,
    R.categoria,
    R.proceso,
    R.equipo,
    R.especialidad,
    R.tipo,
    R.causa,
    R.detalle,
    CONVERT(varchar, R.fecha_y_hora_de_paro, 120) AS fecha_y_hora_de_paro,
    CONVERT(varchar, R.fecha_y_hora_de_arranque, 120) AS fecha_y_hora_de_arranque,
    R.cadencia,
    R.perdida_de_produccion,
    R.horas_de_paro,
    R.id_usuario,
    U.nombre_usuario + ' ' + U.apellido_usuario AS nombre_usuario
FROM 
    Registro R
LEFT JOIN 
    Usuario U ON R.id_usuario = U.id_usuario
ORDER BY 
    R.id_registro DESC;

    `);

    return result.recordset
  } catch (error) {
    throw new Error("Error fetching registros: " + error.message);
  }
};

export const getRegistroById = async (id) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("id_registro", sql.Int, id)
      .query(`
                SELECT R.*, U.usuario as nombre_usuario 
                FROM Registro R
                LEFT JOIN Usuario U ON R.id_usuario = U.id_usuario
                WHERE R.id_registro = @id_registro
            `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error fetching registro: " + error.message);
  }
};

export const createRegistro = async (registroData) => {
  try {
    const pool = await poolPromise;
    console.log(registroData.fecha_y_hora_de_arranque);
    console.log(registroData.fecha_y_hora_de_paro);
    const result = await pool
      .request()
      .input("categoria", sql.NVarChar(100), registroData.categoria)
      .input("proceso", sql.NVarChar(100), registroData.proceso)
      .input("equipo", sql.NVarChar(100), registroData.equipo)
      .input("especialidad", sql.NVarChar(100), registroData.especialidad)
      .input("tipo", sql.NVarChar(100), registroData.tipo)
      .input("causa", sql.NVarChar(100), registroData.causa)
      .input("detalle", sql.NVarChar(100), registroData.detalle)
      .input(
        "fecha_y_hora_de_paro",
        registroData.fecha_y_hora_de_paro
      )
      .input(
        "fecha_y_hora_de_arranque",
        registroData.fecha_y_hora_de_arranque
      )
      .input("horas_de_paro", sql.Float, registroData.horas_de_paro)
      .input("cadencia", sql.Float, registroData.cadencia)
      .input(
        "perdida_de_produccion",
        sql.Float,
        registroData.perdida_de_produccion
      )
      .input("id_usuario", sql.Int, registroData.id_usuario).query(`
                INSERT INTO Registro (
                    categoria, proceso, equipo, especialidad, tipo, causa, detalle,
                    fecha_y_hora_de_paro, fecha_y_hora_de_arranque,  cadencia,
                    perdida_de_produccion, id_usuario, horas_de_paro
                ) OUTPUT INSERTED.*
                VALUES (
                    @categoria, @proceso, @equipo, @especialidad, @tipo, @causa,
                    @detalle, @fecha_y_hora_de_paro, @fecha_y_hora_de_arranque,
                    @cadencia, @perdida_de_produccion, @id_usuario, @horas_de_paro
                )
            `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error creating registro: " + error.message);
  }
};

export const updateRegistro = async (id, registroData) => {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id_registro", sql.Int, id)
      .input("categoria", sql.NVarChar(100), registroData.categoria)
      .input("proceso", sql.NVarChar(100), registroData.proceso)
      .input("equipo", sql.NVarChar(100), registroData.equipo)
      .input("especialidad", sql.NVarChar(100), registroData.especialidad)
      .input("tipo", sql.NVarChar(100), registroData.tipo)
      .input("causa", sql.NVarChar(100), registroData.causa)
      .input("detalle", sql.NVarChar(100), registroData.detalle)
      .input("horas_de_paro", sql.Float, registroData.horas_de_paro)
      .input("fecha_y_hora_de_paro", registroData.fecha_y_hora_de_paro)
      .input("fecha_y_hora_de_arranque", registroData.fecha_y_hora_de_arranque)
      .input("cadencia", sql.Float, registroData.cadencia)
      .input(
        "perdida_de_produccion",
        sql.Float,
        registroData.perdida_de_produccion
      )
      .input("id_usuario", sql.Int, registroData.id_usuario).query(`
                UPDATE Registro SET
                    categoria = @categoria,
                    proceso = @proceso,
                    equipo = @equipo,
                    especialidad = @especialidad,
                    tipo = @tipo,
                    causa = @causa,
                    detalle = @detalle,
                    fecha_y_hora_de_paro = @fecha_y_hora_de_paro,
                    fecha_y_hora_de_arranque = @fecha_y_hora_de_arranque,
                    cadencia = @cadencia,
                    perdida_de_produccion = @perdida_de_produccion,
                    horas_de_paro = @horas_de_paro,
                    id_usuario = @id_usuario
                OUTPUT INSERTED.*
                WHERE id_registro = @id_registro
            `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error updating registro: " + error.message);
  }
};

export const deleteRegistro = async (id) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_registro", sql.Int, id)
      .query("DELETE FROM Registro WHERE id_registro = @id_registro");
    return true;
  } catch (error) {
    throw new Error("Error deleting registro: " + error.message);
  }
};
