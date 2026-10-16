import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/form";
import { BUILD_PREVIEW } from "@/lib/preview";

export default function LoginPage() {
  if (BUILD_PREVIEW) redirect("/kid/home");
  return <LoginForm />;
}
