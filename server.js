const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

const onlineUsers = new Map();
let activeSessions = [];

app.use(express.static(path.join(__dirname, 'main', 'public')));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/menu.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'public','js', 'menu.js'));
});

app.get('/css/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'public', 'css', 'styles.css'));
});

app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    res.sendFile(path.join(__dirname, 'main', 'public', 'images', imageName));
});

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

const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

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

app.post('/admin/users', authenticateToken, isAdmin, async (req, res) => {
    const { username, password, isAdmin } = req.body;
});

app.put('/admin/users/:username', authenticateToken, isAdmin, async (req, res) => {
    const { username } = req.params;
    const { password, isAdmin } = req.body;
});

app.delete('/admin/users/:username', authenticateToken, isAdmin, async (req, res) => {
    const { username } = req.params;
});

app.get('/admin/sessions', authenticateToken, isAdmin, (req, res) => {
    res.json(activeSessions);
});

app.delete('/admin/sessions/:sessionId', authenticateToken, isAdmin, (req, res) => {
    const { sessionId } = req.params;
    activeSessions = activeSessions.filter(session => session.id !== sessionId);
    res.json({ message: 'Session terminated successfully' });
});

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

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

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

app.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ isAdmin: req.user.isAdmin });
});

app.post('/logout', authenticateToken, (req, res) => {
    const username = req.user.username;
    onlineUsers.delete(username);
    res.json({ message: 'Logged out successfully' });
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

            const lastPosition = await getUserLastPosition(username);

            onlineUsers.set(username, {
                username,
                nickname: user.nickname,
                x: lastPosition.x || 400,
                y: lastPosition.y || 300,
                dragonImage: user.selectedDragon?.image || '/images/default-dragon.png'
            });

            res.json({
                message: 'Login successful',
                token,
                isAdmin: user.isAdmin,
                position: { x: lastPosition.x, y: lastPosition.y },
                nickname: user.nickname
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/online-users', authenticateToken, (req, res) => {
    const usersArray = Array.from(onlineUsers.values()).map(user => ({
        username: user.username,
        nickname: user.nickname,
        x: user.x,
        y: user.y,
        dragonImage: user.dragonImage
    }));
    res.json(usersArray);
});

app.post('/update-position', authenticateToken, (req, res) => {
    const { x, y } = req.body;
    const username = req.user.username;

    if (onlineUsers.has(username)) {
        const user = onlineUsers.get(username);
        user.x = x;
        user.y = y;
        onlineUsers.set(username, user);

        updateUserPositionInDB(username, x, y)
            .then(() => res.json({ message: 'Position updated' }))
            .catch(error => res.status(500).json({ message: 'Error updating position' }));
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.post('/update-nickname', authenticateToken, async (req, res) => {
    const { nickname } = req.body;
    const username = req.user.username;

    if (!nickname || nickname.length < 2 || nickname.length > 64) {
        return res.status(400).json({ message: 'Nickname must be between 2 and 64 characters.' });
    }

    try {
        const usersPath = path.join(__dirname, 'users.json');
        const data = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(data);

        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users[userIndex].nickname = nickname;
            await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
            
            if (onlineUsers.has(username)) {
                const user = onlineUsers.get(username);
                user.nickname = nickname;
                onlineUsers.set(username, user);
            }

            res.json({ message: 'Nickname updated successfully', nickname });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating nickname:', error);
        res.status(500).json({ message: 'Server error while updating nickname' });
    }
});

async function updateUserPositionInDB(username, x, y) {
    const usersPath = path.join(__dirname, 'users.json');
    const data = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(data);

    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        users[userIndex].lastPosition = { x, y };
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    }
}

async function getUserLastPosition(username) {
    const usersPath = path.join(__dirname, 'users.json');
    const data = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(data);

    const user = users.find(u => u.username === username);
    return user?.lastPosition || { x: 400, y: 300 };
}

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});