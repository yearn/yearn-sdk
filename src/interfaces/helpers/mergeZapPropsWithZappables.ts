import { getAddress } from "@ethersproject/address";

import { Address, Addressable, Token } from "../../types";

type Zappable = Addressable & {
  allowZapIn?: boolean;
  allowZapOut?: boolean;
  zapInWith?: string;
  zapOutWith?: string;
};

type MergeZapInPropsWithZappables<T> = {
  zappables: T[];
  supportedVaultAddresses: Address[];
  zapInType: keyof Token["supported"];
};

type MergeZapOutPropsWithZappables<T> = {
  zappables: T[];
  supportedVaultAddresses: Address[];
  zapOutType: keyof Token["supported"];
};

/**
 * Helper function to set the zap properties on an Addressable
 * @param zappables an array of objects with an address prop
 * @param supportedVaultAddresses the supported vault addresses
 * @returns the updated metadata
 */
export function mergeZapInPropsWithZappables<T extends Zappable>({
  zappables,
  supportedVaultAddresses,
  zapInType,
}: MergeZapInPropsWithZappables<T>): T[] {
  const supportedVaultAddressesSet = new Set(supportedVaultAddresses);

  return zappables.map((zappable) => {
    if (zappable.zapInWith) return zappable;

    try {
      const address = getAddress(zappable.address);
      const isZappable = supportedVaultAddressesSet.has(address);

      return {
        ...zappable,
        allowZapIn: isZappable,
        zapInWith: isZappable ? zapInType : undefined,
      };
    } catch (error) {
      return zappable;
    }
  });
}

/**
 * Helper function to set the zap properties on an Addressable
 * @param zappables an array of objects with an address prop
 * @param supportedVaultAddresses the supported vault addresses
 * @returns the updated metadata
 */
export function mergeZapOutPropsWithZappables<T extends Zappable>({
  zappables,
  supportedVaultAddresses,
  zapOutType,
}: MergeZapOutPropsWithZappables<T>): T[] {
  const supportedVaultAddressesSet = new Set(supportedVaultAddresses);

  return zappables.map((zappable) => {
    if (zappable.zapOutWith) return zappable;

    try {
      const address = getAddress(zappable.address);
      const isZappable = supportedVaultAddressesSet.has(address);

      return {
        ...zappable,
        allowZapOut: isZappable,
        zapOutWith: isZappable ? zapOutType : undefined,
      };
    } catch (error) {
      return zappable;
    }
  });
}
