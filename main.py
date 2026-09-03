"""
Professional Book Catalog API & Web Application — FastAPI Service with JSON File Persistence.

Run locally:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from threading import Lock
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ConfigDict

# --------------------------------------------------------------------------
# Logging Configuration
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("book_catalog_api")

# --------------------------------------------------------------------------
# JSON Storage Manager
# --------------------------------------------------------------------------
DB_FILE = os.path.join(os.path.dirname(__file__), "books.json")

INITIAL_SEED_DATA = [
    {
        "id": 1,
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "genre": "Technology",
        "publication_year": 2017,
        "pages": 616,
        "rating": 4.9,
        "status": "Completed",
        "isbn": "978-1449373320",
        "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        "description": "An invaluable guide for software engineers exploring modern data systems.",
    },
    {
        "id": 2,
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "genre": "Technology",
        "publication_year": 2008,
        "pages": 464,
        "rating": 4.6,
        "status": "Completed",
        "isbn": "978-0132350884",
        "cover_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
        "description": "Learn how to write clean, maintainable, and agile code on the fly.",
    },
    {
        "id": 3,
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Sci-Fi",
        "publication_year": 1965,
        "pages": 658,
        "rating": 4.8,
        "status": "Reading",
        "isbn": "978-0441172719",
        "cover_url": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80",
        "description": "Set on Arrakis, Dune is the epic journey of Paul Atreides.",
    },
]


class JSONBookStorage:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self._lock = Lock()
        self._ensure_writable_file()

    def _ensure_writable_file(self):
        if not os.path.exists(self.filepath) or os.path.getsize(self.filepath) == 0:
            logger.info("Initializing %s with seed data", self.filepath)
            try:
                self._save_raw(INITIAL_SEED_DATA, target_path=self.filepath)
            except (OSError, PermissionError):
                tmp_path = os.path.join("/tmp", "books.json")
                logger.warning("Read-only filesystem detected. Switching storage path to %s", tmp_path)
                self.filepath = tmp_path
                if not os.path.exists(self.filepath):
                    self._save_raw(INITIAL_SEED_DATA, target_path=self.filepath)

    def _load_raw(self) -> List[Dict[str, Any]]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            if self.filepath != DB_FILE and os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
            return INITIAL_SEED_DATA

    def _save_raw(self, data: List[Dict[str, Any]], target_path: Optional[str] = None) -> None:
        dest = target_path or self.filepath
        try:
            dirname = os.path.dirname(dest) or "."
            temp_file = os.path.join(dirname, f"temp_{os.path.basename(dest)}")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_file, dest)
        except (OSError, PermissionError):
            if dest != os.path.join("/tmp", "books.json"):
                self.filepath = os.path.join("/tmp", "books.json")
                self._save_raw(data, target_path=self.filepath)
            else:
                raise

    def get_all(self) -> List[Dict[str, Any]]:
        with self._lock:
            return self._load_raw()

    def get_by_id(self, book_id: int) -> Optional[Dict[str, Any]]:
        with self._lock:
            books = self._load_raw()
            for book in books:
                if book.get("id") == book_id:
                    return book
            return None

    def add(self, book_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            books = self._load_raw()
            new_id = max([b.get("id", 0) for b in books], default=0) + 1
            new_book = {"id": new_id, **book_data}
            books.append(new_book)
            self._save_raw(books)
            return new_book

    def update(self, book_id: int, updated_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._lock:
            books = self._load_raw()
            for idx, book in enumerate(books):
                if book.get("id") == book_id:
                    updated_book = {**book, **updated_fields, "id": book_id}
                    books[idx] = updated_book
                    self._save_raw(books)
                    return updated_book
            return None

    def delete(self, book_id: int) -> bool:
        with self._lock:
            books = self._load_raw()
            initial_count = len(books)
            books = [b for b in books if b.get("id") != book_id]
            if len(books) < initial_count:
                self._save_raw(books)
                return True
            return False

    def get_stats(self) -> Dict[str, Any]:
        books = self.get_all()
        total = len(books)
        if total == 0:
            return {"total_books": 0, "avg_rating": 0.0, "status_counts": {}, "genres": {}}

        ratings = [b.get("rating", 0) for b in books if b.get("rating") is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

        status_counts: Dict[str, int] = {}
        genres: Dict[str, int] = {}
        for b in books:
            st = b.get("status", "Available")
            status_counts[st] = status_counts.get(st, 0) + 1
            g = b.get("genre", "General")
            genres[g] = genres.get(g, 0) + 1

        return {
            "total_books": total,
            "avg_rating": round(avg_rating, 2),
            "status_counts": status_counts,
            "genres": genres,
        }


storage = JSONBookStorage(DB_FILE)


# --------------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------------
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, example="Clean Code")
    author: str = Field(..., min_length=1, max_length=200, example="Robert C. Martin")
    genre: Optional[str] = Field("General", max_length=100, example="Technology")
    publication_year: Optional[int] = Field(None, ge=1000, le=2100, example=2008)
    pages: Optional[int] = Field(None, ge=1, le=100000, example=464)
    rating: Optional[float] = Field(4.5, ge=1.0, le=5.0, example=4.6)
    status: Optional[str] = Field("Available", example="Completed")
    isbn: Optional[str] = Field(None, example="978-0132350884")
    cover_url: Optional[str] = Field(None, example="https://example.com/cover.jpg")
    description: Optional[str] = Field(None, max_length=2000, example="A handbook of agile software craftsmanship.")


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    author: Optional[str] = Field(None, min_length=1, max_length=200)
    genre: Optional[str] = Field(None, max_length=100)
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    pages: Optional[int] = Field(None, ge=1, le=100000)
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    status: Optional[str] = Field(None)
    isbn: Optional[str] = Field(None)
    cover_url: Optional[str] = Field(None)
    description: Optional[str] = Field(None, max_length=2000)


class Book(BookBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BookList(BaseModel):
    total: int
    limit: int
    offset: int
    books: List[Book]


class CatalogStats(BaseModel):
    total_books: int
    avg_rating: float
    status_counts: Dict[str, int]
    genres: Dict[str, int]


class ErrorResponse(BaseModel):
    detail: str


# --------------------------------------------------------------------------
# FastAPI Application & Lifespan
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    books = storage.get_all()
    logger.info("Book Catalog Service initialized with %d book(s) loaded from JSON", len(books))
    yield
    logger.info("Shutting down Book Catalog Service")


app = FastAPI(
    title="BookVault — Professional Book Catalog API",
    description="A robust FastAPI CRUD service backed by persistent JSON storage and modern Web UI.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


# --------------------------------------------------------------------------
# Frontend Route
# --------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def serve_ui():
    """Serve the Web UI frontend application."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Book Catalog API active. UI not found."}


