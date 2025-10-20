'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

  // Only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initHashConnect = async () => {
      try {
        // Get WalletConnect Project ID from environment or use a default
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id-here'
        
        const appMetadata = {
          name: 'Project Agbejo',
          description: 'Decentralized Escrow Service',
          icons: ['https://absolute.url/to/icon.png'],
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }

        // Initialize HashConnect v3
        const hc = new HashConnect(
          LedgerId.TESTNET,
          projectId,
          appMetadata,
          true // debug mode
        )

        setHashconnect(hc)

        // Set up event listeners
        hc.pairingEvent.on((newPairing) => {
          console.log('Pairing event:', newPairing)
          setPairingData(newPairing)
          if (newPairing.accountIds && newPairing.accountIds.length > 0) {
            setAccountId(newPairing.accountIds[0])
            setConnected(true)
          }
        })

        hc.disconnectionEvent.on(() => {
          console.log('Disconnection event')
          setPairingData(null)
          setAccountId(null)
          setConnected(false)
        })

        hc.connectionStatusChangeEvent.on((state) => {
          console.log('Connection status changed:', state)
          setConnected(state === HashConnectConnectionState.Paired)
        })

        // Initialize
        await hc.init()

        // Check for existing pairings
        const existingPairings = hc.getConnectedAccountIds()
        if (existingPairings && existingPairings.length > 0) {
          setAccountId(existingPairings[0])
          setConnected(true)
        }
      } catch (error) {
        console.error('Error initializing HashConnect:', error)
      }
    }

    initHashConnect()

    return () => {
      if (hashconnect) {
        // Cleanup if needed
      }
    }
  }, [mounted])

  const connect = async () => {
    if (!hashconnect) {
      console.error('HashConnect not initialized')
      return
    }

    try {
      // Open pairing modal
      await hashconnect.openPairingModal()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnect = async () => {
    if (hashconnect && pairingData) {
      try {
        await hashconnect.disconnect(pairingData.topic)
        setConnected(false)
        setAccountId(null)
        setPairingData(null)
      } catch (error) {
        console.error('Error disconnecting:', error)
      }
    }
  }

  // Don't render until mounted to avoid hydration issues
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
