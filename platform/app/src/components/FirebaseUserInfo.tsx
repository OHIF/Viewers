import React from 'react';
import {
  useUserAuthentication,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@ohif/ui-next';
import { getAuth, signOut } from 'firebase/auth';

function LogoutIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
      />
    </svg>
  );
}

export default function FirebaseUserInfo(): React.ReactElement {
  const authContext = useUserAuthentication() as unknown as [{ user: any; enabled: boolean }, any];
  const user = authContext?.[0]?.user;

  if (!user) {
    return <></>;
  }

  const displayName: string = user.displayName || user.email || 'User';
  const email: string = user.email || '';
  const photoURL: string | null = user.photoURL ?? null;
  const initials: string = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex cursor-pointer items-center outline-none"
          title={displayName}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20 transition hover:ring-white/50"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-primary/30 text-primary flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ring-1 ring-white/20 transition hover:ring-white/50">
              {initials}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-52"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
          <span className="text-foreground text-sm font-semibold leading-tight">{displayName}</span>
          {email && (
            <span className="text-muted-foreground truncate text-xs font-normal">{email}</span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
          onClick={handleLogout}
        >
          <LogoutIcon />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
