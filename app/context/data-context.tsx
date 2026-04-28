'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Plant {
  id: string
  name: string
  type: string
  location: string
  image: string
  healthScore: number
  lastWatered: string
  notes: string
}

export interface SensorReading {
  id: string
  plantId: string
  timestamp: string
  temperature: number
  humidity: number
  moisture: number
  lightLevel: number
}

export interface AutomationRule {
  id: string
  name: string
  plantId: string
  type: 'watering' | 'misting' | 'lighting' | 'temperature'
  trigger: string
  frequency: string
  isActive: boolean
  createdAt: string
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
  emailAlerts: boolean
  measurementUnit: 'celsius' | 'fahrenheit'
  moistureThreshold: number
  temperatureRange: [number, number]
}

interface DataContextType {
  plants: Plant[]
  sensorReadings: SensorReading[]
  automations: AutomationRule[]
  settings: UserSettings
  addPlant: (plant: Omit<Plant, 'id'>) => string
  updatePlant: (id: string, plant: Partial<Plant>) => void
  deletePlant: (id: string) => void
  addSensorReading: (reading: Omit<SensorReading, 'id'>) => void
  getSensorReadingsForPlant: (plantId: string) => SensorReading[]
  addAutomation: (automation: Omit<AutomationRule, 'id' | 'createdAt'>) => string
  updateAutomation: (id: string, automation: Partial<AutomationRule>) => void
  deleteAutomation: (id: string) => void
  updateSettings: (settings: Partial<UserSettings>) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  notificationsEnabled: true,
  emailAlerts: true,
  measurementUnit: 'celsius',
  moistureThreshold: 40,
  temperatureRange: [18, 28],
}

