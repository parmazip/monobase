/**
 * Consultation Card Component
 * 
 * Displays consultation information in a card format
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../components/card'
import { Badge } from '../../components/badge'
import { Calendar, Clock, Video, Phone, MapPin } from 'lucide-react'
import type { ConsultationDisplay } from '../types'

export interface ConsultationCardProps {
  consultation: ConsultationDisplay
  onClick?: () => void
  className?: string
}

const consultationTypeIcons = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
}

const statusColors = {
  scheduled: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'outline',
} as const

export function ConsultationCard({ consultation, onClick, className }: ConsultationCardProps) {
  const TypeIcon = consultationTypeIcons[consultation.type]
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className || ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{consultation.patientName}</CardTitle>
          <Badge variant={statusColors[consultation.status]}>
            {consultation.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{consultation.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{consultation.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{consultation.type}</span>
        </div>
        {consultation.chiefComplaint && (
          <div className="pt-2 text-sm text-muted-foreground">
            <span className="font-medium">Chief complaint:</span> {consultation.chiefComplaint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
