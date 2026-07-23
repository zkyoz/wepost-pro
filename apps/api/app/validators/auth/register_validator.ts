import vine from '@vinejs/vine'

export const registerValidator = vine.create({
  displayName: vine.string().trim().minLength(2).maxLength(120),
  email: vine.string().trim().toLowerCase().email().maxLength(254).unique({
    table: 'users',
    column: 'email',
  }),
  password: vine.string().minLength(12).maxLength(128),
  passwordConfirmation: vine.string().sameAs('password'),
})
