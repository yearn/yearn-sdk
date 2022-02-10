import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";

import { ChainId, Context, SdkError, VaultInterface, Yearn, ZapProtocol } from "..";
import { createMockAssetStaticVaultV2 } from "../factories/asset.factory";
import { createMockEarningsUserData } from "../factories/earningsUserData.factory";
import { createMockToken } from "../factories/token.factory";
import { createMockTokenBalance } from "../factories/tokenBalance.factory";
import { EthAddress } from "../helpers";

const earningsAccountAssetsDataMock = jest.fn();
const zapperZapOutMock = jest.fn();
const helperTokenBalancesMock = jest.fn();
const sendTransactionMock = jest.fn();

jest.mock("../yearn", () => ({
  Yearn: jest.fn().mockImplementation(() => ({
    services: {
      meta: {},
      lens: {},
      vision: {},
      asset: {},
      helper: {
        tokenBalances: helperTokenBalancesMock
      },
      oracle: {},
      zapper: {
        zapOut: zapperZapOutMock
      }
    },
    strategies: {},
    earnings: {
      accountAssetsData: earningsAccountAssetsDataMock
    },
    tokens: {}
  }))
}));

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: {
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: sendTransactionMock
        }))
      }
    }
  }))
}));

const PickleJarsMock = jest.requireMock("../services/partners/pickle");
jest.mock("../services/partners/pickle", () => ({
  PickleJars: []
}));

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn().mockImplementation(() => ({
    deposit: jest.fn(),
    withdraw: jest.fn()
  }))
}));

describe("VaultInterface", () => {
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
    it.todo("should get all yearn vaults");
  });

  describe("getStatic", () => {
    it.todo("should get static part of yearn vaults");
  });

  describe("getDynamic", () => {
    it.todo("should get dynamic part of yearn vaults");
  });

  describe("positionsOf", () => {
    it.todo("should get yearn vault positions for a particular address");
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
      describe("when the address provided is included in the addresses array", () => {
        it("should get the Vault User Metadata for the address provided", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x001", "0x002"]);

          expect(actualMetadataOf).toEqual([{ assetAddress: "0x001", earned: "1" }]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
      });

      describe("when the address provided is not included in the addresses array", () => {
        it("should return an empty array", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", ["0x000", "0x002"]);

          expect(actualMetadataOf).toEqual([]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
      });

      describe("when the addresses array is empty", () => {
        it("should return an empty array", async () => {
          const actualMetadataOf = await vaultInterface.metadataOf("0x001", []);

          expect(actualMetadataOf).toEqual([]);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledTimes(1);
          expect(earningsAccountAssetsDataMock).toHaveBeenCalledWith("0x001");
        });
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
          { ...existingBalance2, token: existingToken2 }
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
    it.todo("should get all yearn vault's underlying tokens");
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
        expect(zapInMock).toHaveBeenCalledWith(
          vault,
          token,
          amount,
          account,
          { sendTransaction: sendTransactionMock },
          {},
          ZapProtocol.PICKLE,
          {}
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
          it("should deposit into a yearn vault", async () => {
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
                sendTransaction: sendTransactionMock
              }
            );
            expect(executeVaultContractTransactionMock).toHaveBeenCalledTimes(1);
            expect(executeVaultContractTransactionMock).toHaveBeenCalledWith(expect.any(Function), {});
            expect(actualDeposit).toEqual("trx");
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
          expect(zapInMock).toHaveBeenCalledWith(
            vault,
            token,
            amount,
            account,
            { sendTransaction: sendTransactionMock },
            {},
            ZapProtocol.YEARN,
            {}
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
            sendTransaction: sendTransactionMock
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
            gas: "1"
          };
          zapperZapOutMock.mockResolvedValue(zapOutput);
          const executeZapperTransactionMock = jest.fn().mockResolvedValue("executeZapperTransactionResponse");
          (vaultInterface as any).executeZapperTransaction = executeZapperTransactionMock;

          const [vault, token, amount, account] = ["0xVault", "0xToken", "1", "0xAccount"];

          const actualWithdraw = await vaultInterface.withdraw(vault, token, amount, account, { slippage: 1 });

          expect(actualWithdraw).toBe("executeZapperTransactionResponse");
          expect(zapperZapOutMock).toHaveBeenCalledTimes(1);
          expect(zapperZapOutMock).toHaveBeenCalledWith("0xAccount", "0xToken", "1", "0xVault", "0", 1, false);
          expect(executeZapperTransactionMock).toHaveBeenCalledTimes(1);
          expect(executeZapperTransactionMock).toHaveBeenCalledWith(
            {
              data: "zapOutData",
              from: "0xZapOutFrom",
              gasLimit: BigNumber.from(zapOutput.gas),
              gasPrice: BigNumber.from(zapOutput.gasPrice),
              to: "0xZapOutTo",
              value: BigNumber.from(zapOutput.value)
            },
            {},
            BigNumber.from(zapOutput.value),
            { sendTransaction: sendTransactionMock }
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
});
