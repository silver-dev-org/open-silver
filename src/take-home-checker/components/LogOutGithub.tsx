"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { HiOutlineLogout } from "react-icons/hi";

export default function LogOutGithub() {
  return (
    <Button
      variant="destructive"
      onClick={() => signOut()}
    >
      <HiOutlineLogout className="size-6" />
      Log out from Github
    </Button>
  );
}
