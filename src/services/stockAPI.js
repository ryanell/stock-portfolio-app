const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY
const AV_BASE_URL = 'https://www.alphavantage.co/query'
const FH_BASE_URL = 'https://finnhub.io/api/v1'

// Helper to normalize Finnhub data to Alpha Vantage format
const normalizeFinnhubQuote = (data) => {
  if (!data || !data.c) return null
  
  const change = data.c - data.pc
  const changePercent = data.pc > 0 ? ((change / data.pc) * 100) : 0
  
  return {
    '05. price': data.c.toString(),
    '09. change': change.toString(),
    '10. change percent': changePercent.toFixed(2) + '%'
  }
}

const normalizeFinnhubProfile = (profile, metrics) => {
  if (!profile) return null
  
  // Finnhub's dividend data can be inconsistent. Use currentDividendYieldTTM as primary source
  // It's already a percentage, so divide by 100 to match Alpha Vantage decimal format
  const dividendYield = metrics?.currentDividendYieldTTM 
    ? (metrics.currentDividendYieldTTM / 100).toString() 
    : (metrics?.dividendYieldIndicatedAnnual ? (metrics.dividendYieldIndicatedAnnual / 100).toString() : null)
  
  // Use dividendPerShareTTM as it's more current than annual
  const dividendPerShare = metrics?.dividendPerShareTTM?.toString() 
    || metrics?.dividendPerShareAnnual?.toString() 
    || null
  
  return {
    Name: profile.name || '',
    Exchange: profile.exchange || '',
    Sector: profile.finnhubIndustry || '',
    Industry: profile.finnhubIndustry || '',
    MarketCapitalization: profile.marketCapitalization ? (profile.marketCapitalization * 1000000).toString() : '0',
    Description: profile.description || '',
    DividendYield: dividendYield,
    DividendPerShare: dividendPerShare,
    '52WeekHigh': metrics?.['52WeekHigh']?.toString() || profile['52WeekHigh']?.toString() || '0',
    '52WeekLow': metrics?.['52WeekLow']?.toString() || profile['52WeekLow']?.toString() || '0',
    PERatio: metrics?.peBasicExclExtraTTM?.toString() || '0',
    EPS: metrics?.epsBasicExclExtraItemsTTM?.toString() || '0',
    BookValue: metrics?.bookValuePerShareAnnual?.toString() || '0',
    PayoutRatio: metrics?.payoutRatioTTM ? (metrics.payoutRatioTTM / 100).toString() : null,
    ExDividendDate: null,
    ReturnOnEquityTTM: metrics?.roeTTM ? (metrics.roeTTM / 100).toString() : null,
    '50DayMovingAverage': metrics?.['50DayMovingAverage']?.toString() || 'N/A',
    '200DayMovingAverage': metrics?.['200DayMovingAverage']?.toString() || 'N/A'
  }
}

export const stockAPI = {
  // Search for stocks/ETFs
  searchSymbol: async (keywords) => {
    // Try Alpha Vantage first
    try {
      const response = await fetch(
        `${AV_BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      
      // Check for rate limit or error
      if (data.Note || data['Error Message']) {
        throw new Error('Alpha Vantage rate limit or error')
      }
      
      if (data.bestMatches && data.bestMatches.length > 0) {
        return data.bestMatches
      }
    } catch (error) {
      console.log('Alpha Vantage search failed, trying Finnhub:', error.message)
    }

    // Fallback to Finnhub
    try {
      const response = await fetch(
        `${FH_BASE_URL}/search?q=${keywords}&token=${FINNHUB_KEY}`
      )
      const data = await response.json()
      
      // Convert Finnhub format to Alpha Vantage format
      if (data.result && data.result.length > 0) {
        return data.result.slice(0, 10).map(item => ({
          '1. symbol': item.symbol,
          '2. name': item.description,
          '3. type': item.type,
          '4. region': 'US'
        }))
      }
      
      return []
    } catch (error) {
      console.error('Finnhub search error:', error)
      return []
    }
  },

  // Get current quote
  getQuote: async (symbol) => {
    // Try Alpha Vantage first
    try {
      const response = await fetch(
        `${AV_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      
      // Check for rate limit or error
      if (data.Note || data['Error Message']) {
        throw new Error('Alpha Vantage rate limit or error')
      }
      
      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        return data['Global Quote']
      }
    } catch (error) {
      console.log('Alpha Vantage quote failed, trying Finnhub:', error.message)
    }

    // Fallback to Finnhub
    try {
      const response = await fetch(
        `${FH_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
      )
      const data = await response.json()
      
      return normalizeFinnhubQuote(data)
    } catch (error) {
      console.error('Finnhub quote error:', error)
      return null
    }
  },

  // Get company overview (includes dividend info)
  getOverview: async (symbol) => {
    // Try Alpha Vantage first
    try {
      const response = await fetch(
        `${AV_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      
      // Check for rate limit or error
      if (data.Note || data['Error Message']) {
        throw new Error('Alpha Vantage rate limit or error')
      }
      
      if (data.Symbol) {
        return data
      }
    } catch (error) {
      console.log('Alpha Vantage overview failed, trying Finnhub:', error.message)
    }

    // Fallback to Finnhub - need two calls for complete data
    try {
      const [profileRes, metricsRes] = await Promise.all([
        fetch(`${FH_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
        fetch(`${FH_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_KEY}`)
      ])
      
      const profile = await profileRes.json()
      const metricsData = await metricsRes.json()
      const metrics = metricsData.metric
      
      return normalizeFinnhubProfile(profile, metrics)
    } catch (error) {
      console.error('Finnhub overview error:', error)
      return null
    }
  },

  // Get historical prices
  getHistory: async (symbol, outputsize = 'compact') => {
    // Try Alpha Vantage first
    try {
      const response = await fetch(
        `${AV_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      
      // Check for rate limit or error
      if (data.Note || data['Error Message']) {
        throw new Error('Alpha Vantage rate limit or error')
      }
      
      if (data['Time Series (Daily)']) {
        return data['Time Series (Daily)']
      }
    } catch (error) {
      console.log('Alpha Vantage history failed, trying Finnhub:', error.message)
    }

    // Fallback to Finnhub
    try {
      const to = Math.floor(Date.now() / 1000)
      const from = outputsize === 'compact' 
        ? to - (100 * 24 * 60 * 60) // 100 days
        : to - (365 * 24 * 60 * 60) // 1 year
      
      const response = await fetch(
        `${FH_BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`
      )
      const data = await response.json()
      
      if (data.s === 'ok' && data.t) {
        // Convert Finnhub format to Alpha Vantage format
        const timeSeries = {}
        for (let i = 0; i < data.t.length; i++) {
          const date = new Date(data.t[i] * 1000).toISOString().split('T')[0]
          timeSeries[date] = {
            '1. open': data.o[i].toString(),
            '2. high': data.h[i].toString(),
            '3. low': data.l[i].toString(),
            '4. close': data.c[i].toString(),
            '5. volume': data.v[i].toString()
          }
        }
        return timeSeries
      }
      
      return null
    } catch (error) {
      console.error('Finnhub history error:', error)
      return null
    }
  }
}