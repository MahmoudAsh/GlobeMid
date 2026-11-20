import { describe, expect, it } from 'vitest'
import aliases from '@/data/name-aliases.json'
import { createNameResolver, nameKey, normalizeName } from './names'

const FSR = ['Mahmoud Helal', 'Ahmed Abo Elezz', 'Mohamed Abo Zyed', 'Anwar', 'Fady Adel']

describe('normalizeName', () => {
  it('replaces non-breaking spaces, collapses whitespace and trims', () => {
    expect(normalizeName('Mohamed Magdy')).toBe('Mohamed Magdy')
    expect(normalizeName('  Mohamed Abozaid ')).toBe('Mohamed Abozaid')
    expect(normalizeName('Out of schedule  3 Day')).toBe('Out of schedule 3 Day')
  })
  it('compares case-insensitively', () => {
    expect(nameKey('EZZ')).toBe(nameKey('Ezz'))
    expect(nameKey('Asmaa zidan')).toBe(nameKey('Asmaa Zidan'))
  })
})

describe('createNameResolver', () => {
  const resolve = createNameResolver(aliases, FSR)
  it('applies aliases case-insensitively and takes the FSR spelling', () => {
    expect(resolve('Helal')).toMatchObject({ canonical: 'Mahmoud Helal', inFsrList: true, aliased: true })
    expect(resolve('EZZ')).toMatchObject({ canonical: 'Ahmed Abo Elezz', inFsrList: true })
    expect(resolve('Ezz')).toMatchObject({ canonical: 'Ahmed Abo Elezz' })
    expect(resolve('Mohamed Abozaid ')).toMatchObject({ canonical: 'Mohamed Abo Zyed', inFsrList: true })
    expect(resolve('Mohamed Abo Zaid')).toMatchObject({ canonical: 'Mohamed Abo Zyed' })
  })
  it('matches FSR names regardless of case / spacing', () => {
    expect(resolve(' anwar ')).toMatchObject({ canonical: 'Anwar', inFsrList: true, aliased: false })
  })
  it('keeps people who are not in the FSR list', () => {
    expect(resolve('Moustafa Eid')).toMatchObject({ canonical: 'Moustafa Eid', inFsrList: false, aliased: false })
    // aliased to a canonical name that isn't an FSR either
    expect(resolve('Yaraa')).toMatchObject({ canonical: 'Yara', inFsrList: false, aliased: true })
  })
})
