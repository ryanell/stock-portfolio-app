import { useState } from 'react'
import { X } from 'lucide-react'
import { portfolioService } from '../../services/portfolioService'

export default function AddHoldingModal({ portfolioId, stockData, onClose, onSuccess }) {
  const [shares, setShares] = useState('')
  const [purchasePrice, setPurchasePrice] = useState(stockData?.price?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await portfolioService.addHolding(portfolioId, {
        symbol: stockData.symbol,
        shares: parseFloat(shares),
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding holding:', error)
      alert('Failed to add holding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Add {stockData.symbol} to Portfolio</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Shares
            </label>
            <input
              type="number"
              step="0.01"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price per Share
            </label>
            <input
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-semibold">
                ${(parseFloat(shares || 0) * parseFloat(purchasePrice || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}