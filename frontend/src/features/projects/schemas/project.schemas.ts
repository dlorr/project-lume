import * as yup from "yup";

export const createProjectSchema = yup.object({
  name: yup
    .string()
    .required("Project name is required")
    .min(2, "Must be at least 2 characters")
    .max(100, "Must be at most 100 characters"),

  key: yup
    .string()
    .required("Project key is required")
    .min(2, "Must be at least 2 characters")
    .max(6, "Must be at most 6 characters")
    .matches(
      /^[A-Z]{2,6}$/,
      "Key must be 2–6 uppercase letters (e.g. MYP, PROJ)",
    )
    .transform((val: string) => val?.toUpperCase()),

  description: yup
    .string()
    .max(500, "Must be at most 500 characters")
    .optional(),
});

export type CreateProjectFormValues = yup.InferType<typeof createProjectSchema>;
