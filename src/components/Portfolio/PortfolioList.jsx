import { useState, useEffect } from 'react'
import { Plus, Trash2, Folder } from 'lucide-react'
import { portfolioService } from '../../services/portfolioService'

export default function PortfolioList({ onSelectPortfolio, selectedPortfolioId }) {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPortfolioName, setNewPortfolioName] = useState('')

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      const data = await portfolioService.getPortfolios()
      setPortfolios(data)
      // Auto-select first portfolio if none selected
      if (data.length > 0 && !selectedPortfolioId) {
        onSelectPortfolio(data[0].id)
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePortfolio = async (e) => {
    e.preventDefault()
    if (!newPortfolioName.trim()) return

    try {
      const portfolio = await portfolioService.createPortfolio(newPortfolioName)
      setPortfolios([portfolio, ...portfolios])
      setNewPortfolioName('')
      setShowCreateModal(false)
      onSelectPortfolio(portfolio.id)
    } catch (error) {
      console.error('Error creating portfolio:', error)
      alert('Failed to create portfolio')
    }
  }

  const handleDeletePortfolio = async (portfolioId) => {
    if (!confirm('Are you sure you want to delete this portfolio and all its holdings?')) return

    try {
      await portfolioService.deletePortfolio(portfolioId)
      setPortfolios(portfolios.filter(p => p.id !== portfolioId))
      if (selectedPortfolioId === portfolioId) {
        onSelectPortfolio(portfolios[0]?.id || null)
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      alert('Failed to delete portfolio')
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading portfolios...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">My Portfolios</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Portfolio
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Folder className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-600 mb-4">No portfolios yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Your First Portfolio
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {portfolios.map(portfolio => (
            <div
              key={portfolio.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                selectedPortfolioId === portfolio.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onSelectPortfolio(portfolio.id)}
            >
              <div className="flex items-center gap-3">
                <Folder className={selectedPortfolioId === portfolio.id ? 'text-indigo-600' : 'text-gray-400'} size={20} />
                <span className="font-medium text-gray-800">{portfolio.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePortfolio(portfolio.id)
                }}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Portfolio</h3>
            <form onSubmit={handleCreatePortfolio}>
              <input
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="Portfolio name (e.g., Retirement, Tech Stocks)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewPortfolioName('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

