import { Address, CustomError, Integer, Usdc } from "../common";

export class SimulationError extends CustomError {
  error_code: string;
  static NO_LOG = "no_log";
  static TENDERLY_RESPONSE_ERROR = "tenderly_response_error";
  static PARTIAL_REVER = "partial_rever";

  constructor(message: string, error_code: string) {
    super(message, "simulation");
    this.error_code = error_code;
  }
}

export class ZapperError extends CustomError {
  error_code: string;
  static ZAP_IN_APPROVAL_STATE = "zap_in_approval_state";
  static ZAP_IN_APPROVAL = "zap_in_approval";
  static ZAP_OUT_APPROVAL_STATE = "zap_out_approval_state";
  static ZAP_OUT_APPROVAL = "zap_out_approval";
  static ZAP_IN = "zap_in";
  static ZAP_OUT = "zap_out";

  constructor(message: string, error_code: string) {
    super(message, "zapper");
    this.error_code = error_code;
  }
}
export class EthersError extends CustomError {
  error_code: string;
  static FAIL_TOKEN_FETCH = "fail_token_fetch";
  static NO_DECIMALS = "no_decimals";
  static NO_PRICE_PER_SHARE = "no_price_per_share";
  static POPULATING_TRANSACTION = "populating_transaction";

  constructor(message: string, error_code: string) {
    super(message, "ethers");
    this.error_code = error_code;
  }
}
export class TenderlyError extends CustomError {
  error_code: string;
  static SIMULATION_CALL = "simulation_call";
  static CREATE_FORK = "create_fork";

  constructor(message: string, error_code: string) {
    super(message, "tenderly");
    this.error_code = error_code;
  }
}
export class PriceFetchingError extends CustomError {
  error_code: string;
  static FETCHING_PRICE_ORACLE = "fetching_price_oracle";
  static FETCHING_PRICE_PICKLE = "fetching_price_pickle";

  constructor(message: string, error_code: string) {
    super(message, "price_fetching");
    this.error_code = error_code;
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
