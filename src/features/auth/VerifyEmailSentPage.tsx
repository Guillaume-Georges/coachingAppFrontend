export default function VerifyEmailSentPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <div className="card p-6 text-sm text-gray-700 dark:text-slate-200">
        We sent a verification link to your inbox. Please click the link to verify your email address.
      </div>
      <a href="/login" className="text-sm text-gray-700 hover:underline">Back to sign in</a>
    </div>
  );
}

