export const parseSummaryToHumanReadable = (rawOutput: string): string => {
    const summaryRegex = /Summary:[ \t]*(\n+)?([\s\S]*?)(?=\s*Suggested replies:|$)/
    const match = rawOutput.match(summaryRegex)

    if (!match) {
        return rawOutput
    }

    // Get the trimmed summary and remove any trailing '###'
    return match[2].trim().replace(/\s*###\s*$/, '')
}
