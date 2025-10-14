import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { differenceInYears } from 'date-fns'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageCircle,
  FileText,
  Settings,
  MoreVertical,
  User,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Stethoscope,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  Share2,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Circle,
  Square,
  Send,
  Paperclip,
  Download,
  Upload,  Plus,
  Minus,
  RotateCcw,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  Pill,
  CalendarPlus,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { 
  useConsultation, 
  useCreateConsultation, 
  useUpdateConsultation, 
  useFinalizeConsultation,
  useEMRPatients 
} from '@monobase/sdk/react/hooks/use-emr'
import { Button } from "@monobase/ui/components/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@monobase/ui/components/card"
import { Badge } from "@monobase/ui/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@monobase/ui/components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@monobase/ui/components/tabs"
import { Input } from "@monobase/ui/components/input"
import { Label } from "@monobase/ui/components/label"
import { Textarea } from "@monobase/ui/components/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@monobase/ui/components/dialog"
import { Switch } from "@monobase/ui/components/switch"
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/consultations/$id')({
  component: ConsultationPage,
})

type ConsultationStatus = 'connecting' | 'connected' | 'in-progress' | 'ending' | 'ended'

type VitalSigns = {
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  weight?: number
  height?: number
  respiratoryRate?: number
  oxygenSaturation?: number
}

