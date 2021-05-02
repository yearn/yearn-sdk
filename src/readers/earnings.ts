import { BigNumber } from "@ethersproject/bignumber";
import { ChainId } from "../chain";
import { Address, Integer, Reader, Usdc } from "../common";
import { TokenAmount } from "../types";

interface VaultsContainer {
  vaults: Vault[];
}

interface Vault {
  id: Address;
  balanceTokens: Integer;
  sharesSupply: Integer;
  token: Token;
  latestUpdate: LatestUpdate;
}

interface Token {
  id: Address;
  symbol: String;
  decimals: Integer;
}

interface LatestUpdate {
  pricePerShare: Integer;
}

export interface AccountEarnings {
  earnings: AssetEarnings[];
  accountId: Address;
  totalEarnedUsdc: Usdc;
}

export interface AssetEarnings extends Earnings {
  assetId: Address;
}

export interface Earnings extends TokenAmount {
  tokenId: Address;
}

export class EarningsReader<C extends ChainId> extends Reader<C> {
  async protocolEarnings(): Promise<Usdc> {
    const query = `
    {
      vaults(where:{balanceTokens_gt:0}) {
        id
        balanceTokens
        token {
          symbol
          id
          decimals
        }
        latestUpdate {
          pricePerShare
        }
        sharesSupply
      }
    }
    `;

    const response: VaultsContainer = await this.yearn.services.subgraph.performQuery(
      query
    );
    var result = BigNumber.from(0);
    for (const vault of response.vaults) {
      const earnings = calculateEarningsForVault(vault);
      const earningsUsdc = await this.tokensValueInUsdc(earnings, vault.token);
      // TODO - some results are negative, and some are too large to be realistically possible. This is due to problems with the subgraph and should be fixed there
      if (
        earningsUsdc.gt(BigNumber.from(0)) &&
        earningsUsdc.lt(BigNumber.from(1000000000))
      ) {
        result.add(earningsUsdc);
      }
    }

    return result.toString();
  }

  async assetEarnings(vaultAddress: Address): Promise<AssetEarnings> {
    interface VaultDataContainer {
      vault: Vault;
    }

    const query = `
    {
      vault(id: "${vaultAddress.toLowerCase()}") {
        id
        balanceTokens
        token {
          symbol
          id
          decimals
        }
        latestUpdate {
          pricePerShare
        }
        sharesSupply
      }
    }
    `;
    const response: VaultDataContainer = await this.yearn.services.subgraph.performQuery(
      query
    );
    const vault = response.vault;
    const earnings = calculateEarningsForVault(vault);
    const earningsUsdc = await this.tokensValueInUsdc(earnings, vault.token);
    const result: AssetEarnings = {
      assetId: vaultAddress,
      amount: earnings.toString(),
      amountUsdc: earningsUsdc.toString(),
      tokenId: vault.token.id
    };
    return result;
  }

