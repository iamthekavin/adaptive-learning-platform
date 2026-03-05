import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { getStudentInsights } from "./lib/adaptive/analytics-engine";
import fs from "fs";

async function main() {
  try {
    const data = await getStudentInsights("cm7nybshz0000l20b604rt1f2", "cm7o23qce000fwwx1xdd1mff2");
    fs.writeFileSync("error-out.json", JSON.stringify({ success: true, data }, null, 2));
  } catch (err: any) {
    fs.writeFileSync("error-out.json", JSON.stringify({
      success: false,
      message: err.message,
      cause: err.cause ? err.cause.message || String(err.cause) : null,
      stack: err.stack
    }, null, 2));
  }
}

main();
