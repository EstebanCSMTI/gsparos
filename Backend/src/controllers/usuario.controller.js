import * as usuarioModel from '../models/usuario.model.js';

export const getAll = async (req, res) => {
    try {
        const usuarios = await usuarioModel.getAllUsuarios();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const usuario = await usuarioModel.getUsuarioById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        if (!req.body.usuario || !req.body.contraseña) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }
        const newUsuario = await usuarioModel.createUsuario(req.body);
        res.status(201).json(newUsuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const usuario = await usuarioModel.getUsuarioById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const updatedUsuario = await usuarioModel.updateUsuario(req.params.id, req.body);
        res.json(updatedUsuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const usuario = await usuarioModel.getUsuarioById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        await usuarioModel.deleteUsuario(req.params.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const authenticate = async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;

        // Validar que se proporcionaron las credenciales
        if (!usuario || !contraseña) {
            return res.status(400).json({ 
                message: 'Usuario y contraseña son requeridos' 
            });
        }

        // Intentar autenticar al usuario
        const authenticatedUser = await usuarioModel.authenticateUser(usuario, contraseña);

        if (!authenticatedUser) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Si la autenticación es exitosa, devolver los datos del usuario
        res.json({
            message: 'Autenticación exitosa',
            user: authenticatedUser
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};