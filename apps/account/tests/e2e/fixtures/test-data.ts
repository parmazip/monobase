import { faker } from '@faker-js/faker'

// Factory functions using faker for dynamic test data
export const makeTestUser = () => ({
  email: faker.internet.email().toLowerCase(),
  password: 'TestPassword123!',
  name: faker.person.fullName(),
})

// Legacy static test user (kept for backwards compatibility)
export const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
}

export const personalInfo = {
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Michael',
  dateOfBirth: new Date(1990, 0, 15),
  gender: 'Male',
}

export const updatedPersonalInfo = {
  firstName: 'Jonathan',
  lastName: 'Smith',
  middleName: 'Robert',
  dateOfBirth: new Date(1985, 5, 20),
  gender: 'Non-binary',
}

export const contactInfo = {
  phone: '+1 555-123-4567',
}

export const updatedContactInfo = {
  phone: '+1 555-987-6543',
}

export const addressInfo = {
  street1: '123 Main Street',
  street2: 'Apt 4B',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94102',
  country: 'US',
}

export const updatedAddressInfo = {
  street1: '456 Oak Avenue',
  street2: 'Suite 200',
  city: 'Los Angeles',
  state: 'CA',
  postalCode: '90001',
  country: 'US',
}

export const preferences = {
  languagesSpoken: ['en', 'es'],
  timezone: 'America/Los_Angeles',
}

export const updatedPreferences = {
  languagesSpoken: ['en', 'fr', 'zh'],
  timezone: 'America/New_York',
}

// Notification test data
export const notificationData = {
  security: {
    type: 'security',
    title: 'Password Changed',
    message: 'Your password was successfully updated',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  system: {
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur on Sunday at 2:00 AM',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  },
}