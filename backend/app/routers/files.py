from __future__ import annotations
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Repo
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/{repo_id}")
async def get_file(
    repo_id: str,
    path: str = Query(..., description="Relative path within the repo"),
    start_line: int = Query(default=1, ge=1),
    end_line: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Return file content with optional line range. Used by deep links."""
    repo = await session.get(Repo, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    full_path = os.path.join(repo.local_path or "", path.lstrip("/"))
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Basic security: ensure path doesn't escape repo root
    repo_root = os.path.realpath(repo.local_path)
    real = os.path.realpath(full_path)
    if not real.startswith(repo_root):
        raise HTTPException(status_code=403, detail="Path traversal denied")

    with open(full_path, "r", errors="replace") as f:
        lines = f.readlines()

    if end_line == 0:
        end_line = len(lines)

    total_lines = len(lines)
    selected = lines[start_line - 1 : end_line]

    # Detect language from extension
    ext = os.path.splitext(path)[1].lstrip(".")
    lang_map = {
        "py": "python", "js": "javascript", "ts": "typescript",
        "tsx": "tsx", "jsx": "jsx", "go": "go", "rs": "rust",
        "java": "java", "cpp": "cpp", "c": "c", "md": "markdown",
        "json": "json", "yaml": "yaml", "yml": "yaml", "toml": "toml",
    }
    language = lang_map.get(ext.lower(), "plaintext")

    return {
        "repo_id": repo_id,
        "path": path,
        "language": language,
        "total_lines": total_lines,
        "start_line": start_line,
        "end_line": end_line,
        "content": "".join(selected),
    }
