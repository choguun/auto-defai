/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { QuoteQueryParams, EvmEstimation, SolanaEstimation } from "./types.js";

export async function fetchQuote<ReturnType>(
  params: QuoteQueryParams
): Promise<ReturnType> {
  try {
    const url = "https://api.intensitylabs.ai/v2/quote";

    console.log("Full URL:", url);
    console.log("Request params:", params);

    const response = await axios.get<ReturnType>(url, {
      timeout: 200000,
      params,
      headers: {
        "x-api-key": "ticc2iafmlc",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Full error:", error);
    throw error;
  }
}

export async function fetchEvmQuote(
  params: QuoteQueryParams
): Promise<EvmEstimation> {
  return await fetchQuote<EvmEstimation>(params);
}

export async function fetchSolanaQuote(
  params: QuoteQueryParams
): Promise<SolanaEstimation> {
  return await fetchQuote<SolanaEstimation>(params);
}
