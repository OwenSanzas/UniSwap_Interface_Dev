import styled from 'lib/styled-components'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from './logo.svg'

const Trigger = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
`

export function CompanyMenu() {
  const navigate = useNavigate()
  const handleLogoClick = useCallback(() => {
    navigate({pathname: '/swap'})
  }, [navigate])

  return (
    <Trigger>
      <img src={logo} alt="Logo" width="80" height="80" onClick={handleLogoClick} />
    </Trigger>
  )
}
