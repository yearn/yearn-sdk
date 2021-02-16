import { VaultV2Contract__factory } from "../../../../contracts";
import { Context } from "../../../../data/context";
import { toBigNumber } from "../../../../utils/bn";
import { VaultV2 } from "../interfaces";

export async function calculateTvlV2(vault: VaultV2, ctx: Context): Promise<number> {
  const contract = VaultV2Contract__factory.connect(vault.address, ctx.provider);
  return contract.totalAssets().then(num =>
    toBigNumber(num)
      .div(10 ** vault.decimals)
      .toNumber()
  );
}
