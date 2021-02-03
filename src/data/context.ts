import { Provider } from "@ethersproject/providers";

interface ContextConnectors {
  provider?: Provider;
  etherscan?: string;
}

export class Context implements ContextConnectors {
  blocks: {
    ids: number[];
    cache: { [key: number]: number };
  } = {
    ids: [],
    cache: {}
  };

  private providerRef?: Provider;
  private etherscanKey?: string;

  constructor(connectors?: ContextConnectors) {
    if (!connectors) {
      return;
    }
    const { provider, etherscan } = connectors;
    this.providerRef = provider;
    this.etherscanKey = etherscan;
  }

  set provider(value: Provider) {
    this.providerRef = value;
  }

  get provider(): Provider {
    if (!this.providerRef) {
      throw new ReferenceError(
        "this operations requires a valid provider in the sdk context"
      );
    }
    return this.providerRef;
  }

  set etherscan(value: string) {
    this.etherscanKey = value;
  }

  get etherscan(): string {
    if (!this.etherscanKey) {
      throw new ReferenceError(
        "this operations requires a valid etherscan key in the sdk context"
      );
    }
    return this.etherscanKey;
  }
}
