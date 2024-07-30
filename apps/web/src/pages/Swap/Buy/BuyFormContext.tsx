import { skipToken } from '@reduxjs/toolkit/query/react'
import { buildCurrencyInfo } from 'constants/routing'
import { nativeOnChain } from 'constants/tokens'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import { t } from 'i18next'
import { useFiatOnRampSupportedTokens, useMeldFiatCurrencyInfo } from 'pages/Swap/Buy/hooks'
import { formatFiatOnRampFiatAmount } from 'pages/Swap/Buy/shared'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import {
  FORCountry,
  FORQuoteResponse,
  FORSupportedCountriesResponse,
  FiatCurrencyInfo,
  FiatOnRampCurrency,
} from 'uniswap/src/features/fiatOnRamp/types'
import {
  InvalidRequestAmountTooLow,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useAccount } from 'wagmi'
import { USDT } from 'constants/tokens'

class BuyFormError extends Error {
  constructor(public readonly message: string) {
    super(message)
  }
}

type BuyFormState = {
  readonly inputAmount: string
  readonly quoteCurrency: FiatOnRampCurrency
  readonly selectedCountry?: FORCountry
  readonly countryModalOpen: boolean
  readonly currencyModalOpen: boolean
  readonly providerModalOpen: boolean
}

type BuyInfo = {
  readonly meldSupportedFiatCurrency?: FiatCurrencyInfo
  readonly notAvailableInThisRegion: boolean
  readonly countryOptionsResult?: FORSupportedCountriesResponse
  readonly supportedTokens?: FiatOnRampCurrency[]
  readonly amountOut?: string
  readonly amountOutLoading?: boolean
  readonly quotes?: FORQuoteResponse
  readonly fetchingQuotes: boolean
  readonly error?: BuyFormError
}

type BuyFormContextType = {
  buyFormState: BuyFormState
  setBuyFormState: Dispatch<SetStateAction<BuyFormState>>
  derivedBuyFormInfo: BuyInfo
}

// const account = useAccount();
// const chainId = account.chainId ?? UniverseChainId.Mainnet;

// TODO, change token with account.chainId
export const ethCurrencyInfo = buildCurrencyInfo(USDT)
const DEFAULT_BUY_FORM_STATE: BuyFormState = {
  inputAmount: '',
  quoteCurrency: {
    currencyInfo: ethCurrencyInfo,
    meldCurrencyCode: 'USDT',
  },
  selectedCountry: undefined,
  countryModalOpen: false,
  currencyModalOpen: false,
  providerModalOpen: false,
}

export const BuyFormContext = createContext<BuyFormContextType>({
  buyFormState: DEFAULT_BUY_FORM_STATE,
  setBuyFormState: () => undefined,
  derivedBuyFormInfo: {
    meldSupportedFiatCurrency: undefined,
    notAvailableInThisRegion: false,
    countryOptionsResult: undefined,
    supportedTokens: [],
    amountOut: undefined,
    amountOutLoading: false,
    quotes: undefined,
    fetchingQuotes: false,
    error: undefined,
  },
})

export function useBuyFormContext() {
  return useContext(BuyFormContext)
}

function useDerivedBuyFormInfo(state: BuyFormState): BuyInfo {
  const account = useAccount()
  const { formattedAmount: amountOut, loading: amountOutLoading } = useUSDTokenUpdater(
    true /* inputInFiat */,
    state.inputAmount,
    state.quoteCurrency?.currencyInfo?.currency,
  )

  const { meldSupportedFiatCurrency, notAvailableInThisRegion } = useMeldFiatCurrencyInfo(state.selectedCountry)

  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery()
  const supportedTokens = useFiatOnRampSupportedTokens(meldSupportedFiatCurrency, state.selectedCountry?.countryCode)

  const {
    data: quotes,
    isFetching: fetchingQuotes,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    state.inputAmount &&
      state.inputAmount !== '' &&
      account.address &&
      state.selectedCountry?.countryCode &&
      state.quoteCurrency &&
      meldSupportedFiatCurrency
      ? {
          sourceAmount: parseFloat(state.inputAmount),
          sourceCurrencyCode: meldSupportedFiatCurrency.code,
          destinationCurrencyCode: state.quoteCurrency.meldCurrencyCode ?? 'ETH',
          countryCode: state.selectedCountry.countryCode,
          walletAddress: account.address,
          state: state.selectedCountry.state,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  )

  const error = useMemo(() => {
    if (quotesError && isFiatOnRampApiError(quotesError)) {
      if (isInvalidRequestAmountTooLow(quotesError)) {
        const formattedAmount = formatFiatOnRampFiatAmount(
          (quotesError as InvalidRequestAmountTooLow).data.context.minimumAllowed,
          meldSupportedFiatCurrency,
        )
        return new BuyFormError(t(`fiatOnRamp.error.min`, { amount: formattedAmount }))
      }
      if (isInvalidRequestAmountTooHigh(quotesError)) {
        const formattedAmount = formatFiatOnRampFiatAmount(
          quotesError.data.context.maximumAllowed,
          meldSupportedFiatCurrency,
        )
        return new BuyFormError(t(`fiatOnRamp.error.max`, { amount: formattedAmount }))
      }
      return new BuyFormError(t('common.somethingWentWrong.error'))
    }
    return undefined
  }, [meldSupportedFiatCurrency, quotesError])

  return useMemo(
    () => ({
      amountOut,
      amountOutLoading,
      notAvailableInThisRegion,
      meldSupportedFiatCurrency,
      supportedTokens,
      countryOptionsResult,
      quotes,
      fetchingQuotes,
      error,
    }),
    [
      amountOut,
      amountOutLoading,
      countryOptionsResult,
      error,
      fetchingQuotes,
      meldSupportedFiatCurrency,
      notAvailableInThisRegion,
      quotes,
      supportedTokens,
    ],
  )
}

export function BuyFormContextProvider({ children }: PropsWithChildren) {
  const [buyFormState, setBuyFormState] = useState<BuyFormState>({ ...DEFAULT_BUY_FORM_STATE })
  const derivedBuyFormInfo = useDerivedBuyFormInfo(buyFormState)

  const value = useMemo(
    () => ({
      buyFormState,
      setBuyFormState,
      derivedBuyFormInfo,
    }),
    [buyFormState, derivedBuyFormInfo],
  )

  return <BuyFormContext.Provider value={value}>{children}</BuyFormContext.Provider>
}
