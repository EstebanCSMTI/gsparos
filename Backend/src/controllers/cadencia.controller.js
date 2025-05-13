import * as cadenciaModel from '../models/cadencia.model.js';

export const getAll = async (req, res) => {
    try {
        const cadencias = await cadenciaModel.getAllCadencias();
        res.json(cadencias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const cadencia = await cadenciaModel.getCadenciaById(req.params.id);
        if (!cadencia) {
            return res.status(404).json({ message: 'Cadencia no encontrada' });
        }
        res.json(cadencia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        if (!req.body.id_proceso || !req.body.valor_cadencia) {
            return res.status(400).json({ 
                message: 'Id del proceso y valor de cadencia son requeridos' 
            });
        }

        const newCadencia = await cadenciaModel.createCadencia(req.body);
        res.status(201).json(newCadencia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const cadencia = await cadenciaModel.getCadenciaById(req.params.id);
        if (!cadencia) {
            return res.status(404).json({ message: 'Cadencia no encontrada' });
        }

        if (!req.body.valor_cadencia) {
            return res.status(400).json({ 
                message: 'Id del proceso y valor de cadencia son requeridos' 
            });
        }

        const updatedCadencia = await cadenciaModel.updateCadencia(req.params.id, req.body);
        res.json(updatedCadencia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const cadencia = await cadenciaModel.getCadenciaById(req.params.id);
        if (!cadencia) {
            return res.status(404).json({ message: 'Cadencia no encontrada' });
        }
        await cadenciaModel.deleteCadencia(req.params.id);
        res.json({ message: 'Cadencia eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};