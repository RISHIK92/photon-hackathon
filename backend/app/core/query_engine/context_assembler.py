from __future__ import annotations

from app.config import get_settings

settings = get_settings()

# Maximum characters of code to include in the LLM prompt
_MAX_CONTEXT_CHARS = 12_000


def _format_chunk(chunk: dict, index: int) -> str:
    path = chunk.get("file_path", "unknown")
    sl = chunk.get("start_line", "?")
    el = chunk.get("end_line", "?")
    lang = chunk.get("language", "")
    sym = chunk.get("symbol_name", "")
    header = f"[{index}] {path}:{sl}-{el}"
    if sym:
        header += f" ({sym})"
    return f"{header}\n```{lang}\n{chunk.get('text', '')}\n```"


async def assemble_context(
    chunks: list[dict],
    graph_nodes: list[dict],
    question: str,
) -> dict:
    """
    Build a prompt string and collect citation references.

    Returns a dict with:
        prompt       – full prompt string for the LLM
        cited_chunks – serialisable list of chunk references
        graph_nodes  – deduplicated graph node list
    """
    # ── Build cited_chunks list ───────────────────────────────────────────────
    cited_chunks = [
        {
            "index": i + 1,
            "file_path": c.get("file_path", ""),
            "start_line": c.get("start_line"),
            "end_line": c.get("end_line"),
            "symbol_name": c.get("symbol_name", ""),
            "language": c.get("language", ""),
            "chunk_id": c.get("chunk_id", ""),
        }
        for i, c in enumerate(chunks)
    ]

    # ── Assemble code context (truncate to budget) ────────────────────────────
    sections: list[str] = []
    total_chars = 0
    for i, chunk in enumerate(chunks):
        block = _format_chunk(chunk, i + 1)
        if total_chars + len(block) > _MAX_CONTEXT_CHARS:
            break
        sections.append(block)
        total_chars += len(block)

    code_context = "\n\n".join(sections) if sections else "(no code context retrieved)"

    # ── Graph context summary ─────────────────────────────────────────────────
    graph_summary = ""
    if graph_nodes:
        paths = [n.get("path", n.get("id", "")) for n in graph_nodes[:20]]
        graph_summary = (
            "\n\nRelated modules from dependency graph:\n"
            + "\n".join(f"  - {p}" for p in paths)
        )

    # ── Final prompt ──────────────────────────────────────────────────────────
    prompt = (
        "You are an expert software engineer helping a developer understand a codebase.\n"
        "Answer the question below using ONLY the provided code context. "
        "Cite the relevant file and line numbers where appropriate.\n\n"
        f"### Question\n{question}\n\n"
        f"### Code Context\n{code_context}"
        f"{graph_summary}\n\n"
        "### Answer"
    )

    return {
        "prompt": prompt,
        "cited_chunks": cited_chunks,
        "graph_nodes": graph_nodes,
    }
