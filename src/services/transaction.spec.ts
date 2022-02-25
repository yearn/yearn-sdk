import { TransactionRequest } from "@ethersproject/providers";

import { ChainId, Context, SdkError } from "..";
import { AllowListService } from "./allowlist";
import { TransactionService } from "./transaction";

const sendTransactionMock = jest.fn();
const validateCalldataMock = jest.fn();

jest.mock("../context", () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: {
        getSigner: jest.fn().mockImplementation(() => ({
          sendTransaction: sendTransactionMock
        }))
      }
    },
    events: {
      on: jest.fn()
    }
  }))
}));

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn()
}));

jest.mock("./allowlist", () => ({
  AllowListService: jest.fn().mockImplementation(() => ({
    validateCalldata: validateCalldataMock
  }))
}));

describe("TranscationService", () => {
  let transactionService: TransactionService<ChainId>;
  let mockedAllowList: AllowListService<ChainId>;

  describe("with valid allow list", () => {
    beforeEach(() => {
      mockedAllowList = new ((AllowListService as unknown) as jest.Mock<AllowListService<ChainId>>)();
      transactionService = new TransactionService(1, new Context({}), mockedAllowList);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("when the transaction is validated successfully", () => {
      beforeEach(() => {
        validateCalldataMock.mockReturnValue({ success: true, error: undefined });
      });

      it("the transaction is sent", async () => {
        const tx: TransactionRequest = {
          to: "0x00",
          data: "0x01"
        };

        await transactionService.sendTransaction(tx);

        expect(sendTransactionMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the transaction is rejected", () => {
      const errorMessage = "test error message";

      beforeEach(() => {
        validateCalldataMock.mockReturnValue({ success: false, error: errorMessage });
      });

      it("the transaction is not sent", async () => {
        const tx: TransactionRequest = {
          to: "0x00",
          data: "0x01"
        };

        try {
          await transactionService.sendTransaction(tx);
        } catch (error) {
          expect(error).toStrictEqual(new SdkError(errorMessage));
          expect(sendTransactionMock).toHaveBeenCalledTimes(0);
        }
      });
    });
  });

  describe("with no allow list", () => {
    beforeEach(() => {
      transactionService = new TransactionService(1, new Context({}));
    });

    it("the transaction is sent", async () => {
      const tx: TransactionRequest = {
        to: "0x00",
        data: "0x01"
      };

      await transactionService.sendTransaction(tx);

      expect(sendTransactionMock).toHaveBeenCalledTimes(1);
      expect(validateCalldataMock).toHaveBeenCalledTimes(0);
    });
  });
});
