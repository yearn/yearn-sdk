import { JsonRpcProvider, JsonRpcSigner, Networkish } from "@ethersproject/providers";
import { ChainId } from "./chain";
import { AllowListService } from "./services/allowlist";
import { ValidatedJsonRpcSigner } from "./validatedSigner";

export class ValidatedJsonRpcProvider extends JsonRpcProvider {
  private allowList: AllowListService<ChainId>;

  constructor(url: string, network: Networkish, allowList: AllowListService<ChainId>) {
    super(url, network);
    this.allowList = allowList;
  }

  getSigner(addressOrIndex?: string | number): JsonRpcSigner {
    return new ValidatedJsonRpcSigner(false, this, this.allowList, addressOrIndex);
  }
}
