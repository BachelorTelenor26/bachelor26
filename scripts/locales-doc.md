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

## Renderer component

The component needs to handle every block type and every inline node variant. No `dangerouslySetInnerHTML` is required.

### Inline renderer
```tsx
function InlineContent({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if ("break" in node) return <br key={i} />;
        const text = node.bold ? <strong>{node.text}</strong> : node.text;
        if (node.italic) return <em key={i}>{text}</em>;
        if (node.href)   return <a key={i} href={node.href}>{node.text}</a>;
        if (node.bold)   return <strong key={i}>{node.text}</strong>;
        return <span key={i}>{node.text}</span>;
      })}
    </>
  );
}
```

### Block renderer
```tsx
function StepBody({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return <p key={i}><InlineContent nodes={block.content} /></p>;
          case "ordered-list":
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}><InlineContent nodes={item} /></li>
                ))}
              </ol>
            );
          case "unordered-list":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}><InlineContent nodes={item} /></li>
                ))}
              </ul>
            );
          case "heading":
            return <h3 key={i}><InlineContent nodes={block.content} /></h3>;
        }
      })}
    </div>
  );
}
```

### TypeScript types
```ts
type TextNode   = { text: string; bold?: true; italic?: true; href?: string };
type BreakNode  = { break: true };
type InlineNode = TextNode | BreakNode;

type ParagraphBlock     = { type: "paragraph";      content: InlineNode[] };
type OrderedListBlock   = { type: "ordered-list";   items: InlineNode[][] };
type UnorderedListBlock = { type: "unordered-list"; items: InlineNode[][] };
type HeadingBlock       = { type: "heading"; level: number; content: InlineNode[] };
type Block = ParagraphBlock | OrderedListBlock | UnorderedListBlock | HeadingBlock;
```

---

## Regenerating locale files

Locale files are generated from the raw scraped data in `telenor-guides/` by running:

```bash
python3 scripts/split_guides_content.py \
  --guides-dir telenor-guides \
  --output-dir public/locales
```

Do not edit locale files by hand — run the scraper and regenerate instead.
