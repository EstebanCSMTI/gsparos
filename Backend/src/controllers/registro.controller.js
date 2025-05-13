import * as registroModel from '../models/registro.model.js';

export const getAll = async (req, res) => {
    try {
        const registros = await registroModel.getAllRegistros();
        res.json(registros);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const registro = await registroModel.getRegistroById(req.params.id);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        res.json(registro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        // Validación de campos requeridos
        const requiredFields = ['categoria', 'proceso', 'equipo', 'tipo', 'fecha_y_hora_de_paro', 'id_usuario'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ message: `El campo ${field} es requerido` });
            }
        }

        const newRegistro = await registroModel.createRegistro(req.body);
        res.status(201).json(newRegistro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const registro = await registroModel.getRegistroById(req.params.id);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        const updatedRegistro = await registroModel.updateRegistro(req.params.id, req.body);
        res.json(updatedRegistro);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const registro = await registroModel.getRegistroById(req.params.id);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        await registroModel.deleteRegistro(req.params.id);
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};