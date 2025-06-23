import { getAllSettings, updateSetting } from '$lib/config'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    const settings = await getAllSettings()
    return { settings }
}

export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const data = await request.formData()
            
            // Validate that we have some data to save
            if (data.entries().next().done) {
                return fail(400, { error: 'No settings data provided' })
            }
            
            // Update each setting
            for (const [key, value] of data.entries()) {
                await updateSetting(key, String(value))
            }
            
            return { success: true }
        } catch (error) {
            console.error('Error saving settings:', error)
            return fail(500, { 
                error: 'Failed to save settings. Please try again.' 
            })
        }
    },
}
