import { Address, CustomError, Integer, Usdc } from "../common";

export class SimulationError extends CustomError {
  errorCode: string;
  static NO_LOG = "no_log";
  static TENDERLY_RESPONSE_ERROR = "tenderly_response_error";
  static PARTIAL_REVERT = "partial_revert";

  constructor(message: string, errorCode: string) {
    super(message, "simulation");
    this.errorCode = errorCode;
  }
}

export class ZapperError extends CustomError {
  errorCode: string;
  static ZAP_IN_APPROVAL_STATE = "zap_in_approval_state";
  static ZAP_IN_APPROVAL = "zap_in_approval";
  static ZAP_OUT_APPROVAL_STATE = "zap_out_approval_state";
  static ZAP_OUT_APPROVAL = "zap_out_approval";
  static ZAP_IN = "zap_in";
  static ZAP_OUT = "zap_out";

  constructor(message: string, errorCode: string) {
    super(message, "zapper");
    this.errorCode = errorCode;
  }
}
export class EthersError extends CustomError {
  errorCode: string;
  static FAIL_TOKEN_FETCH = "fail_token_fetch";
  static NO_DECIMALS = "no_decimals";
  static NO_PRICE_PER_SHARE = "no_price_per_share";
  static POPULATING_TRANSACTION = "populating_transaction";

  constructor(message: string, errorCode: string) {
    super(message, "ethers");
    this.errorCode = errorCode;
  }
}
export class TenderlyError extends CustomError {
  errorCode: string;
  static SIMULATION_CALL = "simulation_call";
  static CREATE_FORK = "create_fork";

  constructor(message: string, errorCode: string) {
    super(message, "tenderly");
    this.errorCode = errorCode;
  }
}
export class PriceFetchingError extends CustomError {
  errorCode: string;
  static FETCHING_PRICE_ORACLE = "fetching_price_oracle";
  static FETCHING_PRICE_PICKLE = "fetching_price_pickle";

  constructor(message: string, errorCode: string) {
    super(message, "price_fetching");
    this.errorCode = errorCode;
  }
}

export interface TransactionOutcome {
  sourceTokenAddress: Address;
  sourceTokenAmount: Integer;
  targetTokenAddress: Address;
  targetTokenAmount: Integer;
  targetTokenAmountUsdc: Usdc;
  targetUnderlyingTokenAddress: Address;
  targetUnderlyingTokenAmount: Integer;
  conversionRate: number;
  slippage: number;
}

export interface SimulationOptions {
  slippage?: number;
  root?: string;
  forkId?: string;
  gasPrice?: Integer;
  maxFeePerGas?: Integer;
  maxPriorityFeePerGas?: Integer;
  gasLimit?: Integer;
  save?: boolean;
}
