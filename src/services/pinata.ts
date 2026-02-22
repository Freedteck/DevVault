import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

/**
 * Upload JSON data to Pinata
 * @param data - The JSON object to upload
 * @returns The IPFS URL of the uploaded content
 */
export const uploadJsonToPinata = async (
  data: Record<string, any>,
): Promise<string> => {
  try {
    const response = await pinata.upload.public.json(data);
    const cid = response.cid; // Get the CID of the uploaded JSON
    const url = `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${cid}`;
    return url;
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error);
    throw error;
  }
};
