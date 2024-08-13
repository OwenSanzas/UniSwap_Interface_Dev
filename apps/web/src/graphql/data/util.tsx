import { DeepPartial } from '@apollo/client/utilities'
import { DataTag, DefaultError, QueryKey, UndefinedInitialDataOptions, queryOptions } from '@tanstack/react-query'
import { Currency, Token } from '@uniswap/sdk-core'
import {
  AVERAGE_L1_BLOCK_TIME,
  CHAIN_NAME_TO_CHAIN_ID,
  GQL_MAINNET_CHAINS,
  InterfaceGqlChain,
  SupportedInterfaceChainId,
  UX_SUPPORTED_GQL_CHAINS,
  chainIdToBackendChain,
  isSupportedChainId,
} from 'constants/chains'
import { NATIVE_CHAIN_ID, WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'constants/tokens'
import { DefaultTheme } from 'lib/styled-components'
import ms from 'ms'
import { ThemeColors } from 'theme/colors'
import {
  Chain,
  ContractInput,
  Token as GqlToken,
  PriceSource,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export enum PollingInterval {
  Slow = ms(`5m`),
  Normal = ms(`1m`),
  Fast = AVERAGE_L1_BLOCK_TIME,
  LightningMcQueen = ms(`3s`), // approx block interval for polygon
}

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
}

/** Used for making graphql queries to all chains supported by the graphql backend. Must be mutable for some apollo typechecking. */
export const GQL_MAINNET_CHAINS_MUTABLE = GQL_MAINNET_CHAINS.map((c) => c)

export function toContractInput(currency: Currency): ContractInput {
  const chain = chainIdToBackendChain({ chainId: currency.chainId as SupportedInterfaceChainId })
  return { chain, address: currency.isToken ? currency.address : getNativeTokenDBAddress(chain) }
}

export function gqlToCurrency(token: DeepPartial<GqlToken>): Currency | undefined {
  if (!token.chain) {
    return undefined
  }
  const chainId = supportedChainIdFromGQLChain(token.chain)
  if (!chainId) {
    return undefined
  }
  if (token.standard === TokenStandard.Native || token.address === NATIVE_CHAIN_ID || !token.address) {
    return nativeOnChain(chainId)
  } else {
    return new Token(
      chainId,
      token.address,
      token.decimals ?? 18,
      token.symbol ?? undefined,
      token.project?.name ?? token.name ?? undefined,
    )
  }
}

export function fiatOnRampToCurrency(forCurrency: FORSupportedToken): Currency | undefined {
  if (!isSupportedChainId(Number(forCurrency.chainId))) {
    return
  }
  const supportedChainId = Number(forCurrency.chainId) as SupportedInterfaceChainId

  if (!forCurrency.address) {
    return nativeOnChain(supportedChainId)
  } else {
    // The Meld code may not match the currency's symbol (e.g. codes like USDC_BASE), so these should not be used for display.
    return new Token(supportedChainId, forCurrency.address, 18, forCurrency.cryptoCurrencyCode, forCurrency.displayName)
  }
}

export function isSupportedGQLChain(chain: Chain): chain is InterfaceGqlChain {
  const chains: ReadonlyArray<Chain> = UX_SUPPORTED_GQL_CHAINS
  return chains.includes(chain)
}

export function supportedChainIdFromGQLChain(chain: InterfaceGqlChain): SupportedInterfaceChainId
export function supportedChainIdFromGQLChain(chain: Chain): SupportedInterfaceChainId | undefined
export function supportedChainIdFromGQLChain(chain: Chain): SupportedInterfaceChainId | undefined {
  return isSupportedGQLChain(chain) ? CHAIN_NAME_TO_CHAIN_ID[chain] : undefined
}

export function getTokenDetailsURL({
  address,
  chain,
  inputAddress,
}: {
  address?: string | null
  chain: Chain
  inputAddress?: string | null
}) {
  const chainName = chain.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  return `/explore/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}`
}

export function getPoolDetailsURL(address: string, chain: Chain) {
  const chainName = chain.toLowerCase()
  return `/explore/pools/${chainName}/${address}`
}

export function unwrapToken<
  T extends
    | {
        address?: string | null
        project?: { name?: string | null }
      }
    | undefined,
>(chainId: number, token: T): T {
  if (!token?.address) {
    return token
  }

  const address = token.address.toLowerCase()
  const nativeAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase()
  if (address !== nativeAddress) {
    return token
  }

  const nativeToken = nativeOnChain(chainId)

  return {
    ...token,
    ...nativeToken,
    project: {
      ...token.project,
      name: nativeToken.name,
    },
    address: NATIVE_CHAIN_ID,
    extensions: undefined, // prevents marking cross-chain wrapped tokens as native
  }
}

type ProtocolMeta = { name: string; color: keyof ThemeColors }
const PROTOCOL_META: { [source in PriceSource]: ProtocolMeta } = {
  [PriceSource.SubgraphV2]: { name: 'v2', color: 'accent3' },
  [PriceSource.SubgraphV3]: { name: 'v3', color: 'accent1' },
  /* [PriceSource.UniswapX]: { name: 'UniswapX', color: purple } */
}

export function getProtocolColor(priceSource: PriceSource, theme: DefaultTheme): string {
  return theme[PROTOCOL_META[priceSource].color]
}

export function getProtocolName(priceSource: PriceSource): string {
  return PROTOCOL_META[priceSource].name
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * A wrapper around react-query's queryOptions that disables its caching
 * behavior, so that we can use the Apollo client in the queryFn without
 * worrying about the caches conflicting.
 */
export function apolloQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Pick<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
): Pick<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData>
  },
  'queryKey' | 'queryFn'
> {
  return queryOptions({
    ...options,
    staleTime: 0,
  })
}
