import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema/auth";
import { ac, adminRole, teacherRole, studentRole } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        teacher: teacherRole,
        student: studentRole,
      },
      defaultRole: "student",
    }),
  ],
});
