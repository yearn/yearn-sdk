import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";

import overrides from "./overrides.json";

// Crawl up the constructor chain to find a static method
// Taken directly from ethers.js
function getStatic<T>(ctor: any, key: string): T {
  for (let i = 0; i < 32; i++) {
    if (ctor[key]) {
      return ctor[key];
    }
    if (!ctor.prototype || typeof ctor.prototype !== "object") {
      break;
    }
    ctor = Object.getPrototypeOf(ctor.prototype).constructor;
  }
  throw new Error();
}

// Inject a custom `prepareRequest` function to the JsonRpcProvider, to allow
// eth_call overrides parameters.
export function inject(provider: JsonRpcProvider & { _sdkPatched?: boolean }) {
  if (provider._sdkPatched) return;

  const backup = provider.prepareRequest.bind(provider);

  function call(params: any): [string, Array<any>] {
    const hexlifyTransaction = getStatic<
      (
        t: TransactionRequest,
        a?: { [key: string]: boolean }
      ) => { [key: string]: string }
    >(provider.constructor, "hexlifyTransaction");
    return [
      "eth_call",
      [
        hexlifyTransaction(params.transaction, { from: true }),
        params.blockTag,
        overrides
      ]
    ];
  }

  function prepareRequest(method: string, params: any): [string, Array<any>] {
    if (method === "call") return call(params);
    return backup(method, params);
  }

  console.debug("[SDK] Injecting overrides into providers");

  Object.defineProperty(provider, "prepareRequest", {
    enumerable: true,
    value: prepareRequest.bind(provider),
    writable: false
  });

  Object.defineProperty(provider, "_sdkPatched", {
    enumerable: true,
    value: true,
    writable: false
  });
}
