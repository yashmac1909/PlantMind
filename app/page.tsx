'use client'

import { useState, useEffect } from 'react'
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
} from 'recharts'

const PLANT_TYPES = [
  'Monstera','Snake Plant','Fiddle Leaf Fig','Peace Lily','Rubber Plant',
  'Pothos','Spider Plant','ZZ Plant','Succulent','Cactus','Orchid',
  'Fern','Bamboo Palm','Aloe Vera','Dracaena',
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { addPlant } = useData()
  const router = useRouter()

  const [selectedPlant, setSelectedPlant] = useState<any>(null)
  const [sensorData, setSensorData] = useState<any>(null)
  const [chartHistory, setChartHistory] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  // ✅ WebSocket
  // ✅ CLEAN WebSocket (REAL DATA ONLY)
useEffect(() => {
  if (!selectedPlant) return;

  const ws = new WebSocket(
    "wss://plant-health-monitor-banckend.onrender.com/ws"
  );

  ws.onopen = () => {
    console.log("✅ Connected to WebSocket");
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log("📡 Data received:", msg);

      setSensorData(msg);

      if (msg.input) {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          temperature: Number(msg.input.temperature) || 0,
          humidity: Number(msg.input.humidity) || 0,
          moisture: Number(msg.input.moisture || 0),
        };

        setChartHistory((prev) => {
          const updated = [...prev, newPoint];
          return updated.slice(-25); // keep last 25 points
        });
      }
    } catch (err) {
      console.error("❌ Parsing error:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
  };

  ws.onclose = () => {git init

    console.log("⚠️ WebSocket disconnected");
  };

  return () => {
    ws.close();
  };
}, [selectedPlant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) return setError('Enter plant name')
    if (!formData.type) return setError('Select plant type')
    if (!formData.location) return setError('Enter location')

    const plant = addPlant({
      name: formData.name,
      type: formData.type,
      location: formData.location,
    })

    setSelectedPlant(plant)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
        <h1 className="text-xl font-bold text-green-700">🌿 PlantMind</h1>

        <div className="text-right">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>

          <Button onClick={handleLogout} className="mt-1">
            Logout
          </Button>
        </div>
      </div>

      {!selectedPlant ? (
        /* FORM */
        <div className="flex justify-center mt-20">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-bold text-center text-green-700">
              Add Plant 🌱
            </h2>

            <Input
              placeholder="Plant Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <select
              className="w-full p-2 border rounded"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="">Select Type</option>
              {PLANT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            {/* ✅ LOCATION INPUT */}
            <Input
              placeholder="Location (e.g. Living Room)"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />

            <Button className="w-full bg-green-600 text-white">
              Add Plant
            </Button>

            {error && <p className="text-red-500">{error}</p>}
          </form>
        </div>
      ) : (
        /* DASHBOARD */
        <div>

          {/* PLANT DETAILS */}
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-2xl font-bold text-green-700">
              {selectedPlant.name}
            </h2>
            <p className="text-gray-600 mt-1">
              🌿 {selectedPlant.type} • 📍 {selectedPlant.location}
            </p>
          </div>

          {/* SENSOR CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-gray-500">🌡 Temperature</p>
              <h2 className="text-3xl font-bold text-red-500 mt-2">
                {sensorData?.input?.temperature?.toFixed(1) || '-'}°C
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-gray-500">💧 Humidity</p>
              <h2 className="text-3xl font-bold text-blue-500 mt-2">
                {sensorData?.input?.humidity?.toFixed(1) || '-'}%
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-gray-500">🌱 Moisture</p>
              <h2 className="text-3xl font-bold text-green-500 mt-2">
                {sensorData?.input?.moisture?.toFixed(1) || '-'}%
              </h2>
            </div>

          </div>

          {/* GRAPH */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="mb-4 font-semibold text-gray-700">
              📊 Sensor Trends
            </h2>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />

                <Line type="monotone" dataKey="temperature" stroke="#ef4444" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" />
                <Line type="monotone" dataKey="moisture" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI */}
          {sensorData?.prediction && (
            <div className="bg-white p-6 rounded-xl shadow mt-6">
              <h3 className="font-bold text-purple-700">🤖 Prediction</h3>
              <p>{sensorData.prediction}</p>
              <p>
                Confidence: {(sensorData.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}