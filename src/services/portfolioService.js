import { supabase } from './supabaseClient'

export const portfolioService = {
  // Get all portfolios for current user
  getPortfolios: async () => {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create new portfolio
  createPortfolio: async (name) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('portfolios')
      .insert([{ name, user_id: user.id }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId) => {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
    
    if (error) throw error
  },

  // Get holdings for a portfolio
  getHoldings: async (portfolioId) => {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Add holding to portfolio
  addHolding: async (portfolioId, holding) => {
    const { data, error } = await supabase
      .from('holdings')
      .insert([{
        portfolio_id: portfolioId,
        symbol: holding.symbol,
        shares: holding.shares,
        purchase_price: holding.purchasePrice,
        purchase_date: holding.purchaseDate
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Update holding
  updateHolding: async (holdingId, updates) => {
    const { data, error } = await supabase
      .from('holdings')
      .update(updates)
      .eq('id', holdingId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete holding
  deleteHolding: async (holdingId) => {
    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('id', holdingId)
    
    if (error) throw error
  }
}
