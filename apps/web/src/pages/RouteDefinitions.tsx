import { t } from 'i18n'
import { useAtom } from 'jotai'
import { ReactNode, lazy, useMemo } from 'react'
import { Navigate, matchPath, useLocation } from 'react-router-dom'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { isBrowserRouterEnabled } from 'utils/env'
// High-traffic pages (index and /swap) should not be lazy-loaded.
import Swap from 'pages/Swap'

const NotFound = lazy(() => import('pages/NotFound'))

// this is the same svg defined in assets/images/blue-loader.svg
// it is defined here because the remote asset may not have had time to load when this file is executing
interface RouterConfig {
  browserRouterEnabled?: boolean
  hash?: string
  shouldDisableNFTRoutes?: boolean
}

/**
 * Convenience hook which organizes the router configuration into a single object.
 */
export function useRouterConfig(): RouterConfig {
  const browserRouterEnabled = isBrowserRouterEnabled()
  const { hash } = useLocation()
  const [shouldDisableNFTRoutes] = useAtom(shouldDisableNFTRoutesAtom)
  return useMemo(
    () => ({
      browserRouterEnabled,
      hash,
      shouldDisableNFTRoutes: Boolean(shouldDisableNFTRoutes),
    }),
    [browserRouterEnabled, hash, shouldDisableNFTRoutes],
  )
}

// SEO titles and descriptions sourced from https://docs.google.com/spreadsheets/d/1_6vSxGgmsx6QGEZ4mdHppv1VkuiJEro3Y_IopxUHGB4/edit#gid=0
// getTitle and getDescription are used as static metatags for SEO. Dynamic metatags should be set in the page component itself
const StaticTitlesAndDescriptions = {
  UniswapTitle: t('title.uniswapTradeCrypto'),
  SwapTitle: t('title.buySellTradeEthereum'),
  SwapDescription: t('title.swappingMadeSimple'),
  DetailsPageBaseTitle: t('common.buyAndSell'),
  TDPDescription: t('title.realTime'),
  PDPDescription: t('title.tradeTokens'),
  NFTTitle: t('title.explore'),
  MigrateTitle: t('title.migratev2'),
  MigrateDescription: t('title.easilyRemove'),
  AddLiquidityDescription: t('title.earnFees'),
}

export interface RouteDefinition {
  path: string
  nestedPaths: string[]
  getTitle: (path?: string) => string
  getDescription: (path?: string) => string
  enabled: (args: RouterConfig) => boolean
  getElement: (args: RouterConfig) => ReactNode
}

// Assigns the defaults to the route definition.
function createRouteDefinition(route: Partial<RouteDefinition>): RouteDefinition {
  return {
    getElement: () => null,
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
    enabled: () => true,
    path: '/',
    nestedPaths: [],
    // overwrite the defaults
    ...route,
  }
}

export const routes: RouteDefinition[] = [
  createRouteDefinition({
    path: '/',
    getTitle: () => StaticTitlesAndDescriptions.UniswapTitle,
    getDescription: () => StaticTitlesAndDescriptions.SwapDescription,
    getElement: () => {
      return <Navigate to="/swap"/>
    },
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/send',
    getElement: () => <Swap />,
    getTitle: () => t('title.sendTokens'),
  }),
  createRouteDefinition({
    path: '/limits',
    getElement: () => <Navigate to="/limit" replace />,
    getTitle: () => t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/limit',
    getElement: () => <Swap />,
    getTitle: () => t('title.placeLimit'),
  }),
  createRouteDefinition({
    path: '/buy',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '/swap',
    getElement: () => <Swap />,
    getTitle: () => StaticTitlesAndDescriptions.SwapTitle,
  }),
  createRouteDefinition({
    path: '*',
    getElement: () => <Navigate to="/not-found" replace />,
  }),
  createRouteDefinition({
    path: '/not-found',
    getElement: () => <NotFound />,
  }),
]

export const findRouteByPath = (pathname: string) => {
  for (const route of routes) {
    const match = matchPath(route.path, pathname)
    if (match) {
      return route
    }
    const subPaths = route.nestedPaths.map((nestedPath) => `${route.path}/${nestedPath}`)
    for (const subPath of subPaths) {
      const match = matchPath(subPath, pathname)
      if (match) {
        return route
      }
    }
  }
  return undefined
}
