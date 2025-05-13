import sql from "mssql";
import { poolPromise } from "../config/db.js";
import bcrypt from "bcrypt";

export const getAllUsuarios = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Usuario");
    return result.recordset;
  } catch (error) {
    throw new Error("Error fetching usuarios: " + error.message);
  }
};

export const getUsuarioById = async (id) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_usuario", sql.Int, id)
      .query("SELECT * FROM Usuario WHERE id_usuario = @id_usuario");
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error fetching usuario: " + error.message);
  }
};

export const createUsuario = async (usuarioData) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(usuarioData.contraseña, saltRounds);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("usuario", sql.NVarChar(100), usuarioData.usuario)
      .input("nombre_usuario", sql.NVarChar(100), usuarioData.nombre_usuario)
      .input(
        "apellido_usuario",
        sql.NVarChar(100),
        usuarioData.apellido_usuario
      )
      .input("contraseña", sql.NVarChar(100), hashedPassword)
      .query(
        "INSERT INTO Usuario (usuario, nombre_usuario, apellido_usuario, contraseña) OUTPUT INSERTED.* VALUES (@usuario, @nombre_usuario, @apellido_usuario, @contraseña)"
      );
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error creating usuario: " + error.message);
  }
};

export const updateUsuario = async (id, usuarioData) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_usuario", sql.Int, id)
      .input("usuario", sql.NVarChar(100), usuarioData.usuario)
      .input("nombre_usuario", sql.NVarChar(100), usuarioData.nombre_usuario)
      .input(
        "apellido_usuario",
        sql.NVarChar(100),
        usuarioData.apellido_usuario
      )
      .input("contraseña", sql.NVarChar(100), usuarioData.contraseña)
      .query(
        "UPDATE Usuario SET usuario = @usuario, nombre_usuario = @nombre_usuario, apellido_usuario = @apellido_usuario, contraseña = @contraseña OUTPUT INSERTED.* WHERE id_usuario = @id_usuario"
      );
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error updating usuario: " + error.message);
  }
};

export const deleteUsuario = async (id) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_usuario", sql.Int, id)
      .query("DELETE FROM Usuario WHERE id_usuario = @id_usuario");
    return true;
  } catch (error) {
    throw new Error("Error deleting usuario: " + error.message);
  }
};

export const authenticateUser = async (username, password) => {
  try {
      const pool = await poolPromise;
      const result = await pool.request()
          .input('usuario', sql.NVarChar(100), username)
          .query('SELECT * FROM Usuario WHERE usuario = @usuario');

      const user = result.recordset[0];
      
      if (!user) {
          return null;
      }

      const isMatch = await bcrypt.compare(password, user.contraseña);
      
      if (!isMatch) {
          return null;
      }

      // No devolver la contraseña en la respuesta
      delete user.contraseña;
      return user;
  } catch (error) {
      throw new Error('Error authenticating user: ' + error.message);
  }
};
