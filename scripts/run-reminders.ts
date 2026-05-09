import "dotenv/config";
import { runReminderDispatch } from "../src/lib/reminders";

async function main() {
  const result = await runReminderDispatch();
  console.log("Reminder dispatch result:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
