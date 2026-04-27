#!/usr/bin/env python3
"""
Split scraped guide JSON into browse-friendly locale files.

Output layout:
    telenor-kb/public/locales/<category>/<router>/<step>.json

Each step file contains visible text directly (title/query/body/choices),
so routing by folders replaces long prefixed translation keys.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict, deque
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Tuple

# ---------------------------------------------------------------------------
# HTML body → structured blocks (no dangerouslySetInnerHTML needed)
#
# Tags found across all translation files:
#   Block:  <p> (483)  <ol> (40)  <ul> (31)  <div> (22)  <h3> (4)
#   List:   <li> (232)
#   Inline: <a> (79)  <br> (21)  <strong> (17)  <em> (4)
#
# Output schema per block:
#   { "type": "paragraph",      "content": [InlineNode, ...] }
#   { "type": "ordered-list",   "items":   [[InlineNode, ...], ...] }
#   { "type": "unordered-list", "items":   [[InlineNode, ...], ...] }
#   { "type": "heading",        "level": 3, "content": [InlineNode, ...] }
#
# InlineNode variants:
#   { "text": "plain text" }
#   { "text": "bold text",   "bold": true }
#   { "text": "italic text", "italic": true }
#   { "text": "link label",  "href": "/some/path" }
#   { "break": true }
# ---------------------------------------------------------------------------

_BLOCK_TAGS = frozenset({"p", "ol", "ul", "h3", "h4", "div"})
_LIST_TAGS = frozenset({"ol", "ul"})
_VOID_TAGS = frozenset({"br", "img", "hr", "input", "meta", "link"})
_HEADING_LEVEL: Dict[str, int] = {"h3": 3, "h4": 4}


def _parse_inline(inline_html: str) -> List[dict]:
    """Convert an inline HTML string to a list of InlineNode dicts."""

    class _InlineParser(HTMLParser):
        def __init__(self) -> None:
            super().__init__(convert_charrefs=True)
            self.nodes: List[dict] = []
            # Active formatting flags
            self._bold = 0
            self._italic = 0
            self._href: str | None = None

        def _push_text(self, text: str) -> None:
            if not text:
                return
            node: dict = {"text": text}
            if self._bold:
                node["bold"] = True
            if self._italic:
                node["italic"] = True
            if self._href is not None:
                node["href"] = self._href
            self.nodes.append(node)

        def handle_starttag(self, tag: str, attrs: list) -> None:
            attr_map = dict(attrs)
            if tag in {"strong", "b"}:
                self._bold += 1
            elif tag in {"em", "i"}:
                self._italic += 1
            elif tag == "a":
                self._href = attr_map.get("href") or ""
            elif tag == "br":
                self.nodes.append({"break": True})

        def handle_endtag(self, tag: str) -> None:
            if tag in {"strong", "b"}:
                self._bold = max(0, self._bold - 1)
            elif tag in {"em", "i"}:
                self._italic = max(0, self._italic - 1)
            elif tag == "a":
                self._href = None

        def handle_data(self, data: str) -> None:
            self._push_text(data)

    parser = _InlineParser()
    parser.feed(inline_html)
    # Merge adjacent plain-text nodes to keep the array compact
    merged: List[dict] = []
    for node in parser.nodes:
        if (
            merged
            and "text" in node
            and "text" in merged[-1]
            and set(node.keys()) == set(merged[-1].keys())
            and node.get("bold") == merged[-1].get("bold")
            and node.get("italic") == merged[-1].get("italic")
            and node.get("href") == merged[-1].get("href")
        ):
            merged[-1]["text"] += node["text"]
        else:
            merged.append(node)
    return merged


def _extract_li_items(inner_html: str) -> List[List[dict]]:
    """Return a list of inline-node arrays, one per <li>."""

    class _LiParser(HTMLParser):
        def __init__(self) -> None:
            super().__init__(convert_charrefs=False)
            self.items: List[str] = []
            self._in_li = False
            self._depth = 0
            self._buf = ""

        def _raw(self, tag: str, attrs: list) -> str:
            parts = []
            for name, value in attrs:
                parts.append(f' {name}="{value}"' if value is not None else f" {name}")
            return f"<{tag}{''.join(parts)}>"

        def handle_starttag(self, tag: str, attrs: list) -> None:
            if tag == "li" and not self._in_li:
                self._in_li = True
                self._depth = 0
                self._buf = ""
            elif self._in_li:
                self._buf += self._raw(tag, attrs)
                if tag not in _VOID_TAGS:
                    self._depth += 1

        def handle_endtag(self, tag: str) -> None:
            if not self._in_li:
                return
            if tag == "li" and self._depth == 0:
                item = self._buf.strip()
                # Strip redundant outer <p>…</p> wrapper (very common pattern)
                item = re.sub(r"^<p>(.*)</p>$", r"\1", item, flags=re.DOTALL).strip()
                if item:
                    self.items.append(item)
                self._in_li = False
                self._buf = ""
            else:
                self._buf += f"</{tag}>"
                if tag not in _VOID_TAGS:
                    self._depth = max(0, self._depth - 1)

        def handle_data(self, data: str) -> None:
            if self._in_li:
                self._buf += data

        def handle_entityref(self, name: str) -> None:
            if self._in_li:
                self._buf += "\u00a0" if name == "nbsp" else f"&{name};"

        def handle_charref(self, name: str) -> None:
            if self._in_li:
                self._buf += f"&#{name};"

    p = _LiParser()
    p.feed(inner_html)
    return [_parse_inline(raw) for raw in p.items]


class _BodyParser(HTMLParser):
    """Walk top-level block elements and emit structured block dicts."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.blocks: List[dict] = []
        self._stack: List[dict] = []  # {'tag', 'inner', 'inner_depth'}

    def _top(self) -> dict | None:
        return self._stack[-1] if self._stack else None

    def _raw(self, tag: str, attrs: list) -> str:
        parts = []
        for name, value in attrs:
            parts.append(f' {name}="{value}"' if value is not None else f" {name}")
        return f"<{tag}{''.join(parts)}>"

    def handle_starttag(self, tag: str, attrs: list) -> None:
        top = self._top()
        if top is None and tag in _BLOCK_TAGS:
            self._stack.append({"tag": tag, "inner": "", "inner_depth": 0})
        elif top is not None:
            top["inner"] += self._raw(tag, attrs)
            if tag not in _VOID_TAGS:
                top["inner_depth"] += 1

    def handle_endtag(self, tag: str) -> None:
        top = self._top()
        if top is None:
            return
        if tag == top["tag"] and top["inner_depth"] == 0:
            self._emit(top)
            self._stack.pop()
        else:
            top["inner"] += f"</{tag}>"
            if tag not in _VOID_TAGS:
                top["inner_depth"] = max(0, top["inner_depth"] - 1)

    def handle_data(self, data: str) -> None:
        top = self._top()
        if top is not None:
            top["inner"] += data

    def handle_entityref(self, name: str) -> None:
        top = self._top()
        if top is not None:
            top["inner"] += "\u00a0" if name == "nbsp" else f"&{name};"

    def handle_charref(self, name: str) -> None:
        top = self._top()
        if top is not None:
            top["inner"] += f"&#{name};"

    def _emit(self, block: dict) -> None:
        tag = block["tag"]
        inner = block["inner"].strip()
        if not inner:
            return
        if tag in {"p", "div"}:
            content = _parse_inline(inner)
            if content:
                self.blocks.append({"type": "paragraph", "content": content})
        elif tag in _LIST_TAGS:
            list_type = "ordered-list" if tag == "ol" else "unordered-list"
            items = _extract_li_items(inner)
            if items:
                self.blocks.append({"type": list_type, "items": items})
        elif tag in _HEADING_LEVEL:
            content = _parse_inline(inner)
            if content:
                self.blocks.append({"type": "heading", "level": _HEADING_LEVEL[tag], "content": content})


