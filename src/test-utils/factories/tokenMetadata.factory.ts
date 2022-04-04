import { TokenMetadata } from "../../types";

const DEFAULT_TOKEN_METADATA: TokenMetadata = {
  categories: ["Tokens Metadata"],
  description: "Token Metadata Description.",
  website: "https://token.metadata/",
  tokenSymbolOverride: "tokenSymbolOverride",
  tokenNameOverride: "Token Name Override",
  localization: {},
  address: "0x002",
};

export const createMockTokenMetadata = (overwrites: Partial<TokenMetadata> = {}): TokenMetadata => ({
  ...DEFAULT_TOKEN_METADATA,
  ...overwrites,
});
