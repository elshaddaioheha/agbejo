'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect'

interface WalletContextType {
  connected: boolean
  accountId: string | null
  connect: () => Promise<void>
  disconnect: () => void
  hashconnect: HashConnect | null
  topic: string
  pairingData: HashConnectTypes.SavedPairingData | null
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  accountId: null,
  connect: async () => {},
  disconnect: () => {},
  hashconnect: null,
  topic: '',
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
  const [topic, setTopic] = useState('')
  const [pairingData, setPairingData] = useState<HashConnectTypes.SavedPairingData | null>(null)
  const [mounted, setMounted] = useState(false)

  // Only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initHashConnect = async () => {
      try {
        const hc = new HashConnect()
        setHashconnect(hc)

        // Initialize HashConnect
        const appMetadata: HashConnectTypes.AppMetadata = {
          name: 'Project Agbejo',
          description: 'Decentralized Escrow Service',
          icon: 'https://absolute.url/to/icon.png',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }

        const initData = await hc.init(appMetadata, 'testnet', false)
        setTopic(initData.topic)

        // Set up pairing event listener
        hc.pairingEvent.on((data: MessageTypes.ApprovePairing) => {
          console.log('Pairing event:', data)
          setPairingData(data.pairingData!)
          setAccountId(data.accountIds![0])
          setConnected(true)
        })

        // Check for existing pairing
        const savedPairings = hc.hcData.savedPairings
        if (savedPairings && savedPairings.length > 0) {
          const lastPairing = savedPairings[savedPairings.length - 1]
          setPairingData(lastPairing)
          setAccountId(lastPairing.accountIds[0])
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
      await hashconnect.connectToLocalWallet()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnect = () => {
    if (hashconnect && pairingData) {
      hashconnect.disconnect(pairingData.topic)
      setConnected(false)
      setAccountId(null)
      setPairingData(null)
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
        topic,
        pairingData,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
