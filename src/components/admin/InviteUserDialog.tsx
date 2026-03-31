"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Loader2, Mail, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createUserInvite } from "@/actions/authentication/user-emails";
import { getTenantOptions } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  BUSINESS_TYPE_OPTIONS,
  DEFAULT_COUNTRY,
  TENANT_ROLE_OPTIONS,
  UserFormSchema,
  UserFormValues,
} from "@/schemas/user-form";
import { TenantOption, UserRoleOption } from "@/types/user";
import { toast } from "sonner";

type InviteUserFormInput = UserFormValues;
type TenantAssignmentOption = "existing" | "new" | "none" | null;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
  roleOptions?: UserRoleOption[];
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
  roleOptions = [],
}: InviteUserDialogProps) {
  const safeRoleOptions = roleOptions.length > 0
    ? roleOptions
    : [{ value: "viewer", label: "Viewer", description: null }];

  const [step, setStep] = useState(1);
  const [tenantAssignment, setTenantAssignment] = useState<TenantAssignmentOption>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [tenantSearchOpen, setTenantSearchOpen] = useState(false);
  const [isLoadingTenants, startTenantLoad] = useTransition();

  const form = useForm<InviteUserFormInput>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      global_role: safeRoleOptions[0]?.value ?? "viewer",
      send_invite: true,
      tenant_id: undefined,
      tenant_role: TENANT_ROLE_OPTIONS[2],
      new_tenant: undefined,
      no_tenant: false,
    },
  });

  const inviteeEmail = form.watch("email");
  const selectedTenantId = form.watch("tenant_id");

  const selectedTenant = useMemo(
    () => tenantOptions.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenantOptions],
  );

  useEffect(() => {
    if (!open) {
      form.reset({
        first_name: "",
        last_name: "",
        email: "",
        global_role: safeRoleOptions[0]?.value ?? "viewer",
        send_invite: true,
        tenant_id: undefined,
        tenant_role: TENANT_ROLE_OPTIONS[2],
        new_tenant: undefined,
        no_tenant: false,
      });
      setTenantAssignment(null);
      setStep(1);
      setTenantSearchOpen(false);
      return;
    }

    startTenantLoad(async () => {
      const result = await getTenantOptions();

      if (!result.success) {
        toast.error(result.error ?? "Failed to load tenants");
        return;
      }

      setTenantOptions(result.data ?? []);
    });
  }, [form, open, safeRoleOptions, startTenantLoad]);

  useEffect(() => {
    if (tenantAssignment !== "new") {
      return;
    }

    const currentTenant = form.getValues("new_tenant");
    form.setValue("new_tenant", {
      name: currentTenant?.name ?? "",
      business_type: currentTenant?.business_type ?? BUSINESS_TYPE_OPTIONS[0],
      contact_email: currentTenant?.contact_email || inviteeEmail || "",
      country: currentTenant?.country ?? DEFAULT_COUNTRY,
    });
  }, [form, inviteeEmail, tenantAssignment]);

  const isSubmitting = form.formState.isSubmitting;

  const selectTenantAssignment = (option: Exclude<TenantAssignmentOption, null>) => {
    setTenantAssignment(option);

    if (option === "existing") {
      form.setValue("new_tenant", undefined);
      form.setValue("no_tenant", false);
    }

    if (option === "new") {
      form.setValue("tenant_id", undefined);
      form.setValue("tenant_role", undefined);
      form.setValue("no_tenant", false);
      form.setValue("new_tenant", {
        name: "",
        business_type: BUSINESS_TYPE_OPTIONS[0],
        contact_email: inviteeEmail || "",
        country: DEFAULT_COUNTRY,
      });
    }

    if (option === "none") {
      form.setValue("tenant_id", undefined);
      form.setValue("tenant_role", undefined);
      form.setValue("new_tenant", undefined);
      form.setValue("no_tenant", true);
    }

    void form.trigger(["tenant_id", "tenant_role", "new_tenant", "no_tenant"]);
  };

  const handleNext = async () => {
    const isValid = await form.trigger(["first_name", "last_name", "email", "global_role", "send_invite"]);
    if (isValid) {
      setStep(2);
    }
  };

  const handleSubmit = async (values: InviteUserFormInput) => {
    const payload = {
      ...values,
      tenant_id: tenantAssignment === "existing" ? values.tenant_id : undefined,
      tenant_role: tenantAssignment === "existing" ? values.tenant_role : undefined,
      new_tenant: tenantAssignment === "new" ? values.new_tenant : undefined,
      no_tenant: tenantAssignment === "none",
    };

    const parsedPayload = UserFormSchema.safeParse(payload);

    if (!parsedPayload.success) {
      parsedPayload.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as keyof InviteUserFormInput, { message: issue.message });
        }
      });
      return;
    }

    const result = await createUserInvite(parsedPayload.data);

    if (!result.success) {
      toast.error(result.error ?? "Failed to invite user");
      return;
    }

    toast.success("Invite created successfully");
    await onSuccess();
    onOpenChange(false);
  };

  const stepProgress = step === 1 ? 50 : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Step {step} of 2. Capture the user details, then choose how they should join the portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>User details</span>
            <span>Tenant assignment</span>
          </div>
          <Progress value={stepProgress} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="jane@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="global_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Global role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a global role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeRoleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This controls the user&apos;s global permissions in the portal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="send_invite"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                      <div className="space-y-1">
                        <FormLabel>Send invite email</FormLabel>
                        <FormDescription>
                          When enabled, the user receives a magic link to start onboarding.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4">
                  <div className="text-left">
                    <Card
                      className={cn(
                      "transition-colors",
                      tenantAssignment === "existing" && "ring-2 ring-primary",
                    )}
                      onClick={() => selectTenantAssignment("existing")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="size-4" />
                          Existing Tenant
                        </CardTitle>
                        <CardDescription>
                          Add the user to an existing organisation and pick their tenant role.
                        </CardDescription>
                      </CardHeader>
                      {tenantAssignment === "existing" ? (
                        <CardContent className="grid gap-4 pt-0">
                          <FormField
                            control={form.control}
                            name="tenant_id"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Tenant</FormLabel>
                                <Popover open={tenantSearchOpen} onOpenChange={setTenantSearchOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        className="justify-between font-normal"
                                      >
                                        {selectedTenant?.name ?? "Search for a tenant"}
                                        <UserRoundPlus className="size-4 opacity-60" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search tenants..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          {isLoadingTenants ? "Loading tenants..." : "No tenants found."}
                                        </CommandEmpty>
                                        {tenantOptions.map((tenant) => (
                                          <CommandItem
                                            key={tenant.id}
                                            value={tenant.name}
                                            onSelect={() => {
                                              field.onChange(tenant.id);
                                              setTenantSearchOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 size-4",
                                                tenant.id === field.value ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            {tenant.name}
                                          </CommandItem>
                                        ))}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tenant_role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role within tenant</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a tenant role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TENANT_ROLE_OPTIONS.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      ) : null}
                    </Card>
                  </div>

                  <div className="text-left">
                    <Card
                      className={cn(
                      "transition-colors",
                      tenantAssignment === "new" && "ring-2 ring-primary",
                    )}
                      onClick={() => selectTenantAssignment("new")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="size-4" />
                          Create New Tenant Now
                        </CardTitle>
                        <CardDescription>
                          Create a tenant shell now, then let the user finish their company profile during onboarding.
                        </CardDescription>
                      </CardHeader>
                      {tenantAssignment === "new" ? (
                        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="new_tenant.name"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Company name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme B.V." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_tenant.business_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a business type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {BUSINESS_TYPE_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_tenant.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                                    <SelectItem value="Belgium">Belgium</SelectItem>
                                    <SelectItem value="Germany">Germany</SelectItem>
                                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                    <SelectItem value="United States">United States</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_tenant.contact_email"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Contact email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="billing@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      ) : null}
                    </Card>
                  </div>

                  <div className="text-left">
                    <Card
                      className={cn(
                      "transition-colors",
                      tenantAssignment === "none" && "ring-2 ring-primary",
                    )}
                      onClick={() => selectTenantAssignment("none")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="size-4" />
                          No Tenant
                        </CardTitle>
                        <CardDescription>
                          Invite a system-level user without assigning them to an organisation.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? () => onOpenChange(false) : () => setStep(1)}
                disabled={isSubmitting}
              >
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              {step === 1 ? (
                <Button type="button" onClick={() => void handleNext()} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                  Send Invite
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
