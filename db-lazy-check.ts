import {db} from "./src/lib/db/index";

console.log("database module imported");
try {
  db.$connect();
} catch (error) {
  if (!(error instanceof Error)) throw error;
  console.log(error.message);
}
