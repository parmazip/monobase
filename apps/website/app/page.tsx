"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@monobase/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@monobase/ui/components/card"
import { Badge } from "@monobase/ui/components/badge"
import { SiteHeader } from '@/components/layout/site-header'
import { SignupModal } from '@/components/auth/signup-modal'
import { useSession, useSignOut } from '@monobase/sdk/react/hooks/use-auth'
import { 
  Building2, 
  Shield, 
  Clock, 
  Users,
  Activity,
  DollarSign,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Globe,
  Stethoscope,
  PillIcon,
  FileText,
  Video,
  MessageSquare,
  Calendar,
  CreditCard,
  BarChart3,
  Lock,
  Zap,
  Hospital,
  UserCheck,
  Package
} from "lucide-react"

export default function PlatformLandingPage(): React.JSX.Element {
  const { data: session, isLoading } = useSession()
  const signOut = useSignOut()

  const handleSignOut = async () => {
    await signOut.mutateAsync()
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        session={session}
        isLoading={isLoading}
        onSignOut={handleSignOut}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6">
                <Video className="w-3 h-3 mr-1" />
                Video Consultations with Licensed Pharmacists
              </Badge>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl lg:text-7xl font-headline font-bold text-gray-900 mb-6"
              >
                Professional Pharmacist
                <span className="text-primary block">Video Consultations</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl text-gray-600 mb-8 font-body max-w-3xl mx-auto"
              >
                Connect with licensed pharmacists from the comfort of your home. Get expert medication advice, 
                prescription consultations, and personalized pharmacy care through secure video calls.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <Link href="/pharmacists">
                  <Button 
                    size="lg" 
                    className="shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Find a Pharmacist
                  </Button>
                </Link>
                
                <div className="text-xs text-gray-500">
                  Are you a pharmacist?{' '}
                  <SignupModal 
                    defaultSelection="pharmacist"
                    trigger={
                      <button className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
                        Join our network
                      </button>
                    }
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Platform Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
            >
              {[
                { value: "25K+", label: "Satisfied Patients", icon: Users },
                { value: "250+", label: "Licensed Pharmacists", icon: PillIcon },
                { value: "150K+", label: "Video Consultations", icon: Video },
                { value: "4.8/5", label: "Average Rating", icon: Activity }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Platform Solutions Section */}
      <section id="solutions" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Video-First Pharmacist Care</Badge>
            <h2 className="text-4xl font-headline font-bold text-gray-900 mb-4">
              Professional Pharmacist Services via Video
            </h2>
            <p className="text-xl text-gray-600 font-body max-w-2xl mx-auto">
              Convenient, secure video consultations with licensed pharmacists for all your medication needs
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "Video Consultations",
                description: "Face-to-face consultations with licensed pharmacists from anywhere, anytime",
                features: ["HD Video Calls", "Screen Sharing", "Secure Platform", "15-min Confirmation"],
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: PillIcon,
                title: "Medication Management",
                description: "Comprehensive medication reviews, interactions checks, and therapy optimization",
                features: ["Drug Interaction Analysis", "Therapy Reviews", "Dosing Guidance", "Side Effect Management"],
                color: "from-green-500 to-green-600"
              },
              {
                icon: UserCheck,
                title: "Expert Pharmacist Care", 
                description: "Licensed pharmacists specialized in various areas including geriatrics, wellness, and specialty medications",
                features: ["Licensed Professionals", "Specialized Expertise", "Personalized Care", "Follow-up Support"],
                color: "from-purple-500 to-purple-600"
              }
            ].map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full border-0 shadow-xl overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${solution.color}`}></div>
                  <CardHeader>
                    <div className={`w-12 h-12 bg-gradient-to-r ${solution.color} rounded-xl flex items-center justify-center mb-4`}>
                      <solution.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="font-headline text-xl">{solution.title}</CardTitle>
                    <CardDescription className="text-base font-body mt-2">
                      {solution.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {solution.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Pharmacist Video Features</Badge>
            <h2 className="text-4xl font-headline font-bold text-gray-900 mb-4">
              Complete pharmacy care through video consultations
            </h2>
            <p className="text-xl text-gray-600 font-body max-w-2xl mx-auto">
              Professional pharmacy services delivered securely through our video platform
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Video, title: "HD Video Calls", description: "Crystal clear video consultations with pharmacists" },
              { icon: PillIcon, title: "Medication Reviews", description: "Comprehensive prescription and therapy analysis" },
              { icon: Calendar, title: "Easy Scheduling", description: "Book appointments up to 7 days in advance" },
              { icon: CreditCard, title: "Simple Billing", description: "Transparent $45 per consultation pricing" },
              { icon: MessageSquare, title: "Secure Platform", description: "HIPAA-compliant video technology" },
              { icon: UserCheck, title: "Licensed Pharmacists", description: "Board-certified pharmacy professionals" },
              { icon: Clock, title: "Quick Confirmation", description: "15-minute provider response guarantee" },
              { icon: Lock, title: "Privacy Protected", description: "Your health information stays secure" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Integrations</Badge>
            <h2 className="text-4xl font-headline font-bold text-gray-900 mb-4">
              Seamlessly connects with your existing tools
            </h2>
            <p className="text-xl text-gray-600 font-body max-w-2xl mx-auto">
              Integrated with essential pharmacy and scheduling tools
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "MapFlow",
                logo: "/images/integrations/mapflow-logo.svg",
                type: "Pharmacist",
                description: "Pharmacy workflow management system"
              },
              {
                name: "Pharmacess",
                logo: "/images/integrations/pharmacess-logo.svg",
                type: "Pharmacist",
                description: "Comprehensive pharmacy tools and services"
              },
              {
                name: "Google Calendar",
                logo: "/images/integrations/google-calendar-logo.svg",
                type: "Patient",
                description: "Appointment scheduling and reminders"
              }
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <Image
                    src={integration.logo}
                    alt={`${integration.name} logo`}
                    width={64}
                    height={64}
                    className="mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{integration.name}</h3>
                  <Badge 
                    variant={integration.type === "Pharmacist" ? "default" : "secondary"}
                    className="mb-3"
                  >
                    For {integration.type}s
                  </Badge>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-6">
                <Shield className="w-3 h-3 mr-1" />
                Enterprise Security
              </Badge>
              <h2 className="text-4xl font-headline font-bold mb-6">
                Bank-level security for healthcare data
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Your data is protected with industry-leading security measures and compliance certifications.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "HIPAA Compliant",
                  "SOC 2 Type II",
                  "256-bit Encryption", 
                  "GDPR Ready",
                  "ISO 27001",
                  "24/7 Monitoring"
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-8">
                <Lock className="w-32 h-32 text-primary mx-auto" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-red-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6">
              Ready to get expert pharmacy care?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 font-body">
              Join thousands who trust Parmazip for their medication needs
            </p>
            
            <div className="flex flex-col items-center gap-3">
              <Link href="/pharmacists">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  Browse Pharmacists
                  <Video className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <div className="text-xs text-white/70">
                Are you a pharmacist?{' '}
                <SignupModal 
                  defaultSelection="pharmacist"
                  trigger={
                    <button className="text-white hover:text-white/90 underline font-medium transition-colors">
                      Join our network
                    </button>
                  }
                />
              </div>
            </div>
            
            <div className="mt-12 flex items-center justify-center space-x-8 text-white/80">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>25K+ Satisfied Patients</span>
              </div>
              <div className="flex items-center">
                <PillIcon className="w-5 h-5 mr-2" />
                <span>250+ Licensed Pharmacists</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/images/logos/logo-horizontal-white.png"
                alt="Parmazip Healthcare"
                width={120}
                height={32}
                className="h-8 w-auto mb-4"
              />
              <p className="text-sm">
                Professional pharmacy video consultations with licensed pharmacists.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© 2024 Parmazip. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm hover:text-white transition-colors">HIPAA Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}