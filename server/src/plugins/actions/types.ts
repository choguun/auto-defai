export type JitoBundleResponse = {
  jsonrpc: "2.0";
  result: string;
  id: number;
};

export type BundleStatusResponse = {
  jsonrpc: "2.0";
  result: {
    context: {
      slot: number;
    };
    value: {
      bundle_id: string;
      transactions: string[];
      slot: number;
      confirmation_status: string;
      err: object;
    }[];
  };
  id: number;
};

export type DextraQuoteEstimation = EvmEstimation | SolanaEstimation;

export type QuoteQueryParams = {
  srcToken: string;
  destToken: string;
  amount: string;
  senderAddress: string;
  srcChain: string;
  destChain: string;
  slippage?: string;
  gasRefuel?: string;
  srcChainOrderAuthorityAddress?: string;
  dstChainOrderAuthorityAddress?: string;
  dstChainBridgeFallbackAddress?: string;
  destinationAddress?: string;
  affiliateWallet?: string;
  affiliateFee?: string;
  externalCall?: string;
  // Solana only params
  jitoTip?: string;
  excludeDexes?: string;
  onlyDirectRoutes?: string;
};

export type EvmEstimation = {
  routes: {
    path?: string[];
    amountIn: TokenData;
    amountOut: TokenData;
  }[];
  inputAmount: TokenData;
  outputAmount: TokenData & { receiver: string };
  calldatas: {
    chainId: number;
    from: string;
    data: string;
    to: string;
    value: string;
  };
  gasRefuel?: string;
  swapFee?: TokenFeeData;
  bridgeFee?: TokenFeeData;
  affiliateFee?: {
    receiver: string;
    feeToken: string;
    feeAmount: string;
  };
};

export type TokenData = {
  address: string;
  decimals: number;
  chainId: number;
  name: string;
  symbol: string;
  value: string;
};

export type TokenFeeData = {
  token: string;
  amount: string;
  chainId: number;
};

export type SolanaEstimation = {
  routes: SolanaRoute[];
  inputAmount: {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    value: string;
    chainId: number;
  };
  outputAmount: {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    value: string;
    chainId: number;
  };
  calldatas: SolanaCallData[];
  gasRefuel?: string;
  bridgeFee?: TokenFeeData;
  affiliateFee?: {
    receiver: string;
    feeToken: string;
    feeAmount: string;
  };
};

export type SolanaRoute = {
  path: string[];
  amountIn: {
    address: string;
    decimals: string;
    value: string;
    chainId: number;
  };
  amountOut: {
    address: string;
    decimals: string;
    value: string;
    chainId: number;
  };
  pools: string[];
};

export type SolanaCallData = {
  from: string;
  chainId: number;
  // calldata note
  label: string;
  // actual calldata
  data: string;
};
