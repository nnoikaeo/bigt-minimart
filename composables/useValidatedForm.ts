/**
 * useValidatedForm Composable
 *
 * Provides form validation utilities using Zod + VeeValidate
 * Handles form submission, validation, and error tracking
 *
 * @example
 * const userSchema = z.object({
 *   email: z.string().email('Invalid email'),
 *   password: z.string().min(6, 'Password must be at least 6 characters'),
 * })
 *
 * const { form, errors, isSubmitting, handleSubmit } = useValidatedForm(userSchema)
 *
 * const onSubmit = handleSubmit((values) => {
 *   console.log('Form data:', values)
 * })
 */

import { ref, computed } from 'vue'
import { z } from 'zod'

interface UseValidatedFormOptions {
  onSubmit?: (values: any) => void | Promise<void>
  onError?: (errors: Record<string, string>) => void
}

export function useValidatedForm<T extends z.ZodType>(
  schema: T,
  options: UseValidatedFormOptions = {}
) {
  // Form state
  const formData = ref<any>({})
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isSubmitted = ref(false)

  /**
   * Validate form data against schema
   */
  const validate = async (data?: any): Promise<boolean> => {
    try {
      const dataToValidate = data || formData.value

      // Validate against schema
      const result = await schema.parseAsync(dataToValidate)
      formData.value = result
      errors.value = {}

      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Build error map
        const errorMap: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          errorMap[path] = err.message
        })
        errors.value = errorMap
      }

      if (options.onError) {
        options.onError(errors.value)
      }

      return false
    }
  }

  /**
   * Reset form to initial state
   */
  const reset = () => {
    formData.value = {}
    errors.value = {}
    isSubmitted.value = false
  }

  /**
   * Set form values programmatically
   */
  const setValues = (values: any) => {
    formData.value = values
  }

  /**
   * Get a single field value
   */
  const getFieldValue = (fieldName: string) => {
    return formData.value[fieldName]
  }

  /**
   * Set a single field value
   */
  const setFieldValue = (fieldName: string, value: any) => {
    formData.value[fieldName] = value
  }

  /**
   * Get error for a specific field
   */
  const getFieldError = (fieldName: string): string | undefined => {
    return errors.value[fieldName]
  }

  /**
   * Check if form has errors
   */
  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0
  })

  /**
   * Check if a specific field has error
   */
  const hasFieldError = (fieldName: string): boolean => {
    return !!errors.value[fieldName]
  }

  /**
   * Handle form submission
   */
  const handleSubmit = (submitFn?: (values: any) => void | Promise<void>) => {
    return async (event?: Event) => {
      if (event) {
        event.preventDefault()
      }

      isSubmitting.value = true
      isSubmitted.value = true

      try {
        // Validate form
        const isValid = await validate()

        if (!isValid) {
          isSubmitting.value = false
          return
        }

        // Call submit handler
        const handler = submitFn || options.onSubmit
        if (handler) {
          await handler(formData.value)
        }
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  }

  /**
   * Get all form values
   */
  const getValues = (): z.infer<T> => {
    return formData.value
  }

  /**
   * Validate a single field
   */
  const validateField = async (fieldName: string, value?: any) => {
    try {
      const fieldValue = value !== undefined ? value : formData.value[fieldName]

      // Get schema field
      const fieldSchema = (schema as any).pick({ [fieldName]: true })
      await fieldSchema.parseAsync({ [fieldName]: fieldValue })

      // Clear field error if validation passes
      delete errors.value[fieldName]
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]
        if (fieldError) {
          errors.value[fieldName] = fieldError.message
        }
      }
      return false
    }
  }

  return {
    // State
    formData,
    errors,
    isSubmitting,
    isSubmitted,
    hasErrors,

    // Methods
    validate,
    reset,
    setValues,
    getValues,
    getFieldValue,
    setFieldValue,
    getFieldError,
    hasFieldError,
    validateField,
    handleSubmit,
  }
}
