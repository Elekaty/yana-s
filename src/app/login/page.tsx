import { LoginForm } from "@/app/login/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const linkError = query.error === "link" ? "That link did not sign you in. Send a new one and open it in this browser." : "";
  return <LoginForm linkError={linkError} />;
}
