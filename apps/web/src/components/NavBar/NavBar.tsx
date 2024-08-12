import { Bag } from 'components/NavBar/Bag'
import { ChainSelector } from 'components/NavBar/ChainSelector'
import { CompanyMenu } from 'components/NavBar/CompanyMenu'
import { PreferenceMenu } from 'components/NavBar/PreferencesMenu'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { Tabs } from 'components/NavBar/Tabs/Tabs'
import Row from 'components/Row'
import Web3Status from 'components/Web3Status'
import { useAccount } from 'hooks/useAccount'
import { useIsLimitPage } from 'hooks/useIsLimitPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsSendPage } from 'hooks/useIsSendPage'
import { useIsSwapPage } from 'hooks/useIsSwapPage'
import styled, { css } from 'lib/styled-components'
import { useProfilePageState } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const Nav = styled.nav`
  padding: 0px 12px;
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: ${Z_INDEX.sticky};
  display: flex;
  align-items: center;
  justify-content: center;
`
const NavContents = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1 auto 1;
`
const NavItems = css`
  gap: 12px;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 4px;
  }
`
const Left = styled(Row)`
  display: flex;
  align-items: center;
  wrap: nowrap;
  ${NavItems}
`
const Right = styled(Row)`
  justify-content: flex-end;
  align-self: flex-end;
  ${NavItems}
`

export const RefreshedNavbar = () => {
  const isNftPage = useIsNftPage()
  const isSendPage = useIsSendPage()
  const isSwapPage = useIsSwapPage()
  const isLimitPage = useIsLimitPage()

  const sellPageState = useProfilePageState((state) => state.state)
  const areTabsVisible = useTabsVisible()
  const account = useAccount()

  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)
  const hideChainSelector = multichainUXEnabled ? isSendPage || isSwapPage || isLimitPage || isNftPage : isNftPage

  return (
    <Nav>
      <NavContents>
        <Left>
          <CompanyMenu />
          {areTabsVisible && <Tabs />}
        </Left>

        <Right>
          {isNftPage && sellPageState !== ProfilePageStateType.LISTING && <Bag />}
          {!account.isConnected && !account.isConnecting && <PreferenceMenu />}
          {!hideChainSelector && <ChainSelector />}
          <Web3Status />
        </Right>
      </NavContents>
    </Nav>
  )
}
