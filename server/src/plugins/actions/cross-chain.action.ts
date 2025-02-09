/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-vars */

import {
  ActionExample,
  composeContext,
  generateObject,
  getEmbeddingZeroVector,
  Handler,
  Memory,
  ModelClass,
  Validator,
} from "@ai16z/eliza";
import { CollabLandBaseAction } from "./collabland.action.js";
import { randomUUID } from "crypto";
import { isAddress } from "viem";
import { isAddress as isAddressSolana } from "./utils.js";
import { sendJitoBundle } from "./jito.js";
import { getBundleStatuses } from "./jito.js";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { fetchSolanaQuote } from "./fetch-quote.js";
import { ethers } from "ethers";
import bs58 from "bs58";
import { formatStringEstimation } from "./formatting.js";
import { sleep } from "./jito.js";

const crossChainTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "srcToken": "So11111111111111111111111111111111111111112",
    "destToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "srcChain": "SOLANA",
    "destChain": "BASE",
    "amount": "100000000"
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet information below:

{{walletInfo}}

Extract the following information about the requested token bridge:
- srcToken (the token being bridged)
- destToken (the token being bridged to)
- srcChain (the chain of the token being bridged)
- destChain (the chain of the token being bridged to)
- amount (the amount of the token being bridged)

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined. The result should be a valid JSON object with the following schema:
\`\`\`json
{
    "srcToken": string | null,
    "destToken": string | null,
    "srcChain": string | null,
    "destChain": string | null,
    "amount":  number | string | null
}
\`\`\``;

const TOKEN_ADDRESSES_ARB = {
  ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // Example Base USDC address
  WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  // Add more tokens as needed
};

// const TOKEN_ADDRESSES_BASE = {
//   ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
//   USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Example Base USDC address
//   WETH: "0x4200000000000000000000000000000000000006",
//   // Add more tokens as needed
// };

// const TOKEN_DECIMALS_EVM = {
//   ETH: 18,
//   USDC: 6,
//   WETH: 18,
// };

const TOKEN_ADDRESSES_SOL = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

const TOKEN_DECIMALS_SOL = {
  SOL: 9,
  USDC: 6,
};

const CHAIN_ID = {
  ARB: "42161",
  BASE: "8453",
  SOL: "101",
};