const SAMPLE_PLANTS: Plant[] = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    type: 'Swiss Cheese Plant',
    location: 'Living Room',
    image: '/monstera-deliciosa-plant-detailed.jpg',
    healthScore: 85,
    lastWatered: '2024-04-23',
    notes: 'Thriving with bright indirect light',
  },
  {
    id: '2',
    name: 'Snake Plant',
    type: 'Sansevieria',
    location: 'Bedroom',
    image: '/snake-plant-sansevieria.png',
    healthScore: 92,
    lastWatered: '2024-04-20',
    notes: 'Very low maintenance, prefers dry conditions',
  },
  {
    id: '3',
    name: 'Fiddle Leaf Fig',
    type: 'Ficus Lyrata',
    location: 'Office',
    image: '/fiddle-leaf-fig.png',
    healthScore: 72,
    lastWatered: '2024-04-24',
    notes: 'Needs consistent watering and moderate light',
  },
  {
    id: '4',
    name: 'Peace Lily',
    type: 'Spathiphyllum',
    location: 'Bathroom',
    image: '/peace-lily-spathiphyllum.jpg',
    healthScore: 88,
    lastWatered: '2024-04-23',
    notes: 'Loves humidity, great for bathrooms',
  },
  {
    id: '5',
    name: 'Rubber Plant',
    type: 'Ficus Elastica',
    location: 'Entryway',
    image: '/rubber-plant-ficus-elastica.jpg',
    healthScore: 80,
    lastWatered: '2024-04-22',
    notes: 'Fast growing, needs bright indirect light',
  },
]

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)

  // Initialize data from localStorage on mount
  useEffect(() => {
    const plantsJson = localStorage.getItem('plantMonitorPlants')
    const sensorsJson = localStorage.getItem('plantMonitorSensors')
    const automationsJson = localStorage.getItem('plantMonitorAutomations')
    const settingsJson = localStorage.getItem('plantMonitorSettings')

    if (plantsJson) {
      setPlants(JSON.parse(plantsJson))
    } else {
      setPlants(SAMPLE_PLANTS)
      localStorage.setItem('plantMonitorPlants', JSON.stringify(SAMPLE_PLANTS))
    }

    if (sensorsJson) {
      setSensorReadings(JSON.parse(sensorsJson))
    } else {
      // Generate sample sensor data
      const sampleReadings = generateSampleSensorData()
      setSensorReadings(sampleReadings)
      localStorage.setItem('plantMonitorSensors', JSON.stringify(sampleReadings))
    }

    if (automationsJson) {
      setAutomations(JSON.parse(automationsJson))
    }

    if (settingsJson) {
      setSettings(JSON.parse(settingsJson))
    }
  }, [])

  const generateSampleSensorData = (): SensorReading[] => {
    const readings: SensorReading[] = []
    const now = new Date()

    SAMPLE_PLANTS.forEach((plant) => {
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        readings.push({
          id: `sensor-${plant.id}-${i}`,
          plantId: plant.id,
          timestamp: timestamp.toISOString(),
          temperature: 20 + Math.random() * 8,
          humidity: 50 + Math.random() * 30,
          moisture: 30 + Math.random() * 40,
          lightLevel: 400 + Math.random() * 600,
        })
      }
    })

    return readings
  }

  const addPlant = (plant: Omit<Plant, 'id'>): Plant => {
    const id = Date.now().toString()
    const newPlant = { ...plant, id }
    const updatedPlants = [...plants, newPlant]
    setPlants(updatedPlants)
    localStorage.setItem('plantMonitorPlants', JSON.stringify(updatedPlants))
    return newPlant
  }

  const updatePlant = (id: string, plant: Partial<Plant>) => {
    const updatedPlants = plants.map((p) => (p.id === id ? { ...p, ...plant } : p))
    setPlants(updatedPlants)
    localStorage.setItem('plantMonitorPlants', JSON.stringify(updatedPlants))
  }

  const deletePlant = (id: string) => {
    const updatedPlants = plants.filter((p) => p.id !== id)
    setPlants(updatedPlants)
    localStorage.setItem('plantMonitorPlants', JSON.stringify(updatedPlants))
  }

  const addSensorReading = (reading: Omit<SensorReading, 'id'>) => {
    const id = Date.now().toString()
    const newReading = { ...reading, id }
    const updatedReadings = [...sensorReadings, newReading]
    setSensorReadings(updatedReadings)
    localStorage.setItem('plantMonitorSensors', JSON.stringify(updatedReadings))
  }

  const getSensorReadingsForPlant = (plantId: string): SensorReading[] => {
    return sensorReadings.filter((r) => r.plantId === plantId)
  }

  const addAutomation = (
    automation: Omit<AutomationRule, 'id' | 'createdAt'>
  ): string => {
    const id = Date.now().toString()
    const newAutomation = {
      ...automation,
      id,
      createdAt: new Date().toISOString(),
    }
    const updatedAutomations = [...automations, newAutomation]
    setAutomations(updatedAutomations)
    localStorage.setItem('plantMonitorAutomations', JSON.stringify(updatedAutomations))
    return id
  }

  const updateAutomation = (id: string, automation: Partial<AutomationRule>) => {
    const updatedAutomations = automations.map((a) =>
      a.id === id ? { ...a, ...automation } : a
    )
    setAutomations(updatedAutomations)
    localStorage.setItem('plantMonitorAutomations', JSON.stringify(updatedAutomations))
  }

  const deleteAutomation = (id: string) => {
    const updatedAutomations = automations.filter((a) => a.id !== id)
    setAutomations(updatedAutomations)
    localStorage.setItem('plantMonitorAutomations', JSON.stringify(updatedAutomations))
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem('plantMonitorSettings', JSON.stringify(updatedSettings))
  }

  return (
    <DataContext.Provider
      value={{
        plants,
        sensorReadings,
        automations,
        settings,
        addPlant,
        updatePlant,
        deletePlant,
        addSensorReading,
        getSensorReadingsForPlant,
        addAutomation,
        updateAutomation,
        deleteAutomation,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
