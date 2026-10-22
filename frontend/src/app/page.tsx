import { Suspense } from "react";
import { Guestbook } from "@/components/Guestbook";

export default function Page() {
  return (
    <Suspense>
      <Guestbook />
    </Suspense>
  );
}
