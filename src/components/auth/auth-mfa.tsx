"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldError } from "@/components/ui/field"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/supabaseClient"

const formSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})

type FormData = z.infer<typeof formSchema>

async function verifyMfa(code: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  if (factorsError) return { success: false, error: factorsError.message }

  const totpFactor = factors.totp[0]
  if (!totpFactor) return { success: false, error: "No TOTP factor found." }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: totpFactor.id,
  })
  if (challengeError) return { success: false, error: challengeError.message }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: totpFactor.id,
    challengeId: challenge.id,
    code,
  })

  if (verifyError) return { success: false, error: verifyError.message }
  return { success: true }
}

interface AuthMFAProps {
  redirectTo?: string
}

export default function AuthMFA({ redirectTo = "/dashboard" }: AuthMFAProps) {
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  })

  const onSubmit = async (data: FormData) => {
    setError("")
    setIsPending(true)

    const result = await verifyMfa(data.code)

    if (result.success) {
      window.location.href = redirectTo
    } else {
      setError(result.error || "Failed to verify code")
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        name="code"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                onComplete={form.handleSubmit(onSubmit)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {fieldState.invalid && fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !form.formState.isValid}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify code"
        )}
      </Button>
    </form>
  )
}