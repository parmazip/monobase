import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { providerFormSchema, type ProviderFormData } from '../schemas'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/form'
import { Input } from '../../components/input'
import { Textarea } from '../../components/textarea'
import { Button } from '../../components/button'
import { Checkbox } from '../../components/checkbox'
import { MINOR_AILMENTS } from '../../constants/minor-ailments'
import { MINOR_AILMENTS_PRACTICE_LOCATIONS } from '../../constants/minor-ailments-practice-locations'

interface ProviderFormProps {
  defaultValues?: Partial<ProviderFormData>
  onSubmit: (data: ProviderFormData) => Promise<void>
  isLoading?: boolean
  showButtons?: boolean
  formId?: string
}

export function ProviderForm({ defaultValues, onSubmit, isLoading, showButtons = true, formId }: ProviderFormProps) {
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: defaultValues || {
      providerType: 'pharmacist',
      yearsOfExperience: undefined,
      biography: '',
      minorAilmentsSpecialties: [],
      minorAilmentsPracticeLocations: [],
    },
    mode: 'onBlur',
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id={formId}>
        <input type="hidden" {...form.register('providerType')} value="pharmacist" />

        <FormField
          control={form.control}
          name="yearsOfExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={70}
                  placeholder="e.g., 10"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value ? parseInt(value, 10) : undefined)
                  }}
                />
              </FormControl>
              <FormDescription>
                Number of years practicing in your field
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Biography *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief professional bio (min 10 characters, max 2000 characters)"
                  rows={6}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Share your background, education, and areas of expertise
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minorAilmentsSpecialties"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Minor Ailments Specialties *</FormLabel>
                <FormDescription>
                  Select at least one specialty area you can treat
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MINOR_AILMENTS.map((specialty) => (
                  <FormField
                    key={specialty.code}
                    control={form.control}
                    name="minorAilmentsSpecialties"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={specialty.code}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(specialty.code)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), specialty.code])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== specialty.code
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {specialty.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minorAilmentsPracticeLocations"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Practice Locations *</FormLabel>
                <FormDescription>
                  Select at least one province/territory where you're licensed to practice
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MINOR_AILMENTS_PRACTICE_LOCATIONS.map((location) => (
                  <FormField
                    key={location.code}
                    control={form.control}
                    name="minorAilmentsPracticeLocations"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={location.code}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(location.code)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), location.code])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== location.code
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {location.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {showButtons && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Provider Profile'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
