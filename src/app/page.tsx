import { redirect } from 'next/navigation';

// Root page — middleware handles auth redirect, this catches anything that slips through
export default function RootPage() {
  redirect('/login');
}
