"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Eye,EyeOff,LockKeyhole,Mail,ShieldCheck} from "lucide-react";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";
import "../auth.css";

export default function Login(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false); const [showPassword,setShowPassword]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");setLoading(true);try{const supabase=createSupabaseBrowserClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;router.push("/dashboard");router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Unable to log in.")}finally{setLoading(false)}};
 return <main className="auth-page"><div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/><div className="auth-card"><Link className="brand" href="/"><img src="/orbitex-logo.svg" alt=""/><span>ORBITEX</span></Link><div className="auth-trust"><ShieldCheck/> Secure account access</div><div className="eyebrow">WELCOME BACK</div><h1>Log in to <span>ORBITEX</span></h1><p className="muted">Access your exchange account and continue trading.</p><form onSubmit={submit}><label>Email<div className="auth-input"><Mail/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></div></label><label>Password<div className="auth-input"><LockKeyhole/><input type={showPassword?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>{message&&<div className="notice danger">{message}</div>}<button className="btn primary full" disabled={loading} type="submit">{loading?"Logging in…":"Log in to ORBITEX"}<span>→</span></button></form><div className="auth-divider"><span>NEW TO ORBITEX?</span></div><p className="auth-foot">Don&apos;t have an account? <Link href="/signup">Create your account <span>→</span></Link></p><div className="auth-security"><ShieldCheck/><span>Your account is protected by secure authentication.</span></div></div></main>
}
