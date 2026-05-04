// Human-safe alphabet: excludes 0, 1, I, L, O, U
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const ALPHABET_LEN = ALPHABET.length;
const BI_0 = BigInt(0);
const BI_8 = BigInt(8);
const BI_16 = BigInt(16);
const BI_30 = BigInt(ALPHABET_LEN);
const BI_4096 = BigInt(4096);

export type HandoverPayload = {
  flowId: number;
  choices: number[];
};

export class StatelessSessionCodeService {
  encode(payload: HandoverPayload): string {
    const body = this.encodeBody(payload);
    const check = this.checksumChar(body);
    return "KS-" + this.format(body + check);
  }

  decode(input: string): HandoverPayload | null {
    const raw = this.normalize(input);
    if (!this.isValid(raw)) return null;
    const body = raw.slice(0, -1);
    return this.decodeBody(body);
  }

  isValid(raw: string): boolean {
    if (!raw || raw.length < 2) return false;
    if (![...raw].every((ch) => ALPHABET.includes(ch))) return false;
    const body = raw.slice(0, -1);
    const check = raw.slice(-1);
    return this.checksumChar(body) === check;
  }

  normalize(input: string): string {
    return (input || "").toUpperCase().replace(/^KS-?/, "").replace(/[^A-Z2-9]/g, "");
  }

  format(raw: string): string {
    if (raw.length <= 4) return raw;

    let threeChunks = -1;
    for (let t = 0; t <= Math.floor(raw.length / 3); t += 1) {
      if ((raw.length - 3 * t) % 4 === 0) {
        threeChunks = t;
        break;
      }
    }

    if (threeChunks === -1) {
      return `${raw.slice(0, 4)}-${raw.slice(4)}`;
    }

    const fourChunks = (raw.length - 3 * threeChunks) / 4;
    const sizes = [
      ...Array.from({ length: fourChunks }, () => 4),
      ...Array.from({ length: threeChunks }, () => 3),
    ];

    const chunks: string[] = [];
    let cursor = 0;
    for (const size of sizes) {
      chunks.push(raw.slice(cursor, cursor + size));
      cursor += size;
    }

    return chunks.join("-");
  }

  private encodeBody(payload: HandoverPayload): string {
    if (payload.flowId < 0 || payload.flowId > 4095)
      throw new Error("flowId must be 0..4095");
    if (payload.choices.length > 15)
      throw new Error("choices length must be <= 15");
    if (payload.choices.some((c) => c < 0 || c > 7))
      throw new Error("each choice must be 0..7");

    let value = BigInt(payload.flowId);
    for (const c of payload.choices) {
      value = value * BI_8 + BigInt(c);
    }
    value = value * BI_16 + BigInt(payload.choices.length);

    return this.toBase30(value);
  }

  private decodeBody(body: string): HandoverPayload {
    let value = this.fromBase30(body);

    const stepCount = Number(value % BI_16);
    value /= BI_16;

    const choicesRev: number[] = [];
    for (let i = 0; i < stepCount; i += 1) {
      choicesRev.push(Number(value % BI_8));
      value /= BI_8;
    }

    const flowId = Number(value % BI_4096);

    return { flowId, choices: choicesRev.reverse() };
  }

  private toBase30(value: bigint): string {
    if (value === BI_0) return ALPHABET[0];
    let x = value;
    const out: string[] = [];
    while (x > BI_0) {
      const idx = Number(x % BI_30);
      out.push(ALPHABET[idx]);
      x /= BI_30;
    }
    return out.reverse().join("");
  }

  private fromBase30(input: string): bigint {
    let out = BI_0;
    for (const ch of input) {
      const idx = ALPHABET.indexOf(ch);
      if (idx < 0) throw new Error(`Invalid character: ${ch}`);
      out = out * BI_30 + BigInt(idx);
    }
    return out;
  }

  private checksumChar(body: string): string {
    // djb2 — works in both Node and browser
    let h = 5381;
    for (let i = 0; i < body.length; i++) {
      h = ((h << 5) + h + body.charCodeAt(i)) & 0x7fffffff;
    }
    return ALPHABET[h % ALPHABET_LEN];
  }
}

/** Deterministic flowId from an article slug (0..4095). Uses djb2 hash. */
export function deriveFlowId(articleSlug: string): number {
  let h = 5381;
  for (let i = 0; i < articleSlug.length; i++) {
    h = ((h << 5) + h + articleSlug.charCodeAt(i)) & 0x7fffffff;
  }
  return h % 4096;
}

const _service = new StatelessSessionCodeService();

export function encodeHandoverCode(
  articleSlug: string,
  choiceIndices: number[]
): string {
  return _service.encode({
    flowId: deriveFlowId(articleSlug),
    choices: choiceIndices,
  });
}

export function decodeHandoverCode(code: string): HandoverPayload | null {
  return _service.decode(code);
}
