"use client";
import ErrorScreen from "@/components/ErrorScreen";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ErrorScreen kind="500" retry={reset} />; }