# --------------------------------------------------------------------------
# API Routes
# --------------------------------------------------------------------------
@app.get("/health", tags=["ops"])
def health_check():
    """Liveness probe endpoint."""
    return {"status": "ok", "storage": "json_file"}


@app.get("/api/stats", response_model=CatalogStats, tags=["stats"])
def get_catalog_stats():
    """Get high-level metadata statistics about the book catalog."""
    return storage.get_stats()


@app.get("/books", response_model=BookList, tags=["books"])
def get_books(
    q: Optional[str] = Query(None, description="Search query across title, author, description"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    status: Optional[str] = Query(None, description="Filter by reading status"),
    sort_by: Optional[str] = Query("title", description="Sort by field (title, author, rating, year)"),
    limit: int = Query(50, ge=1, le=100, description="Max books to return"),
    offset: int = Query(0, ge=0, description="Number of books to skip"),
):
    """Retrieve books with full-text search, filtering, sorting, and pagination."""
    all_books = storage.get_all()
    results = all_books

    # Query Search Filter
    if q:
        needle = q.lower()
        results = [
            b for b in results
            if needle in b.get("title", "").lower()
            or needle in b.get("author", "").lower()
            or needle in b.get("genre", "").lower()
            or needle in b.get("description", "").lower()
        ]

    # Genre Filter
    if genre:
        results = [b for b in results if b.get("genre", "").lower() == genre.lower()]

    # Status Filter
    if status:
        results = [b for b in results if b.get("status", "").lower() == status.lower()]

    # Sorting
    if sort_by == "author":
        results.sort(key=lambda x: x.get("author", "").lower())
    elif sort_by == "rating":
        results.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
    elif sort_by == "year":
        results.sort(key=lambda x: x.get("publication_year", 0) or 0, reverse=True)
    else:
        results.sort(key=lambda x: x.get("title", "").lower())

    total = len(results)
    paginated = results[offset : offset + limit]
    return BookList(total=total, limit=limit, offset=offset, books=paginated)


@app.get(
    "/books/{book_id}",
    response_model=Book,
    responses={404: {"model": ErrorResponse}},
    tags=["books"],
)
def get_book(book_id: int):
    """Retrieve details for a single book by ID."""
    book = storage.get_by_id(book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found")
    return book


@app.post(
    "/books",
    response_model=Book,
    status_code=status.HTTP_201_CREATED,
    tags=["books"],
)
def create_book(book: BookCreate):
    """Create a new book and persist to JSON storage."""
    created = storage.add(book.model_dump())
    logger.info("Created book id=%d title=%r", created["id"], created["title"])
    return created


@app.put(
    "/books/{book_id}",
    response_model=Book,
    responses={404: {"model": ErrorResponse}},
    tags=["books"],
)
def replace_book(book_id: int, book: BookCreate):
    """Replace an existing book completely."""
    updated = storage.update(book_id, book.model_dump())
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found")
    logger.info("Replaced book id=%d", book_id)
    return updated


@app.patch(
    "/books/{book_id}",
    response_model=Book,
    responses={404: {"model": ErrorResponse}},
    tags=["books"],
)
def update_book(book_id: int, patch: BookUpdate):
    """Partially update fields for an existing book."""
    updates = patch.model_dump(exclude_unset=True)
    if not updates:
        existing = storage.get_by_id(book_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found")
        return existing

    updated = storage.update(book_id, updates)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found")
    logger.info("Updated book id=%d fields=%s", book_id, list(updates.keys()))
    return updated


@app.delete(
    "/books/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
    tags=["books"],
)
def delete_book(book_id: int):
    """Delete a book from JSON storage by ID."""
    success = storage.delete(book_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found")
    logger.info("Deleted book id=%d", book_id)
    return None