import { describe, expect, it } from 'vitest'
import { approxDays, classifyRequest } from './classifier'

const cats = (text: string, extra: Partial<Parameters<typeof classifyRequest>[0]> = {}) =>
  classifyRequest({ text, ...extra }).categories

describe('classifyRequest — real strings from the sheet', () => {
  it.each([
    ['One day annual leave', ['annual']],
    ['1 Anuual', ['annual']],
    ['2 Anuual', ['annual']],
    ['Saturday morning shift', ['shift']],
    ['Monday Night Shift +++ Teusday + wednasday Day OFF + one day annual', ['annual', 'dayOff', 'shift']],
    ['Monday Day OFF + Saturday Between Shift', ['dayOff', 'shift']],
    ['Weekly off on Saturday and Thursday', ['dayOff']],
    ['Cancel Day OFF', ['cancelledOff']],
    ['Day off is cancelled', ['cancelledOff']],
    ['يوم بديل Double paid', ['cancelledOff']],
    ['1 day birthday', ['birthday']],
    ['Brithday OFF', ['birthday', 'dayOff']],
    ['1 Day public Holiday', ['publicHoliday']],
    ['One additional leave day (Official Leave)', ['publicHoliday']],
    ['1 اجازه رسمي + انيوال', ['annual', 'publicHoliday']],
    ['1 Day شم نسيم', ['publicHoliday']],
    ['2 Day شم النسيم + OFF + 1 Annual', ['annual', 'publicHoliday', 'dayOff']],
    ['2 Day Eid + OFF', ['publicHoliday', 'dayOff']],
    ['Out of schedule ( Training )', ['training', 'outOfSchedule']],
    ['1 Day Outside meeting', ['training']],
    ['2 Day Out side', ['training']],
    ['4 Day Ouside', ['training']],
    ['2 day emergancy', ['emergency']],
    ['يوم طوارئ', ['emergency']],
    ['يوم حاله وفاه', ['bereavement']],
    ['Wedding 5 Day', ['wedding']],
    ['Long 1 Day', ['shift']],
    ['1 Day No Show', ['noShow']],
    ['His last working day on the schedule will be Monday.', ['leaving']],
    ['اخر يوم شغل 28', ['leaving']],
    ['بره الجدول من يوم 18', ['outOfSchedule']],
    ['3ايام وبعد كده اووت', ['outOfSchedule']],
    ['يوم تعبانه', ['sick']],
    ['5 Sick', ['sick']],
  ])('%s', (text, expected) => {
    expect(cats(text)).toEqual(expect.arrayContaining(expected))
    expect(cats(text)).toHaveLength(expected.length)
  })

  it('does not treat "cancel day off" as a day off, nor a birthday (عيد ميلاد) as Eid', () => {
    expect(cats('Cancel Day OFF')).not.toContain('dayOff')
    expect(cats('1 Day ( عيد ميلاد )')).toEqual(['birthday'])
  })

  it('uses the Annual column and the Status column', () => {
    expect(cats('Sunday and Monday', { annualDays: 2 })).toEqual(['annual'])
    expect(classifyRequest({ text: 'Out of schedule ( Sick )', forcedCategory: 'sick' }).primary).toBe('sick')
    expect(cats('Sick', { annualCellIsSick: true })).toEqual(['sick'])
    expect(classifyRequest({ text: 'Out of schedule', forcedCategory: 'training' }).primary).toBe('training')
  })

  it('falls back to "other" and reports it', () => {
    const r = classifyRequest({ text: 'Sunday and Monday' })
    expect(r).toEqual({ categories: ['other'], primary: 'other', unclassified: true })
    expect(classifyRequest({ text: 'N/A' }).unclassified).toBe(true)
  })
})

describe('approxDays', () => {
  it.each([
    ['5 Sick', 5],
    ['2 Day + OFF', 2],
    ['1 Day + OFF', 1],
    ['Out of schedule 3 Day ( Sick)', 3],
    ['Out of schedule ( Sick )', 1],
    ['يوم طوارئ', 1],
  ])('%s → %i', (t, n) => expect(approxDays(t)).toBe(n))
})
