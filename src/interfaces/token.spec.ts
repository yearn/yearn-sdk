import { Contract } from "@ethersproject/contracts";

import { Address, Asset, ChainId, SdkError, TokenInterface } from "..";
import { Context } from "../context";
import { assetStaticVaultV2Factory, balanceFactory, tokenFactory } from "../factories";
import { EthAddress } from "../helpers";
import { Yearn } from "../yearn";

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    approve: jest.fn().mockResolvedValue(true)
  }))
}));

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      asset: {
        ready: { then: jest.fn() }
      },
      oracle: {
        getPriceFromRouter: jest.fn(),
        getPriceUsdc: jest.fn()
      },
      zapper: {
        balances: jest.fn(),
        gas: jest.fn(),
        supportedTokens: jest.fn(),
        zapInApprovalState: jest.fn(),
        zapInApprovalTransaction: jest.fn(),
        zapOutApprovalState: jest.fn(),
        zapOutApprovalTransaction: jest.fn()
      }
    },
    ironBank: { balances: jest.fn() },
    vaults: {
      balances: jest.fn()
    }
  }))
}));

jest.mock("../cache", () => ({
  CachedFetcher: jest.fn().mockImplementation(() => ({
    fetch: jest.fn()
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

  const MockedYearnClass = Yearn as jest.Mock<Yearn<ChainId>>;

  beforeEach(() => {
    mockedYearn = new MockedYearnClass();
    tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
  });

  describe("price", () => {
    it("should should get the exchange rate between two tokens", async () => {
      (mockedYearn.services.oracle.getPriceFromRouter as jest.Mock).mockResolvedValue(1);

      expect(await tokenInterface.price("0x000", "0x001")).toEqual(1);
      expect(mockedYearn.services.oracle.getPriceFromRouter).toHaveBeenCalledTimes(1);
      expect(mockedYearn.services.oracle.getPriceFromRouter).toHaveBeenCalledWith("0x000", "0x001");
    });
  });

  describe("priceUsdc", () => {
    let mockGetPriceUsdc: jest.Mock;

    beforeEach(() => {
      mockGetPriceUsdc = mockedYearn.services.oracle.getPriceUsdc as jest.Mock;
    });

    it("should get the suggested Usdc exchange rate for a token", async () => {
      mockGetPriceUsdc.mockResolvedValue(0.000001);

      expect(await tokenInterface.priceUsdc("0x000")).toEqual(0.000001);
      expect(mockGetPriceUsdc).toHaveBeenCalledTimes(1);
      expect(mockGetPriceUsdc).toHaveBeenCalledWith("0x000", undefined);
    });

    it("should get the suggested Usdc exchange rate for list of tokens", async () => {
      mockGetPriceUsdc.mockResolvedValueOnce(0.000001).mockResolvedValueOnce(0.000002);

      expect(await tokenInterface.priceUsdc(["0x000", "0x001"])).toEqual({
        "0x000": 0.000001,
        "0x001": 0.000002
      });
      expect(mockGetPriceUsdc).toHaveBeenCalledTimes(2);
      expect(mockGetPriceUsdc).toHaveBeenNthCalledWith(1, "0x000", undefined);
      expect(mockGetPriceUsdc).toHaveBeenNthCalledWith(2, "0x001", undefined);
    });
  });

  describe("balances", () => {
    let mockVaultsBalances: jest.Mock;
    let mockZapperBalances: jest.Mock;
    let mockIronBankBalances: jest.Mock;

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
      mockVaultsBalances = mockedYearn.vaults.balances as jest.Mock;
      mockZapperBalances = mockedYearn.services.zapper.balances as jest.Mock;
      mockIronBankBalances = mockedYearn.ironBank.balances as jest.Mock;

      mockVaultsBalances.mockResolvedValue([vaultTokenWithBalance, vaultTokenWithoutBalance]);
    });

    describe("when chainId is 1 or 1337", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
      });

      it("should fetch token balances from the TokenInterface.supported list", async () => {
        mockZapperBalances.mockResolvedValue([zapperTokenWithBalance, zapperSameAddressTokenWithBalance]);

        expect(await tokenInterface.balances("0x000")).toEqual([zapperTokenWithBalance, vaultTokenWithBalance]);
        expect(mockZapperBalances).toHaveBeenCalledTimes(1);
        expect(mockZapperBalances).toHaveBeenCalledWith("0x000");
        expect(mockIronBankBalances).not.toHaveBeenCalled();
      });
    });

    describe("when chainId is 250", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 250, new Context({}));
      });

      it("should fetch token balances from the TokenInterface.supported list", async () => {
        const ironBankBalance = balanceFactory.build();
        mockIronBankBalances.mockResolvedValue([ironBankBalance]);

        expect(await tokenInterface.balances("0x000")).toEqual([ironBankBalance, vaultTokenWithBalance]);
        expect(mockIronBankBalances).toHaveBeenCalledTimes(1);
        expect(mockIronBankBalances).toHaveBeenCalledWith("0x000");
        expect(mockZapperBalances).not.toHaveBeenCalled();
      });
    });

    describe("when chainId is not supported", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 42161, new Context({}));
      });

      it("should throw an SdkError", async () => {
        try {
          await tokenInterface.balances("0x000");
        } catch (error) {
          expect(error).toStrictEqual(new SdkError(`the chain ${42161} hasn't been implemented yet`));
        }
      });
    });
  });

  describe("supported", () => {
    describe("when chainId is 1 or 1337", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 1, new Context({}));
      });

      it("should fetch all the tokens supported by the zapper protocol along with icon url", async () => {
        const supportedTokenWithIcon = tokenFactory.build();
        const supportedTokenWithoutIcon = tokenFactory.build({ address: "0x002" });
        (mockedYearn.services.zapper.supportedTokens as jest.Mock).mockResolvedValue([
          supportedTokenWithIcon,
          supportedTokenWithoutIcon
        ]);
        (mockedYearn.services.asset.ready.then as jest.Mock).mockResolvedValue({ "0x001": "image.png" });

        expect(await tokenInterface.supported()).toEqual([
          { ...supportedTokenWithIcon, icon: "image.png" },
          supportedTokenWithoutIcon
        ]);
        expect(mockedYearn.services.zapper.supportedTokens).toHaveBeenCalledTimes(1);
        expect(mockedYearn.services.asset.ready.then).toHaveBeenCalledTimes(1);
      });
    });

    describe("when chainId is not supported", () => {
      beforeEach(() => {
        tokenInterface = new TokenInterface(mockedYearn, 250, new Context({}));
      });

      it("should return an empty array", async () => {
        expect(await tokenInterface.supported()).toEqual([]);
        expect(mockedYearn.services.zapper.supportedTokens).not.toHaveBeenCalled();
        expect(mockedYearn.services.asset.ready.then).not.toHaveBeenCalled();
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
      let mockZapperZapInApprovalState: jest.Mock;
      let mockZapperZapInApprovalTransaction: jest.Mock;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build({ address: "0x999" }).address;
        mockZapperZapInApprovalState = mockedYearn.services.zapper.zapInApprovalState as jest.Mock;
        mockZapperZapInApprovalTransaction = mockedYearn.services.zapper.zapInApprovalTransaction as jest.Mock;
        (mockedYearn.services.zapper.gas as jest.Mock).mockResolvedValue({
          standard: 1,
          instant: 2,
          fast: 3
        });
      });

      describe("when is not approved", () => {
        beforeEach(() => {
          mockZapperZapInApprovalState.mockResolvedValue({
            isApproved: false
          });
          mockZapperZapInApprovalTransaction.mockResolvedValue({
            data: "data",
            to: "0x000",
            from: "0x001",
            gasPrice: "1"
          });
        });

        it("should approve vault to spend a token on zapIn", async () => {
          expect(await tokenInterface.approve(vault, token, "1", "0x001")).toEqual("transaction");

          expect(mockZapperZapInApprovalTransaction).toHaveBeenCalledTimes(1);
          expect(mockZapperZapInApprovalTransaction).toHaveBeenCalledWith("0x001", "0x999", "3000000000", "yearn");
        });
      });

      describe("when is approved", () => {
        beforeEach(() => {
          mockZapperZapInApprovalState.mockResolvedValue({
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
      let mockZapperZapOutApprovalState: jest.Mock;
      let mockZapperZapOutApprovalTransaction: jest.Mock;

      beforeEach(() => {
        vault = assetStaticVaultV2Factory.build();
        token = tokenFactory.build().address;
        mockZapperZapOutApprovalState = mockedYearn.services.zapper.zapOutApprovalState as jest.Mock;
        mockZapperZapOutApprovalTransaction = mockedYearn.services.zapper.zapOutApprovalTransaction as jest.Mock;
        (mockedYearn.services.zapper.gas as jest.Mock).mockResolvedValue({
          standard: 1,
          instant: 2,
          fast: 3
        });
      });

      describe("when is not approved", () => {
        beforeEach(() => {
          mockZapperZapOutApprovalState.mockResolvedValue({
            isApproved: false
          });
          mockZapperZapOutApprovalTransaction.mockResolvedValue({
            data: "data",
            to: "0x000",
            from: "0x001",
            gasPrice: "1"
          });
        });

        it("should approve vault to spend a vault token on zapOut", async () => {
          expect(await tokenInterface.approveZapOut(vault, token, "0x001")).toEqual("transaction");

          expect(mockZapperZapOutApprovalState).toHaveBeenCalledTimes(1);
          expect(mockZapperZapOutApprovalState).toHaveBeenCalledWith("0x001", "0x001");

          expect(mockZapperZapOutApprovalTransaction).toHaveBeenCalledTimes(1);
          expect(mockZapperZapOutApprovalTransaction).toHaveBeenCalledWith("0x001", "0x001", "3000000000");
        });
      });

      describe("when is approved", () => {
        beforeEach(() => {
          mockZapperZapOutApprovalState.mockResolvedValue({
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
    it.todo("should get an icon url for a particular address");

    it.todo("should get a map of icons for a list of addresses");
  });

  describe("metadata", () => {
    it.todo("should");
  });
});
