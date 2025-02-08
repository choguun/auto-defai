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

const crossChainTemplate = ``;

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
