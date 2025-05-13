import * as dynamicModel from '../models/dynamic.model.js';

export const getTableData = async (req, res) => {
    try {
        const { tableName } = req.params;
        
        if (!tableName) {
            return res.status(400).json({ 
                message: 'El nombre de la tabla es requerido' 
            });
        }

        const data = await dynamicModel.getTableData(tableName);
        res.json(data);
    } catch (error) {
        if (error.message === 'Tabla no permitida') {
            return res.status(403).json({ 
                message: 'No está permitido acceder a esta tabla' 
            });
        }
        res.status(500).json({ message: error.message });
    }
};