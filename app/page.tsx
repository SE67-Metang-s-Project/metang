import { redirect } from "next/navigation";
import { getCmuSession } from "@/lib/cmu-auth";
import { getUserHomePath } from "@/lib/loan-auth";

type HomeProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getCmuSession();
  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (!session) {
    redirect(errorCode ? `/login?error=${errorCode}` : "/login");
  }

  const homePath = await getUserHomePath(session.profile);
  redirect(homePath);
}