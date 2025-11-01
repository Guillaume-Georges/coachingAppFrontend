export function humanizeApiError(e: any) {
  if (e?.status === 401) return 'Please sign in to continue.';
  if (e?.status === 403) return 'You are not authorized for this action.';
  if (e?.status === 409) return 'Conflict. Please refresh.';
  if (e?.status === 422) return 'Validation error. Check your inputs.';
  return 'Something went wrong. Try again.';
}

