import { hashPassword } from "../src/lib/password";
// Read stdin so the password need not appear in shell history or process arguments.
let input = "";
for await (const chunk of process.stdin) input += chunk;
const password = input.replace(/\r?\n$/, "");
if (password.length < 10) {
  console.error("Use at least 10 characters for a production password.");
  process.exit(1);
}
console.log(hashPassword(password));
