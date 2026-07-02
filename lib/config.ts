export const appConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL ?? '',
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? '',
  tasksUrl: process.env.NEXT_PUBLIC_TASKS_URL ?? '',
  contractsUrl: process.env.NEXT_PUBLIC_CONTRACTS_URL ?? '',
  salesCalendarSlug: process.env.NEXT_PUBLIC_SALES_CALENDAR_SLUG ?? 'business',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Devya Solutions',
  companyUrl: process.env.NEXT_PUBLIC_COMPANY_URL ?? 'https://www.devya.dev',
};
