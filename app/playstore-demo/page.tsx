export default function PlayStoreDemo() {
  return (
    <main style={{minHeight:"100vh",background:"#050b16",color:"#f4f7fb",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial,sans-serif"}}>
      <section style={{width:"min(520px,100%)",background:"#0b1422",border:"1px solid #1688ff55",borderRadius:24,padding:32,textAlign:"center",boxShadow:"0 20px 70px #0078ff18"}}>
        <img src="/orbitex-logo.svg" alt="ORBITEX" style={{width:58,height:58,marginBottom:18}} />
        <h1 style={{margin:"0 0 10px",fontSize:30}}>ORBITEX PlayStore</h1>
        <p style={{margin:"0 0 26px",color:"#9eacc0",lineHeight:1.6}}>Demo store page for the ORBITEX mobile app. The official PlayStore listing will be connected here later.</p>
        <a href="/" style={{display:"inline-flex",padding:"13px 22px",borderRadius:12,background:"#1688ff",color:"white",textDecoration:"none",fontWeight:700}}>Back to ORBITEX</a>
      </section>
    </main>
  );
}
