/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";

import {
  Address,
  AssetDynamic,
  ChainId,
  Context,
  ERC20,
  IconMap,
  Integer,
  Position,
  SdkError,
  Token,
  TokenAllowance,
  TokenMetadata,
  Usdc,
  VaultInterface,
  Yearn,
  ZapProtocol,
} from "..";
import { EthAddress, WethAddress } from "../helpers";
import { PartnerService } from "../services/partner";
import {
  createMockAssetDynamicVaultV2,
  createMockAssetStaticVaultV2,
  createMockEarningsUserData,
  createMockToken,
  createMockTokenBalance,
  createMockTokenMarketData,
  createMockVaultMetadata,
} from "../test-utils/factories";

const earningsAccountAssetsDataMock = jest.fn();
const tokensMetadataMock: jest.Mock<Promise<TokenMetadata[]>> = jest.fn();
const tokenAllowanceMock: jest.Mock<Promise<TokenAllowance>> = jest.fn();
const tokenApproveMock: jest.Mock<Promise<TransactionResponse>> = jest.fn();
const zapperZapOutMock = jest.fn();
const zapperZapInMock = jest.fn().mockResolvedValue({
  to: "to",
  from: "from",
  data: "data",
  value: "100",
  gas: "100",
  gasPrice: "100",
});
const tokenMarketDataMock = jest.fn();
const helperTokenBalancesMock = jest.fn();
const helperTokensMock: jest.Mock<Promise<ERC20[]>> = jest.fn();
const lensAdaptersVaultsV2PositionsOfMock = jest.fn();
const lensAdaptersVaultsV2AssetsStaticMock = jest.fn();
const lensAdaptersVaultsV2AssetsDynamicMock = jest.fn();
const lensAdaptersVaultsV2TokensMock = jest.fn();
const sendTransactionMock = jest.fn();
const cachedFetcherFetchMock = jest.fn();
const assetReadyMock = jest.fn();
const assetIconMock: jest.Mock<IconMap<Address>> = jest.fn();
const assetAliasMock = jest.fn();
const oracleGetPriceUsdcMock: jest.Mock<Promise<Usdc>> = jest.fn();
const metaVaultsMock = jest.fn();
const visionApyMock = jest.fn();
const vaultsStrategiesMetadataMock = jest.fn();
const assetsHistoricEarningsMock = jest.fn();
const sendTransactionUsingServiceMock = jest.fn();
const partnerPopulateDepositTransactionMock = jest.fn();
const partnerIsAllowedMock = jest.fn().mockReturnValue(true);

jest.mock("../services/partner", () => ({
  PartnerService: jest.fn().mockImplementation(() => ({
    populateDepositTransaction: partnerPopulateDepositTransactionMock,
    isAllowed: partnerIsAllowedMock,
    partnerId: "0x000partner",
  })),
}));

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      meta: {
        vaults: metaVaultsMock,
      },
      lens: {
        adapters: {
          vaults: {
            v2: {
              positionsOf: lensAdaptersVaultsV2PositionsOfMock,
              assetsStatic: lensAdaptersVaultsV2AssetsStaticMock,
              assetsDynamic: lensAdaptersVaultsV2AssetsDynamicMock,
              tokens: lensAdaptersVaultsV2TokensMock,
            },
          },
        },
      },
      vision: {
        apy: visionApyMock,
      },
      asset: {
        ready: assetReadyMock,
        icon: assetIconMock,
        alias: assetAliasMock,
      },
      helper: {
        tokenBalances: helperTokenBalancesMock,
        tokens: helperTokensMock,
      },
      oracle: {
        getPriceUsdc: oracleGetPriceUsdcMock,
      },
      zapper: {
        zapOut: zapperZapOutMock,
        zapIn: zapperZapInMock,
        tokenMarketData: tokenMarketDataMock,
      },
      transaction: {
        sendTransaction: sendTransactionUsingServiceMock,
      },
    },
    strategies: {
      vaultsStrategiesMetadata: vaultsStrategiesMetadataMock,
    },
    earnings: {
      accountAssetsData: earningsAccountAssetsDataMock,
      assetsHistoricEarnings: assetsHistoricEarningsMock,
    },
    tokens: {
      metadata: tokensMetadataMock,
      allowance: tokenAllowanceMock,
      approve: tokenApproveMock,
    },
  })),
}));

jest.mock("../cache", () => ({
  CachedFetcher: jest.fn().mockImplementation(() => ({
    fetch: cachedFetcherFetchMock,
  })),
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: {
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: sendTransactionMock,
        })),
      },
    },
  })),
}));

const PickleJarsMock = jest.requireMock("../services/partners/pickle");
jest.mock("../services/partners/pickle", () => ({
  PickleJars: [],
}));

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn(),
}));

