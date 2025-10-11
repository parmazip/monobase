/**
 * Billing UI Types
 * 
 * These types are UI-specific and may differ from SDK types.
 * SDK types handle API contracts, while these handle presentation logic.
 */

/**
 * Merchant account setup status for UI display
 */
export type MerchantAccountSetupStatus = 'none' | 'incomplete' | 'complete'

/**
 * Props for merchant account setup form component
 */
export interface MerchantAccountFormProps {
  /**
   * Current merchant account data (null if not created yet)
   */
  account: {
    id: string
    metadata?: {
      onboardingStartedAt?: string
    }
  } | null

  /**
   * Setup status derived from account state
   */
  status: MerchantAccountSetupStatus

  /**
   * Loading state for async operations
   */
  isLoading: boolean

  /**
   * Called when user clicks "Set Up" or "Continue Setup"
   * Should handle creating account and opening Stripe onboarding
   */
  onSetupAccount: () => void

  /**
   * Called when user clicks "Continue" after completing setup
   */
  onSubmit: () => void

  /**
   * Called when user clicks "Skip for now"
   */
  onSkip: () => void

  /**
   * Whether to show action buttons (Submit/Skip)
   * Default: true
   */
  showButtons?: boolean
}

/**
 * Invoice status badge variant mapping
 */
export type InvoiceStatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'

/**
 * Payment method display information
 */
export interface PaymentMethodDisplay {
  type: 'card' | 'bank_transfer' | 'other'
  brand?: string
  last4?: string
  label: string
}

/**
 * Invoice list item for UI display
 */
export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: Date
  issuedDate: Date
  paidDate?: Date
}

/**
 * Props for invoice status badge component
 */
export interface InvoiceStatusBadgeProps {
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  className?: string
}
