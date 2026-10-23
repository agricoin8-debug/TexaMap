import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AuthForm from '@/components/auth-form'
export default async function SignIn() { if ((await getSession())?.user) redirect('/'); return <main className="command-center-bg flex min-h-screen items-center justify-center p-4"><AuthForm mode="sign-in" /></main> }
