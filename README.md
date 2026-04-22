# Class Resource Dashboard

A simple website dashboard to organize class resources such as assignments, notes, PYQ, and syllabus materials.

## Project Structure

- `index.html` - Main webpage
- `styles.css` - Styling
- `script.js` - Frontend behavior
- `assignments/` - Assignment resources
- `notes/` - Subject notes
- `PYQ/` - Previous year questions
- `syllabus/` - Syllabus files

## Run Locally

### Option 1: Python server (Port 8000)

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Open:
- Local: `http://localhost:8000`
- Same Wi-Fi mobile: `http://<your-local-ip>:8000`

### Option 2: VS Code Live Server (Port 5500)

- Start Live Server from VS Code.
- Open:
  - Local: `http://localhost:5500`
  - Same Wi-Fi mobile: `http://<your-local-ip>:5500`

## Notes

- Keep both phone and PC on the same Wi-Fi for LAN testing.
- If mobile cannot open the site, check firewall permissions for Python/VS Code.
