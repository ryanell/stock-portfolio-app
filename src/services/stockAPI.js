const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY
const BASE_URL = 'https://www.alphavantage.co/query'

export const stockAPI = {
  // Search for stocks/ETFs
  searchSymbol: async (keywords) => {
    try {
      const response = await fetch(
        `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      return data.bestMatches || []
    } catch (error) {
      console.error('Error searching symbol:', error)
      return []
    }
  },

  // Get current quote
  getQuote: async (symbol) => {
    try {
      const response = await fetch(
        `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      return data['Global Quote'] || null
    } catch (error) {
      console.error('Error fetching quote:', error)
      return null
    }
  },

  // Get company overview (includes dividend info)
  getOverview: async (symbol) => {
    try {
      const response = await fetch(
        `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching overview:', error)
      return null
    }
  },

  // Get historical prices
  getHistory: async (symbol, outputsize = 'compact') => {
    try {
      const response = await fetch(
        `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      return data['Time Series (Daily)'] || null
    } catch (error) {
      console.error('Error fetching history:', error)
      return null
    }
  }
}
