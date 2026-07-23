import vine from '@vinejs/vine'

export const loginValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254),
  password: vine.string().maxLength(128),
})
