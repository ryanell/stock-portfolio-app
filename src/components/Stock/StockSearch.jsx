import { useState } from 'react'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import { stockAPI } from '../../services/stockAPI'

export default function StockSearch({ onSelectStock }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (e) => {
    const value = e.target.value
    setQuery(value)

    if (value.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    const searchResults = await stockAPI.searchSymbol(value)
    setResults(searchResults)
    setShowResults(true)
    setLoading(false)
  }

  const handleSelectStock = (stock) => {
    setQuery('')
    setResults([])
    setShowResults(false)
    if (onSelectStock) {
      onSelectStock(stock)
    }
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search stocks and ETFs (e.g., AAPL, SPY, MSFT)..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((stock, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectStock(stock)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {stock['1. symbol']}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {stock['2. name']}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {stock['4. region']}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
