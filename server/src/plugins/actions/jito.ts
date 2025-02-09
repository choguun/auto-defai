import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import { BundleStatusResponse, JitoBundleResponse } from "./types.js";

/**
 * Sends signed transactions as Jito bundle
 * @param signedTransactions Signed versioned transactions
 */
export async function sendJitoBundle(
  signedTransactions: VersionedTransaction[]
) {
  const base58Transactions = signedTransactions.map((tx) =>
    bs58.encode(tx.serialize())
  );
  const response = (
    await axios.post<JitoBundleResponse>(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [base58Transactions],
      }
    )
  ).data;

  return response.result;
}

/**
 * Returns bundle status
 * @param bundleID Bundle ID
 */
export async function getBundleStatuses(bundleID: string) {
  const response = (
    await axios.post<BundleStatusResponse>(
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getBundleStatuses",
        params: [[bundleID]],
      }
    )
  ).data;

  return {
    status: response.result.value[0]?.confirmation_status,
    transactions: response.result.value[0]?.transactions,
  };
}

/**
 * Delay function
 */
export const sleep = async (ms: number) => {
  return new Promise((r) => setTimeout(r, ms));
};
