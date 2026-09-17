import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect to Stage 1 for the demo
  redirect('/stage/1');
}
