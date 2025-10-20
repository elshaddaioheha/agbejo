'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// Note: SessionData is the correct type for pairing data in this version
import { HashConnect, HashConnectConnectionState, SessionData } from 'hashconnect'
import { LedgerId } from '@hashgraph/sdk'

interface WalletContextType {
  connected: boolean
  accountId: string | null
  connect: () => Promise<void>
  disconnect: () => void
  hashconnect: HashConnect | null
  pairingData: SessionData | null
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  accountId: null,
  connect: async () => {},
  disconnect: () => {},
  hashconnect: null,
  pairingData: null,
})

export const useWallet = () => useContext(WalletContext)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [hashconnect, setHashconnect] = useState<HashConnect | null>(null)
  const [pairingData, setPairingData] = useState<SessionData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initHashConnect = async () => {
      try {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id-here'
        
        const appMetadata = {
          name: 'Project Agbejo',
          description: 'Decentralized Escrow Service',
          icons: ['https://absolute.url/to/icon.png'],
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }

        const hc = new HashConnect(
          LedgerId.TESTNET,
          projectId,
          appMetadata,
          true // Enable debug mode
        )

        setHashconnect(hc)

        // This event will fire when a new session is created OR when an old one is restored on init
        hc.pairingEvent.on((pairing) => {
          console.log('Pairing event received:', pairing)
          setPairingData(pairing)
          if (pairing.accountIds && pairing.accountIds.length > 0) {
            setAccountId(pairing.accountIds[0])
            setConnected(true)
          }
        })

        hc.disconnectionEvent.on((data) => {
          console.log('Disconnection event received:', data)
          setPairingData(null)
          setAccountId(null)
          setConnected(false)
        })
        
        // Initialize HashConnect. This will try to restore any existing sessions.
        // If a session is restored, the `pairingEvent` above will be triggered.
        await hc.init()

      } catch (error) {
        console.error('Error initializing HashConnect:', error)
      }
    }

    initHashConnect()

  }, [mounted])

  const connect = async () => {
    if (!hashconnect) {
      console.error('HashConnect not initialized')
      return
    }

    try {
      // This opens the pairing modal for the user to connect a wallet
      await hashconnect.openPairingModal()
    } catch (error) {
      console.error('Error opening pairing modal:', error)
    }
  }

  const disconnect = async () => {
    if (hashconnect && pairingData) {
      try {
        await hashconnect.disconnect(pairingData.topic)
      } catch (error) {
        console.error('Error disconnecting:', error)
      } finally {
          // Reset state regardless of whether disconnect throws an error
          setConnected(false)
          setAccountId(null)
          setPairingData(null)
      }
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <WalletContext.Provider
      value={{
        connected,
        accountId,
        connect,
        disconnect,
        hashconnect,
        pairingData,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
