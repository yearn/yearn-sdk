import { Context } from './context';
import { EthersError, SimulationError, TenderlyError } from './types/custom/simulation';
import { JsonRpcSigner } from '@ethersproject/providers';
import { SimulationExecutor } from "./simulationExecutor";
import { TelegramService } from '.';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn().mockReturnValue({
      simulation: {
        id: 'simulation-id',
      },
      transaction: {
        transaction_info: {
          call_trace: { calls: [] },
        },
      },
    })
  })
) as jest.Mock;

const populateTransactionMock = jest.fn().mockReturnValue(Promise.resolve(true));

jest.mock('@ethersproject/providers')
jest.mock('@ethersproject/contracts')

// const ContractMock = Contract as jest.Mocked<any>

const SignerMock = JsonRpcSigner as jest.Mocked<typeof JsonRpcSigner>

const buildSignerMock = (balance = 1, transactionCount = 1) => {
  const getBalanceMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(balance))

  const getTransactionCountMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(transactionCount))

  const signer = new SignerMock('0x00', 'provider' as any) as any
  // signer.provider
  signer.address
  signer.getBalance = getBalanceMock
  signer.getTransactionCount = getTransactionCountMock
  signer.getSigner = () => signer;
  signer.populateTransaction = populateTransactionMock
  return signer
}

jest.mock('./services/telegram', () => ({
  TelegramService: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
  }))
}))
jest.mock('./context', () => ({
  Context: jest.fn().mockImplementation(() => ({
    provider: {
      write: buildSignerMock()
    },
    simulation: {
      dashboardUrl: 'dashboard-url',
    },
  }))
}))

describe('Simualtion executor', () => {
  let simulationExecutor: SimulationExecutor;
  const MockedTelegramServiceClass = <jest.Mock<TelegramService>>TelegramService;

  beforeEach(() => {
    const mockedTelegramService = new MockedTelegramServiceClass();
    simulationExecutor = new SimulationExecutor(mockedTelegramService, new Context({}));
  })

  afterEach(() => {
    jest.clearAllMocks();
  })

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('makeSimulationRequest', () => {
    it('should fail with EthersError populating transaction', async () => {
      expect.assertions(2);
      populateTransactionMock.mockReturnValueOnce(Promise.reject(new Error('something bad happened')))
      try {
        await simulationExecutor.makeSimulationRequest('0x000', '0x000', '1', {});
      } catch (error) {
        expect(error).toBeInstanceOf(EthersError);
        expect(error).toHaveProperty('error_code', EthersError.POPULATING_TRANSACTION)
      }
    });

    it('should fail with TenderlyError simulation call', async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('something bad happened')))
      try {
        await simulationExecutor.makeSimulationRequest('0x000', '0x000', '1', {});
      } catch (error) {
        expect(error).toBeInstanceOf(TenderlyError);
        expect(error).toHaveProperty('error_code', TenderlyError.SIMULATION_CALL)
      }
    });

    it('should fail with SimulationError tenderly response error', async () => {
      expect.assertions(3);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.resolve({
        json: jest.fn().mockReturnValue({
          transaction: {
            error_message: 'some error',
          }
        })
      }))
      try {
        await simulationExecutor.makeSimulationRequest('0x000', '0x000', '1', {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty('error_code', SimulationError.TENDERLY_RESPONSE_ERROR)
        expect(error).toHaveProperty('message', 'some error')
      }
    });

    it('should fail with SimulationError partial revert', async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.resolve({
        json: jest.fn().mockReturnValue({
          simulation: {
            id: 'simulation-id',
          },
          transaction: {
            transaction_info: {
              call_trace: { calls: [{ error: 'some error happened '}] },
            },
          },
        })
      }))
      try {
        await simulationExecutor.makeSimulationRequest('0x000', '0x000', '1', {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty('error_code', SimulationError.PARTIAL_REVER)
      }
    });
  });

  describe('simulateVaultInteraction', () => {
    let spy: jest.SpyInstance;
    beforeEach(() => {
      spy = jest.spyOn(simulationExecutor, 'makeSimulationRequest').mockReturnValueOnce(Promise.resolve({
        simulation: {
          id: '',
        },
        transaction: {
          transaction_info: {
            call_trace: { output: '', calls: []},
            logs: [],
          },
        },
      }));
    });

    afterEach(() => {
      spy.mockRestore()
    });

    it('should fail with SimulationError no log', async () => {
      expect.assertions(2);
      try {
        await simulationExecutor.simulateVaultInteraction('0x000', '0x000', '1', '0x0000', {});
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationError);
        expect(error).toHaveProperty('error_code', SimulationError.NO_LOG)
      }
    });
  });

  describe('createFork', () => {
    it('should fail with TenderlyError create fork', async () => {
      expect.assertions(2);
      (global.fetch as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('something bad happened')))
      try {
        await simulationExecutor.createFork();
      } catch (error) {
        expect(error).toBeInstanceOf(TenderlyError);
        expect(error).toHaveProperty('error_code', TenderlyError.CREATE_FORK)
      }
    });
  });
});
