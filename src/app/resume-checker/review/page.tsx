import { Review } from "@/resume-checker/pages/review";
import { Suspense } from "react";

export default function ReviewPage() {
  return (
    <Suspense>
      <Review />
    </Suspense>
  );
}
