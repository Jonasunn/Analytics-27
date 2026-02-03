(function(){
  const qs = new URLSearchParams(location.search);
  const session_id = qs.get("session_id") || "";
  const banner_id = qs.get("banner_id") || "";
  const ret = qs.get("return") || "";

  const $ = (id)=>document.getElementById(id);
  $("session_id").value = session_id;
  $("banner_id").value = banner_id;

  const msg = $("msg");
  const form = $("regForm");
  const cont = $("continueLink");

  if(ret){
    cont.href = ret;
  }

  function setMsg(t, ok){
    msg.textContent = t;
    msg.className = "msg " + (ok ? "ok" : "err");
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    setMsg("Submitting…", true);

    const payload = {
      session_id,
      game_id: banner_id, // backend uses game_id as banner_id
      name: $("name").value.trim(),
      email: $("email").value.trim(),
      phone: $("phone").value.trim()
    };

    try{
      const r = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      if(!r.ok){
        const t = await r.text();
        throw new Error(t || "Request failed");
      }
      setMsg("Thanks! You're registered.", true);
      form.reset();
      // keep hidden fields
      $("session_id").value = session_id;
      $("banner_id").value = banner_id;

      if(ret){
        cont.style.display = "inline-block";
        cont.textContent = "Continue";
      }
    }catch(err){
      setMsg("Could not submit. Please try again.", false);
      console.error(err);
    }
  });
})();