import { getAllSettings, updateSetting } from '$lib/config'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    const settings = await getAllSettings()
    return { settings }
}

export const actions: Actions = {
    save: async ({ request }) => {
        const data = await request.formData()
        for (const [key, value] of data.entries()) {
            await updateSetting(key, String(value))
        }
        return { success: true }
    },
}
