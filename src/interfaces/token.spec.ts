import { Contract } from "@ethersproject/contracts";

import { Address, Asset, ChainId, Token, TokenInterface, TokenMetadata } from "..";
import { CachedFetcher } from "../cache";
import { Context } from "../context";
import { EthAddress } from "../helpers";
import { createMockAssetStaticVaultV2, createMockBalance, createMockToken } from "../test-utils/factories";
import { Yearn } from "../yearn";

const getPriceUsdcMock = jest.fn();
const getPriceFromRouterMock = jest.fn(() => Promise.resolve(1));
const zapperBalancesMock = jest.fn();
const zapperGasMock = jest.fn();
const zapperSupportedTokensMock = jest.fn();
const zapperZapInApprovalStateMock = jest.fn();
const zapperZapInApprovalTransactionMock = jest.fn();
const zapperZapOutApprovalStateMock = jest.fn();
const zapperZapOutApprovalTransactionMock = jest.fn();
const assetIconMock = jest.fn();
const assetReadyThenMock = jest.fn();
const metaTokensMock = jest.fn();
const vaultsBalancesMock = jest.fn();
const vaultsTokensMock = jest.fn();
const ironBankBalancesMock = jest.fn();
const ironBankTokensMock = jest.fn();
const sendTransactionMock = jest.fn();

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    populateTransaction: {
      approve: jest.fn().mockResolvedValue(true)
    }
  }))
}));

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      asset: {
        ready: { then: assetReadyThenMock },
        icon: assetIconMock
      },
      meta: {
        tokens: metaTokensMock
      },
      oracle: {
        getPriceFromRouter: getPriceFromRouterMock,
        getPriceUsdc: getPriceUsdcMock
      },
      zapper: {
        balances: zapperBalancesMock,
        gas: zapperGasMock,
        supportedTokens: zapperSupportedTokensMock,
        zapInApprovalState: zapperZapInApprovalStateMock,
        zapInApprovalTransaction: zapperZapInApprovalTransactionMock,
        zapOutApprovalState: zapperZapOutApprovalStateMock,
        zapOutApprovalTransaction: zapperZapOutApprovalTransactionMock
      },
      transaction: {
        sendTransaction: sendTransactionMock
      }
    },
    ironBank: { balances: ironBankBalancesMock, tokens: ironBankTokensMock },
    vaults: {
      balances: vaultsBalancesMock,
      tokens: vaultsTokensMock
    }
  }))
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: {
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: jest.fn().mockResolvedValue("transaction")
        }))
      }
    }
  }))
}));

