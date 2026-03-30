import { redirect } from "next/navigation";

import { getOnboardingState } from "@/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepComplete } from "@/components/onboarding/StepComplete";
import { StepLinkProvider } from "@/components/onboarding/StepLinkProvider";
import { StepTenantSetup } from "@/components/onboarding/StepTenantSetup";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { createClient } from "@/lib/supabase/supabaseServerClient";

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseRequestedStep(stepParam: string | string[] | undefined) {
  const rawValue = Array.isArray(stepParam) ? stepParam[0] : stepParam;
  const parsed = Number(rawValue ?? "1");
  return Number.isFinite(parsed) ? parsed : 1;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {   
    redirect("/");
  }

  const stateResult = await getOnboardingState(user.id);

  if (!stateResult.success || !stateResult.data) {
    console.log(stateResult);

    redirect("/");
  }

  const state = stateResult.data;

  if (state.user.is_onboarded) {
    redirect("/dashboard");
  }

  const totalSteps = state.pendingTenantDetails ? 4 : 3;
  const requestedStep = parseRequestedStep(resolvedSearchParams?.step);
  const currentStep = Math.max(1, Math.min(totalSteps, requestedStep));
  const fullName =
    [state.user.first_name, state.user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || state.email;

  if (currentStep === 1) {
    return (
      <OnboardingShell
        currentStep={1}
        totalSteps={totalSteps}
        title="Welcome"
        description="Confirm your account details and upload an avatar if you want one."
      >
        <StepWelcome
          userId={state.user.id}
          email={state.email}
          firstName={state.user.first_name}
          lastName={state.user.last_name}
          avatar={state.user.avatar}
          nextStep={2}
        />
      </OnboardingShell>
    );
  }

  if (currentStep === 2) {
    return (
      <OnboardingShell
        currentStep={2}
        totalSteps={totalSteps}
        title="Connect your account"
        description="Choose how you will sign in after today."
      >
        <StepLinkProvider
          email={state.email}
          identities={state.identities}
          nextStep={3}
        />
      </OnboardingShell>
    );
  }

  if (state.pendingTenantDetails && currentStep === 3 && state.tenant) {
    return (
      <OnboardingShell
        currentStep={3}
        totalSteps={totalSteps}
        title="Complete your company profile"
        description="Your workspace is ready. Fill in the remaining company details to finish setup."
      >
        <StepTenantSetup
          userId={state.user.id}
          tenantId={state.tenant.id}
          tenant={state.tenant}
          nextStep={4}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      currentStep={totalSteps}
      totalSteps={totalSteps}
      title="Almost there"
      description="Review your setup and finish onboarding."
    >
      <StepComplete
        userId={state.user.id}
        name={fullName}
        email={state.email}
        identities={state.identities}
        tenantName={state.membershipTenantName}
      />
    </OnboardingShell>
  );
}
