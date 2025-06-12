import { describe, expect, it, vi } from 'vitest'

type LookBackOption = { value: string; label: string }

const DEFAULT_LOOK_BACK_OPTIONS: ReadonlyArray<LookBackOption> = [
    { value: '1', label: 'hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '4', label: '4 hours' },
    { value: '5', label: '5 hours' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '24 hours' },
]

interface ControlBarModelProps {
    lookBackHours?: string
    messageCount?: number
    onGoClick?: () => void
    canGenerate?: boolean
    isLoading?: boolean
    lookBackOptions?: LookBackOption[]
}

class ControlBarModel {
    lookBackHours: string
    messageCount: number
    canGenerate: boolean
    isLoading: boolean
    readonly lookBackOptions: ReadonlyArray<LookBackOption>
    private goClickCallback: () => void

    constructor(props?: ControlBarModelProps) {
        const defaultLookBackHours = '1'
        const defaultMessageCount = 0
        const defaultCanGenerate = true
        const defaultIsLoading = false
        const defaultOnGoClick = () => {}
        const defaultOptions = props?.lookBackOptions
            ? [...props.lookBackOptions]
            : [...DEFAULT_LOOK_BACK_OPTIONS]

        this.lookBackHours = props?.lookBackHours ?? defaultLookBackHours
        this.messageCount = props?.messageCount ?? defaultMessageCount
        this.canGenerate = props?.canGenerate ?? defaultCanGenerate
        this.isLoading = props?.isLoading ?? defaultIsLoading
        this.goClickCallback = props?.onGoClick ?? defaultOnGoClick
        this.lookBackOptions = defaultOptions

        if (!this.lookBackOptions.find((opt) => opt.value === this.lookBackHours)) {
            throw new Error(`Initial lookBackHours "${this.lookBackHours}" is not a valid option.`)
        }
    }

    selectLookBack(hours: string): void {
        if (!this.lookBackOptions.find((opt) => opt.value === hours)) {
            throw new Error(`Invalid lookBackHours value: "${hours}". Not in available options.`)
        }
        this.lookBackHours = hours
    }

    clickGo(): void {
        if (this.canGenerate && !this.isLoading) {
            this.goClickCallback()
        }
    }

    setCanGenerate(value: boolean): void {
        this.canGenerate = value
    }

    setIsLoading(value: boolean): void {
        this.isLoading = value
    }

    setMessageCount(count: number): void {
        if (count < 0) {
            throw new Error('Message count cannot be negative.')
        }
        this.messageCount = count
    }
}

describe('ControlBarModel', () => {
    it('should initialize with default lookback of 1 hour and empty options', () => {
        const model = new ControlBarModel()
        expect(model.lookBackHours).toBe('1')
        expect(model.messageCount).toBe(0)
        expect(model.canGenerate).toBe(true)
        expect(model.isLoading).toBe(false)
        expect(model.lookBackOptions).toEqual(DEFAULT_LOOK_BACK_OPTIONS)
    })

    it('should initialize with custom props including lookback options and callbacks', () => {
        const mockGo = vi.fn()
        const customOptions = [{ value: 'custom', label: 'Custom Option' }]
        const props: ControlBarModelProps = {
            lookBackHours: 'custom',
            messageCount: 10,
            canGenerate: false,
            isLoading: true,
            onGoClick: mockGo,
            lookBackOptions: customOptions,
        }
        const model = new ControlBarModel(props)
        expect(model.lookBackHours).toBe('custom')
        expect(model.messageCount).toBe(10)
        expect(model.canGenerate).toBe(false)
        expect(model.isLoading).toBe(true)
        expect(model.lookBackOptions).toEqual(customOptions)
        // @ts-expect-error Accessing private for test
        model.goClickCallback()
        expect(mockGo).toHaveBeenCalledTimes(1)
    })

    it('should throw when initial lookBackHours is not found in lookBackOptions', () => {
        expect(() => new ControlBarModel({ lookBackHours: 'invalid' })).toThrow(
            'Initial lookBackHours "invalid" is not a valid option.'
        )
    })

    it('should update lookBackHours when selectLookBack is called with valid value', () => {
        const model = new ControlBarModel()
        model.selectLookBack('12')
        expect(model.lookBackHours).toBe('12')
    })

    it('should throw when selectLookBack is called with value not in lookBackOptions', () => {
        const model = new ControlBarModel()
        expect(() => model.selectLookBack('invalid')).toThrow(
            'Invalid lookBackHours value: "invalid". Not in available options.'
        )
    })

    it('should trigger onGoClick when canGenerate is true and isLoading is false', () => {
        const mockGo = vi.fn()
        const model = new ControlBarModel({
            onGoClick: mockGo,
            canGenerate: true,
            isLoading: false,
        })
        model.clickGo()
        expect(mockGo).toHaveBeenCalledTimes(1)
    })

    it('should prevent onGoClick when canGenerate is false', () => {
        const mockGo = vi.fn()
        const model = new ControlBarModel({
            onGoClick: mockGo,
            canGenerate: false,
            isLoading: false,
        })
        model.clickGo()
        expect(mockGo).not.toHaveBeenCalled()
    })

    it('should prevent onGoClick when isLoading is true', () => {
        const mockGo = vi.fn()
        const model = new ControlBarModel({ onGoClick: mockGo, canGenerate: true, isLoading: true })
        model.clickGo()
        expect(mockGo).not.toHaveBeenCalled()
    })

    it('should toggle canGenerate state using setCanGenerate', () => {
        const model = new ControlBarModel()
        model.setCanGenerate(false)
        expect(model.canGenerate).toBe(false)
        model.setCanGenerate(true)
        expect(model.canGenerate).toBe(true)
    })

    it('should toggle isLoading state using setIsLoading', () => {
        const model = new ControlBarModel()
        model.setIsLoading(true)
        expect(model.isLoading).toBe(true)
        model.setIsLoading(false)
        expect(model.isLoading).toBe(false)
    })

    it('should update messageCount when setMessageCount is called with valid value', () => {
        const model = new ControlBarModel()
        model.setMessageCount(5)
        expect(model.messageCount).toBe(5)
    })

    it('should throw when setMessageCount is called with negative value', () => {
        const model = new ControlBarModel()
        expect(() => model.setMessageCount(-1)).toThrow('Message count cannot be negative.')
    })

    it('should prevent external modifications to lookBackOptions by creating a defensive copy', () => {
        const originalOptions = [{ value: 'a', label: 'A' }]
        const model = new ControlBarModel({ lookBackOptions: originalOptions, lookBackHours: 'a' })
        originalOptions.push({ value: 'b', label: 'B' })
        expect(model.lookBackOptions.length).toBe(1)
        expect(model.lookBackOptions[0].value).toBe('a')
        expect(model.lookBackOptions.find((opt) => opt.value === 'b')).toBeUndefined()
    })

    it('should handle duplicate values in lookBackOptions by using first occurrence', () => {
        const duplicateOptions = [
            { value: '1', label: 'First One' },
            { value: '1', label: 'Second One' },
            { value: '2', label: 'Two' },
        ]

        // Should use the first occurrence of value '1'
        const model = new ControlBarModel({
            lookBackOptions: duplicateOptions,
            lookBackHours: '1',
        })

        expect(model.lookBackHours).toBe('1')
        expect(model.lookBackOptions.length).toBe(3)

        // Should be able to select the first '1' value
        model.selectLookBack('1')
        expect(model.lookBackHours).toBe('1')

        // Should be able to select other values
        model.selectLookBack('2')
        expect(model.lookBackHours).toBe('2')
    })
})
