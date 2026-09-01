const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "find(u=>u.id===session.userId)",
  "find((u:any)=>u.id===session.userId)"
);
server = server.replace(
  "find(u=>u.id===session.userId)", // for the second occurrence
  "find((u:any)=>u.id===session.userId)"
);
server = server.replace(
  "const user=users.get(String(username||\"\"));",
  "const user=users.get(String(username||\"\")) as any;"
);
server = server.replace(
  "const u=[...users.values()].find(x=>x.id===req.params.id);",
  "const u=[...users.values()].find((x:any)=>x.id===req.params.id) as any;"
);
server = server.replace(
  "const u=[...users.values()].find(x=>x.id===req.params.id);",
  "const u=[...users.values()].find((x:any)=>x.id===req.params.id) as any;"
);
server = server.replace(
  "const u=[...users.values()].find(x=>x.id===req.params.id);",
  "const u=[...users.values()].find((x:any)=>x.id===req.params.id) as any;"
);
server = server.replace(
  "const {passwordHash,...safe}=user;",
  "const {passwordHash,...safe}=user as any;"
);

fs.writeFileSync('server.ts', server);
console.log("Types 2 patched");
