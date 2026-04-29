'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useData } from '@/app/context/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { Leaf, Thermometer, Droplets, Sprout, MapPin, LogOut, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

const PLANT_TYPES = [
  'Monstera', 'Snake Plant', 'Fiddle Leaf Fig', 'Peace Lily', 'Rubber Plant',
  'Pothos', 'Spider Plant', 'ZZ Plant', 'Succulent', 'Cactus', 'Orchid',
  'Fern', 'Bamboo Palm', 'Aloe Vera', 'Dracaena',
]

interface SensorInput {
  Ambient_Temperature: number
  Humidity: number
  Soil_Moisture: number
}

interface SensorData {
  input: SensorInput
  prediction: string
  confidence: number
}

interface ChartPoint {
  time: string
  temperature: number
  humidity: number
  moisture: number
}

const getStatusColor = (prediction: string) => {
  const lower = prediction?.toLowerCase() || ''
  if (lower.includes('high stress') || lower.includes('critical')) return 'bg-red-500'
  if (lower.includes('moderate') || lower.includes('warning')) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const getStatusIcon = (prediction: string) => {
  const lower = prediction?.toLowerCase() || ''
  if (lower.includes('high stress') || lower.includes('critical')) return <AlertTriangle className="w-5 h-5" />
  if (lower.includes('moderate') || lower.includes('warning')) return <Activity className="w-5 h-5" />
  return <CheckCircle className="w-5 h-5" />
}

const MetricCard = ({ title, value, unit, icon: Icon, colorClass, gradient }: any) => (
  <div className={`relative overflow-hidden group p-6 rounded-[2rem] border border-white/20 backdrop-blur-md shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${gradient}`}>
    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-lg shadow-inner group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-bold text-white/80 tracking-wider uppercase">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
          {value !== undefined ? value.toFixed(1) : '—'}
        </span>
        <span className="text-xl font-medium text-white/60">{unit}</span>
      </div>
    </div>
  </div>
)

const MetricGraph = ({ title, data, dataKey, color, gradientId }: any) => (
  <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-2xl overflow-hidden group">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h3>
      <div className={`w-3 h-3 rounded-full animate-pulse`} style={{ backgroundColor: color }} />
    </div>
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="time"
            hide
          />
          <YAxis
            hide
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={4}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { addPlant } = useData()
  const router = useRouter()

  const [selectedPlant, setSelectedPlant] = useState<any>(null)
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // WebSocket connection
  useEffect(() => {
    if (!selectedPlant) return

    setWsStatus('connecting')
    const ws = new WebSocket('wss://plant-health-monitor-banckend.onrender.com/ws')

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setWsStatus('connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg: SensorData = JSON.parse(event.data)
        console.log('📡 Data received:', msg)

        setSensorData(msg)

        if (msg.input) {
          const newPoint: ChartPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: Number(msg.input.Ambient_Temperature) || 0,
            humidity: Number(msg.input.Humidity) || 0,
            moisture: Number(msg.input.Soil_Moisture) || 0,
          }

          setChartHistory((prev) => [...prev, newPoint].slice(-30))
        }
      } catch (err) {
        console.error('❌ Parse error:', err)
      }
    }

    ws.onerror = () => setWsStatus('disconnected')
    ws.onclose = () => setWsStatus('disconnected')

    return () => ws.close()
  }, [selectedPlant])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) return setError('Enter plant name')
    if (!formData.type) return setError('Select plant type')
    if (!formData.location.trim()) return setError('Enter location')

    const plant = addPlant({
      name: formData.name.trim(),
      type: formData.type,
      location: formData.location.trim(),
    })

    setSelectedPlant(plant)
  }, [formData, addPlant])

  const handleLogout = useCallback(() => {
    logout()
    router.push('/login')
  }, [logout, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f8fafc] selection:bg-emerald-100 relative overflow-hidden">
      {/* Dynamic Glassmorphism Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-green-200/30 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-[10%] right-[20%] w-[60%] h-[60%] bg-teal-200/40 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/40 mb-8 transition-all hover:shadow-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
              <Leaf className="w-8 h-8 text-white animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent tracking-tighter">
                PlantMind
              </h1>
              <p className="text-xs font-bold text-emerald-800/50 tracking-widest uppercase">Intelligent Biosphere</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-gray-800 tracking-tight">{user?.name}</p>
              <p className="text-xs font-medium text-gray-500">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="rounded-2xl h-12 px-6 border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-bold"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {!selectedPlant ? (
          /* Add Plant Form */
          <div className="flex justify-center items-center min-h-[70vh]">
            <form
              onSubmit={handleSubmit}
              className="bg-white/40 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/60 w-full max-w-lg space-y-8 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-[3rem] -z-10" />

              <div className="text-center">
                <div className="inline-flex p-5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2rem] mb-6 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Sprout className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Add Your Plant</h2>
                <p className="text-gray-500 mt-2 font-medium">Join the green revolution today</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Plant Name</label>
                  <Input
                    placeholder="e.g., Midnight Fern"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-14 rounded-2xl border-none bg-white/50 backdrop-blur-md focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg font-medium placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Plant Type</label>
                  <select
                    className="w-full h-14 px-4 border-none rounded-2xl bg-white/50 backdrop-blur-md focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-lg font-medium appearance-none cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="" className="text-gray-300">Select type...</option>
                    {PLANT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500/30" />
                    <Input
                      placeholder="e.g., Sunlit Balcony"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="h-14 rounded-2xl border-none bg-white/50 backdrop-blur-md focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg font-medium placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-bold rounded-2xl shadow-2xl shadow-emerald-500/40 transition-all hover:-translate-y-1 active:scale-95"
              >
                <Leaf className="w-6 h-6 mr-3" />
                Initialize Monitoring
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-shake">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* Dashboard View */
          <div className="space-y-6">

            {/* Plant Info + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{selectedPlant.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                      <span className="inline-flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full text-sm">
                        <Leaf className="w-4 h-4 text-green-600" />
                        {selectedPlant.type}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {selectedPlant.location}
                      </span>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${wsStatus === 'connected' ? 'bg-green-100 text-green-700' :
                      wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                        wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                          'bg-red-500'
                      }`} />
                    {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </div>
                </div>
              </div>

              {/* AI Prediction Card */}
              {sensorData?.prediction && (
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-700">AI Analysis</h3>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold ${getStatusColor(sensorData.prediction)}`}>
                    {getStatusIcon(sensorData.prediction)}
                    {sensorData.prediction}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Confidence</span>
                      <span className="font-semibold text-gray-700">{(sensorData.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${sensorData.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sensor Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Temperature"
                value={sensorData?.input?.Ambient_Temperature}
                unit="°C"
                icon={Thermometer}
                gradient="bg-gradient-to-br from-orange-400 to-red-600"
              />
              <MetricCard
                title="Humidity"
                value={sensorData?.input?.Humidity}
                unit="%"
                icon={Droplets}
                gradient="bg-gradient-to-br from-blue-400 to-indigo-600"
              />
              <MetricCard
                title="Soil Moisture"
                value={sensorData?.input?.Soil_Moisture}
                unit="%"
                icon={Sprout}
                gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
              />
            </div>

            {/* Individual Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MetricGraph
                title="Temperature History"
                data={chartHistory}
                dataKey="temperature"
                color="#f87171"
                gradientId="tempArea"
              />
              <MetricGraph
                title="Humidity History"
                data={chartHistory}
                dataKey="humidity"
                color="#60a5fa"
                gradientId="humidArea"
              />
              <MetricGraph
                title="Moisture History"
                data={chartHistory}
                dataKey="moisture"
                color="#34d399"
                gradientId="moistArea"
              />
            </div>

            {/* Chart */}
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-white/60 group relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Sensor Trends</h2>
                  <p className="text-sm font-medium text-gray-500">Holistic view of plant vitals</p>
                </div>
                <div className="px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-widest shadow-inner">
                  Last {chartHistory.length} readings
                </div>
              </div>

              {chartHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="humidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="moistGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature (°C)"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      name="Soil Moisture (%)"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-gray-400">
                  <Activity className="w-12 h-12 mb-3 animate-pulse" />
                  <p>Waiting for sensor data...</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
