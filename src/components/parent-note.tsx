import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function ParentNote({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{body}</CardDescription>
    </Card>
  );
}
