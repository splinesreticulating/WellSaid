import { getMessages } from "$lib/getMessages";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    return await getMessages(start, end);
};
