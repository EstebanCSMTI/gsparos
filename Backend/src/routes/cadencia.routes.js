import { Router } from 'express';
import * as cadenciaController from '../controllers/cadencia.controller.js';

const router = Router();

router.get('/', cadenciaController.getAll);
router.get('/:id', cadenciaController.getById);
router.post('/', cadenciaController.create);
router.put('/:id', cadenciaController.update);
router.delete('/:id', cadenciaController.remove);

export default router;