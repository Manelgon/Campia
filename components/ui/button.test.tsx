import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('Button renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
})

test('Button supports variants', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button.className).toContain('bg-destructive')
})
