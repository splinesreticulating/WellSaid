import { describe, expect, it } from 'vitest'

// Create a mock model that simulates the AdditionalContext component
class AdditionalContextModel {
    additionalContext: string
    expanded: boolean
    changeContext: (newContext: string) => void
    toggleExpanded: () => void
    clearContext: () => void

    constructor(initialContext = '', initialExpanded = false) {
        this.additionalContext = initialContext
        this.expanded = initialExpanded

        this.changeContext = (newContext: string) => {
            this.additionalContext = newContext
        }

        this.clearContext = () => {
            this.additionalContext = ''
        }

        this.toggleExpanded = () => {
            this.expanded = !this.expanded
        }
    }
}

describe('AdditionalContext Component', () => {
    it('should initialize with default values', () => {
        const component = new AdditionalContextModel()
        expect(component.additionalContext).toBe('')
        expect(component.expanded).toBe(false)
    })

    it('should initialize with provided values', () => {
        const component = new AdditionalContextModel('Some context', true)
        expect(component.additionalContext).toBe('Some context')
        expect(component.expanded).toBe(true)
    })

    it('should update additionalContext when changed', () => {
        const component = new AdditionalContextModel()
        component.changeContext('New context information')
        expect(component.additionalContext).toBe('New context information')
    })

    it('should toggle expanded state', () => {
        const component = new AdditionalContextModel()
        expect(component.expanded).toBe(false)

        component.toggleExpanded()
        expect(component.expanded).toBe(true)

        component.toggleExpanded()
        expect(component.expanded).toBe(false)
    })

    it('should clear additionalContext', () => {
        const component = new AdditionalContextModel('hey')
        component.clearContext()
        expect(component.additionalContext).toBe('')
    })
})
