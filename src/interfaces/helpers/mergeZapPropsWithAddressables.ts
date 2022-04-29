import { getAddress } from "@ethersproject/address";

import { Address, Addressable, Token } from "../../types";

type MergeZapPropsWithAddressables<T> = {
  addressables: T[];
  supportedVaultAddresses: Address[];
  zapInType: keyof Token["supported"];
  zapOutType: keyof Token["supported"];
};

/**
 * Helper function to set the zap properties on an Addressable
 * @param addressables an array of objects with an address prop
 * @param supportedVaultAddresses the supported vault addresses
 * @returns the updated metadata
 */
export function mergeZapPropsWithAddressables<T extends Addressable>({
  addressables,
  supportedVaultAddresses,
  zapInType,
  zapOutType,
}: MergeZapPropsWithAddressables<T>): T[] {
  const supportedVaultAddressesSet = new Set(supportedVaultAddresses);

  return addressables.map((addressable) => {
    try {
      const address = getAddress(addressable.address);
      const isZappable = supportedVaultAddressesSet.has(address);

      return {
        ...addressable,
        allowZapIn: isZappable,
        allowZapOut: isZappable,
        zapInWith: isZappable ? zapInType : undefined,
        zapOutWith: isZappable ? zapOutType : undefined,
      };
    } catch (error) {
      return addressable;
    }
  });
}
