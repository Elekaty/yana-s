import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/form";
import { demoMode } from "@/lib/preview";

export default function LoginPage() {
  if (demoMode()) redirect("/kid/home");
  return <LoginForm />;
}
