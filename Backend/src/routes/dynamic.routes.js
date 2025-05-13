import { Router } from 'express';
import * as dynamicController from '../controllers/dynamic.controller.js';

const router = Router();

router.get('/:tableName', dynamicController.getTableData);

export default router;