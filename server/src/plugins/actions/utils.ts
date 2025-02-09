import { PublicKey } from "@solana/web3.js";

export function isAddress(address: string) {
  try {
    new PublicKey(address); // Attempt to create a PublicKey
    return true;
  } catch (error) {
    return false; // Invalid address
  }
}
