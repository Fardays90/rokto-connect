import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { registerUser } from '../api/auth'
import * as z from 'zod'
import ApiModal from '../components/ApiModal'
import React from 'react'
import { useAuthStore } from '../stores/auth'
import { getCurrentUser } from '../api/user'

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  zip_code: string;
  division: string;
  district: string;
  password: string;
  is_donor?: boolean;
  blood_type?: string;
}

interface ApiErrorResponse {
  detail: string;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const formSchema = z
  .object({
    first_name: z.string().min(2, 'First name must be at least 2 characters.'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters.'),
    phone_number: z
      .string()
      .regex(
        /^(?:\+?88)?01[3-9]\d{8}$/,
        'Enter a valid mobile number (e.g. 01712345678)'
      ),
    zip_code: z.string().regex(/^[0-9]{4}$/, 'ZIP code must be exactly 4 digits.'),
    division: z.string().min(1, 'Please select a division.'),
    district: z.string().min(2, 'District must be at least 2 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    is_donor: z.boolean().default(false),
    blood_type: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_donor && (!data.blood_type || data.blood_type.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select your blood type.',
        path: ['blood_type'],
      })
    }
  })

type RegisterFormValues = z.input<typeof formSchema>

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  )
}
export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_donor: false,
      division: '',
      blood_type: '',
    },
    mode: 'onTouched',
  })
  const isDonor = watch('is_donor')
  const { mutate, isLoading, isError, isSuccess, error } = useMutation({
    mutationFn: registerUser,
    onSuccess: (data: any) => {
      console.log('Registration successful:', data?.message);
      // could show toast or redirect
    },
    // 2. Explicitly type error as AxiosError<ApiErrorResponse>
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const errorMsg = err.response?.data?.detail || 'Registration failed'
      console.error('Error:', errorMsg)
    },
  }) as any

  const onSubmit = async (data: RegisterFormValues) => {
    mutate(data)
  }

  const [modalOpen, setModalOpen] = React.useState(false)
  React.useEffect(() => {
    if (isLoading || isError || isSuccess) setModalOpen(true)
  }, [isLoading, isError, isSuccess])

  const setAuth = useAuthStore.getState().setUser
  React.useEffect(() => {
    if (isSuccess) {
      ;(async () => {
        try {
          const user = await getCurrentUser()
          setAuth(user)
        } catch (e) {
          // ignore
        }
      })()
    }
  }, [isSuccess, setAuth])
  const getInputClasses = (hasError: boolean) =>
    `w-full rounded-lg border bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-[color:var(--rc-bone)]/20 focus:ring-2 ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
        : 'border-[color:var(--rc-line)] focus:border-[color:var(--rc-blood)] focus:ring-[color:var(--rc-blood)]/10'
    }`

  const getSelectClasses = (hasError: boolean) =>
    `w-full appearance-none rounded-lg border bg-black/30 px-4 py-3 text-sm outline-none transition focus:ring-2 ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
        : 'border-[color:var(--rc-line)] focus:border-[color:var(--rc-blood)] focus:ring-[color:var(--rc-blood)]/10'
    }`

  return (
    <main
      className="min-h-screen bg-[color:var(--rc-ink)] px-6 py-16 text-[color:var(--rc-bone)]"
      style={{ fontFamily: 'var(--rc-body)' }}
    >
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-10">
          <div
            className="mb-5 text-xs uppercase tracking-[0.25em] text-[color:var(--rc-blood)]"
            style={{ fontFamily: 'var(--rc-mono)' }}
          >
            RoktoConnect
          </div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--rc-display)' }}
          >
            Create your account.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--rc-bone)]/55">
            Join RoktoConnect and help connect people with the blood they need.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rc-line)] bg-white/[0.025] p-7 shadow-2xl">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--rc-blood)]/10 blur-3xl" />

          <form
            className="relative space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
                >
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  placeholder="Fardin"
                  autoComplete="given-name"
                  className={getInputClasses(!!errors.first_name)}
                  {...register('first_name')}
                />
                <ErrorMessage message={errors.first_name?.message} />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
                >
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  placeholder="Dhrubo"
                  autoComplete="family-name"
                  className={getInputClasses(!!errors.last_name)}
                  {...register('last_name')}
                />
                <ErrorMessage message={errors.last_name?.message} />
              </div>
            </div>

            
            <div>
              <label
                htmlFor="phone_number"
                className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
              >
                Phone number
              </label>
              <input
                id="phone_number"
                type="tel"
                placeholder="+8801712345678"
                data-lpignore="true"
                data-1p-ignore="true"
                autoComplete="off"
                className={getInputClasses(!!errors.phone_number)}
                {...register('phone_number')}
              />
              <ErrorMessage message={errors.phone_number?.message} />
            </div>

            <input
              type="text"
              name="dummy_username"
              style={{ display: 'none' }}
              autoComplete="username"
            />

            
            <div>
              <div
                className="mb-3 text-xs uppercase tracking-wider text-[color:var(--rc-bone)]/40"
                style={{ fontFamily: 'var(--rc-mono)' }}
              >
                Location
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                
                <div>
                  <label
                    htmlFor="zip_code"
                    className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
                  >
                    ZIP code
                  </label>
                  <input
                    id="zip_code"
                    type="text"
                    placeholder="1212"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="postal-code"
                    className={getInputClasses(!!errors.zip_code)}
                    {...register('zip_code')}
                  />
                  <ErrorMessage message={errors.zip_code?.message} />
                </div>

                
                <div>
                  <label
                    htmlFor="division"
                    className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
                  >
                    Division
                  </label>
                  <select
                    id="division"
                    className={getSelectClasses(!!errors.division)}
                    {...register('division')}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="barisal">Barisal</option>
                    <option value="chattogram">Chattogram</option>
                    <option value="dhaka">Dhaka</option>
                    <option value="khulna">Khulna</option>
                    <option value="mymensingh">Mymensingh</option>
                    <option value="rajshahi">Rajshahi</option>
                    <option value="rangpur">Rangpur</option>
                    <option value="sylhet">Sylhet</option>
                  </select>
                  <ErrorMessage message={errors.division?.message} />
                </div>

                
                <div>
                  <label
                    htmlFor="district"
                    className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
                  >
                    District
                  </label>
                  <input
                    id="district"
                    type="text"
                    placeholder="Dhaka"
                    autoComplete="address-level2"
                    className={getInputClasses(!!errors.district)}
                    {...register('district')}
                  />
                  <ErrorMessage message={errors.district?.message} />
                </div>
              </div>
            </div>

            
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-[color:var(--rc-bone)]/60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a secure password"
                autoComplete="new-password"
                className={getInputClasses(!!errors.password)}
                {...register('password')}
              />
              <ErrorMessage message={errors.password?.message} />
              {!errors.password && (
                <p className="mt-2 text-xs text-[color:var(--rc-bone)]/30">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            
            <div className="rounded-xl border border-[color:var(--rc-line)] bg-white/[0.025] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[color:var(--rc-blood)]"
                  {...register('is_donor')}
                />
                <div>
                  <div className="text-sm font-medium">
                    I want to become a donor
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--rc-bone)]/45">
                    Make yourself available to people who need your blood type.
                  </p>
                </div>
              </label>

              {isDonor && (
                <div className="mt-5 border-t border-[color:var(--rc-line)] pt-5">
                  <label
                    htmlFor="blood_type"
                    className="mb-2 block text-xs uppercase tracking-wider text-[color:var(--rc-bone)]/50"
                    style={{ fontFamily: 'var(--rc-mono)' }}
                  >
                    Blood type
                  </label>
                  <select
                    id="blood_type"
                    className={getSelectClasses(!!errors.blood_type)}
                    {...register('blood_type')}
                  >
                    <option value="" disabled>
                      Select your blood type
                    </option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage message={errors.blood_type?.message} />
                  {!errors.blood_type && (
                    <p
                      className="mt-2 text-xs text-[color:var(--rc-plasma)]/70"
                      style={{ fontFamily: 'var(--rc-mono)' }}
                    >
                      REQUIRED FOR DONORS
                    </p>
                  )}
                </div>
              )}
            </div>

                
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--rc-blood)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:var(--rc-blood-deep)] hover:shadow-lg hover:shadow-[color:var(--rc-blood)]/20 active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    Create account
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              {isError && (
                <div className="mt-3 text-sm text-red-400">
                  {(error as AxiosError<any>)?.response?.data?.detail || 'Registration failed. Please try again.'}
                </div>
              )}

              {isSuccess && (
                <div className="mt-3 text-sm text-[color:var(--rc-plasma)]">Account created successfully.</div>
              )}
            </div>
            <ApiModal
              open={modalOpen}
              loading={isLoading}
              success={isSuccess}
              error={isError ? ((error as AxiosError<any>)?.response?.data?.detail || 'Registration failed') : null}
              title="Register"
              onClose={() => setModalOpen(false)}
            />
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[color:var(--rc-bone)]/40">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-[color:var(--rc-bone)] transition hover:text-[color:var(--rc-blood)]"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  )
}
