const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

let activeSessions = [];

// Servir archivos estáticos desde el directorio 'main/public'
app.use(express.static(path.join(__dirname, 'main', 'public')));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura'; // Usar variable de entorno en producción

// Configurar rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limita cada IP a 100 solicitudes por ventana
});

app.use(limiter);

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Ruta para servir la página principal (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir menu.js
app.get('/menu.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'public','js', 'menu.js'));
});

// Ruta para servir el CSS
app.get('/css/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'public', 'css', 'styles.css'));
});

// Rutas para servir las imágenes de los dragones y el obstáculo
app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    res.sendFile(path.join(__dirname, 'main', 'public', 'images', imageName));
});

// Ruta para obtener dragones desde el archivo JSON (protegida)
app.get('/dragons', authenticateToken, async (req, res) => {
    try {
        const dragonsPath = path.join(__dirname, 'dragons.json');
        const data = await fs.readFile(dragonsPath, 'utf8');
        const dragons = JSON.parse(data);
        res.json(dragons);
    } catch (error) {
        console.error('Error al leer el archivo de dragones:', error);
        res.status(500).json({ message: 'Error en el servidor al leer los dragones' });
    }
});
// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

// Admin route to get all users
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'users.json');
        const data = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(data);
        res.json(users.map(user => ({ username: user.username, isAdmin: user.isAdmin })));
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users' });
    }
});

// Admin route to create a new user
app.post('/admin/users', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, isAdmin } = req.body;
    // ... (implement user creation logic)
});

// Admin route to update a user
app.put('/admin/users/:username', authenticateToken, isAdmin, async (req, res) => {
    const { username } = req.params;
    const { password, isAdmin } = req.body;
    // ... (implement user update logic)
});

// Admin route to delete a user
app.delete('/admin/users/:username', authenticateToken, isAdmin, async (req, res) => {
    const { username } = req.params;
    // ... (implement user deletion logic)
});

// Admin route to get all active sessions
app.get('/admin/sessions', authenticateToken, isAdmin, (req, res) => {
    res.json(activeSessions);
});

// Admin route to terminate a session
app.delete('/admin/sessions/:sessionId', authenticateToken, isAdmin, (req, res) => {
    const { sessionId } = req.params;
    activeSessions = activeSessions.filter(session => session.id !== sessionId);
    res.json({ message: 'Session terminated successfully' });
});
// Ruta para guardar dragones en el archivo JSON (protegida)
app.post('/dragons', authenticateToken, async (req, res) => {
    const dragons = req.body;
    const dragonsPath = path.join(__dirname, 'dragons.json');

    if (!Array.isArray(dragons)) {
        return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un array de dragones' });
    }

    try {
        await fs.writeFile(dragonsPath, JSON.stringify(dragons, null, 2));
        res.json({ message: 'Dragones guardados correctamente' });
    } catch (error) {
        console.error('Error al guardar los dragones:', error);
        res.status(500).json({ message: 'Error en el servidor al guardar los dragones' });
    }
});

// Ruta para el registro de usuarios
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password || username.length < 3 || password.length < 6) {
        return res.status(400).json({ message: 'Datos de entrada inválidos' });
    }

    try {
        const usersPath = path.join(__dirname, 'users.json');
        let users = [];
        try {
            const data = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe, se creará uno nuevo
        }

        if (users.some(user => user.username === username)) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        res.json({ message: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor al registrar usuario' });
    }
});
// Añadir una nueva ruta para verificar el token
app.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ isAdmin: req.user.isAdmin });
});

// Añade esta ruta en tu archivo server.js
app.post('/logout', authenticateToken, (req, res) => {
    const sessionId = req.body.sessionId;
    if (sessionId) {
        // Eliminar la sesión del array de sesiones activas
        activeSessions = activeSessions.filter(session => session.id !== sessionId);
    }
    res.json({ message: 'Sesión cerrada exitosamente' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const usersPath = path.join(__dirname, 'users.json');
        const data = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.username === username);

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
            const sessionId = Math.random().toString(36).substring(7);
            activeSessions.push({ id: sessionId, username: user.username, loginTime: new Date() });
            res.json({ message: 'Inicio de sesión exitoso', token, sessionId, isAdmin: user.isAdmin });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});