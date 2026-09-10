"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";

export default function Login(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");setLoading(true);try{const supabase=createSupabaseBrowserClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;router.push("/dashboard");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Unable to log in.")}finally{setLoading(false)}};
 return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/">ARBITRAGE<span>.</span></Link><div className="eyebrow">WELCOME BACK</div><h1>Log in</h1><p className="muted">Access your exchange account.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>{message&&<div className="notice danger">{message}</div>}<button className="btn primary full" disabled={loading} type="submit">{loading?"Logging in…":"Log in"}</button></form><p className="auth-foot">Don&apos;t have an account? <Link href="/signup">Create one</Link></p></div></main>
}