describe("VaultInterface", () => {
  const accountAddress: Address = "0xAccount";
  const vaultAddress: Address = "0xVault";
  const tokenAddress: Address = "0xToken";
  const spenderAddress: Address = "0xSpender";
  let vaultInterface: VaultInterface<1>;
  let mockedYearn: Yearn<ChainId>;

  beforeEach(() => {
    mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
    vaultInterface = new VaultInterface(mockedYearn, 1, new Context({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    describe("when the fetcher tokens are cached", () => {
      let cachedToken: Token;
      let randomCachedToken: Token;

      beforeEach(() => {
        cachedToken = createMockToken({ address: "0xCachedToken" });
        randomCachedToken = createMockToken({ address: "0xCachedRandom" });
        cachedFetcherFetchMock.mockResolvedValue([cachedToken, randomCachedToken]);
      });

      describe("when the addresses filter is given", () => {
        it("should get all cached tokens in the addresses array filter", async () => {
          const actualGet = await vaultInterface.get([cachedToken.address]);

          expect(actualGet).toEqual([cachedToken]);
        });
      });

      describe("when the addresses filter is not given", () => {
        it("should get all cached tokens", async () => {
          const actualGet = await vaultInterface.get();

          expect(actualGet).toEqual([cachedToken, randomCachedToken]);
        });
      });
    });

    describe("when the fetcher tokens are not cached", () => {
      let getStaticMock: jest.Mock;
      let vaultDynamic: AssetDynamic<"VAULT_V2">;

      beforeEach(() => {
        cachedFetcherFetchMock.mockResolvedValue(undefined);
        metaVaultsMock.mockResolvedValue([]);
        const vaultStatic = createMockAssetStaticVaultV2();
        getStaticMock = jest.fn().mockResolvedValue([vaultStatic]);
        (vaultInterface as any).getStatic = getStaticMock;
        vaultDynamic = createMockAssetDynamicVaultV2();
        const getDynamicMock = jest.fn().mockResolvedValue([vaultDynamic]);
        (vaultInterface as any).getDynamic = getDynamicMock;
        vaultsStrategiesMetadataMock.mockResolvedValue([
          {
            vaultAddress: "0x001",
            strategiesMetadata: {
              name: "strategiesMetadataName",
              description: "strategiesMetadataDescription",
              address: "strategiesMetadataAddress",
              protocols: ["strategiesMetadata"],
            },
          },
        ]);
        assetsHistoricEarningsMock.mockResolvedValue([
          {
            assetAddress: "0x001",
            decimals: 18,
            dayData: [
              {
                earnings: { amount: "1", amountUsdc: "1" },
                date: "12-02-2022",
              },
            ],
          },
        ]);
      });

      it("should get all yearn vaults", async () => {
        const actualGet = await vaultInterface.get();

        expect(actualGet).toEqual([
          {
            ...vaultDynamic,
            decimals: "18",
            name: "ASSET",
            symbol: "ASS",
            token: "0x001",
            version: "1",
            metadata: {
              ...vaultDynamic.metadata,
              historicEarnings: [
                {
                  date: "12-02-2022",
                  earnings: {
                    amount: "1",
                    amountUsdc: "1",
                  },
                },
              ],
              strategies: {
                strategiesMetadata: {
                  address: "strategiesMetadataAddress",
                  description: "strategiesMetadataDescription",
                  name: "strategiesMetadataName",
                  protocols: ["strategiesMetadata"],
                },
                vaultAddress: "0x001",
              },
            },
          },
        ]);
        expect(metaVaultsMock).toHaveBeenCalledTimes(1);
        expect(getStaticMock).toHaveBeenCalledTimes(1);
        expect(getStaticMock).toHaveBeenCalledWith(undefined, undefined);
      });

      describe("when dynamic asset does not exist for asset address", () => {
        beforeEach(() => {
          const vaultDynamic = createMockAssetDynamicVaultV2({ address: "0xNonExistant" });
          (vaultInterface as any).getDynamic = jest.fn().mockResolvedValue([vaultDynamic]);
        });

        it("should throw", async () => {
          const balance = createMockTokenBalance({ address: "0x001" });
          helperTokenBalancesMock.mockResolvedValue([balance]);

          try {
            await vaultInterface.get();
          } catch (error) {
            expect(error).toStrictEqual(new SdkError("Dynamic asset does not exist for 0x001"));
          }
        });
      });
    });
  });

  describe("getStatic", () => {
    it("should get static part of yearn vaults", async () => {
      const position = {
        assetAddress: "0xPositionAssetAddress",
        tokenAddress: "0xPositionTokenAddress",
        typeId: "positionTypeId",
        balance: "1",
        underlyingTokenBalance: {
          amount: "1",
          amountUsdc: "1",
        },
        assetAllowances: [
          {
            owner: "0xAssetAllowancesOwner",
            spender: "0xAssetAllowancesSpender",
            amount: "2",
          },
        ],
        tokenAllowances: [
          {
            owner: "0xTokenAllowancesOwner",
            spender: "0xTokenAllowancesSpender",
            amount: "3",
          },
        ],
      };
      lensAdaptersVaultsV2AssetsStaticMock.mockResolvedValue([position]);

      const actualGetStatic = await vaultInterface.getStatic(["0x001"]);

      expect(actualGetStatic).toEqual([position]);
      expect(lensAdaptersVaultsV2AssetsStaticMock).toHaveBeenCalledTimes(1);
      expect(lensAdaptersVaultsV2AssetsStaticMock).toHaveBeenCalledWith(["0x001"], undefined);
    });
  });

  describe("getDynamic", () => {
    describe("when the fetcher tokens are cached", () => {
      let cachedToken: Token;
      let randomCachedToken: Token;

      beforeEach(() => {
        cachedToken = createMockToken({ address: "0xCachedToken" });
        randomCachedToken = createMockToken({ address: "0xCachedRandom" });
        cachedFetcherFetchMock.mockResolvedValue([cachedToken, randomCachedToken]);
      });

      describe("when the addresses filter is given", () => {
        it("should get all cached tokens in the addresses array filter", async () => {
          const actualGetDynamic = await vaultInterface.getDynamic([cachedToken.address]);

          expect(actualGetDynamic).toEqual([cachedToken]);
        });
      });

      describe("when the addresses filter is not given", () => {
        it("should get all cached tokens", async () => {
          const actualGetDynamic = await vaultInterface.getDynamic();

          expect(actualGetDynamic).toEqual([cachedToken, randomCachedToken]);
        });
      });
    });

    describe("when the fetcher tokens are not cached", () => {
      beforeEach(() => {
        cachedFetcherFetchMock.mockResolvedValue(undefined);
        metaVaultsMock.mockResolvedValue([createMockVaultMetadata({ address: "0x001" })]);
        tokenMarketDataMock.mockResolvedValue([]);
      });

      describe("vaultMetadataOverrides", () => {
        beforeEach(() => {
          (vaultInterface as any).yearn.services.lens.adapters.vaults = [];
        });

        describe("when is provided", () => {
          it("should not call meta vaults", async () => {
            await vaultInterface.getDynamic(
              [],
              [{ address: "0xVaultMetadataOverrides", comment: "", hideAlways: false }]
            );

            expect(metaVaultsMock).not.toHaveBeenCalled();
          });
        });

        fdescribe("when is not provided", () => {
          it("should get the vault's metadata", async () => {
            await vaultInterface.getDynamic([]);

            expect(metaVaultsMock).toHaveBeenCalledTimes(1);
            expect(tokenMarketDataMock).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe("when tokenId is WethAddress", () => {
        let assetsDynamic: AssetDynamic<"VAULT_V2">;

        beforeEach(() => {
          assetsDynamic = createMockAssetDynamicVaultV2({
            tokenId: WethAddress,
          });
          lensAdaptersVaultsV2AssetsDynamicMock.mockResolvedValue([assetsDynamic]);
          visionApyMock.mockResolvedValue([]);
          assetIconMock.mockReturnValue({ [EthAddress]: "eth.png" });
        });

        it("should set the ETH metadata", async () => {
          const actualGetDynamic = await vaultInterface.getDynamic();

          expect(actualGetDynamic).toEqual([
            {
              ...assetsDynamic,
              metadata: {
                ...assetsDynamic.metadata,
                displayIcon: {
                  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "eth.png",
                },
              },
            },
          ]);
          expect(lensAdaptersVaultsV2AssetsDynamicMock).toHaveBeenCalledTimes(1);
          expect(lensAdaptersVaultsV2AssetsDynamicMock).toHaveBeenCalledWith(undefined, undefined);
          expect(assetIconMock).toHaveBeenCalledTimes(1);
          expect(assetIconMock).not.toHaveBeenCalledWith(WethAddress);
          expect(assetIconMock).toHaveBeenCalledWith(EthAddress);
        });
      });

      describe("when tokenId is not WethAddress", () => {
        let assetsDynamic: AssetDynamic<"VAULT_V2">;

        beforeEach(() => {
          assetsDynamic = createMockAssetDynamicVaultV2();
          lensAdaptersVaultsV2AssetsDynamicMock.mockResolvedValue([assetsDynamic]);
          visionApyMock.mockResolvedValue([]);
          assetIconMock.mockReturnValue({ "0x001": "0x001.png" });
          assetAliasMock.mockReturnValueOnce({
            name: "aliasTokenName",
            symbol: "ALIAS_TOKEN_SYMBOL",
            address: "0x001",
          });
        });

        it("should get dynamic part of yearn vaults", async () => {
          const actualGetDynamic = await vaultInterface.getDynamic();

          expect(actualGetDynamic).toEqual([
            {
              ...assetsDynamic,
              metadata: {
                ...assetsDynamic.metadata,
                displayIcon: {
                  "0x001": "0x001.png",
                },
                displayName: "Vault Metadata",
                defaultDisplayToken: assetsDynamic.tokenId,
              },
            },
          ]);
          expect(lensAdaptersVaultsV2AssetsDynamicMock).toHaveBeenCalledTimes(1);
          expect(lensAdaptersVaultsV2AssetsDynamicMock).toHaveBeenCalledWith(undefined, undefined);
          expect(assetIconMock).toHaveBeenCalledTimes(1);
          expect(assetIconMock).toHaveBeenCalledWith("0x001Dynamic");
          expect(assetAliasMock).toHaveBeenCalledTimes(1);
          expect(assetAliasMock).toHaveBeenCalledWith("0x001Dynamic");
        });
      });
    });
  });

  describe("positionsOf", () => {
    let position: Position;

    beforeEach(() => {
      const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: EthAddress });
      vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);
      position = {
        assetAddress: "0xPositionAssetAddress",
        tokenAddress: "0xPositionTokenAddress",
        typeId: "positionTypeId",
        balance: "1",
        underlyingTokenBalance: {
          amount: "1",
          amountUsdc: "1",
        },
        assetAllowances: [
          {
            owner: "0xAssetAllowancesOwner",
            spender: "0xAssetAllowancesSpender",
            amount: "2",
          },
        ],
        tokenAllowances: [
          {
            owner: "0xTokenAllowancesOwner",
            spender: "0xTokenAllowancesSpender",
            amount: "3",
          },
        ],
      };
      lensAdaptersVaultsV2PositionsOfMock.mockResolvedValue([position]);
    });

    it("should get yearn vault positions for a particular address", async () => {
      const actualPositionsOf = await vaultInterface.positionsOf("0x001");

      expect(actualPositionsOf).toEqual([position]);
      expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledTimes(1);
      expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledWith("0x001", undefined, undefined);
    });

    describe("when positionsOf throws", () => {
      describe("when the addresses filter was provided", () => {
        it("should return all positions and not get the static vaults", async () => {
          lensAdaptersVaultsV2PositionsOfMock.mockRejectedValueOnce(new Error("positionsOf error"));
          lensAdaptersVaultsV2PositionsOfMock.mockResolvedValue([position]);

          const actualPositionsOf = await vaultInterface.positionsOf("0x001", ["0x001"]);

          expect(actualPositionsOf).toEqual([position]);
          expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledTimes(2);
          expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledWith("0x001", ["0x001"], undefined);
          expect(vaultInterface.getStatic).not.toHaveBeenCalled();
        });
      });

      describe("when the addresses filter was not provided", () => {
        it("should return all positions and get the static vaults", async () => {
          lensAdaptersVaultsV2PositionsOfMock.mockRejectedValueOnce(new Error("positionsOf error"));
          lensAdaptersVaultsV2PositionsOfMock.mockResolvedValue([position]);

          const actualPositionsOf = await vaultInterface.positionsOf("0x001");

          expect(actualPositionsOf).toEqual([position]);
          expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledTimes(2);
          expect(lensAdaptersVaultsV2PositionsOfMock).toHaveBeenCalledWith("0x001", ["0x001"], undefined);
          expect(vaultInterface.getStatic).toHaveBeenCalledTimes(1);
          expect(vaultInterface.getStatic).toHaveBeenCalledWith(undefined, undefined);
        });
      });
    });
  });

  describe("summaryOf", () => {
    it("should get the Vaults User Summary for a particular address", async () => {
      const earningsUserData = createMockEarningsUserData();
      earningsAccountAssetsDataMock.mockResolvedValueOnce(earningsUserData);

      const actualSummaryOf = await vaultInterface.summaryOf("0x001");

      expect(actualSummaryOf).toEqual({ earnings: "1", estimatedYearlyYield: "1", grossApy: 1, holdings: "1" });
      expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
      expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
    });
  });

  describe("metadataOf", () => {
    beforeEach(() => {
      const earningsUserData = createMockEarningsUserData();
      earningsAccountAssetsDataMock.mockResolvedValueOnce(earningsUserData);
    });

    describe("when an addresses array is not given", () => {
      it("should get the Vault User Metadata for a particular address", async () => {
        const actualMetadataOf = await vaultInterface.metadataOf("0x001");

        expect(actualMetadataOf).toEqual([{ assetAddress: "0x001", earned: "1" }]);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
      });
    });

    describe("when an addresses array is given", () => {
      it("should get the Vault User Metadata when it is passed a specific address", async () => {
        const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x001", "0x002"]);

        expect(actualMetadataOf).toEqual([{ assetAddress: "0x001", earned: "1" }]);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
      });

      it("should return an empty array when it is not passed a specific address", async () => {
        const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x002"]);

        expect(actualMetadataOf).toEqual([]);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
      });

      it("should return an empty array when the addresses array is empty", async () => {
        const actualMetadataOf = await vaultInterface.metadataOf("0x001", []);

        expect(actualMetadataOf).toEqual([]);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
        expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
      });
    });
  });

  describe("balances", () => {
    describe("when token exists for balance", () => {
      it("should get all yearn vault's underlying token balances for a particular address", async () => {
        const existingToken = createMockToken();
        const existingToken2 = createMockToken({ address: "0xExisting" });
        const randomToken = createMockToken({ address: "0xRandom" });
        vaultInterface.tokens = jest.fn().mockResolvedValue([existingToken, existingToken2, randomToken]);

        const existingBalance = createMockTokenBalance();
        const existingBalance2 = createMockTokenBalance({ address: "0xExisting" });
        helperTokenBalancesMock.mockResolvedValue([existingBalance, existingBalance2]);

        const actualBalances = await vaultInterface.balances("0x001");

        expect(actualBalances).toEqual([
          { ...existingBalance, token: existingToken },
          { ...existingBalance2, token: existingToken2 },
        ]);
        expect(helperTokenBalancesMock).toHaveBeenCalledTimes(1);
        expect(helperTokenBalancesMock).toHaveBeenCalledWith("0x001", ["0x001", "0xExisting", "0xRandom"], undefined);
      });
    });

    describe("when token does not exist for balance", () => {
      it("should throw", async () => {
        const token = createMockToken({ address: "foo" });
        vaultInterface.tokens = jest.fn().mockResolvedValue([token]);

        const balance = createMockTokenBalance({ address: "0x001" });
        helperTokenBalancesMock.mockResolvedValue([balance]);

        try {
          await vaultInterface.balances("0x001");
        } catch (error) {
          expect(error).toStrictEqual(new SdkError("Token does not exist for Balance(0x001)"));
        }
      });
    });
  });

  describe("tokens", () => {
    describe("when the fetcher tokens are cached", () => {
      it("should get all cached tokens", async () => {
        const cachedToken = createMockToken({ address: "0xCachedToken" });
        cachedFetcherFetchMock.mockResolvedValue([cachedToken]);

        const actualTokens = await vaultInterface.tokens();

        expect(actualTokens).toEqual([cachedToken]);
      });
    });

    describe("when the fetcher tokens are not cached", () => {
      it("should get all yearn vault's underlying tokens", async () => {
        const tokenMock = createMockToken();
        cachedFetcherFetchMock.mockResolvedValue(undefined);
        lensAdaptersVaultsV2TokensMock.mockResolvedValue([tokenMock.address]);
        assetIconMock.mockReturnValue({
          [tokenMock.address]: "token-mock-icon.png",
        });
        helperTokensMock.mockReturnValue(Promise.resolve<Token[]>([tokenMock]));
        tokensMetadataMock.mockReturnValue(
          Promise.resolve<TokenMetadata[]>([
            { ...tokenMock, description: "Token mock metadata", website: "foo.bar", localization: {} },
          ])
        );
        oracleGetPriceUsdcMock.mockResolvedValue("1");
        const fillTokenMetadataOverridesMock = jest.fn();
        (vaultInterface as any).fillTokenMetadataOverrides = fillTokenMetadataOverridesMock;

        const actualTokens = await vaultInterface.tokens();

        expect(actualTokens).toEqual([
          {
            ...tokenMock,
            icon: "token-mock-icon.png",
            symbol: "ALIAS_TOKEN_SYMBOL",
            metadata: {
              address: "0x001",
              decimals: "18",
              description: "Token mock metadata",
              localization: {},
              symbol: "DEAD",
              name: "Dead Token",
              priceUsdc: "0",
              dataSource: "vaults",
              website: "foo.bar",
              supported: {},
            },
            name: "Dead Token",
            priceUsdc: "1",
            dataSource: "vaults",
            supported: {
              vaults: true,
            },
          },
        ]);
        expect(lensAdaptersVaultsV2TokensMock).toHaveBeenCalledTimes(1);
        expect(lensAdaptersVaultsV2TokensMock).toHaveBeenCalledWith(undefined); // no overrides
        expect(assetIconMock).toHaveBeenCalledTimes(1);
        expect(assetIconMock).toHaveBeenCalledWith(["0x001", EthAddress]);
        expect(helperTokensMock).toHaveBeenCalledTimes(1);
        expect(helperTokensMock).toHaveBeenCalledWith(["0x001"], undefined);
        expect(tokensMetadataMock).toHaveBeenCalledTimes(1);
        expect(tokensMetadataMock).toHaveBeenCalledWith(["0x001"]);
        expect(assetAliasMock).toHaveBeenCalledTimes(1);
        expect(assetAliasMock).toHaveBeenCalledWith("0x001");
        expect(fillTokenMetadataOverridesMock).toHaveBeenCalledTimes(1);
        expect(fillTokenMetadataOverridesMock).toHaveBeenCalledWith(actualTokens[0], actualTokens[0].metadata);
      });
    });
  });

  describe("getDepositAllowance", () => {
    it("should fetch token deposit allowance", async () => {
      const getDepositContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
      (vaultInterface as any).getDepositContractAddress = getDepositContractAddressMock;

      await vaultInterface.getDepositAllowance(accountAddress, vaultAddress, tokenAddress);

      expect(getDepositContractAddressMock).toHaveBeenCalledTimes(1);
      expect(getDepositContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
      expect(tokenAllowanceMock).toHaveBeenCalledTimes(1);
      expect(tokenAllowanceMock).toHaveBeenCalledWith(accountAddress, tokenAddress, spenderAddress);
    });
  });

  describe("getWithdrawAllowance", () => {
    it("should fetch token withdraw allowance", async () => {
      const getWithdrawContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
      (vaultInterface as any).getWithdrawContractAddress = getWithdrawContractAddressMock;

      await vaultInterface.getWithdrawAllowance(accountAddress, vaultAddress, tokenAddress);

      expect(getWithdrawContractAddressMock).toHaveBeenCalledTimes(1);
      expect(getWithdrawContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
      expect(tokenAllowanceMock).toHaveBeenCalledTimes(1);
      expect(tokenAllowanceMock).toHaveBeenCalledWith(accountAddress, vaultAddress, spenderAddress);
    });
  });

  describe("approveDeposit", () => {
    describe("when no amount provided", () => {
      it("should infinite approve", async () => {
        const getDepositContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
        (vaultInterface as any).getDepositContractAddress = getDepositContractAddressMock;

        await vaultInterface.approveDeposit(accountAddress, vaultAddress, tokenAddress);

        expect(getDepositContractAddressMock).toHaveBeenCalledTimes(1);
        expect(getDepositContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
        expect(tokenApproveMock).toHaveBeenCalledTimes(1);
        expect(tokenApproveMock).toHaveBeenCalledWith(
          accountAddress,
          tokenAddress,
          spenderAddress,
          MaxUint256.toString(),
          undefined
        );
      });
    });

    describe("when amount provided", () => {
      it("should approve exact amount", async () => {
        const amount: Integer = "1000000";
        const getDepositContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
        (vaultInterface as any).getDepositContractAddress = getDepositContractAddressMock;

        await vaultInterface.approveDeposit(accountAddress, vaultAddress, tokenAddress, amount);

        expect(getDepositContractAddressMock).toHaveBeenCalledTimes(1);
        expect(getDepositContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
        expect(tokenApproveMock).toHaveBeenCalledTimes(1);
        expect(tokenApproveMock).toHaveBeenCalledWith(accountAddress, tokenAddress, spenderAddress, amount, undefined);
      });
    });
  });

  describe("withdrawDeposit", () => {
    describe("when no amount provided", () => {
      it("should infinite approve", async () => {
        const getWithdrawContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
        (vaultInterface as any).getWithdrawContractAddress = getWithdrawContractAddressMock;

        await vaultInterface.approveWithdraw(accountAddress, vaultAddress, tokenAddress);

        expect(getWithdrawContractAddressMock).toHaveBeenCalledTimes(1);
        expect(getWithdrawContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
        expect(tokenApproveMock).toHaveBeenCalledTimes(1);
        expect(tokenApproveMock).toHaveBeenCalledWith(
          accountAddress,
          vaultAddress,
          spenderAddress,
          MaxUint256.toString(),
          undefined
        );
      });
    });

    describe("when amount provided", () => {
      it("should approve exact amount", async () => {
        const amount: Integer = "1000000";
        const getWithdrawContractAddressMock = jest.fn().mockResolvedValue(spenderAddress);
        (vaultInterface as any).getWithdrawContractAddress = getWithdrawContractAddressMock;

        await vaultInterface.approveWithdraw(accountAddress, vaultAddress, tokenAddress, amount);

        expect(getWithdrawContractAddressMock).toHaveBeenCalledTimes(1);
        expect(getWithdrawContractAddressMock).toHaveBeenCalledWith(vaultAddress, tokenAddress);
        expect(tokenApproveMock).toHaveBeenCalledTimes(1);
        expect(tokenApproveMock).toHaveBeenCalledWith(accountAddress, vaultAddress, spenderAddress, amount, undefined);
      });
    });
  });

  describe("deposit", () => {
    describe("when is zapping into pickle jar", () => {
      beforeEach(() => {
        PickleJarsMock.PickleJars = ["0xVault"];
      });

      it("should call zapIn with correct arguments and pickle as the zapProtocol", async () => {
        const zapInMock = jest.fn();
        (vaultInterface as any).zapIn = zapInMock;

        const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

        await vaultInterface.deposit(vault, token, amount, account);

        expect(zapInMock).toHaveBeenCalledTimes(1);
        expect(zapInMock).toHaveBeenCalledWith(vault, token, amount, account, {}, ZapProtocol.PICKLE, {});
      });

      it("should call zapIn with correct arguments and pickle as the zapProtocol and the partner id", async () => {
        mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
        mockedYearn.services.partner = new (PartnerService as unknown as jest.Mock<PartnerService<ChainId>>)();
        vaultInterface = new VaultInterface(mockedYearn, 1, new Context({}));

        const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

        await vaultInterface.deposit(vault, token, amount, account, { slippage: 0.1 });

        expect(zapperZapInMock).toHaveBeenCalledTimes(1);
        expect(zapperZapInMock).toHaveBeenCalledWith(
          "0xAccount",
          "0xToken",
          "1",
          "0xVault",
          "0",
          0.1,
          false,
          "pickle",
          "0x000partner"
        );
      });
    });

    describe("when is not zapping into pickle jar", () => {
      beforeEach(() => {
        PickleJarsMock.PickleJars = [];
      });

      describe("when vault ref token is the same as the token", () => {
        describe("when token is eth address", () => {
          it("should throw", async () => {
            const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: EthAddress });
            vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);

            try {
              await vaultInterface.deposit("0xVault", EthAddress, "1", "0xAccount");
            } catch (error) {
              expect(error).toStrictEqual(new SdkError("deposit:v2:eth not implemented"));
            }
          });
        });

        describe("when token is not eth address", () => {
          describe("when there is no partner service", () => {
            it("should deposit directly into a yearn vault", async () => {
              const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xToken" });
              vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);

              const executeVaultContractTransactionMock = jest.fn().mockResolvedValue("trx");
              (vaultInterface as any).executeVaultContractTransaction = executeVaultContractTransactionMock;

              const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

              const actualDeposit = await vaultInterface.deposit(vault, token, amount, account);

              expect(Contract).toHaveBeenCalledTimes(1);
              expect(Contract).toHaveBeenCalledWith(
                "0xVault",
                ["function deposit(uint256 amount) public", "function withdraw(uint256 amount) public"],
                {
                  sendTransaction: sendTransactionMock,
                }
              );

              expect(partnerPopulateDepositTransactionMock).not.toHaveBeenCalled();
              expect(executeVaultContractTransactionMock).toHaveBeenCalledTimes(1);
              expect(executeVaultContractTransactionMock).toHaveBeenCalledWith(expect.any(Function), {});
              expect(actualDeposit).toEqual("trx");
            });
          });

          describe("when there is partner service", () => {
            it("should deposit into a yearn vault through the partner service", async () => {
              mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
              mockedYearn.services.partner = new (PartnerService as unknown as jest.Mock<PartnerService<ChainId>>)();
              mockedYearn.services.partner.populateDepositTransaction = jest.fn().mockResolvedValue({
                vault: "0xVault",
                amount: "1",
              });
              vaultInterface = new VaultInterface(mockedYearn, 1, new Context({}));
              const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xToken" });
              vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);

              const executeVaultContractTransactionMock = jest.fn().mockImplementation((fn) => fn());
              (vaultInterface as any).executeVaultContractTransaction = executeVaultContractTransactionMock;

              const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

              await vaultInterface.deposit(vault, token, amount, account);

              expect(mockedYearn.services.partner.populateDepositTransaction).toHaveBeenCalledTimes(1);
              expect(mockedYearn.services.partner.populateDepositTransaction).toHaveBeenCalledWith(
                "0xVault",
                "1",
                undefined
              );
            });
          });
        });
      });

      describe("when vault ref token is not the same as the token", () => {
        it("should call zapIn with correct arguments and yearn as the zapProtocol", async () => {
          const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xRandom" });
          vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);

          const zapInMock = jest.fn();
          (vaultInterface as any).zapIn = zapInMock;

          const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

          await vaultInterface.deposit(vault, token, amount, account);

          expect(zapInMock).toHaveBeenCalledTimes(1);
          expect(zapInMock).toHaveBeenCalledWith(vault, token, amount, account, {}, ZapProtocol.YEARN, {});
        });

        it("should call zapIn with correct arguments and yearn as the zapProtocol and the partner id", async () => {
          mockedYearn = new (Yearn as jest.Mock<Yearn<ChainId>>)();
          mockedYearn.services.partner = new (PartnerService as unknown as jest.Mock<PartnerService<ChainId>>)();
          vaultInterface = new VaultInterface(mockedYearn, 1, new Context({}));
          const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xRandom" });
          vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);

          const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

          await vaultInterface.deposit(vault, token, amount, account, { slippage: 0.1 });

          expect(zapperZapInMock).toHaveBeenCalledTimes(1);
          expect(zapperZapInMock).toHaveBeenCalledWith(
            "0xAccount",
            "0xToken",
            "1",
            "0xVault",
            "0",
            0.1,
            false,
            "yearn",
            "0x000partner"
          );
        });
      });
    });
  });

  describe("withdraw", () => {
    describe("when vault ref token is the same as the token given", () => {
      beforeEach(() => {
        const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xToken" });
        vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);
      });

      it("should withdraw from a yearn vault", async () => {
        const executeVaultContractTransactionMock = jest.fn().mockResolvedValue("trx");
        (vaultInterface as any).executeVaultContractTransaction = executeVaultContractTransactionMock;

        const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

        const actualWithdraw = await vaultInterface.withdraw(vault, token, amount, account);

        expect(Contract).toHaveBeenCalledTimes(1);
        expect(Contract).toHaveBeenCalledWith(
          "0xVault",
          ["function deposit(uint256 amount) public", "function withdraw(uint256 amount) public"],
          {
            sendTransaction: sendTransactionMock,
          }
        );
        expect(executeVaultContractTransactionMock).toHaveBeenCalledTimes(1);
        expect(executeVaultContractTransactionMock).toHaveBeenCalledWith(expect.any(Function), {});
        expect(actualWithdraw).toEqual("trx");
      });
    });

    describe("when vault ref token is not the same as the token given", () => {
      beforeEach(() => {
        const assetStaticVaultV2 = createMockAssetStaticVaultV2({ token: "0xRandom" });
        vaultInterface.getStatic = jest.fn().mockResolvedValue([assetStaticVaultV2]);
      });

      describe("when slippage is provided as an option", () => {
        it("should call zapOut with correct arguments and pickle as the zapProtocol", async () => {
          const zapOutput = {
            to: "0xZapOutTo",
            from: "0xZapOutFrom",
            data: "zapOutData",
            value: "1",
            gasPrice: "1",
            gas: "1",
          };
          zapperZapOutMock.mockResolvedValue(zapOutput);
          const executeZapperTransactionMock = jest.fn().mockResolvedValue("executeZapperTransactionResponse");
          (vaultInterface as any).executeZapperTransaction = executeZapperTransactionMock;

          const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

          const actualWithdraw = await vaultInterface.withdraw(vault, token, amount, account, { slippage: 1 });

          expect(actualWithdraw).toBe("executeZapperTransactionResponse");
          expect(zapperZapOutMock).toHaveBeenCalledTimes(1);
          expect(zapperZapOutMock).toHaveBeenCalledWith(
            "0xAccount",
            "0xToken",
            "1",
            "0xVault",
            "0",
            1,
            false,
            undefined,
            undefined
          );
          expect(executeZapperTransactionMock).toHaveBeenCalledTimes(1);
          expect(executeZapperTransactionMock).toHaveBeenCalledWith(
            {
              data: "zapOutData",
              from: "0xZapOutFrom",
              gasLimit: BigNumber.from(zapOutput.gas),
              gasPrice: BigNumber.from(zapOutput.gasPrice),
              to: "0xZapOutTo",
              value: BigNumber.from(zapOutput.value),
            },
            {},
            BigNumber.from(zapOutput.value)
          );
        });
      });

      describe("when slippage is not provided as an option", () => {
        it("should throw", async () => {
          try {
            await vaultInterface.withdraw("0xVault", "0xToken", "1", "0xAccount", { slippage: undefined });
          } catch (error) {
            expect(error).toStrictEqual(new SdkError("zap operations should have a slippage set"));
          }
        });
      });
    });
  });

  describe("mergeZapperProps", () => {
    it("should set the zapper properties on a vault's metadata", async () => {
      const vaultMetadataMock = {
        zappable: createMockVaultMetadata({ address: "0xZaPpAbLe" }), // random case `0xZappable`
        notZappable: createMockVaultMetadata({ address: "0xNotZappable" }),
      };

      const vaultTokenMarketDataMock = {
        zappable: createMockTokenMarketData({ address: "0xZappable" }),
        notInVaults: createMockTokenMarketData({ address: "0xNotInVaults" }),
        random: createMockTokenMarketData({ address: "0xRandom" }),
      };

      const actual = vaultInterface.mergeZapperProps(
        [vaultMetadataMock.zappable, vaultMetadataMock.notZappable],
        [vaultTokenMarketDataMock.zappable, vaultTokenMarketDataMock.notInVaults, vaultTokenMarketDataMock.random]
      );

      expect(actual.length).toEqual(2);
      expect(actual).toEqual(
        expect.arrayContaining([
          {
            ...vaultMetadataMock.zappable,
            allowZapIn: true,
            allowZapOut: true,
            zapInWith: "zapperZapIn",
            zapOutWith: "zapperZapOut",
          },
          {
            ...vaultMetadataMock.notZappable,
            allowZapIn: false,
            allowZapOut: false,
            zapInWith: undefined,
            zapOutWith: undefined,
          },
        ])
      );
    });
  });
});
