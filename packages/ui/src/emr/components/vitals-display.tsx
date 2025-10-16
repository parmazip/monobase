import { Card, CardContent, CardHeader, CardTitle } from '@monobase/ui/components/card'
import { Activity, Thermometer, Heart, Weight, Ruler } from 'lucide-react'
import type { VitalsData } from '@monobase/sdk/services/emr'

interface VitalsDisplayProps {
  vitals: VitalsData
}

export function VitalsDisplay({ vitals }: VitalsDisplayProps) {
  const vitalItems = [
    {
      label: 'Temperature',
      value: vitals.temperatureCelsius ? `${vitals.temperatureCelsius}°C` : undefined,
      icon: Thermometer,
      show: !!vitals.temperatureCelsius,
    },
    {
      label: 'Blood Pressure',
      value: vitals.systolicBp && vitals.diastolicBp ? `${vitals.systolicBp}/${vitals.diastolicBp} mmHg` : undefined,
      icon: Activity,
      show: !!(vitals.systolicBp && vitals.diastolicBp),
    },
    {
      label: 'Heart Rate',
      value: vitals.heartRate ? `${vitals.heartRate} bpm` : undefined,
      icon: Heart,
      show: !!vitals.heartRate,
    },
    {
      label: 'Weight',
      value: vitals.weightKg ? `${vitals.weightKg} kg` : undefined,
      icon: Weight,
      show: !!vitals.weightKg,
    },
    {
      label: 'Height',
      value: vitals.heightCm ? `${vitals.heightCm} cm` : undefined,
      icon: Ruler,
      show: !!vitals.heightCm,
    },
  ].filter((item) => item.show)

  if (vitalItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vital Signs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {vitalItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </div>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
