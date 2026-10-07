import type { Level, Profile, UserType } from '../domain/types'

export const INTEREST_OPTIONS = [
  'Retail & Small Business',
  'Agriculture & Agribusiness',
  'Food & Processing',
  'Rural Services',
  'Handicrafts & Local Products',
  'Finance & Banking',
  'Marketing & Sales',
  'Supply Chain',
  'Entrepreneurship',
]

export const SKILL_OPTIONS = [
  'Pricing',
  'Inventory',
  'Cash Flow',
  'Financial Decisions',
  'Negotiation',
  'Marketing',
  'Business Planning',
  'Decision Making',
]

export const USER_TYPES: UserType[] = [
  'Student',
  'Aspiring Entrepreneur',
  'Rural Entrepreneur',
  'Mentor / Educator',
]

export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced']

export const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Marathi', 'Kannada', 'Telugu']

export const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  userType: 'Aspiring Entrepreneur',
  level: 'Beginner',
  interests: [],
  skills: [],
  language: 'English',
}
