import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import StockSearch from '../components/Stock/StockSearch'
import StockDetail from '../components/Stock/StockDetail'
import PortfolioList from '../components/Portfolio/PortfolioList'
import HoldingsList from '../components/Portfolio/HoldingsList'
import AddHoldingModal from '../components/Portfolio/AddHoldingModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [selectedStock, setSelectedStock] = useState(null)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null)
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false)
  const [stockToAdd, setStockToAdd] = useState(null)
  const [refreshHoldings, setRefreshHoldings] = useState(0)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSelectStock = (stock) => {
    // Extract symbol from the search result
    setSelectedStock(stock['1. symbol'])
  }

  const handleAddToPortfolio = (stockData) => {
    if (!selectedPortfolioId) {
      alert('Please create or select a portfolio first!')
      return
    }
    setStockToAdd(stockData)
    setShowAddHoldingModal(true)
  }

  const handleHoldingAdded = () => {
    // Trigger refresh of holdings list
    setRefreshHoldings(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Stock Portfolio Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Portfolio List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <PortfolioList 
                onSelectPortfolio={setSelectedPortfolioId}
                selectedPortfolioId={selectedPortfolioId}
              />
            </div>
          </div>

          {/* Right Content - Stock Search and Holdings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stock Search Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Search Stocks & ETFs</h2>
              <StockSearch onSelectStock={handleSelectStock} />
            </div>

            {/* Stock Detail Section */}
            {selectedStock && (
              <div>
                <StockDetail 
                  symbol={selectedStock} 
                  onAddToPortfolio={handleAddToPortfolio}
                />
              </div>
            )}

            {/* Portfolio Holdings Section */}
            {selectedPortfolioId ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Portfolio Holdings</h2>
                <HoldingsList 
                  portfolioId={selectedPortfolioId} 
                  key={refreshHoldings} // Force refresh when this changes
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">Create or select a portfolio to view holdings</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Holding Modal */}
      {showAddHoldingModal && stockToAdd && (
        <AddHoldingModal
          portfolioId={selectedPortfolioId}
          stockData={stockToAdd}
          onClose={() => {
            setShowAddHoldingModal(false)
            setStockToAdd(null)
          }}
          onSuccess={handleHoldingAdded}
        />
      )}
    </div>
  )
}