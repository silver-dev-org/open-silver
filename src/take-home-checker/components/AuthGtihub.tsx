"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa";

export default function AuthGitHub() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Button onClick={() => signIn("github")}>
        <FaGithub />
        Sign in with GitHub
      </Button>
    </div>
  );
}
