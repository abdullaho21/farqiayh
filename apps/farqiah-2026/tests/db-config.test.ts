import test from "node:test";
import assert from "node:assert/strict";
import { postgresConnection } from "../src/lib/db-config";

test("PostgreSQL raw SQL and models use the same configured schema", () => {
  const result = postgresConnection(
    "postgresql://test:test@localhost/test?schema=farqiah_ci&sslmode=require&options=-c%20statement_timeout%3D5000",
  );
  const url = new URL(result.connectionString!);
  assert.equal(result.schema, "farqiah_ci");
  assert.equal(url.searchParams.has("schema"), false);
  assert.equal(url.searchParams.get("sslmode"), "require");
  assert.equal(
    url.searchParams.get("options"),
    '-c statement_timeout=5000 -c search_path="farqiah_ci"',
  );
});

test("schema names cannot add PostgreSQL startup arguments", () => {
  const schema = 'polls "demo" \\ -c statement_timeout=0';
  const result = postgresConnection(
    `postgresql://test:test@localhost/test?schema=${encodeURIComponent(schema)}`,
  );
  assert.equal(result.schema, schema);
  const options = new URL(result.connectionString!).searchParams.get(
    "options",
  )!;
  assert.ok(options.includes('""demo""'));
  assert.ok(options.includes(String.raw`\ -c\ statement_timeout=0`));
  assert.ok(options.includes(String.raw`\\`));
});

test("database-free generation uses the public schema default", () => {
  assert.deepEqual(postgresConnection(), {
    connectionString: undefined,
    schema: "public",
  });
  const result = postgresConnection("postgresql://localhost/test");
  assert.equal(result.schema, "public");
  assert.equal(
    new URL(result.connectionString!).searchParams.get("options"),
    '-c search_path="public"',
  );
});
