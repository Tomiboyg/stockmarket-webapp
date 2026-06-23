import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import type { Holding, TradeTransaction } from '../types'

interface PortfolioContextType {
  cash: number
  holdings: Holding[]
  transactions: TradeTransaction[]
  loading: boolean
  buyStock: (symbol: string, shares: number, price: number) => Promise<{ success: boolean; error?: string }>
  sellStock: (symbol: string, shares: number, price: number) => Promise<{ success: boolean; error?: string }>
  resetPortfolio: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cash, setCash] = useState(100000)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<TradeTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPortfolio = useCallback(async (userId: string) => {
    const [profileRes, holdingsRes, txRes] = await Promise.all([
      supabase.from('profiles').select('cash_balance').eq('id', userId).single(),
      supabase.from('holdings').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('executed_at', { ascending: false }),
    ])
    if (profileRes.data) setCash(Number(profileRes.data.cash_balance))
    if (holdingsRes.data) setHoldings(holdingsRes.data as Holding[])
    if (txRes.data) setTransactions(txRes.data as TradeTransaction[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchPortfolio(user.id)
  }, [user, fetchPortfolio])

  const buyStock = async (symbol: string, shares: number, price: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }
    const totalCost = shares * price
    if (cash < totalCost) return { success: false, error: 'Insufficient funds' }

    const newCash = cash - totalCost
    const existing = holdings.find((h) => h.symbol === symbol)
    let newAvgPrice = price
    let newShares = shares
    if (existing) {
      newAvgPrice = ((existing.shares * existing.average_buy_price) + totalCost) / (existing.shares + shares)
      newShares = existing.shares + shares
    }

    const { error: cashError } = await supabase.from('profiles').update({ cash_balance: newCash }).eq('id', user.id)
    if (cashError) return { success: false, error: cashError.message }

    if (existing) {
      await supabase
        .from('holdings')
        .update({ shares: newShares, average_buy_price: Math.round(newAvgPrice * 100) / 100, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('symbol', symbol)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id,
        symbol,
        shares: newShares,
        average_buy_price: Math.round(newAvgPrice * 100) / 100,
      })
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      symbol,
      type: 'BUY',
      shares,
      price,
      total_amount: Math.round(totalCost * 100) / 100,
    })

    await fetchPortfolio(user.id)
    return { success: true }
  }

  const sellStock = async (symbol: string, shares: number, price: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }
    const holding = holdings.find((h) => h.symbol === symbol)
    if (!holding || holding.shares < shares) return { success: false, error: 'Not enough shares' }

    const totalProceeds = shares * price
    const newCash = cash + totalProceeds
    const remainingShares = holding.shares - shares

    const { error: cashError } = await supabase.from('profiles').update({ cash_balance: newCash }).eq('id', user.id)
    if (cashError) return { success: false, error: cashError.message }

    if (remainingShares === 0) {
      await supabase.from('holdings').delete().eq('user_id', user.id).eq('symbol', symbol)
    } else {
      await supabase
        .from('holdings')
        .update({ shares: remainingShares, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('symbol', symbol)
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      symbol,
      type: 'SELL',
      shares,
      price,
      total_amount: Math.round(totalProceeds * 100) / 100,
    })

    await fetchPortfolio(user.id)
    return { success: true }
  }

  const resetPortfolio = async () => {
    if (!user) return
    await supabase.from('profiles').update({ cash_balance: 100000 }).eq('id', user.id)
    await supabase.from('holdings').delete().eq('user_id', user.id)
    await supabase.from('transactions').delete().eq('user_id', user.id)
    await fetchPortfolio(user.id)
  }

  return (
    <PortfolioContext.Provider value={{ cash, holdings, transactions, loading, buyStock, sellStock, resetPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}
