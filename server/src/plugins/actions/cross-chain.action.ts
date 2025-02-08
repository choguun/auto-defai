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
import { chainMap } from "../../utils.js";

const crossChainTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "srcToken": "So11111111111111111111111111111111111111112",
    "destToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "amount": "100000000"
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet information below:

{{walletInfo}}

Extract the following information about the requested token bridge:
- srcToken (the token being bridged)
- destToken (the token being bridged to)
- amount (the amount of the token being bridged)

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined. The result should be a valid JSON object with the following schema:
\`\`\`json
{
    "srcToken": string | null,
    "destToken": string | null,
    "amount":  number | string | null
}
\`\`\``;

export class GetChainAction extends CollabLandBaseAction {
  constructor() {
    const name = "CROSS_CHAIN";
    const similes = [
      "CROSS_CHAIN",
      "CROSS_CHAIN_ACTION",
      "CROSS_CHAIN_ACTIONS",
    ];
    const description =
      "Extracts the chain from the recent messages and the available chains are ethereum, base, linea and solana.";
    const handler: Handler = async (
      _runtime,
      message,
      _state,
      _options,
      _callback
    ): Promise<boolean> => {
      try {
        console.log("[GetChainAction] message", message);
        console.log("[GetChainAction] options", _options);

        const availableChains = Object.entries(chainMap)
          .map(([chain]) => {
            return `${chain}`;
          })
          .join("\n");
        console.log("[GetChainAction] availableChains", availableChains);

        const extractContext = composeContext({
          state: {
            ..._state!,
            availableChains: availableChains,
          },
          template: crossChainTemplate,
        });
        console.log("[GetChainAction] extractContext", extractContext);
        const extractedChain = await generateObject({
          context: extractContext,
          modelClass: ModelClass.SMALL,
          runtime: _runtime,
        });
        console.log("[GetChainAction] extractedChain", extractedChain);
        if (!extractedChain.chain) {
          _callback?.({
            text: "I couldn't identify a valid chain name. Please specify a supported chain like Ethereum, Base, Linea or Solana.",
          });
          return false;
        }

        // Create memory
        const chainMemory: Memory = {
          id: randomUUID(),
          agentId: message.agentId,
          userId: message.userId,
          roomId: message.roomId,
          content: {
            text: "",
            chain: extractedChain.chain,
          },
          createdAt: Date.now(),
          embedding: getEmbeddingZeroVector(),
          unique: true,
        };
        console.log("[GetChainAction] creating chainMemory", chainMemory);
        const onChainMemoryManager = _runtime.getMemoryManager("onchain")!;
        await onChainMemoryManager.createMemory(chainMemory, true);

        _callback?.({
          text: `Your current chain is now ${extractedChain.chain} `,
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
            text: "What is your smart account?",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}
