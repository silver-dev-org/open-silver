import { signOut, useSession } from "next-auth/react";
import {  } from "react-icons/fi";
import { HiOutlineLogout } from "react-icons/hi";

export default function LogOutGithub() {
  const { data: session } = useSession();

  if (!session) return <></>

  return (
      <button
        onClick={() => signOut()}
        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-700 transition duration-200"
      >
        <HiOutlineLogout className="w-5 h-5 text-red-500" />
      </button>
  );
}
