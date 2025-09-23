import z from 'zod'

export const maxProfileDisplayNameLength = 100
export const maxProfileUsernameLength = 50
export const minProfileUsernameLength = 3

export const maxProfileDescriptionLength = 10000

export const maxProfileLinks = 10
export const maxProfileLinkNameLength = 50
export const maxProfileLinkUrlLength = 255

export const generalSettingsFormSchema = z.object({
  displayName: z
    .string()
    .min(1, { error: 'Display name is required' })
    .max(maxProfileDisplayNameLength, {
      error: `Max ${maxProfileDisplayNameLength} characters`,
    }),
  username: z
    .string()
    .min(minProfileUsernameLength, {
      error: `Must be at least ${minProfileUsernameLength} characters`,
    })
    .max(maxProfileUsernameLength, {
      error: `Max ${maxProfileUsernameLength} characters`,
    }),
  description: z.string().max(maxProfileDescriptionLength, {
    error: `Max ${maxProfileDescriptionLength} characters`,
  }),
  socialLinks: z
    .array(
      z.object({
        id: z.string(),
        name: z
          .string()
          .min(1, { error: 'Name is required' })
          .max(maxProfileLinkNameLength, {
            error: `Max ${maxProfileLinkNameLength} characters`,
          }),
        url: z
          .url({
            error: 'Invalid URL',
          })
          .max(maxProfileLinkUrlLength, {
            error: `Max ${maxProfileLinkUrlLength} characters`,
          }),
        position: z.number(),
      }),
    )
    .max(maxProfileLinks, {
      error: `You can only add up to ${maxProfileLinks} links`,
    }),
  avatarUrl: z.string(),
})
