import React from "react";
import { FieldType } from "@/types/cms";

/**
 * Helper function to create a new field type configuration
 * This makes it easier and more consistent to add new field types
 */
export function createFieldType({
  value,
  label,
  icon,
  description,
  color,
  cmsComponent,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  cmsComponent: React.ComponentType<any>;
}): FieldType {
  return {
    value,
    label,
    icon,
    description,
    color,
    cmsComponent,
  };
}

/**
 * Color preset utilities for consistent field type styling
 */
export const FIELD_TYPE_COLORS = {
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-green-100 text-green-800",
  purple: "bg-purple-100 text-purple-800",
  orange: "bg-orange-100 text-orange-800",
  pink: "bg-pink-100 text-pink-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  cyan: "bg-cyan-100 text-cyan-800",
  emerald: "bg-emerald-100 text-emerald-800",
  violet: "bg-violet-100 text-violet-800",
  rose: "bg-rose-100 text-rose-800",
  gray: "bg-gray-100 text-gray-800",
} as const;

/**
 * Standard field validation helpers that can be reused across field types
 */
export const fieldValidators = {
  required: (value: any, fieldName: string) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Must be a valid email address';
    }
    return null;
  },

  url: (value: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'Must be a valid URL';
    }
    return null;
  },

  minLength: (value: string, min: number) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  number: (value: any) => {
    if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },

  positive: (value: number) => {
    if (value !== undefined && value !== null && Number(value) < 0) {
      return 'Must be a positive number';
    }
    return null;
  },
};

/**
 * Base field component props interface
 * All field components should accept these props
 */
export interface BaseFieldProps {
  field: {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    default_value?: string;
    description?: string;
    validation?: string;
  };
  fieldId: string;
  value: any;
  error?: string;
  handleFieldChange: (fieldId: string, value: any) => void;
  handleFieldBlur: (field: any) => void;
}

/**
 * Higher-order component that provides common field functionality
 */
export function withFieldWrapper<P extends BaseFieldProps>(
  WrappedComponent: React.ComponentType<P>
) {
  return function FieldWithWrapper(props: P) {
    const { field, fieldId, value, error, handleFieldChange, handleFieldBlur } = props;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {field.type && (
            <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {field.type}
            </span>
          )}
        </div>
        
        <WrappedComponent {...props} />
        
        {error && <p className="text-sm text-destructive">{error}</p>}
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  };
}

/**
 * Example usage:
 * 
 * const MyField = withFieldWrapper(({ field, fieldId, value, handleFieldChange }) => (
 *   <Input
 *     id={fieldId}
 *     value={value || ""}
 *     onChange={(e) => handleFieldChange(field.id, e.target.value)}
 *   />
 * ));
 * 
 * const myFieldType = createFieldType({
 *   value: "my-field",
 *   label: "My Field",
 *   icon: <MyIcon className="h-4 w-4" />,
 *   description: "A custom field type",
 *   color: FIELD_TYPE_COLORS.blue,
 *   cmsComponent: MyField,
 * });
 */