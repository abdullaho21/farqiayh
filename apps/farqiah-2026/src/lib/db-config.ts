/** Apply the Prisma schema parameter to both model queries and raw SQL. */
export function postgresConnection(connectionString?: string) {
  if (!connectionString) return { connectionString, schema: "public" };
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? "public";
  // PostgreSQL quotes identifiers with double quotes. Startup options additionally
  // escape whitespace/backslashes so a schema name stays in one argument.
  const identifier = `"${schema.replaceAll('"', '""')}"`;
  const searchPath = identifier.replace(/[\\\s]/g, "\\$&");
  const options = url.searchParams.get("options");
  url.searchParams.set(
    "options",
    `${options ? `${options} ` : ""}-c search_path=${searchPath}`,
  );
  url.searchParams.delete("schema");
  return { connectionString: url.toString(), schema };
}
