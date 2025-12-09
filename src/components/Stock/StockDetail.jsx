import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Percent } from 'lucide-react'
import { stockAPI } from '../../services/stockAPI'

export default function StockDetail({ symbol, onAddToPortfolio }) {
  const [quote, setQuote] = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStockData()
  }, [symbol])

  const loadStockData = async () => {
    setLoading(true)
    const [quoteData, overviewData] = await Promise.all([
      stockAPI.getQuote(symbol),
      stockAPI.getOverview(symbol)
    ])
    setQuote(quoteData)
    setOverview(overviewData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (!quote || !overview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Unable to load stock data. Please try again.</p>
      </div>
    )
  }

  const price = parseFloat(quote['05. price'])
  const change = parseFloat(quote['09. change'])
  const changePercent = parseFloat(quote['10. change percent']?.replace('%', ''))
  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold">{symbol}</h2>
            <p className="text-indigo-100 mt-1">{overview.Name}</p>
          </div>
          <button
            onClick={() => onAddToPortfolio?.({ symbol, name: overview.Name, price })}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Add to Portfolio
          </button>
        </div>

        <div className="mt-6">
          <div className="text-4xl font-bold">${price.toFixed(2)}</div>
          <div className={`flex items-center gap-2 mt-2 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="text-lg font-semibold">
              {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
            <span className="text-indigo-200 text-sm">Today</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Company Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Exchange</span>
              <span className="font-medium">{overview.Exchange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sector</span>
              <span className="font-medium">{overview.Sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Industry</span>
              <span className="font-medium">{overview.Industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap</span>
              <span className="font-medium">
                ${(parseFloat(overview.MarketCapitalization) / 1e9).toFixed(2)}B
              </span>
            </div>
          </div>
        </div>

        {/* Dividend Info */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-green-600" />
            Dividend Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dividend Yield</span>
              <span className="font-medium">
                {overview.DividendYield ? `${(parseFloat(overview.DividendYield) * 100).toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dividend Per Share (Yearly)</span>
              <span className="font-medium">
                {overview.DividendPerShare ? `$${parseFloat(overview.DividendPerShare).toFixed(2)}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ex-Dividend Date</span>
              <span className="font-medium">{overview.ExDividendDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payout Ratio</span>
              <span className="font-medium">
                {overview.PayoutRatio ? `${(parseFloat(overview.PayoutRatio) * 100).toFixed(0)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Valuation Metrics */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Valuation</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">P/E Ratio</span>
              <span className="font-medium">{overview.PERatio || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EPS</span>
              <span className="font-medium">{overview.EPS || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Book Value</span>
              <span className="font-medium">{overview.BookValue || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ROE</span>
              <span className="font-medium">
                {overview.ReturnOnEquityTTM ? `${(parseFloat(overview.ReturnOnEquityTTM) * 100).toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Trading Info */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Trading Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">52 Week High</span>
              <span className="font-medium">${parseFloat(overview['52WeekHigh']).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">52 Week Low</span>
              <span className="font-medium">${parseFloat(overview['52WeekLow']).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">50 Day MA</span>
              <span className="font-medium">${parseFloat(overview['50DayMovingAverage']).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">200 Day MA</span>
              <span className="font-medium">${parseFloat(overview['200DayMovingAverage']).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {overview.Description && (
        <div className="px-6 pb-6">
          <h3 className="font-semibold text-gray-800 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{overview.Description}</p>
        </div>
      )}
    </div>
  )
}