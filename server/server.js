const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

const JWT_SECRET = 'deadline_secret_key_2024';
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database
const db = new sqlite3.Database('./deadlines.db');

// Inizializza database
db.serialize(() => {
  // Tabella utenti
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    isAdmin BOOLEAN NOT NULL DEFAULT 0
  )`);

  // Tabella scadenze
  db.run(`CREATE TABLE IF NOT EXISTS deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    category TEXT,
    priority TEXT NOT NULL,
    prealert TEXT,
    assignedTo TEXT,
    completed BOOLEAN DEFAULT 0,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);

  // Tabella categorie
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // Tabella log attività
  db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    details TEXT
  )`);

  // Crea utente admin di default
  const hashedPassword = bcrypt.hashSync('SERISRL25%', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, isAdmin) VALUES (?, ?, ?)`, 
    ['admin', hashedPassword, true]);

  // Categorie di default
  const defaultCategories = ['Lavoro', 'Personale', 'Urgente', 'Riunioni'];
  defaultCategories.forEach(category => {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);
  });
});

// Middleware per autenticazione
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido' });
    }
    req.user = user;
    next();
  });
};

// Routes di autenticazione
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log accesso
    const log = {
      action: 'Login',
      user: username,
      timestamp: new Date().toISOString(),
      details: `Login effettuato da ${username}`
    };

    db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
      [log.action, log.user, log.timestamp, log.details]);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Password attuale non corretta' });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nell\'aggiornamento password' });
      }

      // Log cambio password
      const log = {
        action: 'Cambio password',
        user: req.user.username,
        timestamp: new Date().toISOString(),
        details: `Password cambiata per l'utente ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      res.json({ message: 'Password aggiornata con successo' });
    });
  });
});

// Routes utenti
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, isAdmin FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }
    res.json(users);
  });
});

app.post('/api/users', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { username, password, isAdmin } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
    [username, hashedPassword, isAdmin], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Utente già esistente' });
      }

      // Log creazione utente
      const log = {
        action: 'Creazione utente',
        user: req.user.username,
        timestamp: new Date().toISOString(),
        details: `Creato utente ${username} da ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      // Notifica via socket
      io.emit('user_created', {
        id: this.lastID,
        username,
        isAdmin
      });

      res.status(201).json({
        id: this.lastID,
        username,
        isAdmin
      });
    });
});

app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { id } = req.params;
  const { username, password, isAdmin } = req.body;
  
  let query = 'UPDATE users SET username = ?, isAdmin = ?';
  let params = [username, isAdmin];

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(400).json({ error: 'Errore nell\'aggiornamento utente' });
    }

    // Log modifica utente
    const log = {
      action: 'Modifica utente',
      user: req.user.username,
      timestamp: new Date().toISOString(),
      details: `Modificato utente ${username} da ${req.user.username}`
    };

    db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
      [log.action, log.user, log.timestamp, log.details]);

    // Notifica via socket
    io.emit('user_updated', { id, username, isAdmin });

    res.json({ id, username, isAdmin });
  });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { id } = req.params;

  db.get('SELECT username FROM users WHERE id = ?', [id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nella cancellazione utente' });
      }

      // Log eliminazione utente
      const log = {
        action: 'Eliminazione utente',
        user: req.user.username,
        timestamp: new Date().toISOString(),
        details: `Eliminato utente ${user.username} da ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      // Notifica via socket
      io.emit('user_deleted', { id });

      res.json({ message: 'Utente eliminato con successo' });
    });
  });
});

// Routes scadenze
app.get('/api/deadlines', authenticateToken, (req, res) => {
  db.all('SELECT * FROM deadlines ORDER BY date ASC, time ASC', (err, deadlines) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }
    
    // Parse JSON fields
    const parsedDeadlines = deadlines.map(deadline => ({
      ...deadline,
      prealert: JSON.parse(deadline.prealert || '[]'),
      assignedTo: JSON.parse(deadline.assignedTo || '[]'),
      completed: Boolean(deadline.completed)
    }));
    
    res.json(parsedDeadlines);
  });
});

app.post('/api/deadlines', authenticateToken, (req, res) => {
  const deadline = req.body;
  const now = new Date().toISOString();

  db.run(`INSERT INTO deadlines 
    (title, description, date, time, category, priority, prealert, assignedTo, completed, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deadline.title,
      deadline.description,
      deadline.date,
      deadline.time,
      deadline.category,
      deadline.priority,
      JSON.stringify(deadline.prealert),
      JSON.stringify(deadline.assignedTo),
      deadline.completed || false,
      req.user.username,
      now
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore nella creazione scadenza' });
      }

      const newDeadline = {
        id: this.lastID,
        ...deadline,
        createdBy: req.user.username,
        createdAt: now
      };

      // Log creazione scadenza
      const log = {
        action: 'Creazione scadenza',
        user: req.user.username,
        timestamp: now,
        details: `Creata scadenza "${deadline.title}" da ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      // Notifica via socket
      io.emit('deadline_created', newDeadline);

      res.status(201).json(newDeadline);
    });
});

app.put('/api/deadlines/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const deadline = req.body;

  db.run(`UPDATE deadlines SET 
    title = ?, description = ?, date = ?, time = ?, category = ?, 
    priority = ?, prealert = ?, assignedTo = ?
    WHERE id = ?`,
    [
      deadline.title,
      deadline.description,
      deadline.date,
      deadline.time,
      deadline.category,
      deadline.priority,
      JSON.stringify(deadline.prealert),
      JSON.stringify(deadline.assignedTo),
      id
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Errore nell\'aggiornamento scadenza' });
      }

      const updatedDeadline = { id: parseInt(id), ...deadline };

      // Log modifica scadenza
      const log = {
        action: 'Modifica scadenza',
        user: req.user.username,
        timestamp: new Date().toISOString(),
        details: `Modificata scadenza "${deadline.title}" da ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      // Notifica via socket
      io.emit('deadline_updated', updatedDeadline);

      res.json(updatedDeadline);
    });
});

