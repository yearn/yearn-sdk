import { ChainId } from "./chain";
import { Cache } from "./cache";
import { ContextValue } from "./context";
import { TokenReader } from "./readers/token";
import { VaultReader } from "./readers/vault";
import { ApyService } from "./services/apy";
import { LensService } from "./services/lens";
import { OracleService } from "./services/oracle";
import { ZapperService } from "./services/zapper";
import { IconsService } from "./services/icons";
export declare class Yearn<T extends ChainId> {
    services: {
        lens: LensService<T>;
        oracle: OracleService<T>;
        zapper: ZapperService;
        icons: IconsService;
        apy: ApyService;
    };
    vaults: VaultReader<T>;
    tokens: TokenReader<T>;
    constructor(chainId: T, context: ContextValue, cache?: Cache);
}
