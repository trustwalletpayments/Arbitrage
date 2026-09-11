"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";
import "../auth.css";

export default function Signup(){
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setMessage("");setLoading(true);try{const supabase=createSupabaseBrowserClient();const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)throw error;setMessage("Account created. Check your email if email confirmation is enabled, then log in.")}catch(error){setMessage(error instanceof Error?error.message:"Unable to create account.")}finally{setLoading(false)}};
 return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/">ORBITEX<span>.</span></Link><div className="eyebrow">CREATE ACCOUNT</div><h1>Join the exchange</h1><p className="muted">Create your exchange account and start with testnet funds.</p><form onSubmit={submit}><label>Full name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters"/></label>{message&&<div className="notice">{message}</div>}<button className="btn primary full" disabled={loading} type="submit">{loading?"Creating…":"Create account"}</button></form><p className="auth-foot">Already registered? <Link href="/login">Log in</Link></p></div></main>
}
