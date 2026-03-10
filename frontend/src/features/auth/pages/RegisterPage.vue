<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth.schemas";
import { useAuth } from "../composables/useAuth";
import AppInput from "@/components/ui/AppInput.vue";
import AppButton from "@/components/ui/AppButton.vue";

const { isLoading, serverError, register } = useAuth();

const { handleSubmit, errors } = useForm<RegisterFormValues>({
  validationSchema: toTypedSchema(registerSchema),
});

const { value: firstName } = useField<string>("firstName");
const { value: lastName } = useField<string>("lastName");
const { value: email } = useField<string>("email");
const { value: username } = useField<string>("username");
const { value: password } = useField<string>("password");

const onSubmit = handleSubmit(async (values) => {
  await register(values);
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-foreground tracking-tight mb-1">
        Create your account
      </h2>
      <p class="text-sm text-muted-foreground">
        Start managing your projects today
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

      <!-- First + Last name side by side -->
      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="firstName"
          label="First name"
          placeholder="John"
          autocomplete="given-name"
          :error="errors.firstName"
        />
        <AppInput
          v-model="lastName"
          label="Last name"
          placeholder="Doe"
          autocomplete="family-name"
          :error="errors.lastName"
        />
      </div>

      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        :error="errors.email"
      />

      <AppInput
        v-model="username"
        label="Username"
        placeholder="johndoe"
        autocomplete="username"
        :error="errors.username"
      />

      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        :error="errors.password"
      />

      <AppButton
        type="submit"
        variant="primary"
        :loading="isLoading"
        :full-width="true"
        class="mt-2"
      >
        Create account
      </AppButton>
    </form>

    <p class="text-sm text-muted-foreground text-center mt-6">
      Already have an account?
      <router-link
        to="/auth/login"
        class="text-primary hover:text-primary-hover font-medium transition-colors"
      >
        Sign in
      </router-link>
    </p>
  </div>
</template>
