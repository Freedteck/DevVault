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
const GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "https://ipfs.io";

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
  name = "devvault-content",
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
  try {
    const url = `${GATEWAY}/ipfs/${cid}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.text as string) ?? null;
  } catch {
    return null;
  }
}
