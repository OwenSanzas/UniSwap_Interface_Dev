import { useIsTouchDevice } from '@tamagui/core'
import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { NavIcon } from 'components/Logo/NavIcon'
import { MenuDropdown } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { MobileMenuDrawer } from 'components/NavBar/CompanyMenu/MobileMenuDrawer'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import { useScreenSize } from 'hooks/screenSize'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Popover, Text } from 'ui/src'
import { Hamburger } from 'ui/src/components/icons'
import logo from './DeFiner_Labs_Logomark_dark.png'

const ArrowDown = styled(ArrowChangeDown)<{ $isActive: boolean }>`
  height: 100%;
  color: ${({ $isActive, theme }) => ($isActive ? theme.neutral1 : theme.neutral2)};
`
const Trigger = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  &:hover {
    ${ArrowDown} {
      color: ${({ theme }) => theme.neutral1} !important;
    }
  }
`
const UniIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null)
  const isSmallScreen = !useScreenSize()['sm']
  const isMobileDrawer = useIsMobileDrawer()
  const isLargeScreen = useScreenSize()['xl']
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  const handleLogoClick = useCallback(() => {
    navigate({
      pathname: '/swap',
      search: '',
    })
  }, [navigate])
  const isTouchDevice = useIsTouchDevice()

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Trigger>
        <img src={logo} alt="Logo" width="48" height="48" onClick={handleLogoClick} />
          {isLargeScreen && (
            <Text variant="subheading1" color="$accent1" userSelect="none">
              DeFiner Labs
            </Text>
          )}
          {(isSmallScreen || isTouchDevice) && <Hamburger size={22} color="$neutral2" cursor="pointer" ml="16px" />}
          <ArrowDown $isActive={isOpen} width="12px" height="12px" />
        </Trigger>
      </Popover.Trigger>
      {isMobileDrawer ? <MobileMenuDrawer isOpen={isOpen} closeMenu={closeMenu} /> : <MenuDropdown close={closeMenu} />}
    </Popover>
  )
}
