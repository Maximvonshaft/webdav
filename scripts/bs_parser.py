#!/usr/bin/env python3
import json
import sys
from bs4 import BeautifulSoup


def parse_html(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = None
    for selector in ["h1", "h2", ".title"]:
        candidate = soup.select_one(selector)
        if candidate and candidate.get_text(strip=True):
            title = candidate.get_text(strip=True)
            break

    paragraphs = [
        p.get_text(" ", strip=True)
        for p in soup.find_all(["p", "article"])
        if p.get_text(strip=True)
    ]
    highlights = paragraphs[:5]

    entities = []
    for tag in soup.select(".tag, .label"):
        text = tag.get_text(strip=True)
        if text:
            entities.append(text)

    return {
        "title": title,
        "highlights": highlights,
        "entities": entities,
    }


def main():
    html = sys.stdin.read()
    if not html:
        print(json.dumps({"title": None, "highlights": [], "entities": []}))
        return

    data = parse_html(html)
    print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
