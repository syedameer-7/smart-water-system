# Smart Water Quality Monitoring and Diversion System

Full-stack prototype for monitoring turbidity, controlling main/diversion valves, and visualizing water quality data.

## Structure

- `server`: Node.js + Express + SQLite backend API
- `client`: React + Vite + Tailwind CSS dashboard

## Backend Setup (server/)

1. Install dependencies:

```bash
cd server
npm install express cors dotenv better-sqlite3
```

2. Run the backend with optional simulator:

```bash
# With mock data simulator enabled
ENABLE_SIMULATOR=true PORT=4000 node server.js

# Or without simulator
PORT=4000 node server.js
```

The SQLite database file `water_system.sqlite` will be created automatically.

### Key API Endpoints

- `POST /api/sensor-data` – Arduino/ESP posts `{ turbidity: number }`
- `GET /api/current-status` – live turbidity, valve states, filtration status
- `POST /api/control-valve` – manual control `{ target: 'main'|'diversion'|'pump', action: 'open'|'close' }`
- `GET /api/history?range=hour|day` – turbidity history for charts
- `GET /api/filtration-logs` – filtration and diversion events
- `GET /api/settings/threshold` / `POST /api/settings/threshold` – turbidity threshold configuration
- `GET /api/system-status` – sensor health, connection, last data received, pump status

## Frontend Setup (client/)

1. Install dependencies:

```bash
cd client
npm install
```

If `package.json` does not yet contain dependencies, install them explicitly:

```bash
npm install react react-dom axios chart.js react-chartjs-2
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
```

2. Start the dashboard:

```bash
npm run dev
```

By default Vite runs on `http://localhost:5173` and proxies `/api/*` to `http://localhost:4000`.

## Arduino/ESP Integration

Point your microcontroller HTTP client (or MQTT bridge) at:

- `POST http://<your-pc-ip>:4000/api/sensor-data` with JSON body:

```json
{ "turbidity": 4.2 }
```

You can also call `POST /api/control-valve` from the Arduino/ESP if you want closed-loop control from the web UI.

## Mock Data Simulator

To run the dashboard without hardware connected, start the backend with:

```bash
cd server
ENABLE_SIMULATOR=true node server.js
```

Every 5 seconds, a synthetic turbidity reading is generated. Values occasionally exceed the threshold so you can see the diversion and filtration logic, alerts, and logs in action.

