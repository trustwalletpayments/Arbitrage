"use client";
import {FormEvent, useState} from "react";
import Link from "next/link";

export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
 const submit=(e:FormEvent)=>{e.preventDefault(); alert("Authentication will be connected to Supabase later.")};
 return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/">ARBITRAGE<span>.</span></Link><div className="eyebrow">WELCOME BACK</div><h1>Log in</h1><p className="muted">Access your exchange account.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label><button className="btn primary full" type="submit">Log in</button></form><p className="auth-foot">Don&apos;t have an account? <Link href="/signup">Create one</Link></p></div></main>
}