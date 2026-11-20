import { describe, expect, it } from 'vitest'
import { mapStatus } from './status'

describe('mapStatus', () => {
  it('maps the five values used in the sheet', () => {
    expect(mapStatus('Approved')).toEqual({ status: 'approved', forcedCategory: null })
    expect(mapStatus('Rejected')).toEqual({ status: 'rejected', forcedCategory: null })
    expect(mapStatus('Sick')).toEqual({ status: 'approved', forcedCategory: 'sick' })
    expect(mapStatus('Training')).toEqual({ status: 'approved', forcedCategory: 'training' })
    expect(mapStatus('')).toEqual({ status: 'not_marked', forcedCategory: null })
    expect(mapStatus(undefined)).toEqual({ status: 'not_marked', forcedCategory: null })
  })
  it('a red row is rejected even without the word', () => {
    expect(mapStatus('', 'FF0000').status).toBe('rejected')
    expect(mapStatus('Approved', 'FFFF0000').status).toBe('rejected')
    expect(mapStatus('Approved', '').status).toBe('approved')
  })
  it('is case / space tolerant', () => {
    expect(mapStatus(' approved ').status).toBe('approved')
    expect(mapStatus('REJECTED').status).toBe('rejected')
  })
})
