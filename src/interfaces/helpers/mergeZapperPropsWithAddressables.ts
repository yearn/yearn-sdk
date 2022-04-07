import { getAddress } from "@ethersproject/address";

import { Address, Addressable } from "../../types";

/**
 * Helper function to set the zapper properties on a vault's metadata
 * @param addressables an array of objects with an address prop
 * @param supportedVaultAddresses the supported vault addresses
 * @returns the updated metadata
 */
export function mergeZapperPropsWithAddressables<T extends Addressable>(
  addressables: T[],
  supportedVaultAddresses: Address[]
): T[] {
  const supportedVaultAddressesSet = new Set(supportedVaultAddresses);

  return addressables.map((addressable) => {
    try {
      const address = getAddress(addressable.address);
      const isZappable = supportedVaultAddressesSet.has(address);

      return {
        ...addressable,
        allowZapIn: isZappable,
        allowZapOut: isZappable,
        zapInWith: isZappable ? "zapperZapIn" : undefined,
        zapOutWith: isZappable ? "zapperZapOut" : undefined,
      };
    } catch (error) {
      return addressable;
    }
  });
}
