import { Contract } from "@ethersproject/contracts";

import { Address, Asset, ChainId, SdkError, TokenInterface, TokenMetadata } from "..";
import { CachedFetcher } from "../cache";
import { Context } from "../context";
import { assetStaticVaultV2Factory, balanceFactory, tokenFactory } from "../factories";
import { EthAddress } from "../helpers";
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
const ironBankBalancesMock = jest.fn();

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    approve: jest.fn().mockResolvedValue(true)
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
      }
    },
    ironBank: { balances: ironBankBalancesMock },
    vaults: {
      balances: vaultsBalancesMock
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("price", () => {
    it("should should get the exchange rate between two tokens", async () => {
      expect(await tokenInterface.price("0x000", "0x001")).toEqual(1);
      expect(getPriceFromRouterMock).toHaveBeenCalledTimes(1);
      expect(getPriceFromRouterMock).toHaveBeenCalledWith("0x000", "0x001");
    });
  });

  describe("priceUsdc", () => {
    it("should get the suggested Usdc exchange rate for a token", async () => {
      getPriceUsdcMock.mockResolvedValue(0.000001);

      expect(await tokenInterface.priceUsdc("0x000")).toEqual(0.000001);
      expect(getPriceUsdcMock).toHaveBeenCalledTimes(1);
      expect(getPriceUsdcMock).toHaveBeenCalledWith("0x000", undefined);
    });

    it("should get the suggested Usdc exchange rate for list of tokens", async () => {
      getPriceUsdcMock.mockResolvedValueOnce(0.000001).mockResolvedValueOnce(0.000002);

      expect(await tokenInterface.priceUsdc(["0x000", "0x001"])).toEqual({
        "0x000": 0.000001,
        "0x001": 0.000002
      });
      expect(getPriceUsdcMock).toHaveBeenCalledTimes(2);
      expect(getPriceUsdcMock).toHaveBeenNthCalledWith(1, "0x000", undefined);
      expect(getPriceUsdcMock).toHaveBeenNthCalledWith(2, "0x001", undefined);
    });
  });

  describe("balances", () => {
    const vaultTokenWithBalance = balanceFactory.build({
      address: "0x001"
    });
    const vaultTokenWithoutBalance = balanceFactory.build({
      balance: "0"
    });
    const zapperTokenWithBalance = balanceFactory.build({
      address: "0x002"
    });
    const zapperSameAddressTokenWithBalance = balanceFactory.build({
      address: "0x001"
    });

    beforeEach(() => {
      vaultsBalancesMock.mockResolvedValue([vaultTokenWithBalance, vaultTokenWithoutBalance]);
    });

    describe("when chainId is 1 or 1337", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
      });

      it("should fetch token balances from the TokenInterface.supported list", async () => {
        zapperBalancesMock.mockResolvedValue([zapperTokenWithBalance, zapperSameAddressTokenWithBalance]);

        expect(await tokenInterface.balances("0x000")).toEqual([zapperTokenWithBalance, vaultTokenWithBalance]);
        expect(zapperBalancesMock).toHaveBeenCalledTimes(1);
        expect(zapperBalancesMock).toHaveBeenCalledWith("0x000");
        expect(ironBankBalancesMock).not.toHaveBeenCalled();
      });
    });

    describe("when chainId is 250", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 250, new Context({}));
      });

      it("should fetch token balances from the TokenInterface.supported list", async () => {
        const ironBankBalance = balanceFactory.build();
        ironBankBalancesMock.mockResolvedValue([ironBankBalance]);

        expect(await tokenInterface.balances("0x000")).toEqual([ironBankBalance, vaultTokenWithBalance]);
        expect(ironBankBalancesMock).toHaveBeenCalledTimes(1);
        expect(ironBankBalancesMock).toHaveBeenCalledWith("0x000");
        expect(zapperBalancesMock).not.toHaveBeenCalled();
      });
    });

    describe("when chainId is not supported", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 42 as any, new Context({}));
      });

      it("should throw an SdkError", async () => {
        try {
          await tokenInterface.balances("0x000");
        } catch (error) {
          expect(error).toStrictEqual(new SdkError(`the chain ${42} hasn't been implemented yet`));
        }
      });
    });
  });

  describe("supported", () => {
    describe("when the supported tokens are cached", () => {
      let cachedToken = tokenFactory.build();

      beforeEach(() => {
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue([cachedToken]);
      });

      it("should return the supported tokens cached", async () => {
        expect(await tokenInterface.supported()).toEqual([cachedToken]);
      });
    });

    describe("when the supported tokens are not cached", () => {
      beforeEach(() => {
        jest.spyOn(CachedFetcher.prototype, "fetch").mockResolvedValue(undefined);
      });

      describe("when chainId is 1 or 1337", () => {
        beforeEach(() => {
          tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
        });

        it("should fetch all the tokens supported by the zapper protocol along with icon url", async () => {
          const supportedTokenWithIcon = tokenFactory.build();
          const supportedTokenWithoutIcon = tokenFactory.build({ address: "0x002" });
          zapperSupportedTokensMock.mockResolvedValue([supportedTokenWithIcon, supportedTokenWithoutIcon]);
          assetReadyThenMock.mockResolvedValue({ "0x001": "image.png" });

          expect(await tokenInterface.supported()).toEqual([
            { ...supportedTokenWithIcon, icon: "image.png" },
            supportedTokenWithoutIcon
          ]);
          expect(zapperSupportedTokensMock).toHaveBeenCalledTimes(1);
          expect(assetReadyThenMock).toHaveBeenCalledTimes(1);
        });
      });

      describe("when chainId is not supported", () => {
        beforeEach(() => {
          tokenInterface = new TokenInterface(mockedYearn, 250, new Context({}));
        });

        it("should return an empty array", async () => {
          expect(await tokenInterface.supported()).toEqual([]);
          expect(zapperSupportedTokensMock).not.toHaveBeenCalled();
          expect(assetReadyThenMock).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("approve", () => {
    describe("when the vault token is the same as the token", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build().address;
      });

      it("should approve vault to spend a token on zapIn", async () => {
        expect(await tokenInterface.approve(vault, token, "1", "0x001")).toEqual(true);

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
        vault = assetStaticVaultV2Factory.build();
        token = EthAddress;
      });

      it("should return true", async () => {
        expect(await tokenInterface.approve(vault, token, "1", "0x001")).toEqual(true);
      });
    });

    describe("zapInApprovalState", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build({ address: "0x999" }).address;
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
          expect(await tokenInterface.approve(vault, token, "1", "0x001")).toEqual("transaction");

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
          expect(await tokenInterface.approve(vault, token, "1", "0x001")).toEqual(true);
        });
      });
    });
  });

  describe("approveZapOut", () => {
    describe("when the vault token is not the same as the token", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build({ address: "0x999" }).address;
      });

      it("should return false", async () => {
        expect(await tokenInterface.approveZapOut(vault, token, "0x001")).toEqual(false);
      });
    });

    describe("zapInApprovalState", () => {
      let vault: Asset<"VAULT_V2">;
      let token: Address;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build().address;
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
          expect(await tokenInterface.approveZapOut(vault, token, "0x001")).toEqual("transaction");

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
          expect(await tokenInterface.approveZapOut(vault, token, "0x001")).toEqual(false);
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
          expect(await tokenInterface.metadata(["0x002"])).toEqual([
            {
              address: "0x002",
              description: "bar"
            }
          ]);
        });
      });

      describe("when there are no addresses", () => {
        it("should return the cached result", async () => {
          expect(await tokenInterface.metadata()).toEqual(tokenMetadata);
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
          expect(await tokenInterface.metadata(["0x001"])).toEqual([
            {
              address: "0x001",
              description: "bar"
            }
          ]);
        });
      });

      describe("when there are no addresses", () => {
        it("should return the tokens from the meta service", async () => {
          expect(await tokenInterface.metadata()).toEqual(tokenMetadataFromMetaService);
        });
      });
    });
  });
});