#!/usr/bin/env python3
"""
Recursively scrape the Telenor support-wizard JSON flow starting from one URL.

It exports a graph-like JSON file with nodes and edges so the data can be
modeled later in Prisma.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import deque
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import parse_qs, quote, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


DEFAULT_USER_AGENT = "support-wizard-scraper/1.0"


@dataclass
class CrawlConfig:
    start_url: str
    graph_output_path: str
    responses_dir: str
    timeout_seconds: int
    max_nodes: int
    same_host_only: bool
    user_agent: str


def parse_args() -> CrawlConfig:
    parser = argparse.ArgumentParser(
        description=(
            "Scrape support wizard JSON by following step links to build a flow graph."
        )
    )
    parser.add_argument(
        "start_url",
        help="Absolute URL for the first JSON response (entry step).",
    )
    parser.add_argument(
        "--graph-output",
        default=None,
        help=(
            "Output file path for graph JSON. If omitted, the file name is "
            "derived from --responses-dir, for example router_a_flow_graph.json."
        ),
    )
    parser.add_argument(
        "--responses-dir",
        default="wizard_responses",
        help=(
            "Directory where one JSON file per fetched response is written "
            "(default: wizard_responses)."
        ),
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP timeout in seconds (default: 20).",
    )
    parser.add_argument(
        "--max-nodes",
        type=int,
        default=1000,
        help="Hard safety cap on number of nodes to crawl (default: 1000).",
    )
    parser.add_argument(
        "--allow-cross-host",
        action="store_true",
        help="Follow links that leave the start URL host.",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help=f"HTTP User-Agent header (default: {DEFAULT_USER_AGENT}).",
    )

    args = parser.parse_args()

    responses_dir = args.responses_dir
    graph_output_path = args.graph_output
    if not graph_output_path:
        folder_name = os.path.basename(os.path.normpath(responses_dir)) or responses_dir
        safe_folder_name = re.sub(r"[^A-Za-z0-9._-]", "_", folder_name).strip("._") or "wizard_responses"
        graph_output_path = f"{safe_folder_name}_flow_graph.json"

    return CrawlConfig(
        start_url=args.start_url,
        graph_output_path=graph_output_path,
        responses_dir=responses_dir,
        timeout_seconds=args.timeout,
        max_nodes=args.max_nodes,
        same_host_only=not args.allow_cross_host,
        user_agent=args.user_agent,
    )


def fetch_json(url: str, cfg: CrawlConfig) -> Dict[str, Any]:
    headers = {"User-Agent": cfg.user_agent, "Accept": "application/json"}

    req = Request(url, headers=headers)
    with urlopen(req, timeout=cfg.timeout_seconds) as res:
        charset = res.headers.get_content_charset() or "utf-8"
        raw = res.read().decode(charset, errors="replace")
    return json.loads(raw)


def normalize_component_ref(ref: str) -> str:
    return ref.split(":", 1)[1] if ref.startswith("comp:") else ref


def resolve_component_link_without_template(comp_id: str, current_url: str) -> str:
    """
    Resolve comp:<id> links when no explicit URL template is provided.

    Heuristics (in order):
    1) If current URL has query id-like keys, replace their value with comp_id.
    2) If current path ends in an id-like segment (with optional extension), replace it.
    3) Fallback to treating comp_id as a relative link.
    """
    parsed = urlparse(current_url)

    # 1) Replace common id query parameters.
    query = parse_qs(parsed.query, keep_blank_values=True)
    id_keys = ("id", "componentId", "component", "comp")
    replaced_query = False
    for key in id_keys:
        if key in query:
            query[key] = [comp_id]
            replaced_query = True
    if replaced_query:
        return urlunparse(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                urlencode(query, doseq=True),
                parsed.fragment,
            )
        )

    # 2) Replace last path segment if it looks id-like.
    path = parsed.path
    if "/" in path:
        prefix, last = path.rsplit("/", 1)
    else:
        prefix, last = "", path

    m = re.match(r"^(?P<name>[^.]+)(?P<ext>\.[^.]+)?$", last)
    if m:
        name = m.group("name") or ""
        ext = m.group("ext") or ""
        if re.fullmatch(r"\d+|[0-9a-fA-F-]{8,}", name):
            new_last = f"{comp_id}{ext}"
            new_path = f"{prefix}/{new_last}" if prefix else new_last
            return urlunparse(
                (
                    parsed.scheme,
                    parsed.netloc,
                    new_path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment,
                )
            )

    # 3) Fallback: resolve as relative target.
    return urljoin(current_url if current_url.endswith("/") else f"{current_url}/", comp_id)


def resolve_link_target(
    target: str,
    current_url: str,
    cfg: CrawlConfig,
) -> Optional[str]:
    if not target:
        return None

    if target.startswith("comp:"):
        comp_id = quote(normalize_component_ref(target), safe="")
        return resolve_component_link_without_template(comp_id, current_url)

    if target.startswith("http://") or target.startswith("https://"):
        return target

    base = f"{urlparse(cfg.start_url).scheme}://{urlparse(cfg.start_url).netloc}"
    if target.startswith("/"):
        return urljoin(base, target)

    return urljoin(current_url, target)


def should_follow(url: str, cfg: CrawlConfig) -> bool:
    if not cfg.same_host_only:
        return True
    return urlparse(url).netloc == urlparse(cfg.start_url).netloc


def get_component_identity(payload: Dict[str, Any], url: str) -> str:
    candidate = payload.get("id") or payload.get("publishUrl") or payload.get("title")
    if isinstance(candidate, str) and candidate.strip():
        return candidate.strip()
    return url


def sanitize_filename(value: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in value)
    safe = safe.strip("._")
    return safe or "response"


def write_response_file(
    payload: Dict[str, Any],
    component_key: str,
    responses_dir: str,
    used_names: set[str],
) -> str:
    os.makedirs(responses_dir, exist_ok=True)

    preferred = payload.get("id") or payload.get("publishUrl") or component_key
    if not isinstance(preferred, str):
        preferred = component_key
    base_name = sanitize_filename(preferred)

    candidate = f"{base_name}.json"
    index = 2
    while candidate in used_names:
        candidate = f"{base_name}_{index}.json"
        index += 1
    used_names.add(candidate)

    file_path = os.path.join(responses_dir, candidate)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return file_path


def iter_step_links(payload: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    content = payload.get("content") or {}

    for idx, item in enumerate(content.get("stepLinks") or []):
        button_url = item.get("buttonUrl") or {}
        target = button_url.get("dynamicLink")
        source_field = "buttonUrl.dynamicLink"

        if not target:
            target = button_url.get("externalUrl")
            source_field = "buttonUrl.externalUrl"

        if target:
            yield {
                "fromField": source_field,
                "buttonText": item.get("buttonText"),
                "buttonSecondaryText": item.get("buttonSecondaryText"),
                "targetRaw": target,
                "index": idx,
            }

    for idx, item in enumerate(content.get("stepSelection") or []):
        target = item.get("dynamicLink")
        if target:
            yield {
                "fromField": "stepSelection.dynamicLink",
                "buttonText": item.get("title"),
                "buttonSecondaryText": None,
                "targetRaw": target,
                "index": idx,
            }

    # Some wizard steps branch via product cards (e.g., router model selection).
    for idx, item in enumerate(content.get("productList") or []):
        product_link = item.get("productLink") or {}
        target = product_link.get("dynamicLink")
        source_field = "productList.productLink.dynamicLink"

        if not target:
            target = product_link.get("externalUrl")
            source_field = "productList.productLink.externalUrl"

        if target:
            yield {
                "fromField": source_field,
                "buttonText": item.get("productName"),
                "buttonSecondaryText": item.get("bestMatchingField"),
                "targetRaw": target,
                "index": idx,
            }


def make_node_summary(payload: Dict[str, Any]) -> Dict[str, Any]:
    content = payload.get("content") or {}
    return {
        "id": payload.get("id"),
        "title": payload.get("title"),
        "publishUrl": payload.get("publishUrl"),
        "directoryUrl": payload.get("directoryUrl"),
        "stepHeader": content.get("stepHeader"),
        "stepQuery": content.get("stepQuery"),
        "stepBody": content.get("stepBody"),
        "stepContentCount": len(content.get("stepContent") or []),
        "schemaId": payload.get("schemaId"),
        "contextPublication": payload.get("contextPublication"),
    }


def crawl(cfg: CrawlConfig) -> Dict[str, Any]:
    queue: deque[str] = deque([cfg.start_url])
    visited_urls: set[str] = set()
    visited_component_ids: set[str] = set()

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    errors: List[Dict[str, str]] = []
    response_file_names: set[str] = set()

    while queue and len(nodes) < cfg.max_nodes:
        current_url = queue.popleft()
        if current_url in visited_urls:
            continue
        visited_urls.add(current_url)

        try:
            payload = fetch_json(current_url, cfg)
        except Exception as exc:  # noqa: BLE001 - preserve message in output
            errors.append({"url": current_url, "error": str(exc)})
            continue

        component_key = get_component_identity(payload, current_url)
        if component_key in visited_component_ids:
            continue
        visited_component_ids.add(component_key)

        response_file_path = write_response_file(
            payload=payload,
            component_key=component_key,
            responses_dir=cfg.responses_dir,
            used_names=response_file_names,
        )

        node = {
            "url": current_url,
            "componentKey": component_key,
            "summary": make_node_summary(payload),
            "responseFile": response_file_path,
        }
        nodes.append(node)

        for link in iter_step_links(payload):
            target_url = resolve_link_target(link["targetRaw"], current_url, cfg)
            edge = {
                "from": component_key,
                "fromUrl": current_url,
                "label": link.get("buttonText"),
                "secondaryLabel": link.get("buttonSecondaryText"),
                "fromField": link.get("fromField"),
                "targetRaw": link.get("targetRaw"),
                "toUrl": target_url,
            }
            edges.append(edge)

            if not target_url:
                continue
            if not should_follow(target_url, cfg):
                continue
            if target_url not in visited_urls:
                queue.append(target_url)

    return {
        "meta": {
            "startUrl": cfg.start_url,
            "sameHostOnly": cfg.same_host_only,
            "crawledAtEpochMs": int(time.time() * 1000),
            "maxNodes": cfg.max_nodes,
            "responsesDir": cfg.responses_dir,
        },
        "stats": {
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "errorCount": len(errors),
        },
        "nodes": nodes,
        "edges": edges,
        "errors": errors,
    }


def main() -> int:
    cfg = parse_args()
    graph = crawl(cfg)
    with open(cfg.graph_output_path, "w", encoding="utf-8") as f:
        json.dump(graph, f, ensure_ascii=False, indent=2)

    print(
        (
            f"Done. Nodes: {graph['stats']['nodeCount']}, "
            f"Edges: {graph['stats']['edgeCount']}, "
            f"Errors: {graph['stats']['errorCount']}. "
            f"Graph output: {cfg.graph_output_path}. "
            f"Responses dir: {cfg.responses_dir}"
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
