import { Page, Locator } from '@playwright/test';

export class PharmacistDetailPage {
  readonly page: Page;
  readonly pharmacistName: Locator;
  readonly pharmacistTitle: Locator;
  readonly pharmacistRating: Locator;
  readonly pharmacistReviewCount: Locator;
  readonly pharmacistBio: Locator;
  readonly pharmacistSpecializations: Locator;
  readonly pharmacistLanguages: Locator;
  readonly consultationFee: Locator;
  readonly yearsExperience: Locator;
  readonly backButton: Locator;
  readonly bookAppointmentButton: Locator;
  readonly dateSelector: Locator;
  readonly timeSlots: Locator;
  readonly selectedTimeSlot: Locator;
  readonly patientNameInput: Locator;
  readonly patientEmailInput: Locator;
  readonly patientPhoneInput: Locator;
  readonly reasonInput: Locator;
  readonly notesTextarea: Locator;
  readonly confirmBookingButton: Locator;
  readonly cancelBookingButton: Locator;
  readonly bookingSuccessMessage: Locator;
  readonly bookingErrorMessage: Locator;
  readonly noSlotsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pharmacistName = page.locator('[data-testid="pharmacist-name"]');
    this.pharmacistTitle = page.locator('[data-testid="pharmacist-title"]');
    this.pharmacistRating = page.locator('[data-testid="pharmacist-rating"]');
    this.pharmacistReviewCount = page.locator('[data-testid="pharmacist-review-count"]');
    this.pharmacistBio = page.locator('[data-testid="pharmacist-bio"]');
    this.pharmacistSpecializations = page.locator('[data-testid="pharmacist-specializations"]');
    this.pharmacistLanguages = page.locator('[data-testid="pharmacist-languages"]');
    this.consultationFee = page.locator('[data-testid="consultation-fee"]');
    this.yearsExperience = page.locator('[data-testid="years-experience"]');
    this.backButton = page.getByRole('button', { name: /back/i });
    this.bookAppointmentButton = page.getByRole('button', { name: /book appointment/i });
    this.dateSelector = page.locator('[data-testid="date-selector"]').first();
    this.timeSlots = page.locator('[data-testid="time-slot"]');
    this.selectedTimeSlot = page.locator('[data-testid="time-slot"][data-selected="true"]');
    this.patientNameInput = page.getByLabel(/patient name/i);
    this.patientEmailInput = page.getByLabel(/email/i);
    this.patientPhoneInput = page.getByLabel(/phone/i);
    this.reasonInput = page.getByLabel(/reason for consultation/i);
    this.notesTextarea = page.getByLabel(/additional notes/i);
    this.confirmBookingButton = page.getByRole('button', { name: /confirm booking/i });
    this.cancelBookingButton = page.getByRole('button', { name: /cancel/i });
    this.bookingSuccessMessage = page.locator('[data-testid="booking-success"]');
    this.bookingErrorMessage = page.locator('[data-testid="booking-error"]');
    this.noSlotsMessage = page.getByText(/no available slots/i);
  }

  async goto(pharmacistId: string) {
    await this.page.goto(`/pharmacists/${pharmacistId}`);
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getPharmacistInfo() {
    return {
      name: await this.pharmacistName.textContent(),
      title: await this.pharmacistTitle.textContent(),
      rating: await this.pharmacistRating.textContent(),
      reviewCount: await this.pharmacistReviewCount.textContent(),
      bio: await this.pharmacistBio.textContent(),
      specializations: await this.pharmacistSpecializations.textContent(),
      languages: await this.pharmacistLanguages.textContent(),
      fee: await this.consultationFee.textContent(),
      experience: await this.yearsExperience.textContent(),
    };
  }

  async selectDate(date: string) {
    // Click date button directly by accessible name (e.g., "Sat4Oct" or just "Sat")
    await this.page.getByRole('button', { name: new RegExp(date, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getAvailableTimeSlotCount(): Promise<number> {
    const slots = await this.timeSlots.all();
    let availableCount = 0;
    for (const slot of slots) {
      const isAvailable = await slot.getAttribute('data-available');
      if (isAvailable === 'true') availableCount++;
    }
    return availableCount;
  }

  async selectTimeSlot(index: number = 0) {
    const availableSlots = await this.page.locator('[data-testid="time-slot"][data-available="true"]').all();
    if (availableSlots[index]) {
      await availableSlots[index].click();
    }
  }

  async isTimeSlotSelected(index: number = 0): Promise<boolean> {
    const slots = await this.timeSlots.all();
    if (slots[index]) {
      const selected = await slots[index].getAttribute('data-selected');
      return selected === 'true';
    }
    return false;
  }

  async openBookingModal() {
    await this.bookAppointmentButton.click();
    await this.page.waitForSelector('[data-testid="booking-modal"]', { state: 'visible' });
  }

  async fillBookingForm(data: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reason: string;
    notes?: string;
  }) {
    await this.patientNameInput.fill(data.patientName);
    await this.patientEmailInput.fill(data.patientEmail);
    await this.patientPhoneInput.fill(data.patientPhone);
    await this.reasonInput.fill(data.reason);
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  async confirmBooking() {
    await this.confirmBookingButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelBooking() {
    await this.cancelBookingButton.click();
  }

  async isBookingSuccessVisible(): Promise<boolean> {
    return await this.bookingSuccessMessage.isVisible();
  }

  async isBookingErrorVisible(): Promise<boolean> {
    return await this.bookingErrorMessage.isVisible();
  }

  async getBookingErrorMessage(): Promise<string | null> {
    if (await this.isBookingErrorVisible()) {
      return await this.bookingErrorMessage.textContent();
    }
    return null;
  }

  async isNoSlotsMessageVisible(): Promise<boolean> {
    return await this.noSlotsMessage.isVisible();
  }

  async waitForTimeSlotsToLoad() {
    await this.page.waitForSelector('[data-testid="time-slot"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => {
      // If no slots, wait for no slots message
      return this.page.waitForSelector('[data-testid="no-slots-message"]', {
        state: 'visible',
        timeout: 10000
      });
    });
  }

  async getSelectedTimeSlotText(): Promise<string | null> {
    const selected = await this.selectedTimeSlot.first();
    if (selected) {
      return await selected.textContent();
    }
    return null;
  }

  async isBookAppointmentEnabled(): Promise<boolean> {
    return await this.bookAppointmentButton.isEnabled();
  }
}