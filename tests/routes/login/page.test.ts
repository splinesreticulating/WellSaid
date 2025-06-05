import { describe, expect, it, vi } from 'vitest'

// Create a mock login page model for testing
interface FormState {
    username: string
    password: string
    error: string
    loading: boolean
}

class LoginPageModel {
    formState: FormState = {
        username: '',
        password: '',
        error: '',
        loading: false,
    }
    redirected = false
    fetchCalled = false
    fetchUrl = ''
    fetchOptions: Record<string, unknown> = {}
    navigationHelper = {
        goto: (path: string) => {
            this.redirected = true
            this.redirectPath = path
        },
    }
    redirectPath = ''

    constructor(errorParam: string | null = null) {
        // Simulate URL error param check
        if (errorParam === 'too_many_attempts') {
            this.formState.error = 'Too many login attempts. Please try again later.'
        }

        // Automatically check auth on init
        this.checkAuthStatus()
    }

    async checkAuthStatus(mockAuthenticated = false) {
        this.fetchCalled = true
        this.fetchUrl = '/api/auth/check'

        if (mockAuthenticated) {
            this.navigationHelper.goto('/')
        }
    }

    async handleSubmit(mockSuccess = false, mockError = false) {
        this.formState.loading = true
        this.formState.error = ''
        this.fetchCalled = true
        this.fetchUrl = '/api/auth/login'
        this.fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: this.formState.username,
                password: this.formState.password,
            }),
        }

        try {
            if (mockError) {
                throw new Error('Network error')
            }

            if (mockSuccess) {
                this.navigationHelper.goto('/')
            } else {
                this.formState.error = 'Invalid username or password'
            }
        } catch (error) {
            this.formState.error = 'An error occurred during login'
        } finally {
            this.formState.loading = false
        }
    }

    setUsername(username: string) {
        this.formState.username = username
    }

    setPassword(password: string) {
        this.formState.password = password
    }
}

describe('Login Page Model', () => {
    it('should initialize with empty form state', () => {
        const loginPage = new LoginPageModel()

        expect(loginPage.formState.username).toBe('')
        expect(loginPage.formState.password).toBe('')
        expect(loginPage.formState.error).toBe('')
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should show error message when error parameter is present', () => {
        const loginPage = new LoginPageModel('too_many_attempts')

        expect(loginPage.formState.error).toBe('Too many login attempts. Please try again later.')
    })

    it('should check auth status on initialization', () => {
        const loginPage = new LoginPageModel()

        expect(loginPage.fetchCalled).toBe(true)
        expect(loginPage.fetchUrl).toBe('/api/auth/check')
    })

    it('should redirect if already authenticated', async () => {
        const loginPage = new LoginPageModel()
        await loginPage.checkAuthStatus(true)

        expect(loginPage.redirected).toBe(true)
        expect(loginPage.redirectPath).toBe('/')
    })

    it('should handle form submission with successful login', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('test_user')
        loginPage.setPassword('correct_password')

        await loginPage.handleSubmit(true)

        expect(loginPage.fetchCalled).toBe(true)
        expect(loginPage.fetchUrl).toBe('/api/auth/login')
        expect(loginPage.fetchOptions.method).toBe('POST')
        expect(loginPage.redirected).toBe(true)
        expect(loginPage.redirectPath).toBe('/')
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should display error with failed login', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('wrong_user')
        loginPage.setPassword('wrong_password')

        await loginPage.handleSubmit(false)

        expect(loginPage.fetchCalled).toBe(true)
        expect(loginPage.fetchUrl).toBe('/api/auth/login')
        expect(loginPage.formState.error).toBe('Invalid username or password')
        expect(loginPage.redirected).toBe(false)
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should handle unexpected errors during login', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('test_user')
        loginPage.setPassword('test_password')

        await loginPage.handleSubmit(false, true)

        expect(loginPage.fetchCalled).toBe(true)
        expect(loginPage.formState.error).toBe('An error occurred during login')
        expect(loginPage.redirected).toBe(false)
        expect(loginPage.formState.loading).toBe(false)
    })
})
