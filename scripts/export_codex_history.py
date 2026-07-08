from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any


SKIP_USER_PREFIXES = (
    "<environment_context>",
    "<codex_internal_context",
    "<permissions instructions>",
    "<app-context>",
    "<collaboration_mode>",
    "<skills_instructions>",
    "<plugins_instructions>",
)


@dataclass
class ChatItem:
    timestamp: str
    role: str
    text: str


@dataclass
class ThreadExport:
    thread_id: str
    title: str
    created_at: str
    updated_at: str
    cwd: str
    source_path: Path
    archived: bool
    items: list[ChatItem] = field(default_factory=list)


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def clean_text(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    return value.strip()


def is_context_text(value: str) -> bool:
    stripped = value.strip()
    return any(stripped.startswith(prefix) for prefix in SKIP_USER_PREFIXES)


def append_item(items: list[ChatItem], item: ChatItem) -> None:
    if items and items[-1].role == item.role and items[-1].text == item.text:
        return
    items.append(item)


def text_from_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""

    parts: list[str] = []
    for item in content:
        if not isinstance(item, dict):
            continue
        item_type = item.get("type")
        if item_type in {"input_text", "output_text", "text"}:
            parts.append(str(item.get("text", "")))
        elif "text" in item and item_type not in {"image", "input_image"}:
            parts.append(str(item.get("text", "")))
    return "\n".join(part for part in parts if part)


def load_index(codex_home: Path) -> dict[str, dict[str, Any]]:
    index_path = codex_home / "session_index.jsonl"
    index: dict[str, dict[str, Any]] = {}
    if not index_path.exists():
        return index

    with index_path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            thread_id = row.get("id")
            if thread_id:
                index[thread_id] = row
    return index


def first_actual_user(items: list[ChatItem]) -> str:
    for item in items:
        if item.role == "user" and item.text:
            return item.text
    return ""


def title_from_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = text.removeprefix("/goal ").strip()
    return text[:80] if text else "Untitled Codex thread"


def safe_filename(title: str, thread_id: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", title)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    cleaned = cleaned[:80] or "untitled"
    return f"{cleaned} - {thread_id}.md"


def iter_rollouts(codex_home: Path) -> list[tuple[Path, bool]]:
    paths: list[tuple[Path, bool]] = []
    sessions = codex_home / "sessions"
    archived = codex_home / "archived_sessions"
    if sessions.exists():
        paths.extend((path, False) for path in sessions.rglob("rollout-*.jsonl"))
    if archived.exists():
        paths.extend((path, True) for path in archived.glob("rollout-*.jsonl"))
    return sorted(paths, key=lambda pair: pair[0].stat().st_mtime)


def parse_thread(path: Path, archived: bool, index: dict[str, dict[str, Any]]) -> ThreadExport | None:
    metadata: dict[str, Any] = {}
    items: list[ChatItem] = []
    seen_user_events: set[tuple[str, str]] = set()

    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            timestamp = str(row.get("timestamp") or "")
            row_type = row.get("type")
            payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}

            if row_type == "session_meta":
                metadata.update(payload)
                continue

            if row_type == "event_msg" and payload.get("type") == "user_message":
                text = clean_text(str(payload.get("message") or ""))
                if text and not is_context_text(text):
                    key = (timestamp, text)
                    if key not in seen_user_events:
                        seen_user_events.add(key)
                        append_item(items, ChatItem(timestamp, "user", text))
                continue

            if row_type != "response_item":
                continue

            payload_type = payload.get("type")
            if payload_type == "message":
                role = str(payload.get("role") or "")
                text = clean_text(text_from_content(payload.get("content")))
                if not text:
                    continue
                if role == "user":
                    if is_context_text(text):
                        continue
                    key = (timestamp, text)
                    if key in seen_user_events:
                        continue
                    seen_user_events.add(key)
                if role in {"user", "assistant"}:
                    append_item(items, ChatItem(timestamp, role, text))
                continue

            if payload_type == "function_call":
                name = payload.get("name") or payload.get("call_id") or "tool"
                append_item(items, ChatItem(timestamp, "tool", f"Tool call: {name}"))

    thread_id = str(metadata.get("session_id") or metadata.get("id") or "")
    if not thread_id:
        match = re.search(r"([0-9a-f]{8}-[0-9a-f-]{27})", path.name)
        thread_id = match.group(1) if match else path.stem

    indexed = index.get(thread_id, {})
    first_user = first_actual_user(items)
    title = indexed.get("thread_name") or title_from_text(first_user)
    created_at = str(metadata.get("timestamp") or "")
    updated_at = str(indexed.get("updated_at") or "")
    cwd = str(metadata.get("cwd") or "")

    if not items and not metadata:
        return None

    return ThreadExport(
        thread_id=thread_id,
        title=title,
        created_at=created_at,
        updated_at=updated_at,
        cwd=cwd,
        source_path=path,
        archived=archived,
        items=items,
    )


def write_thread_markdown(thread: ThreadExport, out_dir: Path) -> Path:
    filename = safe_filename(thread.title, thread.thread_id)
    path = out_dir / "threads" / filename
    lines = [
        f"# {thread.title}",
        "",
        f"- Thread ID: `{thread.thread_id}`",
        f"- Created: {thread.created_at or 'unknown'}",
        f"- Updated: {thread.updated_at or 'unknown'}",
        f"- Archived: {'yes' if thread.archived else 'no'}",
        f"- CWD: `{thread.cwd or 'unknown'}`",
        f"- Source: `{thread.source_path}`",
        "",
        "## Conversation",
        "",
    ]

    for item in thread.items:
        heading = {"user": "User", "assistant": "Codex", "tool": "Tool"}.get(item.role, item.role)
        lines.extend([f"### {heading} {item.timestamp}", "", item.text, ""])

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_index(threads: list[ThreadExport], markdown_paths: dict[str, Path], out_dir: Path) -> None:
    rows = []
    for thread in sorted(threads, key=lambda t: t.updated_at or t.created_at, reverse=True):
        rel = markdown_paths[thread.thread_id].relative_to(out_dir)
        rows.append(
            {
                "id": thread.thread_id,
                "title": thread.title,
                "created_at": thread.created_at,
                "updated_at": thread.updated_at,
                "archived": thread.archived,
                "cwd": thread.cwd,
                "message_count": len(thread.items),
                "markdown": str(rel).replace("\\", "/"),
                "source_path": str(thread.source_path),
            }
        )

    (out_dir / "index.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    lines = [
        "# Restored Codex Chat History",
        "",
        f"Exported threads: {len(rows)}",
        "",
        "| Updated | Title | Messages | Archived | File |",
        "| --- | --- | ---: | --- | --- |",
    ]
    for row in rows:
        title = str(row["title"]).replace("|", "\\|")
        file_link = str(row["markdown"]).replace(" ", "%20")
        lines.append(
            f"| {row['updated_at'] or row['created_at'] or 'unknown'} | {title} | "
            f"{row['message_count']} | {'yes' if row['archived'] else 'no'} | "
            f"[open]({file_link}) |"
        )

    (out_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def export_history(codex_home: Path, out_dir: Path) -> tuple[list[ThreadExport], int]:
    index = load_index(codex_home)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "threads").mkdir(parents=True, exist_ok=True)

    rollout_count = 0
    threads_by_id: dict[str, ThreadExport] = {}
    for path, archived in iter_rollouts(codex_home):
        rollout_count += 1
        thread = parse_thread(path, archived, index)
        if thread:
            previous = threads_by_id.get(thread.thread_id)
            if previous is None or len(thread.items) > len(previous.items):
                threads_by_id[thread.thread_id] = thread

    threads = list(threads_by_id.values())

    markdown_paths = {thread.thread_id: write_thread_markdown(thread, out_dir) for thread in threads}
    write_index(threads, markdown_paths, out_dir)
    return threads, rollout_count


def main() -> int:
    parser = argparse.ArgumentParser(description="Export local Codex JSONL sessions to Markdown.")
    parser.add_argument(
        "--codex-home",
        default=str(Path.home() / ".codex"),
        help="Path to the Codex home directory.",
    )
    parser.add_argument(
        "--out",
        default="codex-history-restore",
        help="Output directory for restored history files.",
    )
    args = parser.parse_args()

    codex_home = Path(args.codex_home).expanduser().resolve()
    out_dir = Path(args.out).resolve()
    threads, rollout_count = export_history(codex_home, out_dir)
    archived_count = sum(1 for thread in threads if thread.archived)
    message_count = sum(len(thread.items) for thread in threads)
    print(
        f"Exported {len(threads)} unique threads from {rollout_count} rollout files "
        f"({archived_count} archived) with {message_count} items."
    )
    print(f"Index: {out_dir / 'README.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
