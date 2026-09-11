import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
async function seed() {
  const demo = process.env.DEMO_MODE === "true";
  const username = process.env.ADMIN_USERNAME || "silverhand";
  const passwordHash =
    process.env.ADMIN_PASSWORD_HASH || (demo ? hashPassword("engineer") : "");
  if (!passwordHash)
    throw new Error(
      "Set ADMIN_PASSWORD_HASH, or explicitly enable DEMO_MODE=true.",
    );
  await db.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
  // Idempotent seed: existing polls and votes are never overwritten.
  if (
    demo &&
    !(await db.poll.findUnique({ where: { id: "farqiah-demo-2026" } }))
  ) {
    await db.poll.create({
      data: {
        id: "farqiah-demo-2026",
        title: "The next game night",
        description:
          "The group chat has opinions. Let’s make it official. Pick the game, choose the snacks, and help shape our next night in.",
        status: "LIVE",
        rounds: {
          create: {
            number: 1,
            status: "LIVE",
            questions: {
              create: [
                {
                  title: "What are we playing?",
                  position: 0,
                  options: {
                    create: [
                      { label: "Rocket League", position: 0 },
                      { label: "It Takes Two", position: 1 },
                      { label: "Minecraft", position: 2 },
                      { label: "Something else", isText: true, position: 3 },
                    ],
                  },
                },
                {
                  title: "What’s on the snack table?",
                  position: 1,
                  type: "MULTIPLE",
                  maxSelections: 2,
                  options: {
                    create: [
                      { label: "Pizza", position: 0 },
                      { label: "Shawarma", position: 1 },
                      { label: "Chips & dips", position: 2 },
                      {
                        label: "Bring your own idea",
                        isText: true,
                        position: 3,
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
  }
  console.log("Admin seeded. Demo poll created if requested and absent.");
}
seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
