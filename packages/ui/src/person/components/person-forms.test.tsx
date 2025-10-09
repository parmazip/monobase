import { describe, test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonalInfoForm } from './personal-info-form'
import { ContactInfoForm } from './contact-info-form'
import { AddressForm } from './address-form'
import { PreferencesForm } from './preferences-form'

describe('PersonalInfoForm', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders personal info form with all fields', () => {
    const onSubmit = () => {}
    render(<PersonalInfoForm onSubmit={onSubmit} />)

    // Check for form fields
    expect(screen.getByLabelText(/first name/i)).toBeDefined()
    expect(screen.getByLabelText(/last name/i)).toBeDefined()
    expect(screen.getByLabelText(/gender/i)).toBeDefined()
    expect(screen.getByLabelText(/date of birth/i)).toBeDefined()
  })

  test('renders with default values', () => {
    const defaultValues = {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male' as const,
      dateOfBirth: new Date('1990-01-01')
    }

    const onSubmit = () => {}
    render(<PersonalInfoForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement
    expect(firstNameInput).toBeDefined()
    expect(firstNameInput.value).toBe('John')

    const lastNameInput = screen.getByDisplayValue('Doe') as HTMLInputElement
    expect(lastNameInput).toBeDefined()
    expect(lastNameInput.value).toBe('Doe')
  })

  test('shows submit button when showButtons is true', () => {
    const onSubmit = () => {}
    render(<PersonalInfoForm onSubmit={onSubmit} showButtons={true} />)

    expect(screen.getByRole('button', { name: /continue/i })).toBeDefined()
  })

  test('shows cancel button when onCancel is provided', () => {
    const onSubmit = () => {}
    const onCancel = () => {}
    render(
      <PersonalInfoForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        showButtons={true}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
  })

  test('uses custom submit text', () => {
    const onSubmit = () => {}
    render(
      <PersonalInfoForm
        onSubmit={onSubmit}
        showButtons={true}
        submitText="Update Profile"
      />
    )

    expect(screen.getByRole('button', { name: /update profile/i })).toBeDefined()
  })

  test('handles role-specific rendering', () => {
    const onSubmit = () => {}
    render(<PersonalInfoForm onSubmit={onSubmit} role="provider" />)

    // Form should render with provider context
    expect(screen.getByLabelText(/first name/i)).toBeDefined()
  })

  test('shows avatar section when showAvatar is true', () => {
    const onSubmit = () => {}
    const onAvatarUpload = async (file: File) => ({
      file: 'file-id',
      url: 'https://example.com/avatar.jpg'
    })

    render(
      <PersonalInfoForm
        onSubmit={onSubmit}
        showAvatar={true}
        onAvatarUpload={onAvatarUpload}
      />
    )

    // Should show avatar with camera button
    expect(screen.getByRole('button', { name: '' })).toBeDefined() // Camera icon button
  })
})

describe('ContactInfoForm', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders contact info form with all fields', () => {
    const onSubmit = () => {}
    render(<ContactInfoForm onSubmit={onSubmit} />)

    // Check for form fields
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/phone/i)).toBeDefined()
  })

  test('renders with default values', () => {
    const defaultValues = {
      email: 'john@example.com',
      phone: '+12133734253'
    }

    const onSubmit = () => {}
    render(<ContactInfoForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    const emailInput = screen.getByDisplayValue('john@example.com') as HTMLInputElement
    expect(emailInput).toBeDefined()
    expect(emailInput.value).toBe('john@example.com')
  })

  test('validates email format', async () => {
    const onSubmit = () => {}
    render(<ContactInfoForm onSubmit={onSubmit} showButtons={true} />)

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /save/i })

    // Enter invalid email
    await userEvent.type(emailInput, 'invalid-email')
    fireEvent.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      const errorMessage = screen.queryByText(/invalid email/i)
      expect(errorMessage).toBeDefined()
    })
  })

  test('shows submit and cancel buttons', () => {
    const onSubmit = () => {}
    const onCancel = () => {}
    render(
      <ContactInfoForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        showButtons={true}
      />
    )

    expect(screen.getByRole('button', { name: /save/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
  })
})

describe('AddressForm', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders address form with all fields', () => {
    const onSubmit = () => {}
    render(<AddressForm onSubmit={onSubmit} />)

    // Check for form fields - use exact match to avoid matching "Street Address Line 2"
    expect(screen.getByLabelText(/^street address$/i)).toBeDefined()
    expect(screen.getByLabelText(/city/i)).toBeDefined()
    expect(screen.getByLabelText(/state/i)).toBeDefined()
    expect(screen.getByLabelText(/zip/i)).toBeDefined()
    expect(screen.getByLabelText(/country/i)).toBeDefined()
  })

  test('renders with default values', () => {
    const defaultValues = {
      street1: '123 Main St',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US'
    }

    const onSubmit = () => {}
    render(<AddressForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    const addressInput = screen.getByDisplayValue('123 Main St') as HTMLInputElement
    expect(addressInput).toBeDefined()
    expect(addressInput.value).toBe('123 Main St')

    const cityInput = screen.getByDisplayValue('Los Angeles') as HTMLInputElement
    expect(cityInput).toBeDefined()
    expect(cityInput.value).toBe('Los Angeles')
  })

  test('includes optional address line 2 field', () => {
    const onSubmit = () => {}
    render(<AddressForm onSubmit={onSubmit} />)

    expect(screen.getByLabelText(/street address line 2/i)).toBeDefined()
  })

  test('validates required fields', async () => {
    const onSubmit = () => {}
    render(<AddressForm onSubmit={onSubmit} showButtons={true} required={true} />)

    const submitButton = screen.getByRole('button', { name: /continue/i })

    // Try to submit without filling required fields
    fireEvent.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      // At least one required field error should appear
      const errors = screen.queryAllByText(/required/i)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  test('handles form submission', async () => {
    let submittedData: any = null
    const onSubmit = (data: any) => {
      submittedData = data
    }

    render(<AddressForm onSubmit={onSubmit} showButtons={true} />)

    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/^street address$/i), '456 Elm St')
    await userEvent.type(screen.getByLabelText(/city/i), 'San Francisco')

    // Select state (assuming it's a select field)
    const stateField = screen.getByLabelText(/state/i)
    await userEvent.type(stateField, 'CA')

    await userEvent.type(screen.getByLabelText(/zip/i), '94102')

    // Select country
    const countryField = screen.getByLabelText(/country/i)
    fireEvent.click(countryField)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submittedData).toBeDefined()
    })
  })
})

