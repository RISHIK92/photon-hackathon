from __future__ import annotations
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import QueryRequest, QueryIntent
from app.core.query_engine.intent_classifier import classify_intent
from app.core.query_engine.retrieval import hybrid_retrieve
from app.core.query_engine.context_assembler import assemble_context
from app.core.query_engine.llm_orchestrator import stream_answer

router = APIRouter()


@router.post("")
async def query_repo(
    payload: QueryRequest,
    session: AsyncSession = Depends(get_session),
):
    """Main NL query endpoint. Returns a streaming SSE response."""
    session_id = payload.session_id or str(uuid.uuid4())

    # Step 1: classify intent
    intent = await classify_intent(payload.question)

    # Step 2: hybrid retrieval
    chunks, graph_nodes = await hybrid_retrieve(
        repo_id=payload.repo_id,
        question=payload.question,
        intent=intent,
    )

    # Step 3: assemble context
    context = await assemble_context(chunks, graph_nodes, payload.question)

    # Step 4: stream LLM answer
    async def event_generator():
        # First send metadata
        meta = {
            "type": "meta",
            "session_id": session_id,
            "intent": intent.value,
            "cited_chunks": context["cited_chunks"],
            "graph_nodes": context["graph_nodes"],
        }
        yield f"data: {json.dumps(meta)}\n\n"

        # Then stream tokens
        async for token in stream_answer(context["prompt"], payload.question):
            yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
