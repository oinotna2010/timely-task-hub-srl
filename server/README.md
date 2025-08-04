# Server Backend - Sistema Gestione Scadenze

## Installazione e Avvio

1. **Installa le dipendenze:**
   ```bash
   cd server
   npm install
   ```

2. **Avvia il server:**
   ```bash
   # Modalità sviluppo (con auto-reload)
   npm run dev
   
   # Modalità produzione
   npm start
   ```

3. **Il server sarà disponibile su:**
   - API: `http://localhost:3001/api`
   - Socket.io: `http://localhost:3001`

## Funzionalità

### Autenticazione
- Login con JWT
- Cambio password
- Middleware di autenticazione per tutte le route protette

### Gestione Utenti
- Creazione, modifica, eliminazione utenti (solo admin)
- Lista utenti
- Ruoli admin/utente normale

### Gestione Scadenze
- CRUD completo per le scadenze
- Assegnazione a utenti
- Categorie e priorità
- Completamento scadenze
- Notifiche real-time via Socket.io

### Categorie
- Gestione categorie personalizzate
- Categorie di default precaricate

### Log Attività
- Tracciamento automatico di tutte le azioni
- Storico delle modifiche

### Notifiche Real-time
- Socket.io per sincronizzazione multi-dispositivo
- Notifiche push per nuove scadenze
- Aggiornamenti in tempo reale

## Database

Il server utilizza SQLite con le seguenti tabelle:

- **users**: Gestione utenti e autenticazione
- **deadlines**: Scadenze con tutte le proprietà
- **categories**: Categorie personalizzate
- **activity_logs**: Log di tutte le attività

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/change-password` - Cambio password

### Utenti
- `GET /api/users` - Lista utenti
- `POST /api/users` - Crea utente (admin only)
- `PUT /api/users/:id` - Modifica utente (admin only)
- `DELETE /api/users/:id` - Elimina utente (admin only)

### Scadenze
- `GET /api/deadlines` - Lista scadenze
- `POST /api/deadlines` - Crea scadenza
- `PUT /api/deadlines/:id` - Modifica scadenza
- `DELETE /api/deadlines/:id` - Elimina scadenza
- `PATCH /api/deadlines/:id/complete` - Completa scadenza

### Categorie
- `GET /api/categories` - Lista categorie
- `POST /api/categories` - Crea categoria
- `DELETE /api/categories/:name` - Elimina categoria

### Log
- `GET /api/logs` - Storico attività

## Configurazione

- **Porto**: 3001 (modificabile in `server.js`)
- **JWT Secret**: Cambia `JWT_SECRET` per produzione
- **Database**: `deadlines.db` (SQLite, creato automaticamente)
- **CORS**: Configurato per accettare tutte le origini (modificare per produzione)

## Credenziali di Default

- **Username**: admin
- **Password**: SERISRL25%
- **Ruolo**: Amministratore

## Note per Produzione

1. Cambia il `JWT_SECRET` con una chiave sicura
2. Configura CORS per domini specifici
3. Usa un database PostgreSQL o MySQL
4. Implementa rate limiting
5. Aggiungi HTTPS
6. Configura variabili d'ambiente