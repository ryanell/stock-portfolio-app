import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Trash2, DollarSign } from 'lucide-react'
import { portfolioService } from '../../services/portfolioService'
import { stockAPI } from '../../services/stockAPI'

export default function HoldingsList({ portfolioId }) {
  const [holdings, setHoldings] = useState([])
  const [holdingsWithData, setHoldingsWithData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (portfolioId) {
      loadHoldings()
    }
  }, [portfolioId])

  const loadHoldings = async () => {
    setLoading(true)
    try {
      const data = await portfolioService.getHoldings(portfolioId)
      setHoldings(data)
      
      // Fetch current prices for each holding
      const enrichedHoldings = await Promise.all(
        data.map(async (holding) => {
          const quote = await stockAPI.getQuote(holding.symbol)
          const overview = await stockAPI.getOverview(holding.symbol)
          return {
            ...holding,
            currentPrice: quote ? parseFloat(quote['05. price']) : null,
            change: quote ? parseFloat(quote['09. change']) : null,
            changePercent: quote ? parseFloat(quote['10. change percent']?.replace('%', '')) : null,
            dividendYield: overview?.DividendYield ? parseFloat(overview.DividendYield) : null,
            dividendPerShare: overview?.DividendPerShare ? parseFloat(overview.DividendPerShare) : null
          }
        })
      )
      setHoldingsWithData(enrichedHoldings)
    } catch (error) {
      console.error('Error loading holdings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHolding = async (holdingId) => {
    if (!confirm('Are you sure you want to remove this holding?')) return

    try {
      await portfolioService.deleteHolding(holdingId)
      setHoldings(holdings.filter(h => h.id !== holdingId))
      setHoldingsWithData(holdingsWithData.filter(h => h.id !== holdingId))
    } catch (error) {
      console.error('Error deleting holding:', error)
      alert('Failed to delete holding')
    }
  }

  const calculateTotals = () => {
    return holdingsWithData.reduce((acc, holding) => {
      const cost = parseFloat(holding.purchase_price) * parseFloat(holding.shares)
      const current = holding.currentPrice ? holding.currentPrice * parseFloat(holding.shares) : 0
      const gain = current - cost
      const annualDividend = holding.dividendPerShare ? holding.dividendPerShare * parseFloat(holding.shares) : 0
      
      return {
        totalCost: acc.totalCost + cost,
        totalValue: acc.totalValue + current,
        totalGain: acc.totalGain + gain,
        totalDividends: acc.totalDividends + annualDividend
      }
    }, { totalCost: 0, totalValue: 0, totalGain: 0, totalDividends: 0 })
  }

  if (loading) {
    return <div className="text-gray-500">Loading holdings...</div>
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No holdings yet. Search for a stock and click "Add to Portfolio"</p>
      </div>
    )
  }

  const totals = calculateTotals()
  const totalGainPercent = totals.totalCost > 0 ? (totals.totalGain / totals.totalCost) * 100 : 0

  return (
    <div>
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-gray-800">
            ${totals.totalValue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-2xl font-bold text-gray-800">
            ${totals.totalCost.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Gain/Loss</div>
          <div className={`text-2xl font-bold ${totals.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.totalGain >= 0 ? '+' : ''}${totals.totalGain.toFixed(2)}
            <span className="text-sm ml-2">({totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Annual Dividends</div>
          <div className="text-2xl font-bold text-green-600">
            ${totals.totalDividends.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dividend</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holdingsWithData.map((holding) => {
              const shares = parseFloat(holding.shares)
              const purchasePrice = parseFloat(holding.purchase_price)
              const currentPrice = holding.currentPrice || 0
              const cost = purchasePrice * shares
              const value = currentPrice * shares
              const gain = value - cost
              const gainPercent = cost > 0 ? (gain / cost) * 100 : 0
              const annualDividend = holding.dividendPerShare ? holding.dividendPerShare * shares : 0

              return (
                <tr key={holding.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{holding.symbol}</div>
                    <div className="text-xs text-gray-500">{holding.purchase_date}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{shares.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${purchasePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    ${currentPrice.toFixed(2)}
                    {holding.changePercent !== null && (
                      <div className={`text-xs flex items-center justify-end gap-1 ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {holding.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${value.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className={`font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                    </div>
                    <div className={`text-xs ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {annualDividend > 0 ? (
                      <div>
                        <div className="font-medium text-green-600">${annualDividend.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {holding.dividendYield ? `${(holding.dividendYield * 100).toFixed(2)}%` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteHolding(holding.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
