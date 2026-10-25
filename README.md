# BookVault — Book Catalog & Reading Tracker 📚

BookVault is a modern book catalog and reading-tracker web application built with **FastAPI, Python, HTML, CSS, and vanilla JavaScript**. It lets users manage a personal book collection, search and filter books, track reading status, and view catalog statistics through a responsive web interface and REST API.

<p align="center">
  <strong>REST API · CRUD Operations · Search & Filters · Reading Tracker · Statistics Dashboard</strong>
</p>

## ✨ Features

### Book Management
- Add books with title, author, genre, publication year, page count, rating, ISBN, cover image, status, and description.
- View detailed information for an individual book.
- Edit book details with full updates or partial updates.
- Delete books from the catalog.
- Store catalog records in a JSON file.

### Search, Filter & Sort
- Search by title, author, genre, or description.
- Filter books by genre and reading status.
- Sort by title, author, rating, or publication year.
- Use pagination with configurable limit and offset.
- Switch between grid and list layouts in the web interface.

### Reading Dashboard
- View total books in the catalog.
- See the average book rating.
- Track counts by reading status.
- Review genre statistics.
- Start with sample book records when the data file is empty.

### API & Developer Experience
- REST endpoints built with FastAPI.
- Request and response validation using Pydantic.
- Interactive API documentation through Swagger UI and ReDoc.
- Health-check endpoint for service monitoring.
- Structured application logging.
- Static frontend files served by the FastAPI application.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend application logic |
| FastAPI | REST API and routing |
| Pydantic | Request validation and response schemas |
| Uvicorn | ASGI development server |
| JSON | Lightweight file-based data persistence |
| HTML5 | Web interface structure |
| CSS3 | Responsive design and styling |
| JavaScript (Vanilla) | API requests, search, filters, forms, and UI interactions |

## 🚀 Getting Started

### Prerequisites

- Python **3.13 or later** is recommended to match the project's `pyproject.toml` configuration.
- pip
- Git (optional)

### 1. Clone the repository

```bash
git clone https://github.com/joshichaitanya58/FastApi_Project.git
cd FastApi_Project
```

### 2. Create and activate a virtual environment

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the application

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open the following URLs in your browser:

- **Web application:** http://127.0.0.1:8000/
- **Swagger API docs:** http://127.0.0.1:8000/docs
- **ReDoc API docs:** http://127.0.0.1:8000/redoc
- **Health check:** http://127.0.0.1:8000/health

Stop the development server with `Ctrl+C`.

## 🔌 API Endpoints

Base URL for local development: `http://127.0.0.1:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the BookVault web interface |
| `GET` | `/health` | Returns service health and storage type |
| `GET` | `/api/stats` | Returns catalog totals, average rating, status counts, and genre counts |
| `GET` | `/books` | Lists books with search, filters, sorting, and pagination |
| `GET` | `/books/{book_id}` | Retrieves one book by ID |
| `POST` | `/books` | Creates a new book |
| `PUT` | `/books/{book_id}` | Replaces all editable fields for a book |
| `PATCH` | `/books/{book_id}` | Updates selected fields |
| `DELETE` | `/books/{book_id}` | Deletes a book |

### Query Parameters for `GET /books`

| Parameter | Description | Example |
|---|---|---|
| `q` | Search title, author, genre, or description | `q=python` |
| `genre` | Filter by genre | `genre=Technology` |
| `status` | Filter by reading status | `status=Reading` |
| `sort_by` | Sort by `title`, `author`, `rating`, or `year` | `sort_by=rating` |
| `limit` | Number of records to return (1–100) | `limit=20` |
| `offset` | Number of records to skip | `offset=0` |

Example request:

```bash
curl "http://127.0.0.1:8000/books?q=clean&sort_by=rating&limit=10"
```

### Example: Create a Book

Send a `POST` request to `/books` with a JSON body:

```json
{
  "title": "Learning Python",
  "author": "Mark Lutz",
  "genre": "Technology",
  "publication_year": 2013,
  "pages": 1600,
  "rating": 4.5,
  "status": "Reading",
  "isbn": "978-1449355739",
  "cover_url": "https://example.com/book-cover.jpg",
  "description": "A guide to Python programming."
}
```

You can test this endpoint interactively through Swagger UI at `/docs`.

## 📁 Project Structure

```text
FastApi_Project/
├── main.py                # FastAPI app, API routes, validation, and JSON storage
├── books.json             # Book records and initial sample data
├── requirements.txt       # Python dependencies
├── pyproject.toml         # Project metadata and dependency configuration
├── uv.lock                # Locked dependency versions for uv
├── vercel.json            # Vercel deployment configuration
└── static/
    ├── index.html         # BookVault frontend
    ├── css/
    │   └── styles.css     # UI styling and responsive layout
    └── js/
        └── app.js         # API integration and frontend behavior
```

## 💾 Data Storage Notes

BookVault currently uses a JSON file (`books.json`) instead of a relational database. This makes local setup straightforward and avoids requiring a separate database server.

- Keep a backup of `books.json` if the catalog contains data you need.
- The application includes a lock to coordinate file access within one process.
- On hosting platforms with ephemeral or read-only filesystems, changes may not persist after a restart or redeployment. The app may fall back to `/tmp`, which is temporary.
- For a multi-user or production deployment, use a persistent database such as PostgreSQL or MySQL and consider concurrent-write handling.

## 🌐 Deployment

The repository includes a `vercel.json` configuration for deploying the FastAPI service on Vercel.

Before deploying, confirm that the hosting environment supports the required Python runtime and that the application’s data storage approach fits the platform. **JSON file writes on serverless hosting should not be treated as durable storage**; use a managed database or persistent storage for data that must survive redeployments.

## 🔒 Production Considerations

- Configure CORS with trusted origins instead of allowing every origin where appropriate.
- Add authentication and authorization if the catalog should be private or shared by multiple users.
- Use persistent storage and database backups for production data.
- Validate and safely render user-provided text in the frontend.
- Add automated tests and monitoring before production use.

## 🔮 Future Enhancements

- Add user accounts and multiple personal libraries.
- Migrate from JSON storage to PostgreSQL or MySQL.
- Add book cover upload and ISBN lookup.
- Add reading goals, notes, favorites, and reading-history charts.
- Add export/import for CSV and JSON.
- Add automated API and frontend tests.

## 👨‍💻 Author

**Chaitanya Joshi**

- GitHub: [@joshichaitanya58](https://github.com/joshichaitanya58)
- Portfolio: [my-portfolio-delta-virid-82.vercel.app](https://my-portfolio-delta-virid-82.vercel.app/)
- LinkedIn: [Chaitanya Joshi](https://www.linkedin.com/in/chaitanya-joshi-644b39298/)

---

<p align="center">Built with FastAPI, Python, and JavaScript.</p>
