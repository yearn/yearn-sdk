import { allSupportedChains, isArbitrum, isEthereum, isFantom } from "./chain";

describe("Chain", () => {
  it.each`
    chainId  | ethereum | fantom   | arbitrum
    ${1}     | ${true}  | ${false} | ${false}
    ${250}   | ${false} | ${true}  | ${false}
    ${1337}  | ${true}  | ${false} | ${false}
    ${42161} | ${false} | ${false} | ${true}
    ${42}    | ${false} | ${false} | ${false}
  `(`should return the correct result for each chain "$chainId"`, ({ chainId, ethereum, fantom, arbitrum }) => {
    expect(isEthereum(chainId)).toBe(ethereum);
    expect(isFantom(chainId)).toBe(fantom);
    expect(isArbitrum(chainId)).toBe(arbitrum);
  });

  describe("allSupportedChains", () => {
    it("should return all supported chains", () => {
      expect(allSupportedChains).toStrictEqual([1, 10, 250, 1337, 42161]);
    });
  });
});