function ConsultationPage() {
  const { id } = useParams({ from: '/_dashboard/consultations/$id' })

  // Fetch consultation if it exists
  const { data: existingConsultation, isLoading: consultationLoading } = useConsultation(id)
  
  // Fetch patients to find patient details
  const { data: patientsData } = useEMRPatients({ limit: 100 })
  
  // Mutations
  const { mutate: createConsultation } = useCreateConsultation()
  const { mutate: updateConsultation, isPending: isUpdating } = useUpdateConsultation()
  const { mutate: finalizeConsultation, isPending: isFinalizing } = useFinalizeConsultation()

  // Video call states
  const [callStatus, setCallStatus] = useState<ConsultationStatus>('connecting')
  const [isRecording, setIsRecording] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  
  // Clinical states
  const [vitals, setVitals] = useState<VitalSigns>({})
  const [consultationNotes, setConsultationNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [followUpNeeded, setFollowUpNeeded] = useState(false)
  
  // UI states
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showVitalsDialog, setShowVitalsDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('video')

  // Get patient info from existing consultation or create mock data
  const patient = existingConsultation ? {
    id: existingConsultation.patient,
    name: patientsData?.data?.find(p => p.id === existingConsultation.patient)
      ? `${patientsData.data.find(p => p.id === existingConsultation.patient)!.firstName} ${patientsData.data.find(p => p.id === existingConsultation.patient)!.lastName}`
      : 'Patient',
    age: 0,
    reason: existingConsultation.chiefComplaint || 'General consultation',
  } : {
    id: 'temp-patient',
    name: 'Test Patient',
    age: 30,
    reason: 'Video consultation',
  }

  // Initialize form when consultation loads
  useEffect(() => {
    if (existingConsultation) {
      setDiagnosis(existingConsultation.assessment || '')
      setTreatmentPlan(existingConsultation.plan || '')    
      setPrescriptions(existingConsultation.prescriptions || [])
      setFollowUpNeeded(existingConsultation.followUp?.needed || false)
    }
  }, [existingConsultation])

  // Initialize call timer
  useEffect(() => {
    if (callStatus === 'connected' || callStatus === 'in-progress') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [callStatus])

  // Simulate connection process
  useEffect(() => {
    setTimeout(() => setCallStatus('connected'), 2000)
    setTimeout(() => setCallStatus('in-progress'), 3000)
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const endConsultation = async () => {
    if (existingConsultation) {
      finalizeConsultation(existingConsultation.id, {        onSuccess: () => {
          toast.success('Consultation finalized')
        },
        onError: () => {
          toast.error('Failed to finalize consultation')
        }
      })
    }
    
    setCallStatus('ending')
    setTimeout(() => {
      setCallStatus('ended')
      setShowEndDialog(false)
    }, 2000)
  }

  const handleSaveNotes = async () => {
    if (!existingConsultation) {
      toast.error('No consultation to update')
      return
    }

    updateConsultation({
      consultationId: existingConsultation.id,
      data: {
        assessment: diagnosis || undefined,
        plan: treatmentPlan || undefined,
        prescriptions,
        followUp: followUpNeeded ? { needed: true } : undefined,
      },
    }, {
      onSuccess: () => {
        toast.success('Notes saved')      },
      onError: () => {
        toast.error('Failed to save notes')
      }
    })
  }

  const handleSaveVitals = async () => {
    if (!existingConsultation) {
      toast.error('No consultation to update')
      return
    }

    updateConsultation({
      consultationId: existingConsultation.id,
      data: {
        vitals: {
          bloodPressure: vitals.bloodPressure,
          pulse: vitals.heartRate?.toString(),
          temperature: vitals.temperature ? `${vitals.temperature}°F` : undefined,
          weight: vitals.weight ? `${vitals.weight}lbs` : undefined,
        },
      },
    }, {
      onSuccess: () => {
        toast.success('Vitals saved')
        setShowVitalsDialog(false)
      },
      onError: () => {
        toast.error('Failed to save vitals')
      }
    })  }

  // Loading state
  if (consultationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Loading Consultation</h2>
            <p className="text-muted-foreground">
              Please wait while we prepare your consultation...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (callStatus === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Consultation Complete</h2>
            <p className="text-muted-foreground mb-6">
              Your consultation with {patient.name} has ended successfully.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Duration:</span>                <span>{formatDuration(callDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Recording:</span>
                <span>{isRecording ? 'Saved' : 'Not recorded'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              View Notes
            </Button>
            <Button className="flex-1">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header Bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>          </Avatar>
          <div>
            <h2 className="font-semibold">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">{patient.reason}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <Badge variant={callStatus === 'in-progress' ? 'default' : 'secondary'}>
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && 'Connected'}
            {callStatus === 'in-progress' && 'In Progress'}
            {callStatus === 'ending' && 'Ending...'}
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-gray-900">
          {callStatus === 'connecting' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to {patient.name}...</p>              </div>
            </div>
          ) : (
            <>
              {/* Main Video Feed */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                <div className="text-white text-center">
                  <Video className="h-24 w-24 mx-auto mb-4" />
                  <p className="text-xl">{patient.name}</p>
                  <p className="text-sm text-gray-400">Video Stream</p>
                </div>

                {/* Picture-in-Picture */}
                <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white/20 flex items-center justify-center">
                  <div className="text-white text-center">
                    <User className="h-12 w-12 mx-auto" />
                    <p className="text-sm">You</p>
                  </div>
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 animate-pulse">
                    <Circle className="h-4 w-4" />
                    Recording
                  </div>
                )}
              </div>              {/* Video Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                <Button
                  size="lg"
                  variant={audioEnabled ? "secondary" : "destructive"}
                  className="rounded-full w-12 h-12"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant={videoEnabled ? "secondary" : "destructive"}
                  className="rounded-full w-12 h-12"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant={isScreenSharing ? "default" : "secondary"}
                  className="rounded-full w-12 h-12"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant={isRecording ? "default" : "secondary"}
                  className="rounded-full w-12 h-12"
                  onClick={() => setIsRecording(!isRecording)}
                >                  {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-12 h-12 ml-4"
                  onClick={() => setShowEndDialog(true)}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-white border-l flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="m-4 grid w-auto grid-cols-3">
              <TabsTrigger value="video">Patient Info</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="notes">Clinical</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="flex-1 p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>Age {patient.age} • {patient.reason}</CardDescription>
                </CardHeader>                <CardFooter className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowVitalsDialog(true)}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Record Vitals
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Medical History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col p-4">
              <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                <p className="text-sm text-muted-foreground text-center">Chat messages will appear here</p>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type a message..." />
                <Button size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>            </TabsContent>

            <TabsContent value="notes" className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Consultation Notes</Label>
                  <Textarea
                    placeholder="Record your observations and findings..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Diagnosis</Label>
                  <Textarea
                    placeholder="Primary and secondary diagnoses..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Treatment Plan</Label>
                  <Textarea
                    placeholder="Recommended treatments and next steps..."
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    rows={3}
                  />
                </div>                <div className="flex items-center space-x-2">
                  <Switch
                    id="follow-up"
                    checked={followUpNeeded}
                    onCheckedChange={setFollowUpNeeded}
                  />
                  <Label htmlFor="follow-up" className="text-sm">Follow-up required</Label>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Pill className="mr-2 h-4 w-4" />
                    Add Prescription
                  </Button>
                  
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdating ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>      {/* End Consultation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Consultation</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this consultation with {patient.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="save-notes" defaultChecked />
              <Label htmlFor="save-notes">Save consultation notes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="send-summary" defaultChecked />
              <Label htmlFor="send-summary">Send summary to patient</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="schedule-followup" checked={followUpNeeded} onCheckedChange={setFollowUpNeeded} />
              <Label htmlFor="schedule-followup">Schedule follow-up appointment</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={endConsultation}>
              <PhoneOff className="mr-2 h-4 w-4" />
              End Consultation
            </Button>          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
            <DialogDescription>
              Record {patient.name}'s vital signs for this consultation
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bp">Blood Pressure</Label>
                <Input
                  id="bp"
                  placeholder="120/80"
                  value={vitals.bloodPressure || ''}
                  onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr">Heart Rate (bpm)</Label>
                <Input
                  id="hr"
                  type="number"
                  placeholder="72"
                  value={vitals.heartRate || ''}
                  onChange={(e) => setVitals({...vitals, heartRate: parseInt(e.target.value)})}
                />              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temp">Temperature (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={vitals.temperature || ''}
                  onChange={(e) => setVitals({...vitals, temperature: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="150"
                  value={vitals.weight || ''}
                  onChange={(e) => setVitals({...vitals, weight: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVitalsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVitals} disabled={isUpdating}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? 'Saving...' : 'Save Vitals'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}