describe("TokenInterface", () => {
  let tokenInterface: TokenInterface<1>;

  let mockedYearn: Yearn<ChainId>;

  beforeEach(() => {
    mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
    tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("price", () => {
    it("should should get the exchange rate between two tokens", async () => {
      const actualPrice = await tokenInterface.price("0x000", "0x001");

      expect(actualPrice).toEqual(1);
      expect(getPriceFromRouterMock).toHaveBeenCalledTimes(1);
      expect(getPriceFromRouterMock).toHaveBeenCalledWith("0x000", "0x001");
    });
  });

  describe("priceUsdc", () => {
    it("should get the suggested Usdc exchange rate for a token", async () => {
      getPriceUsdcMock.mockResolvedValue(0.000001);

      const actualPriceUsdc = await tokenInterface.priceUsdc("0x000");

      expect(actualPriceUsdc).toEqual(0.000001);
      expect(getPriceUsdcMock).toHaveBeenCalledTimes(1);
      expect(getPriceUsdcMock).toHaveBeenCalledWith("0x000", undefined);
    });

    it("should get the suggested Usdc exchange rate for list of tokens", async () => {
      getPriceUsdcMock.mockResolvedValueOnce(0.000001).mockResolvedValueOnce(0.000002);

      const actualPriceUsdc = await tokenInterface.priceUsdc(["0x000", "0x001"]);

      expect(actualPriceUsdc).toEqual({
        "0x000": 0.000001,
        "0x001": 0.000002
      });
      expect(getPriceUsdcMock).toHaveBeenCalledTimes(2);
      expect(getPriceUsdcMock).toHaveBeenNthCalledWith(1, "0x000", undefined);
      expect(getPriceUsdcMock).toHaveBeenNthCalledWith(2, "0x001", undefined);
    });
  });

  describe("balances", () => {
    const vaultTokenWithBalance = createMockBalance({
      address: "0x001"
    });
    const vaultTokenWithoutBalance = createMockBalance({
      balance: "0"
    });
    const zapperTokenWithBalance = createMockBalance({
      address: "0x002"
    });
    const zapperSameAddressTokenWithBalance = createMockBalance({
      address: "0x001"
    });

    beforeEach(() => {
      vaultsBalancesMock.mockResolvedValue([vaultTokenWithBalance, vaultTokenWithoutBalance]);
    });

    ([1, 1337] as ChainId[]).forEach(chainId =>
      describe(`when chainId is ${chainId}`, () => {
        beforeEach(() => {
          tokenInterface = new TokenInterface(mockedYearn, chainId, new Context({}));
        });

        it("should fetch token balances from the TokenInterface.supported list", async () => {
          zapperBalancesMock.mockResolvedValue([zapperTokenWithBalance, zapperSameAddressTokenWithBalance]);

          const actualBalances = await tokenInterface.balances("0x000");

          expect(actualBalances).toEqual([zapperTokenWithBalance, vaultTokenWithBalance]);
          expect(zapperBalancesMock).toHaveBeenCalledTimes(1);
          expect(zapperBalancesMock).toHaveBeenCalledWith("0x000");
          expect(ironBankBalancesMock).not.toHaveBeenCalled();
        });

        it("should return only tokens from the vaults when zapper fails", async () => {
          zapperBalancesMock.mockImplementation(() => {
            throw new Error("zapper balances failed!");
          });

          const actualBalances = await tokenInterface.balances("0x000");

          expect(actualBalances).toEqual([vaultTokenWithBalance]);
          expect(zapperBalancesMock).toHaveBeenCalledTimes(1);
          expect(zapperBalancesMock).toHaveBeenCalledWith("0x000");
          expect(ironBankBalancesMock).not.toHaveBeenCalled();
          expect(console.error).toHaveBeenCalled();
        });
      })
    );

    describe("when chainId is 250", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 250, new Context({}));
      });

      it("should fetch token balances from the TokenInterface.supported list", async () => {
        const ironBankBalance = createMockBalance();
        ironBankBalancesMock.mockResolvedValue([ironBankBalance]);

        const actualBalances = await tokenInterface.balances("0x000");

        expect(actualBalances).toEqual([ironBankBalance, vaultTokenWithBalance]);
        expect(ironBankBalancesMock).toHaveBeenCalledTimes(1);
        expect(ironBankBalancesMock).toHaveBeenCalledWith("0x000");
        expect(zapperBalancesMock).not.toHaveBeenCalled();
      });
    });

    describe("when chainId is not supported", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 42 as any, new Context({}));
      });

      it("should return an empty array and log the error", async () => {
        const actualBalances = await tokenInterface.balances("0x000");

        expect(actualBalances).toEqual([]);
        expect(console.error).toHaveBeenCalled();
        expect(zapperBalancesMock).not.toHaveBeenCalled();
        expect(ironBankBalancesMock).not.toHaveBeenCalled();
      });
    });
  });

  describe("supported", () => {
    describe("when the supported tokens are cached", () => {
      let cachedToken = createMockToken();

      beforeEach(() => {
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue([cachedToken]);
      });

      it("should return the supported tokens cached", async () => {
        const actualSupportedTokensCached = await tokenInterface.supported();

        expect(actualSupportedTokensCached).toEqual([cachedToken]);
      });
    });

    describe("when the supported tokens are not cached", () => {
      beforeEach(() => {
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue(undefined);
      });

      ([1, 1337] as ChainId[]).forEach(chainId =>
        describe(`when chainId is ${chainId}`, () => {
          let ironBankToken: Token;
          let vaultsToken: Token;

          beforeEach(() => {
            tokenInterface = new TokenInterface(mockedYearn, chainId, new Context({}));
            ironBankToken = createMockToken({ address: "0x001", symbol: "IRON", name: "Iron Token" });
            vaultsToken = createMockToken({
              address: "0x002",
              symbol: "VAULT",
              name: "Vault Token"
            });
            vaultsTokensMock.mockResolvedValue([vaultsToken]);
            ironBankTokensMock.mockResolvedValue([ironBankToken]);
          });

          it("should fetch all the tokens from Zapper, Vaults and Iron", async () => {
            const supportedZapperTokenWithIcon = createMockToken({ address: "0x003" });
            const supportedZapperTokenWithoutIcon = createMockToken({ address: "0x004" });

            zapperSupportedTokensMock.mockResolvedValue([
              supportedZapperTokenWithIcon,
              supportedZapperTokenWithoutIcon
            ]);
            assetReadyThenMock.mockResolvedValue({ "0x003": "image.png" });

            const actualSupportedTokens = await tokenInterface.supported();

            expect(actualSupportedTokens.length).toEqual(4);
            expect(actualSupportedTokens).toEqual(
              expect.arrayContaining([
                { ...supportedZapperTokenWithIcon, icon: "image.png", supported: { zapper: true } },
                { ...supportedZapperTokenWithoutIcon, supported: { zapper: true } },
                vaultsToken,
                ironBankToken
              ])
            );
            expect(zapperSupportedTokensMock).toHaveBeenCalledTimes(1);
            expect(vaultsTokensMock).toHaveBeenCalledTimes(1);
            expect(ironBankTokensMock).toHaveBeenCalledTimes(1);
            expect(assetReadyThenMock).toHaveBeenCalledTimes(1);
          });

          it("should overwrite zapper tokens' data with our own in case of duplicates", async () => {
            const ironBankTokenAlsoInZapper = createMockToken({
              address: "0x001",
              symbol: "IRON",
              name: "Iron Token in Zapper",
              icon: "iron-bank.svg",
              priceUsdc: "10"
            });
            const vaultsTokenAlsoInZapper = createMockToken({
              address: "0x002",
              symbol: "VAULT",
              name: "Vault Token in Zapper",
              icon: "vaults.svg",
              priceUsdc: "20"
            });
            const ironBankTokenNotInZapper = createMockToken({
              address: "0x003",
              symbol: "IRON2",
              name: "Iron Token 2",
              icon: "iron-bank-2.svg",
              priceUsdc: "12"
            });
            const vaultsTokenNotInZapper = createMockToken({
              address: "0x004",
              symbol: "VAULT2",
              name: "Vault Token 2",
              icon: "vaults-2.svg",
              priceUsdc: "22"
            });
            const ironBankTokenInVaults = createMockToken({
              address: "0x005",
              symbol: "IRON3",
              name: "Iron Token in Vaults",
              icon: "iron-bank-3.svg",
              priceUsdc: "13"
            });
            const vaultsTokenInIronBank = createMockToken({
              address: "0x005",
              symbol: "VAULT3",
              name: "Vault Token in Iron Bank",
              icon: "vaults-3.svg",
              priceUsdc: "23"
            });

            ironBankTokensMock.mockResolvedValue([
              vaultsTokenAlsoInZapper,
              ironBankTokenNotInZapper,
              ironBankTokenInVaults
            ]);
            vaultsTokensMock.mockResolvedValue([
              ironBankTokenAlsoInZapper,
              vaultsTokenNotInZapper,
              vaultsTokenInIronBank
            ]);
            zapperSupportedTokensMock.mockResolvedValue([
              {
                ...ironBankTokenAlsoInZapper,
                priceUsdc: "1",
                supported: {
                  zapper: true
                }
              },
              {
                ...vaultsTokenAlsoInZapper,
                priceUsdc: "2",
                supported: {
                  zapper: true
                }
              }
            ]);
            assetReadyThenMock.mockResolvedValue({ "0x001": "zapper-iron-bank.svg", "0x002": "zapper-vaults.svg" });

            const actualSupportedTokens = await tokenInterface.supported();

            expect(actualSupportedTokens.length).toEqual(5);
            expect(actualSupportedTokens).toEqual(
              expect.arrayContaining([
                {
                  ...ironBankTokenAlsoInZapper,
                  supported: {
                    zapper: true
                  }
                },
                vaultsTokenNotInZapper,
                {
                  ...vaultsTokenAlsoInZapper,
                  supported: {
                    zapper: true
                  }
                },
                ironBankTokenNotInZapper,
                vaultsTokenInIronBank
              ])
            );
            expect(zapperSupportedTokensMock).toHaveBeenCalledTimes(1);
            expect(vaultsTokensMock).toHaveBeenCalledTimes(1);
            expect(ironBankTokensMock).toHaveBeenCalledTimes(1);
            expect(assetReadyThenMock).toHaveBeenCalledTimes(1);
          });

          it("should return internal tokens when zapper fails", async () => {
            zapperSupportedTokensMock.mockImplementation(() => {
              throw new Error("zapper balances failed!");
            });

            const actualSupportedTokens = await tokenInterface.supported();

            expect(actualSupportedTokens.length).toEqual(2);
            expect(actualSupportedTokens).toEqual([vaultsToken, ironBankToken]);
            expect(zapperSupportedTokensMock).toHaveBeenCalledTimes(1);
            expect(vaultsTokensMock).toHaveBeenCalledTimes(1);
            expect(ironBankTokensMock).toHaveBeenCalledTimes(1);
            expect(assetReadyThenMock).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
          });
        })
      );

      ([250, 42161] as ChainId[]).forEach(chainId =>
        describe(`when chainId is ${chainId}`, () => {
          let ironBankToken: Token;
          let vaultsToken: Token;

          beforeEach(() => {
            tokenInterface = new TokenInterface(mockedYearn, chainId, new Context({}));
            ironBankToken = createMockToken({ address: "0x001", symbol: "IRON", name: "Iron Token" });
            vaultsToken = createMockToken({
              address: "0x002",
              symbol: "VAULT",
              name: "Vault Token"
            });
            vaultsTokensMock.mockResolvedValue([vaultsToken]);
            ironBankTokensMock.mockResolvedValue([ironBankToken]);
          });

          it("should fetch all the tokens only from Vaults and Iron Bank (not Zapper)", async () => {
            const actualSupportedTokens = await tokenInterface.supported();

            expect(actualSupportedTokens.length).toEqual(2);
            expect(actualSupportedTokens).toEqual(expect.arrayContaining([vaultsToken, ironBankToken]));
            expect(zapperSupportedTokensMock).not.toHaveBeenCalled();
            expect(assetReadyThenMock).not.toHaveBeenCalled();
            expect(vaultsTokensMock).toHaveBeenCalledTimes(1);
            expect(ironBankTokensMock).toHaveBeenCalledTimes(1);
          });

          it("should return vaults token instead of iron bank tokens in case of duplicates", async () => {
            const ironBankToken = createMockToken({
              address: "0x001",
              symbol: "IRON",
              name: "Iron Token",
              icon: "iron-bank.svg",
              priceUsdc: "10"
            });
            const vaultsToken = createMockToken({
              address: "0x002",
              symbol: "VAULT",
              name: "Vault Token",
              icon: "vaults.svg",
              priceUsdc: "20"
            });
            const ironBankTokenInVaults = createMockToken({
              address: "0x003",
              symbol: "IRON3",
              name: "Iron Token in Vaults",
              icon: "iron-bank-3.svg",
              priceUsdc: "13"
            });
            const vaultsTokenInIronBank = createMockToken({
              address: "0x003",
              symbol: "VAULT3",
              name: "Vault Token in Iron Bank",
              icon: "vaults-3.svg",
              priceUsdc: "23"
            });

            ironBankTokensMock.mockResolvedValue([ironBankToken, ironBankTokenInVaults]);
            vaultsTokensMock.mockResolvedValue([vaultsToken, vaultsTokenInIronBank]);

            const actualSupportedTokens = await tokenInterface.supported();

            expect(actualSupportedTokens.length).toEqual(3);
            expect(actualSupportedTokens).toEqual(
              expect.arrayContaining([ironBankToken, vaultsToken, vaultsTokenInIronBank])
            );
            expect(zapperSupportedTokensMock).not.toHaveBeenCalled();
            expect(assetReadyThenMock).not.toHaveBeenCalled();
            expect(vaultsTokensMock).toHaveBeenCalledTimes(1);
            expect(ironBankTokensMock).toHaveBeenCalledTimes(1);
          });
        })
      );

      (([42] as unknown) as ChainId[]).forEach(chainId =>
        it(`should return an empty array when chainId is ${chainId}`, async () => {
          tokenInterface = new TokenInterface(mockedYearn, chainId, new Context({}));

          const actualSupportedTokens = await tokenInterface.supported();

          expect(actualSupportedTokens).toEqual([]);
          expect(zapperSupportedTokensMock).not.toHaveBeenCalled();
          expect(assetReadyThenMock).not.toHaveBeenCalled();
        })
      );
    });
  });

  describe("approve", () => {
    describe("when the vault token is the same as the token", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = createMockAssetStaticVaultV2();
        token = createMockToken().address;
        sendTransactionMock.mockResolvedValue(true);
      });

      it("should approve vault to spend a token on a direct deposit", async () => {
        const actualApprove = await tokenInterface.approve(vault, token, "1", "0x001");

        expect(actualApprove).toEqual(true);

        expect(Contract).toHaveBeenCalledTimes(1);
        expect(Contract).toHaveBeenCalledWith("0x001", ["function approve(address _spender, uint256 _value) public"], {
          sendTransaction: expect.any(Function)
        });
      });
    });

    describe("when Ether is beind sent", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = createMockAssetStaticVaultV2();
        token = EthAddress;
      });

      it("should return true", async () => {
        const actualApprove = await tokenInterface.approve(vault, token, "1", "0x001");

        expect(actualApprove).toEqual(true);
      });
    });

    describe("zapInApprovalState", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = createMockAssetStaticVaultV2();
        token = createMockToken({ address: "0x999" }).address;
        zapperGasMock.mockResolvedValue({
          standard: 1,
          instant: 2,
          fast: 3
        });
      });

      describe("when is not approved", () => {
        beforeEach(() => {
          zapperZapInApprovalStateMock.mockResolvedValue({
            isApproved: false
          });
          zapperZapInApprovalTransactionMock.mockResolvedValue({
            data: "data",
            to: "0x000",
            from: "0x001",
            gasPrice: "1"
          });
        });

        it("should approve vault to spend a token on zapIn", async () => {
          const actualApprove = await tokenInterface.approve(vault, token, "1", "0x001");

          expect(actualApprove).toEqual("transaction");
          expect(zapperZapInApprovalTransactionMock).toHaveBeenCalledTimes(1);
          expect(zapperZapInApprovalTransactionMock).toHaveBeenCalledWith("0x001", "0x999", "3000000000", "yearn");
        });
      });

      describe("when is approved", () => {
        beforeEach(() => {
          zapperZapInApprovalStateMock.mockResolvedValue({
            isApproved: true
          });
        });

        it("should return true", async () => {
          const actualApprove = await tokenInterface.approve(vault, token, "1", "0x001");

          expect(actualApprove).toEqual(true);
        });
      });
    });
  });

  describe("approveZapOut", () => {
    describe("when the vault token is not the same as the token", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = createMockAssetStaticVaultV2();
        token = createMockToken({ address: "0x999" }).address;
      });

      it("should return false", async () => {
        const actualApproveZapOut = await tokenInterface.approveZapOut(vault, token, "0x001");

        expect(actualApproveZapOut).toEqual(false);
      });
    });

    describe("zapInApprovalState", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = createMockAssetStaticVaultV2();
        token = createMockToken().address;
        zapperGasMock.mockResolvedValue({
          standard: 1,
          instant: 2,
          fast: 3
        });
      });

      describe("when is not approved", () => {
        beforeEach(() => {
          zapperZapOutApprovalStateMock.mockResolvedValue({
            isApproved: false
          });
          zapperZapOutApprovalTransactionMock.mockResolvedValue({
            data: "data",
            to: "0x000",
            from: "0x001",
            gasPrice: "1"
          });
        });

        it("should approve vault to spend a vault token on zapOut", async () => {
          const actualApproveZapOut = await tokenInterface.approveZapOut(vault, token, "0x001");

          expect(actualApproveZapOut).toEqual("transaction");
          expect(zapperZapOutApprovalStateMock).toHaveBeenCalledTimes(1);
          expect(zapperZapOutApprovalStateMock).toHaveBeenCalledWith("0x001", "0x001");
          expect(zapperZapOutApprovalTransactionMock).toHaveBeenCalledTimes(1);
          expect(zapperZapOutApprovalTransactionMock).toHaveBeenCalledWith("0x001", "0x001", "3000000000");
        });
      });

      describe("when is approved", () => {
        beforeEach(() => {
          zapperZapOutApprovalStateMock.mockResolvedValue({
            isApproved: true
          });
        });

        it("should return false", async () => {
          const actualApproveZapOut = await tokenInterface.approveZapOut(vault, token, "0x001");

          expect(actualApproveZapOut).toEqual(false);
        });
      });
    });
  });

  describe("icon", () => {
    it("should call AssetService#icon with the address", () => {
      tokenInterface.icon("0x001");

      expect(assetIconMock).toHaveBeenCalledTimes(1);
      expect(assetIconMock).toHaveBeenCalledWith("0x001");
    });

    it("sshould call AssetService#icon with a list of the address", () => {
      tokenInterface.icon(["0x001", "0x002"]);

      expect(assetIconMock).toHaveBeenCalledTimes(1);
      expect(assetIconMock).toHaveBeenCalledWith(["0x001", "0x002"]);
    });
  });

  describe("metadata", () => {
    const tokenMetadataFromMetaService: TokenMetadata[] = [
      {
        address: "tokenMetadataAddressFromMetaService",
        description: "foo"
      },
      {
        address: "0x001",
        description: "bar"
      }
    ];

    beforeEach(() => {
      metaTokensMock.mockResolvedValue(tokenMetadataFromMetaService);
    });

    describe("when the token medatada is cached", () => {
      let tokenMetadata: TokenMetadata[];

      beforeEach(() => {
        tokenMetadata = [
          {
            address: "tokenMetadataAddress",
            description: "foo"
          },
          {
            address: "0x002",
            description: "bar"
          }
        ];
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue(tokenMetadata);
      });

      describe("when there are addresses", () => {
        it("should return the token metadata that include those addresses", async () => {
          const actualMetadata = await tokenInterface.metadata(["0x002"]);

          expect(actualMetadata).toEqual([
            {
              address: "0x002",
              description: "bar"
            }
          ]);
        });
      });

      describe("when there are no addresses", () => {
        it("should return the cached result", async () => {
          const actualMetadata = await tokenInterface.metadata();

          expect(actualMetadata).toEqual(tokenMetadata);
        });
      });
    });

    describe("when the token medatada is not cached", () => {
      beforeEach(() => {
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue(undefined);
        metaTokensMock.mockResolvedValue(tokenMetadataFromMetaService);
      });

      describe("when there are addresses", () => {
        it("should return the token metadata that include those addresses", async () => {
          const actualMetadata = await tokenInterface.metadata(["0x001"]);

          expect(actualMetadata).toEqual([
            {
              address: "0x001",
              description: "bar"
            }
          ]);
        });
      });

      describe("when there are no addresses", () => {
        it("should return the tokens from the meta service", async () => {
          const actualMetadata = await tokenInterface.metadata();

          expect(actualMetadata).toEqual(tokenMetadataFromMetaService);
        });
      });
    });
  });
});
