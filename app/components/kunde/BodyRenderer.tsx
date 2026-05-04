export type InlineRun = { text: string; bold?: boolean };

export type LocaleBodyItem =
  | { type: "paragraph"; content: InlineRun[] }
  | { type: "ordered-list" | "unordered-list"; items: InlineRun[][] };

function Inline({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, i) =>
        run.bold ? (
          <strong key={i}>{run.text}</strong>
        ) : (
          <span key={i}>{run.text}</span>
        )
      )}
    </>
  );
}

export default function BodyRenderer({ body }: { body: LocaleBodyItem[] }) {
  if (!body?.length) return null;

  return (
    <div className="space-y-3 text-sm text-gray-700">
      {body.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i}>
              <Inline runs={block.content} />
            </p>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={i} className="list-decimal list-inside space-y-1">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Inline runs={item} />
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={i} className="list-disc list-inside space-y-1">
              {block.items.map((item, j) => (
                <li key={j}>
                  <Inline runs={item} />
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}
