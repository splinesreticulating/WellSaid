import { describe, it, expect, vi, beforeEach, afterEach, assert } from 'vitest'

// Create a mock model that simulates the ReplySuggestions component
class ReplySuggestionsModel {
    replies: string[]
    loading: boolean
    copiedIndex: number
    clipboardWriteSuccess: boolean
    execCommandSuccess: boolean

    constructor(initialReplies: string[] = [], initialLoading = false) {
        this.replies = initialReplies
        this.loading = initialLoading
        this.copiedIndex = -1
        this.clipboardWriteSuccess = true
        this.execCommandSuccess = true
    }

    async copyToClipboard(text: string, index: number): Promise<void> {
        if (this.clipboardWriteSuccess) {
            // Simulate clipboard API success
            this.copiedIndex = index
            // Reset after 2 seconds (we'll test this with vi.advanceTimersByTime)
            setTimeout(() => {
                this.copiedIndex = -1
            }, 2000)
            return
        }

        // Simulate fallback method
        if (this.execCommandSuccess) {
            this.copiedIndex = index
            setTimeout(() => {
                this.copiedIndex = -1
            }, 2000)
        } else {
            throw new Error('Failed to copy text')
        }
    }

    setLoading(isLoading: boolean): void {
        this.loading = isLoading
    }

    setReplies(newReplies: string[]): void {
        this.replies = newReplies
    }

    simulateClipboardAPIFailure(): void {
        this.clipboardWriteSuccess = false
    }

    simulateExecCommandFailure(): void {
        this.execCommandSuccess = false
    }
}

describe('ReplySuggestions Component', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    it('should initialize with default values', () => {
        const component = new ReplySuggestionsModel()
        expect(component.replies).toEqual([])
        expect(component.loading).toBe(false)
        expect(component.copiedIndex).toBe(-1)
    })

    it('should initialize with provided values', () => {
        const replies = ['Reply 1', 'Reply 2', 'Reply 3']
        const component = new ReplySuggestionsModel(replies, true)
        expect(component.replies).toEqual(replies)
        expect(component.loading).toBe(true)
        expect(component.copiedIndex).toBe(-1)
    })

    it('should update loading state', () => {
        const component = new ReplySuggestionsModel()
        expect(component.loading).toBe(false)
        component.setLoading(true)
        expect(component.loading).toBe(true)
    })

    it('should update replies', () => {
        const component = new ReplySuggestionsModel()
        const newReplies = ['New reply 1', 'New reply 2']
        component.setReplies(newReplies)
        expect(component.replies).toEqual(newReplies)
    })

    it('should set copied index when copying and reset after timeout', async () => {
        const component = new ReplySuggestionsModel(['Reply 1', 'Reply 2'])

        await component.copyToClipboard('Reply 2', 1)
        expect(component.copiedIndex).toBe(1)

        // Fast-forward time to test the reset timeout
        vi.advanceTimersByTime(2000)
        expect(component.copiedIndex).toBe(-1)
    })

    it('should use fallback method if clipboard API fails', async () => {
        const component = new ReplySuggestionsModel(['Reply 1', 'Reply 2'])
        component.simulateClipboardAPIFailure()

        await component.copyToClipboard('Reply 1', 0)
        expect(component.copiedIndex).toBe(0)

        // Fast-forward time to test the reset timeout
        vi.advanceTimersByTime(2000)
        expect(component.copiedIndex).toBe(-1)
    })

    it('should handle failure of both clipboard methods', async () => {
        const component = new ReplySuggestionsModel(['Reply 1'])
        component.simulateClipboardAPIFailure()
        component.simulateExecCommandFailure()

        try {
            await component.copyToClipboard('Reply 1', 0)
            // If we reach here, the test should fail
            expect.fail('Expected copyToClipboard to throw an error')
        } catch (error: unknown) {
            if (error instanceof Error) {
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toBe('Failed to copy text')
            } else {
                assert.fail('Expected an Error instance')
            }
        }

        // copiedIndex should remain unchanged on error
        expect(component.copiedIndex).toBe(-1)
    })

    afterEach(() => {
        vi.useRealTimers()
    })
})
