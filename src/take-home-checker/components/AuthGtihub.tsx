"use client";

import { signIn, useSession } from "next-auth/react";
import { FaGithub } from "react-icons/fa";

export default function AuthGitHub() {
  const { data: session } = useSession();

  if (!!session) return <></>;

  return (
    <div className="flex flex-col items-center justify-center h-screen dark:bg-gray-900 dark:text-white">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 dark:text-gray-100">
        Sign in to GitHub to test your take-home
      </h2>
      <button
        onClick={() => signIn("github")}
        className="flex items-center bg-black text-white py-3 px-8 rounded-full hover:bg-gray-800 transition duration-200 shadow-lg dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <FaGithub className="mr-3 text-xl" />
        Sign in with GitHub
      </button>
    </div>
  );
}