  async accountEarnings(accountAddress: Address): Promise<AccountEarnings> {
    interface AccountContainer {
      account: Account;
    }

    interface Account {
      deposits: VaultInteraction[];
      sharesReceived: VaultInteraction[];
      sharesSent: VaultInteraction[];
      withdrawals: VaultInteraction[];
      vaultPositions: VaultPositionContainer[];
    }

    interface VaultIdContainer {
      id: string;
    }

    interface LatestUpdate {
      pricePerShare: string;
    }

    interface VaultIdWithLatestUpdateContainer extends VaultIdContainer {
      latestUpdate: LatestUpdate;
    }

    interface VaultInteraction {
      tokenAmount: string;
      vault: VaultIdContainer;
    }

    interface VaultPositionContainer {
      balanceShares: string;
      token: Token;
      shareToken: Token;
      vault: VaultIdWithLatestUpdateContainer;
    }

    interface VaultPosition extends VaultInteraction {
      balanceShares: string;
      token: Token;
      shareToken: Token;
      vault: VaultIdWithLatestUpdateContainer;
    }

    function sumTokenAmountsFromInteractions(
      interactions: VaultInteraction[],
      vaultAddress: string
    ): BigNumber {
      return interactions
        .filter(deposit => deposit.vault.id == vaultAddress)
        .map(deposit => BigNumber.from(deposit.tokenAmount))
        .reduce((total, amount) => total.add(amount), BigNumber.from(0));
    }

    const calculateEarningsForVaultPosition = async (
      vaultPosition: VaultPosition
    ): Promise<AssetEarnings> => {
      const vaultAddress = vaultPosition.vault.id;
      const depositsTotal = sumTokenAmountsFromInteractions(
        account.deposits,
        vaultAddress
      );
      const sharesReceivedTotal = sumTokenAmountsFromInteractions(
        account.sharesReceived,
        vaultAddress
      );
      const sharesSentTotal = sumTokenAmountsFromInteractions(
        account.sharesSent,
        vaultAddress
      );
      const withdrawalsTotal = sumTokenAmountsFromInteractions(
        account.withdrawals,
        vaultAddress
      );

      let positiveValues = BigNumber.from(vaultPosition.tokenAmount)
        .add(withdrawalsTotal)
        .add(sharesSentTotal);
      let negativeValues = depositsTotal.add(sharesReceivedTotal);

      var totalTokensEarned = BigNumber.from(0);

      if (positiveValues.gt(negativeValues)) {
        totalTokensEarned = positiveValues.sub(negativeValues);
      } else {
        throw new Error(
          `subtraction overthrow error while calculating earnings for vault ${vaultPosition.vault.id} with account address ${accountAddress}}`
        );
      }

      const totalEarnedUsdc = await this.tokensValueInUsdc(
        totalTokensEarned,
        vaultPosition.token
      );

      const result: AssetEarnings = {
        assetId: vaultPosition.vault.id,
        tokenId: vaultPosition.token.id,
        amount: totalTokensEarned.toString(),
        amountUsdc: totalEarnedUsdc.toString()
      };

      return result;
    };

    const query = `
      {
        account(id: "${accountAddress.toLowerCase()}") {
        sharesSent {
          tokenAmount
          vault {
            id
          }
        }
        sharesReceived {
          tokenAmount
          vault {
            id
          }
        }
        deposits {
          tokenAmount
          vault {
            id
          }
        }
        withdrawals {
          tokenAmount
          vault {
            id
          }
        }
        vaultPositions {
          balanceShares
          token {
            id
            symbol
            decimals
          }
          shareToken {
            id
            symbol
            decimals
          }
          vault {
            id
            latestUpdate {
                pricePerShare
            }
          }
        }
      }
    }
    `;

    const response: AccountContainer = await this.yearn.services.subgraph.performQuery(
      query
    );

    const account = response.account;

    const vaultPositions = account.vaultPositions.map(
      vaultPositionContainer => {
        const shares = BigNumber.from(vaultPositionContainer.balanceShares);
        const pricePerShare = BigNumber.from(
          vaultPositionContainer.vault.latestUpdate.pricePerShare
        );
        const decimals = BigNumber.from(vaultPositionContainer.token.decimals);
        const tokenAmount = shares
          .mul(pricePerShare)
          .div(BigNumber.from(10).pow(decimals));
        const result: VaultPosition = {
          balanceShares: vaultPositionContainer.balanceShares,
          token: vaultPositionContainer.token,
          shareToken: vaultPositionContainer.shareToken,
          vault: vaultPositionContainer.vault,
          tokenAmount: tokenAmount.toString()
        };
        return result;
      }
    );

    var earnings: AssetEarnings[] = [];
    var totalEarningsUsdc = BigNumber.from(0);
    for (const vaultPosition of vaultPositions) {
      const vaultUserEarnings = await calculateEarningsForVaultPosition(
        vaultPosition
      );
      earnings.push(vaultUserEarnings);
      totalEarningsUsdc = totalEarningsUsdc.add(
        BigNumber.from(vaultUserEarnings.amountUsdc)
      );
    }

    const result: AccountEarnings = {
      earnings: earnings,
      accountId: accountAddress,
      totalEarnedUsdc: totalEarningsUsdc.toString()
    };

    console.log(result);

    return result;
  }

  private async tokensValueInUsdc(
    tokenAmount: BigNumber,
    token: Token
  ): Promise<BigNumber> {
    const tokenUsdcPrice = await this.yearn.services.oracle.getPriceUsdc(
      token.id
    );
    return BigNumber.from(tokenUsdcPrice)
      .mul(tokenAmount)
      .div(BigNumber.from(10).pow(BigNumber.from(token.decimals)));
  }
}

function calculateEarningsForVault(vault: Vault): BigNumber {
  const pricePerShare = BigNumber.from(vault.latestUpdate.pricePerShare);
  const totalTokens = pricePerShare.mul(BigNumber.from(vault.sharesSupply));
  const earnedTokens = totalTokens
    .sub(BigNumber.from(vault.balanceTokens))
    .div(BigNumber.from(10).pow(BigNumber.from(vault.token.decimals)));
  return earnedTokens;
}
