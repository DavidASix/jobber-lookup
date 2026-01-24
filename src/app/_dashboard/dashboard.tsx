"use client";

import type { User } from "next-auth";

export function Dashboard({ user }: { user: User }) {
  return (
    <div className="flex flex-col border-2">
      <h2>Dashboard</h2>
      <p>{JSON.stringify(user)}</p>
    </div>
  );
}
