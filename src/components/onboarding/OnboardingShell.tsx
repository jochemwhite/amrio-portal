"use client";

import { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OnboardingShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function OnboardingShell({
  currentStep,
  totalSteps,
  title,
  description,
  children,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader className="space-y-4 border-b">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span>Onboarding</span>
              <span>
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
