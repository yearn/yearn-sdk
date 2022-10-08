import { allSupportedChains, isArbitrum, isEthereum, isFantom, isGoerli } from "./chain";

describe("Chain", () => {
  it.each`
    chainId  | ethereum | fantom   | arbitrum | goerli
    ${1}     | ${true}  | ${false} | ${false} | ${false}
    ${5}     | ${false} | ${false} | ${false} | ${true}
    ${250}   | ${false} | ${true}  | ${false} | ${false}
    ${1337}  | ${true}  | ${false} | ${false} | ${false}
    ${42161} | ${false} | ${false} | ${true}  | ${false}
    ${42}    | ${false} | ${false} | ${false} | ${false}
  `(`should return the correct result for each chain "$chainId"`, ({ chainId, ethereum, fantom, arbitrum, goerli }) => {
    expect(isFantom(chainId)).toBe(fantom);
    expect(isArbitrum(chainId)).toBe(arbitrum);
  });

  describe("allSupportedChains", () => {
    it("should return all supported chains", () => {
       expect(allSupportedChains).toStrictEqual([1, 5, 10, 250, 1337, 42161]);
    });
  });
});
