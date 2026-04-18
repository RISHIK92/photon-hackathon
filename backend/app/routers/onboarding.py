"""onboarding.py — Learning path / onboarding router."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import Repo
from app.services.learning_path import generate_learning_path

router = APIRouter()


@router.get("/{repo_id}/learning-path")
async def get_learning_path(
    repo_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Generate (or return cached) a sequenced onboarding plan for a repository.
    Returns phases ordered from foundational → entry, each with files, key
    concepts, and estimated reading time.
    """
    repo = await session.get(Repo, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    if repo.status.value != "READY":
        raise HTTPException(status_code=409, detail="Repo not yet ready — indexing may still be running")

    path = await generate_learning_path(repo_id)
    return path