def html_body_to_blocks(body_html: str) -> List[dict]:
    """Convert an HTML body string to a list of structured block dicts."""
    if not body_html:
        return []
    stripped = body_html.strip()
    if not stripped:
        return []
    # Plain text with no block tags — wrap in a single paragraph
    if not re.search(r"<(p|ol|ul|h[1-6]|div)\b", stripped, re.IGNORECASE):
        return [{"type": "paragraph", "content": _parse_inline(stripped)}]
    parser = _BodyParser()
    parser.feed(stripped)
    return parser.blocks


def slugify(value: str) -> str:
    value = (value or "").strip().lower()
    # Normalize Scandinavian chars for stable ASCII keys
    value = value.replace("å", "aa").replace("ø", "oe").replace("æ", "ae")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value)
    value = re.sub(r"-+", "-", value).strip("_-")
    return value or "unknown"


def extract_component_key(url_or_key: str) -> str:
    if not url_or_key:
        return ""
    if "/" in url_or_key:
        return url_or_key.rstrip("/").split("/")[-1]
    return url_or_key


def safe_json_load(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_graph_index(flow_graph: dict) -> Tuple[Dict[str, List[dict]], List[dict]]:
    by_from: Dict[str, List[dict]] = defaultdict(list)
    edges: List[dict] = []

    for edge in flow_graph.get("edges", []):
        from_key = extract_component_key(edge.get("from", ""))
        to_key = extract_component_key(edge.get("toUrl", ""))
        if not from_key or not to_key:
            continue
        normalized = {
            "from": from_key,
            "to": to_key,
            "label": (edge.get("label") or "").strip(),
            "secondaryLabel": (edge.get("secondaryLabel") or "").strip(),
            "fromField": edge.get("fromField") or "",
        }
        by_from[from_key].append(normalized)
        edges.append(normalized)

    return by_from, edges


def find_start_node(edges: List[dict]) -> str:
    # Prefer explicit edge label "Start"
    for e in edges:
        if (e.get("label") or "").strip().lower() == "start":
            return e["to"]

    # Fallback: node with outgoing but no incoming
    incoming = {e["to"] for e in edges}
    outgoing = {e["from"] for e in edges}
    roots = sorted(list(outgoing - incoming))
    return roots[0] if roots else ""


def find_router_split_node(
    by_from: Dict[str, List[dict]], edges: List[dict], start_node: str
) -> str:
    """
    Find the node where router/device choice actually happens.

    We prefer a node with multiple productList links (router cards). This handles
    flows that have an initial gate step before router selection.
    """
    if not start_node:
        return ""

    # Compute BFS depth from start to pick the first relevant router split node.
    depth: Dict[str, int] = {start_node: 0}
    queue = deque([start_node])
    while queue:
        node = queue.popleft()
        for edge in by_from.get(node, []):
            nxt = edge["to"]
            if nxt not in depth:
                depth[nxt] = depth[node] + 1
                queue.append(nxt)

    # Count productList-style outgoing edges per node.
    product_counts: Dict[str, int] = defaultdict(int)
    for edge in edges:
        from_field = edge.get("fromField") or ""
        if from_field.startswith("productList"):
            product_counts[edge["from"]] += 1

    candidates = [node for node, count in product_counts.items() if count >= 2]
    if not candidates:
        return start_node

    candidates.sort(key=lambda node: (depth.get(node, 10**9), node))
    return candidates[0]


def get_pre_router_group(
    by_from: Dict[str, List[dict]], start_node: str, split_node: str
) -> str:
    """
    Return a slug for the gating choice that leads into the router split node.

    Example for tregt-nett: start(371062) --"Nei"--> split(371196) => "nei".
    """
    if not start_node or not split_node or start_node == split_node:
        return ""

    queue = deque([start_node])
    seen = {start_node}
    parent: Dict[str, Tuple[str, str]] = {}

    while queue:
        node = queue.popleft()
        if node == split_node:
            break

        for edge in by_from.get(node, []):
            nxt = edge["to"]
            if nxt in seen:
                continue
            seen.add(nxt)
            parent[nxt] = (node, edge.get("label") or "")
            queue.append(nxt)

    if split_node not in parent:
        return ""

    # Walk backwards and pick the label on the edge that enters split_node.
    incoming_label = parent[split_node][1]
    return slugify(incoming_label)


def infer_router_targets(
    by_from: Dict[str, List[dict]], edges: List[dict], start_node: str
) -> Dict[str, str]:
    """
    Assign each node to a router bucket based on first branching hop after the start node.
    If a node is reachable from multiple routers, mark as 'shared'.
    """
    ownership: Dict[str, str] = {}

    split_node = find_router_split_node(by_from, edges, start_node)

    # Prefer productList links at split node, fallback to all outgoing links.
    split_outgoing = by_from.get(split_node, [])
    router_edges = [
        edge for edge in split_outgoing if (edge.get("fromField") or "").startswith("productList")
    ]
    if not router_edges:
        router_edges = split_outgoing

    router_bases: List[Tuple[str, str]] = []
    for edge in router_edges:
        router_label = slugify(edge.get("label") or "shared")
        if router_label in {"", "start"}:
            router_label = "shared"
        router_bases.append((edge["to"], router_label))

    # BFS from each router base
    for base_node, router in router_bases:
        queue = deque([base_node])
        seen = set()
        while queue:
            node = queue.popleft()
            if node in seen:
                continue
            seen.add(node)

            if node not in ownership:
                ownership[node] = router
            elif ownership[node] != router:
                ownership[node] = "shared"

            for edge in by_from.get(node, []):
                queue.append(edge["to"])

    # Include start and split nodes as shared context
    if start_node:
        ownership[start_node] = "shared"
    if split_node:
        ownership[split_node] = "shared"

    return ownership


def get_step_fields(component_json: dict) -> dict:
    content = component_json.get("content", {})

    step_header = (content.get("stepHeader") or "").strip()
    step_query = (content.get("stepQuery") or "").strip()

    # Prefer stepContent blocks, fallback to legacy stepBody
    bodies: List[str] = []
    for block in content.get("stepContent", []) or []:
        body = (block.get("stepBody") or "").strip()
        if body:
            bodies.append(body)

    if not bodies:
        fallback_body = (content.get("stepBody") or "").strip()
        if fallback_body:
            bodies.append(fallback_body)

    combined_html = "\n\n".join(bodies).strip()
    structured_body = html_body_to_blocks(combined_html)

    return {
        "title": step_header,
        "query": step_query,
        "body": structured_body,
    }


def build_choice_texts(by_from: Dict[str, List[dict]], from_node: str) -> List[dict]:
    choices = []
    for edge in by_from.get(from_node, []):
        choices.append(
            {
                "label": edge.get("label") or "",
                "secondaryLabel": edge.get("secondaryLabel") or "",
            }
        )
    return choices


def derive_step_slug(component_json: dict, step_title: str) -> str:
    # Prefer the component filename slug from publishUrl, e.g. "kontakt-leverandor-result.comp"
    publish_url = (component_json.get("publishUrl") or "").strip()
    if publish_url:
        filename = publish_url.rstrip("/").split("/")[-1]
        filename = re.sub(r"\.comp$", "", filename, flags=re.IGNORECASE)
        publish_slug = slugify(filename)
        if publish_slug != "unknown":
            return publish_slug

    title_slug = slugify(step_title)
    if title_slug != "unknown":
        return title_slug

    return "step"


def make_unique_slug(base_slug: str, used: set[str]) -> str:
    candidate = base_slug
    if candidate not in used:
        used.add(candidate)
        return candidate

    index = 2
    while True:
        candidate = f"{base_slug}_v{index}"
        if candidate not in used:
            used.add(candidate)
            return candidate
        index += 1


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def process_category(guides_dir: Path, category_slug: str, output_root: Path) -> None:
    # Support both naming conventions: <category>_flow_graph.json and <category>.json
    flow_graph_path = guides_dir / f"{category_slug}_flow_graph.json"
    if not flow_graph_path.exists():
        flow_graph_path = guides_dir / f"{category_slug}.json"
    components_dir = guides_dir / category_slug

    if not flow_graph_path.exists() or not components_dir.exists():
        print(f"Skipping {category_slug}: missing flow graph or component folder")
        return

    flow_graph = safe_json_load(flow_graph_path)
    by_from, edges = build_graph_index(flow_graph)
    start_node = find_start_node(edges)
    split_node = find_router_split_node(by_from, edges, start_node)
    pre_router_group = get_pre_router_group(by_from, start_node, split_node)
    router_ownership = infer_router_targets(by_from, edges, start_node)

    out_category = output_root / category_slug

    routers_written: set[str] = set()
    used_step_tokens: Dict[str, set[str]] = defaultdict(set)

    component_files = sorted(components_dir.glob("*.json"))
    for component_file in component_files:
        component_json = safe_json_load(component_file)
        component_id = str(component_json.get("id") or component_file.stem)

        router_key = router_ownership.get(component_id, "shared")
        router_key = slugify(router_key)

        step_fields = get_step_fields(component_json)
        step_slug = derive_step_slug(component_json, step_fields["title"])
        step_token = make_unique_slug(step_slug, used_step_tokens[router_key])

        # Step locale contains only user-visible text.
        choice_struct = build_choice_texts(by_from, component_id)

        # Locale step file with visible text only.
        step_locale = {
            "title": step_fields["title"],
            "query": step_fields["query"],
            "body": step_fields["body"],
            "choices": choice_struct,
        }

        if router_key != "shared" and pre_router_group:
            step_out = out_category / pre_router_group / router_key / f"{step_token}.json"
            routers_written.add(f"{pre_router_group}/{router_key}")
        else:
            step_out = out_category / router_key / f"{step_token}.json"
            routers_written.add(router_key)
        write_json(step_out, step_locale)

    print(
        f"Generated {category_slug}: routers={len(routers_written)} components={len(component_files)}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split scraped guide JSON into structured + centralized text files"
    )
    parser.add_argument(
        "--guides-dir",
        default="telenor-guides",
        help="Path to scraped guides directory (default: telenor-guides)",
    )
    parser.add_argument(
        "--output-dir",
        default="telenor-kb/public/locales",
        help="Output directory (default: telenor-kb/public/locales)",
    )
    parser.add_argument(
        "--categories",
        nargs="*",
        default=["ikke-pa-nett", "tregt-nett", "ustabilt-nett"],
        help="Category folders to process",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    guides_dir = Path(args.guides_dir).resolve()
    output_root = Path(args.output_dir).resolve()

    output_root.mkdir(parents=True, exist_ok=True)

    for category in args.categories:
        process_category(guides_dir, category, output_root)

    print(f"Done. Output written to: {output_root}")


if __name__ == "__main__":
    main()
