const base = "https://walhad-carelink.onrender.com";
const login = await fetch(base + "/api/auth/login", { method:"POST", headers:{"content-type":"application/json"},
  body: JSON.stringify({ email:"admin@walhadhealth.so", password:"WalhadAdmin2026!" }) });
const cookie = login.headers.get("set-cookie")?.split(";")[0];
const list = await (await fetch(base + "/api/patients", { headers: { cookie } })).json();
console.log("patients before:", JSON.stringify(list.patients?.map(p => ({ id: p.id, name: p.displayName, readings: p.readings }))));