app.delete('/api/deadlines/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT title FROM deadlines WHERE id = ?', [id], (err, deadline) => {
    if (err || !deadline) {
      return res.status(404).json({ error: 'Scadenza non trovata' });
    }

    db.run('DELETE FROM deadlines WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nella cancellazione scadenza' });
      }

      // Log eliminazione scadenza
      const log = {
        action: 'Eliminazione scadenza',
        user: req.user.username,
        timestamp: new Date().toISOString(),
        details: `Eliminata scadenza "${deadline.title}" da ${req.user.username}`
      };

      db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
        [log.action, log.user, log.timestamp, log.details]);

      // Notifica via socket
      io.emit('deadline_deleted', { id: parseInt(id) });

      res.json({ message: 'Scadenza eliminata con successo' });
    });
  });
});

app.patch('/api/deadlines/:id/complete', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE deadlines SET completed = ? WHERE id = ?', [true, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Errore nel completamento scadenza' });
    }

    db.get('SELECT * FROM deadlines WHERE id = ?', [id], (err, deadline) => {
      if (deadline) {
        const completedDeadline = {
          ...deadline,
          prealert: JSON.parse(deadline.prealert || '[]'),
          assignedTo: JSON.parse(deadline.assignedTo || '[]'),
          completed: true
        };

        // Log completamento scadenza
        const log = {
          action: 'Completamento scadenza',
          user: req.user.username,
          timestamp: new Date().toISOString(),
          details: `Completata scadenza "${deadline.title}" da ${req.user.username}`
        };

        db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
          [log.action, log.user, log.timestamp, log.details]);

        // Notifica via socket
        io.emit('deadline_completed', completedDeadline);

        res.json(completedDeadline);
      }
    });
  });
});

// Routes categorie
app.get('/api/categories', authenticateToken, (req, res) => {
  db.all('SELECT name FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }
    res.json(categories.map(c => c.name));
  });
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const { name } = req.body;

  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Categoria già esistente' });
    }

    // Log creazione categoria
    const log = {
      action: 'Creazione categoria',
      user: req.user.username,
      timestamp: new Date().toISOString(),
      details: `Creata categoria "${name}" da ${req.user.username}`
    };

    db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
      [log.action, log.user, log.timestamp, log.details]);

    res.status(201).json(name);
  });
});

app.delete('/api/categories/:name', authenticateToken, (req, res) => {
  const { name } = req.params;

  db.run('DELETE FROM categories WHERE name = ?', [decodeURIComponent(name)], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Errore nella cancellazione categoria' });
    }

    // Log eliminazione categoria
    const log = {
      action: 'Eliminazione categoria',
      user: req.user.username,
      timestamp: new Date().toISOString(),
      details: `Eliminata categoria "${decodeURIComponent(name)}" da ${req.user.username}`
    };

    db.run('INSERT INTO activity_logs (action, user, timestamp, details) VALUES (?, ?, ?, ?)',
      [log.action, log.user, log.timestamp, log.details]);

    res.json({ message: 'Categoria eliminata con successo' });
  });
});

// Routes log attività
app.get('/api/logs', authenticateToken, (req, res) => {
  db.all('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100', (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Errore database' });
    }
    res.json(logs);
  });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Utente connesso:', socket.id);

  socket.on('send_notification', (notification) => {
    // Invia notifica a tutti gli utenti connessi
    io.emit('notification', {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('mark_read', (notificationId) => {
    socket.emit('notification_read', { id: notificationId });
  });

  socket.on('disconnect', () => {
    console.log('Utente disconnesso:', socket.id);
  });
});

// Avvia server
server.listen(PORT, () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
  console.log(`📡 API disponibili su http://localhost:${PORT}/api`);
  console.log(`🔗 Socket.io attivo su http://localhost:${PORT}`);
});