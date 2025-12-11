import { expect, test } from 'vitest'
import { cn } from './utils'

test('cn merges classes correctly', () => {
    expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
    expect(cn('c-1', { 'c-2': true, 'c-3': false })).toBe('c-1 c-2')
    expect(cn('p-4 p-2')).toBe('p-2') // Tailwind merge
    expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500') // Tailwind merge
})
