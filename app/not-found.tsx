import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-xl text-center">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The route you opened is not part of FaceMark AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonVariants()} href="/">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