export class CrossChainAction extends CollabLandBaseAction {
  constructor() {
    const name = "CROSS_CHAIN";
    const similes = [
      "CROSS_CHAIN",
      "CROSS_CHAIN_ACTION",
      "CROSS_CHAIN_ACTIONS",
    ];
    const description = "Cross-chain swap actions";
    const handler: Handler = async (
      _runtime,
      message,
      _state,
      _options,
      _callback
    ): Promise<boolean> => {
      try {
        console.log("[GetCrossChainAction] message", message);
        console.log("[GetCrossChainAction] options", _options);

        const extractContext = composeContext({
          state: {
            ..._state!,
          },
          template: crossChainTemplate,
        });

        console.log("[GetCrossChainAction] extractContext", extractContext);
        const content = await generateObject({
          runtime: _runtime,
          context: extractContext,
          modelClass: ModelClass.LARGE,
        });

        console.log("[GetCrossChainAction] content", content);
        if (!content.amount) {
          console.log("Amount is not a number, skipping swap");
          const responseMsg = {
            text: "The amount must be a number",
          };
          _callback?.(responseMsg);
          return true;
        }

        if (!content.srcToken) {
          console.log("srcToken is no data, skipping swap");
          const responseMsg = {
            text: "The srcToken must be a valid token",
          };
          _callback?.(responseMsg);
          return true;
        }

        if (!content.destToken) {
          console.log("destToken is no data, skipping swap");
          const responseMsg = {
            text: "The destToken must be a valid token",
          };
          _callback?.(responseMsg);
          return true;
        }

        if (!content.srcChain) {
          console.log("srcChain is no data, skipping swap");
          const responseMsg = {
            text: "The srcChain must be a valid chain",
          };
          _callback?.(responseMsg);
          return true;
        }

        if (!content.destChain) {
          console.log("destChain is no data, skipping swap");
          const responseMsg = {
            text: "The destChain must be a valid chain",
          };
          _callback?.(responseMsg);
          return true;
        }

        const srcToken = !isAddressSolana(content.srcToken)
          ? TOKEN_ADDRESSES_SOL[
              content.srcToken as keyof typeof TOKEN_ADDRESSES_SOL
            ]
          : content.srcToken;
        const destToken = !isAddress(content.destToken)
          ? TOKEN_ADDRESSES_ARB[
              content.destToken as keyof typeof TOKEN_ADDRESSES_ARB
            ]
          : content.destToken;
        const amount = String(
          parseFloat(content.amount) *
            10 **
              TOKEN_DECIMALS_SOL[
                content.srcToken as keyof typeof TOKEN_DECIMALS_SOL
              ]
        );

        const jitoTip = "1000000";
        const srcChain = CHAIN_ID.SOL;
        const destChain = CHAIN_ID.BASE;
        const slippage = "1.5";

        const BASE_MAINNET_URL = _runtime.getSetting("BASE_MAINNET_URL");

        const baseProvider = ethers.getDefaultProvider(BASE_MAINNET_URL!);

        const SOLANA_BASE_58_PRIVATE_KEY = _runtime.getSetting(
          "SOLANA_BASE_58_PRIVATE_KEY"
        );
        const EVM_PRIVATE_KEY = _runtime.getSetting("EVM_PRIVATE_KEY");

        const baseSigner = new ethers.Wallet(EVM_PRIVATE_KEY!).connect(
          baseProvider
        );

        const solanaSigner = Keypair.fromSeed(
          bs58.decode(SOLANA_BASE_58_PRIVATE_KEY!).slice(0, 32)
        );

        const quote = await fetchSolanaQuote({
          senderAddress: solanaSigner.publicKey.toBase58(),
          amount,
          srcToken,
          destToken,
          srcChain,
          destChain,
          slippage,
          jitoTip,
          // `destinationAddress` and `dstChainOrderAuthorityAddress` are required for bridge transactions
          destinationAddress: baseSigner.address,
          dstChainOrderAuthorityAddress: baseSigner.address,
        });

        console.log(
          `Expected to receive: ${formatStringEstimation(
            quote.outputAmount.value,
            quote.outputAmount.decimals
          )} ${quote.outputAmount.symbol}`
        );

        // deserialize Solana transactions
        const transactions: VersionedTransaction[] = [];
        for (let i = 0; i < quote.calldatas.length; i++) {
          const calldata = quote.calldatas[i];
          const messageBuffer = Buffer.from(calldata.data, "base64");
          const transaction = VersionedTransaction.deserialize(messageBuffer);
          transactions.push(transaction);
        }

        // sign transactions
        for (const transaction of transactions) {
          transaction.sign([solanaSigner]);
        }

        // sending transactions as Jito bundle
        const bundleId = await sendJitoBundle(transactions);

        // waiting for transactions confirmation
        while (true) {
          const bundleData = await getBundleStatuses(bundleId);
          console.log(`Bundle status: ${bundleData.status}`);

          await sleep(1000);
          if (
            bundleData.status === "confirmed" ||
            bundleData.status === "finalized"
          ) {
            bundleData.transactions.forEach((transactionHash) => {
              console.log(`https://solscan.io/tx/${transactionHash}`);
            });

            break;
          }
        }

        // Create memory
        const chainMemory: Memory = {
          id: randomUUID(),
          agentId: message.agentId,
          userId: message.userId,
          roomId: message.roomId,
          content: {
            text: "",
            srcToken: content.srcToken,
            destToken: content.destToken,
            amount: content.amount,
            srcChain: content.srcChain,
            destChain: content.destChain,
          },
          createdAt: Date.now(),
          embedding: getEmbeddingZeroVector(),
          unique: true,
        };

        console.log("[CrossChainAction] creating chainMemory", chainMemory);
        const onChainMemoryManager = _runtime.getMemoryManager("onchain")!;
        await onChainMemoryManager.createMemory(chainMemory, true);

        _callback?.({
          text: `Bridge complete! Transaction: [tx_hash], Amount: ${content.amount} ${content.srcToken}, Received: ${formatStringEstimation(
            quote.outputAmount.value,
            quote.outputAmount.decimals
          )} ${quote.outputAmount.symbol}`,
        });
        return true;
      } catch (error) {
        this.handleError(error);
        return false;
      }
    };
    const validate: Validator = async (
      _,
      _message,
      _state
    ): Promise<boolean> => {
      return true;
    };
    const examples: ActionExample[][] = [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Bridge from solana 1 SOL for USDC on Base",
            srcToken: "SOL",
            destToken: "USDC",
            srcChain: "SOLANA",
            destChain: "BASE",
            amount: 1,
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "swap from SOLANA 0.001 SOL to USDC on BASE",
            srcToken: "SOL",
            destToken: "USDC",
            srcChain: "SOLANA",
            destChain: "BASE",
            amount: 0.001,
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}
