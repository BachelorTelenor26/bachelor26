# Locale Files

Step content for the troubleshooting guides lives in `public/locales/` and is organised by category and device:

```
public/locales/
  <category>/
    <device>/
      <step>.json
    shared/
      <step>.json
```

Categories: `ikke-pa-nett`, `tregt-nett`, `ustabilt-nett`.  
Device folders match the slugs stored on the `DeviceType` model (e.g. `huawei_b818`, `wifi_ruter`, `zyxel_p8702n`).  
Steps under `shared/` apply to all devices in that category.

---

## File structure

```json
{
  "title": "Nullstill ruteren",
  "query": "Løste dette problemet?",
  "body": [ ...blocks ],
  "choices": [
    { "label": "Ja", "secondaryLabel": "" },
    { "label": "Nei", "secondaryLabel": "" }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Step heading shown to the user |
| `query` | `string` | Question or call-to-action below the body |
| `body` | `Block[]` | Structured content (see below) |
| `choices` | `Choice[]` | Button labels for the available answers |

---

## Body blocks

`body` is an array of block objects. Each block has a `type` field.

### `paragraph`
```json
{ "type": "paragraph", "content": [ ...InlineNode ] }
```

### `ordered-list` / `unordered-list`
```json
{ "type": "ordered-list", "items": [ [InlineNode, ...], ... ] }
```
Each item is itself an array of inline nodes (same as `content` in a paragraph).

### `heading`
```json
{ "type": "heading", "level": 3, "content": [ ...InlineNode ] }
```

---

## Inline nodes

Inline nodes are the leaf elements inside `content` or list `items`.

| Shape | Meaning |
|---|---|
| `{ "text": "plain text" }` | Plain text run |
| `{ "text": "bold", "bold": true }` | Bold text |
| `{ "text": "italic", "italic": true }` | Italic text |
| `{ "text": "link label", "href": "/path" }` | Hyperlink |
| `{ "break": true }` | Line break (`<br>`) |

Flags can combine — a node can have both `bold` and `italic` set to `true`.

---
