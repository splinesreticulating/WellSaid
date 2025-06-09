import { describe, expect, it, vi } from 'vitest'

// Create a mock login page model for testing form actions
interface FormState {
    username: string
    password: string
    loading: boolean
}

interface ActionData {
    error?: string
}

class LoginPageModel {
    formState: FormState = {
        username: '',
        password: '',
        loading: false,
    }
    form: ActionData | null = null
    submitted = false
    formData: FormData | null = null
    navigationHelper = {
        goto: (path: string) => {
            this.redirected = true
            this.redirectPath = path
        },
    }
    redirected = false
    redirectPath = ''
    errorParam: string | null = null

    constructor(errorParam: string | null = null) {
        this.errorParam = errorParam
    }

    setUsername(username: string) {
        this.formState.username = username
    }

    setPassword(password: string) {
        this.formState.password = password
    }

    // Simulate form submission
    async submitForm(mockResult: ActionData | null = null, shouldRedirect = false) {
        this.formState.loading = true
        this.submitted = true

        // Create form data as would be sent
        this.formData = new FormData()
        this.formData.append('username', this.formState.username)
        this.formData.append('password', this.formState.password)

        // Simulate form action result
        if (shouldRedirect) {
            this.navigationHelper.goto('/')
        } else {
            this.form = mockResult
        }

        this.formState.loading = false
    }

    // Simulate checking for error query parameters
    checkErrorParam(): string | null {
        return this.errorParam
    }

    // Get the error message to display
    getErrorMessage(): string | null {
        if (this.form?.error) {
            return this.form.error
        }
        if (this.errorParam === 'too_many_attempts') {
            return 'Too many login attempts. Please try again later.'
        }
        return null
    }
}

describe('Login Page Model (Form Actions)', () => {
    it('should initialize with empty form state', () => {
        const loginPage = new LoginPageModel()

        expect(loginPage.formState.username).toBe('')
        expect(loginPage.formState.password).toBe('')
        expect(loginPage.formState.loading).toBe(false)
        expect(loginPage.form).toBe(null)
    })

    it('should show error message when error parameter is present', () => {
        const loginPage = new LoginPageModel('too_many_attempts')

        expect(loginPage.getErrorMessage()).toBe('Too many login attempts. Please try again later.')
    })

    it('should handle form submission with successful login (redirect)', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('test_user')
        loginPage.setPassword('correct_password')

        await loginPage.submitForm(null, true)

        expect(loginPage.submitted).toBe(true)
        expect(loginPage.formData?.get('username')).toBe('test_user')
        expect(loginPage.formData?.get('password')).toBe('correct_password')
        expect(loginPage.redirected).toBe(true)
        expect(loginPage.redirectPath).toBe('/')
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should display error with failed login', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('wrong_user')
        loginPage.setPassword('wrong_password')

        await loginPage.submitForm({ error: 'nope' })

        expect(loginPage.submitted).toBe(true)
        expect(loginPage.getErrorMessage()).toBe('nope')
        expect(loginPage.redirected).toBe(false)
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should handle server errors during login', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('test_user')
        loginPage.setPassword('test_password')

        await loginPage.submitForm({ error: 'An error occurred during login' })

        expect(loginPage.submitted).toBe(true)
        expect(loginPage.getErrorMessage()).toBe('An error occurred during login')
        expect(loginPage.redirected).toBe(false)
        expect(loginPage.formState.loading).toBe(false)
    })

    it('should handle server configuration errors', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('test_user')
        loginPage.setPassword('test_password')

        await loginPage.submitForm({ error: 'Server configuration error' })

        expect(loginPage.getErrorMessage()).toBe('Server configuration error')
    })

    it('should handle missing credentials error', async () => {
        const loginPage = new LoginPageModel()
        // Don't set username/password

        await loginPage.submitForm({ error: 'Username and password are required' })

        expect(loginPage.getErrorMessage()).toBe('Username and password are required')
    })

    it('should create proper form data for submission', async () => {
        const loginPage = new LoginPageModel()
        loginPage.setUsername('testuser')
        loginPage.setPassword('testpass')

        await loginPage.submitForm()

        expect(loginPage.formData).toBeInstanceOf(FormData)
        expect(loginPage.formData?.get('username')).toBe('testuser')
        expect(loginPage.formData?.get('password')).toBe('testpass')
    })
})
