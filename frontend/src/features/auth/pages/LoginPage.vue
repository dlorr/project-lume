<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schemas";
import { useAuth } from "../composables/useAuth";
import AppInput from "@/components/ui/AppInput.vue";
import AppButton from "@/components/ui/AppButton.vue";

const { isLoading, serverError, login } = useAuth();

/**
 * useForm from vee-validate:
 *   - validates against loginSchema on submit
 *   - tracks field errors, touched, dirty state
 *   - handleSubmit only calls our callback if validation passes
 */
const { handleSubmit, errors } = useForm<LoginFormValues>({
  validationSchema: toTypedSchema(loginSchema),
});

// useField binds each field to the form context
// value is the reactive field value, handleChange updates it
const { value: email } = useField<string>("email");
const { value: password } = useField<string>("password");

const onSubmit = handleSubmit(async (values) => {
  await login(values);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-foreground tracking-tight mb-1">
        Welcome back
      </h2>
      <p class="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
      <!-- Server error banner -->
      <div
        v-if="serverError"
        class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md"
      >
        {{ serverError }}
      </div>

      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        :error="errors.email"
      />

      <div class="flex flex-col gap-1">
        <AppInput
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.password"
        />
        <!-- Forgot password — future feature placeholder -->
        <div class="flex justify-end mt-1">
          <span
            class="text-xs text-muted-foreground opacity-50 cursor-not-allowed"
          >
            Forgot password?
          </span>
        </div>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        :loading="isLoading"
        :full-width="true"
        class="mt-2"
      >
        Sign in
      </AppButton>
    </form>

    <!-- Register link -->
    <p class="text-sm text-muted-foreground text-center mt-6">
      Don't have an account?
      <router-link
        to="/auth/register"
        class="text-primary hover:text-primary-hover font-medium transition-colors"
      >
        Create one
      </router-link>
    </p>
  </div>
</template>
