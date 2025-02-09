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
