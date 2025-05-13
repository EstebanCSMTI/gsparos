import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import usuarioRoutes from './routes/usuario.routes.js';
import registroRoutes from './routes/registro.routes.js';
import dynamicRoutes from './routes/dynamic.routes.js';
import cadenciaRoutes from './routes/cadencia.routes.js';

dotenv.config();

const PORT = process.env.PORT || 8028;
const app = express();

app.use(cors({ 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Middleware para registrar todas las solicitudes entrantes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
    console.log("Headers:", req.headers);
    if (Object.keys(req.body).length) {
        console.log("Body:", req.body);
    }
    next();
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/registros', registroRoutes);
app.use('/api/dynamic', dynamicRoutes);
app.use('/api/cadencias', cadenciaRoutes);

// Middleware para manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});