import { describe, expect, it, vi } from 'vitest'

type Unit = 'minutes' | 'hours' | 'days'

interface Props {
    lookBackAmount?: string
    lookBackUnit?: Unit
    messageCount?: number
    onGoClick?: () => void
    canGenerate?: boolean
    isLoading?: boolean
}

class ControlBarModel {
    lookBackAmount: string
    lookBackUnit: Unit
    messageCount: number
    canGenerate: boolean
    isLoading: boolean
    private goClick: () => void

    constructor(props?: Props) {
        this.lookBackAmount = props?.lookBackAmount ?? '1'
        this.lookBackUnit = props?.lookBackUnit ?? 'hours'
        this.messageCount = props?.messageCount ?? 0
        this.canGenerate = props?.canGenerate ?? true
        this.isLoading = props?.isLoading ?? false
        this.goClick = props?.onGoClick ?? (() => {})
    }

    setLookBackAmount(val: string) {
        this.lookBackAmount = val
    }

    setLookBackUnit(val: Unit) {
        this.lookBackUnit = val
    }

    clickGo() {
        if (this.canGenerate && !this.isLoading) this.goClick()
    }

    setMessageCount(count: number) {
        if (count < 0) throw new Error('Message count cannot be negative.')
        this.messageCount = count
    }

    setCanGenerate(val: boolean) {
        this.canGenerate = val
    }

    setIsLoading(val: boolean) {
        this.isLoading = val
    }
}

describe('ControlBarModel', () => {
    it('initializes with defaults', () => {
        const model = new ControlBarModel()
        expect(model.lookBackAmount).toBe('1')
        expect(model.lookBackUnit).toBe('hours')
        expect(model.messageCount).toBe(0)
        expect(model.canGenerate).toBe(true)
        expect(model.isLoading).toBe(false)
    })

    it('calls onGoClick when allowed', () => {
        const fn = vi.fn()
        const model = new ControlBarModel({ onGoClick: fn })
        model.clickGo()
        expect(fn).toHaveBeenCalled()
    })

    it('setters update values', () => {
        const model = new ControlBarModel()
        model.setLookBackAmount('5')
        model.setLookBackUnit('days')
        model.setMessageCount(2)
        model.setCanGenerate(false)
        model.setIsLoading(true)
        expect(model.lookBackAmount).toBe('5')
        expect(model.lookBackUnit).toBe('days')
        expect(model.messageCount).toBe(2)
        expect(model.canGenerate).toBe(false)
        expect(model.isLoading).toBe(true)
    })

    it('throws when message count negative', () => {
        const model = new ControlBarModel()
        expect(() => model.setMessageCount(-1)).toThrow('Message count cannot be negative.')
    })
})
