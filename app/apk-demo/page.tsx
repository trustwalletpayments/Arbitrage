export default function ApkDemo() {
  return (
    <main style={{minHeight:"100vh",background:"#050b16",color:"#f4f7fb",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial,sans-serif"}}>
      <section style={{width:"min(520px,100%)",background:"#0b1422",border:"1px solid #1688ff55",borderRadius:24,padding:32,textAlign:"center",boxShadow:"0 20px 70px #0078ff18"}}>
        <div style={{width:64,height:64,borderRadius:18,margin:"0 auto 18px",display:"grid",placeItems:"center",background:"#0d2038",border:"1px solid #1688ff66",color:"#35a7ff",fontSize:30}}>↓</div>
        <h1 style={{margin:"0 0 10px",fontSize:30}}>ORBITEX APK</h1>
        <p style={{margin:"0 0 12px",color:"#9eacc0",lineHeight:1.6}}>Demo APK download page.</p>
        <p style={{margin:"0 0 26px",color:"#748399",fontSize:14,lineHeight:1.6}}>The real signed Android APK will be connected here later. No installation file is being distributed in this demo.</p>
        <a href="/" style={{display:"inline-flex",padding:"13px 22px",borderRadius:12,background:"#1688ff",color:"white",textDecoration:"none",fontWeight:700}}>Back to ORBITEX</a>
      </section>
    </main>
  );
}
