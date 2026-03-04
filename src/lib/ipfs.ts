/**
 * IPFS utilities via Pinata.
 *
 * Upload:  server-side only (PINATA_JWT is secret)
 * Fetch:   client or server via public gateway
 *
 * Content is stored as JSON: { text: "<markdown body>" }
 * so we have a typed envelope instead of raw plaintext.
 */

const PINATA_API = "https://api.pinata.cloud";

// Normalize gateway: add https:// if no protocol prefix supplied
function normalizeGateway(raw: string): string {
  if (!raw) return "https://ipfs.io";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

const CONFIGURED_GATEWAY = normalizeGateway(
  process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "",
);
// Always keep a public fallback in case the dedicated gateway requires a token
const PUBLIC_GATEWAY = "https://gateway.pinata.cloud";

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a markdown body to Pinata/IPFS.
 * Returns the IPFS CID (v0 "Qm…" hash).
 * Throws if PINATA_JWT is not configured or upload fails.
 *
 * SERVER-SIDE ONLY — never call from client components.
 */
export async function uploadToIPFS(
  content: string,
  name = "vurso-content",
): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT not configured");

  const body = JSON.stringify({
    pinataContent: { text: content },
    pinataMetadata: { name },
  });

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  return json.IpfsHash as string; // e.g. "QmXyz..."
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/**
 * Fetch a markdown body from IPFS by CID.
 * Uses the configured Pinata dedicated gateway, falls back to ipfs.io.
 * Returns the text string, or null if not found / misconfigured.
 */
export async function fetchFromIPFS(cid: string): Promise<string | null> {
  if (!cid) return null;

  const gateways = [CONFIGURED_GATEWAY, PUBLIC_GATEWAY, "https://ipfs.io"].filter(
    (g, i, arr) => arr.indexOf(g) === i, // deduplicate
  );

  for (const gateway of gateways) {
    try {
      const url = `${gateway}/ipfs/${cid}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) continue;
      const json = await res.json();
      const text = (json?.text as string) ?? null;
      if (text) return text;
    } catch {
      // try next gateway
    }
  }
  return null;
}