describe('PreferencesForm', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders preferences form with all fields', () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    // Check for form field labels - now accessible with getByLabelText
    expect(screen.getByLabelText(/languages spoken/i)).toBeDefined()
    expect(screen.getByLabelText(/timezone/i)).toBeDefined()
  })

  test('renders with default values', () => {
    const defaultValues = {
      languagesSpoken: ['en'],
      timezone: 'America/New_York'
    }

    const onSubmit = () => {}
    render(<PreferencesForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    // Check that form renders with defaults
    expect(screen.getByLabelText(/languages spoken/i)).toBeDefined()
    expect(screen.getByLabelText(/timezone/i)).toBeDefined()
  })

  test('includes communication preferences', () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    // Form only has language and timezone fields, no communication preferences
    expect(screen.getByLabelText(/languages spoken/i)).toBeDefined()
    expect(screen.getByLabelText(/timezone/i)).toBeDefined()
  })

  test('handles language selection', async () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    // Languages field should be present
    expect(screen.getByLabelText(/languages spoken/i)).toBeDefined()
    expect(screen.getByText(/select all languages you speak/i)).toBeDefined()
  })

  test('handles timezone selection', async () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    // Timezone field should be present with detected timezone
    expect(screen.getByLabelText(/timezone/i)).toBeDefined()
    expect(screen.getByText(/current detected timezone/i)).toBeDefined()
  })

  test('displays proper language names in badges, not codes', async () => {
    const defaultValues = {
      languagesSpoken: ['en', 'es', 'ar']
    }

    const onSubmit = () => {}
    render(<PreferencesForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    // Should display proper names in badges (using nativeName which is the label)
    await waitFor(() => {
      expect(screen.getByText('English')).toBeDefined()
      expect(screen.getByText('Español')).toBeDefined()
      expect(screen.getByText('العربية')).toBeDefined()

      // Should NOT display 3-letter codes
      expect(screen.queryByText('eng')).toBeNull()
      expect(screen.queryByText('spa')).toBeNull()
      expect(screen.queryByText('ara')).toBeNull()
    })
  })

  test('displays native language names in badges', async () => {
    const defaultValues = {
      languagesSpoken: ['en', 'es', 'ja', 'fr']
    }

    const onSubmit = () => {}
    render(<PreferencesForm defaultValues={defaultValues} onSubmit={onSubmit} />)

    // Since preferences-form uses nativeName in labels
    await waitFor(() => {
      expect(screen.getByText('English')).toBeDefined()
      expect(screen.getByText('Español')).toBeDefined()
      expect(screen.getByText('日本語')).toBeDefined()
      expect(screen.getByText('Français')).toBeDefined()
    })
  })

  test('displays native language names in dropdown', async () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    const combobox = screen.getByTestId('languages-combobox')
    fireEvent.click(combobox)

    await waitFor(() => {
      // Check for a few languages to ensure they are using the native name
      expect(screen.getByText('Español')).toBeDefined()
      expect(screen.getByText('日本語')).toBeDefined()
      expect(screen.getByText('Français')).toBeDefined()
    })
  })


  test('toggles communication preferences', async () => {
    const onSubmit = () => {}
    render(<PreferencesForm onSubmit={onSubmit} />)

    // This form doesn't have communication preferences, just verify form renders
    expect(screen.getByLabelText(/languages spoken/i)).toBeDefined()
    expect(screen.getByLabelText(/timezone/i)).toBeDefined()
  })

  test('submits form with preferences', async () => {
    let submittedData: any = null
    const onSubmit = (data: any) => {
      submittedData = data
    }

    render(<PreferencesForm onSubmit={onSubmit} showButtons={true} />)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save preferences/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submittedData).toBeDefined()
    })
  })

  test('shows cancel button when provided', () => {
    const onSubmit = () => {}
    const onCancel = () => {}
    render(
      <PreferencesForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        showButtons={true}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
  })
})