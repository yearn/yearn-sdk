import { Context } from "../../data/context";
import { fetchTransactionList } from "../../data/etherscan";
import { TimedBlock } from "../../utils/block";
import { Vault } from "../interfaces";

export async function fetchInceptionBlock(
  vault: Vault,
  ctx: Context
): Promise<TimedBlock | null> {
  const txlist = await fetchTransactionList({ address: vault.address }, ctx);
  if (txlist.length < 3) return null;
  const inception = txlist[2]; // skip contract creation
  return { block: inception.blockNumber, timestamp: inception.timeStamp };
}
