import * as yup from "yup";

/**
 * Schemas mirror backend DTO validation rules exactly.
 * If backend changes (e.g. min password length), update here too.
 *
 * Keeping both in sync means the user gets frontend feedback
 * that matches what the backend would reject — no surprises.
 */

export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),

  password: yup.string().required("Password is required"),
});

export const registerSchema = yup.object({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "Must be at least 2 characters")
    .max(50, "Must be at most 50 characters"),

  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Must be at least 2 characters")
    .max(50, "Must be at most 50 characters"),

  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),

  username: yup
    .string()
    .required("Username is required")
    .min(3, "Must be at least 3 characters")
    .max(20, "Must be at most 20 characters")
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, underscores, and hyphens",
    ),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Must be at least 8 characters")
    .max(72, "Must be at most 72 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
export type RegisterFormValues = yup.InferType<typeof registerSchema>;
