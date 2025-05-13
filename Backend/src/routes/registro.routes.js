import { Router } from 'express';
import * as registroController from '../controllers/registro.controller.js';

const router = Router();

router.get('/', registroController.getAll);
router.get('/:id', registroController.getById);
router.post('/', registroController.create);
router.put('/:id', registroController.update);
router.delete('/:id', registroController.remove);

export default router;