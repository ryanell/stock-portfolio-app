import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { portfolioService } from '../../services/portfolioService'
import { stockAPI } from '../../services/stockAPI'

export default function PortfolioCharts({ portfolioId }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1M') // 1W, 1M, 3M, 6M, 1Y, ALL
  const [selectedMetric, setSelectedMetric] = useState('value') // value, gain, gainPercent

  useEffect(() => {
    if (portfolioId) {
      loadChartData()
    }
  }, [portfolioId, timeRange])

  const loadChartData = async () => {
      console.log('Loading chart data for portfolio:', portfolioId)
    setLoading(true)
    try {
      const holdings = await portfolioService.getHoldings(portfolioId)
      
      if (holdings.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      // Get historical data for each holding
      const historicalDataPromises = holdings.map(async (holding) => {
        const history = await stockAPI.getHistory(holding.symbol, 'full')
        return { holding, history }
      })

      const allHistoricalData = await Promise.all(historicalDataPromises)

      // Calculate portfolio value over time
      const portfolioHistory = calculatePortfolioHistory(allHistoricalData, holdings)
      
      // Filter by time range
      const filteredData = filterByTimeRange(portfolioHistory, timeRange)
      
      setChartData(filteredData)
    } catch (error) {
      console.error('Error loading chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePortfolioHistory = (allHistoricalData, holdings) => {
    const dateMap = new Map()

    // Aggregate all dates
    allHistoricalData.forEach(({ holding, history }) => {
      if (!history) return

      Object.keys(history).forEach(date => {
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            totalValue: 0,
            totalCost: 0,
            holdings: []
          })
        }

        const dayData = dateMap.get(date)
        const shares = parseFloat(holding.shares)
        const purchasePrice = parseFloat(holding.purchase_price)
        const closePrice = parseFloat(history[date]['4. close'])

        dayData.totalValue += closePrice * shares
        dayData.totalCost += purchasePrice * shares
        dayData.holdings.push({
          symbol: holding.symbol,
          value: closePrice * shares
        })
      })
    })

    // Convert to array and sort by date
    const sortedData = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        date: day.date,
        value: day.totalValue,
        cost: day.totalCost,
        gain: day.totalValue - day.totalCost,
        gainPercent: ((day.totalValue - day.totalCost) / day.totalCost) * 100
      }))

    return sortedData
  }

  const filterByTimeRange = (data, range) => {
    if (data.length === 0) return []

    const now = new Date()
    let startDate

    switch (range) {
      case '1W':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case '1M':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case '3M':
        startDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      case '6M':
        startDate = new Date(now.setMonth(now.getMonth() - 6))
        break
      case '1Y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      case 'ALL':
        return data
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1))
    }

    return data.filter(d => new Date(d.date) >= startDate)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">{new Date(data.date).toLocaleDateString()}</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-600">Cost: {formatCurrency(data.cost)}</p>
          <p className={`text-sm font-semibold ${data.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.gain >= 0 ? '+' : ''}{formatCurrency(data.gain)} ({formatPercent(data.gainPercent)})
          </p>
        </div>
      )
    }
    return null
  }

  const getChartStats = () => {
    if (chartData.length === 0) return null

    const firstDay = chartData[0]
    const lastDay = chartData[chartData.length - 1]
    const change = lastDay.value - firstDay.value
    const changePercent = (change / firstDay.value) * 100

    return { change, changePercent, isPositive: change >= 0 }
  }

  const stats = getChartStats()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Performance</h3>
        <div className="text-center py-12">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No historical data available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Add holdings to your portfolio to see performance charts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Portfolio Performance</h3>
          {stats && (
            <div className="flex items-center gap-2 mt-1">
              {stats.isPositive ? (
                <TrendingUp className="text-green-600" size={20} />
              ) : (
                <TrendingDown className="text-red-600" size={20} />
              )}
              <span className={`text-lg font-bold ${stats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stats.change >= 0 ? '+' : ''}{formatCurrency(stats.change)} ({formatPercent(stats.changePercent)})
              </span>
              <span className="text-sm text-gray-500">{timeRange}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            stroke="#6B7280"
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            stroke="#6B7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#4F46E5" 
            strokeWidth={2}
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Gain/Loss Chart */}
      <div className="mt-8">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Gain/Loss Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#6B7280"
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#6B7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="gain" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}