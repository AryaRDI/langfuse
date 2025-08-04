import { prisma } from "@langfuse/shared/src/db";
import { createOrgProjectAndApiKey } from "@langfuse/shared/src/server";
import type { Session } from "next-auth";
import { v4 } from "uuid";

export interface TestUser {
  id: string;
  name: string;
  email: string;
}

export interface TestSetup {
  caller: any;
  project: any;
  org: any;
  user: TestUser;
  session: Session;
}

/**
 * Creates a test user with the given properties
 */
export async function createTestUser(
  overrides?: Partial<TestUser>,
): Promise<TestUser> {
  const userId = overrides?.id ?? `test-user-${v4()}`;
  const userEmail = overrides?.email ?? `test-user-${v4()}@example.com`;
  const userName = overrides?.name ?? `Test User ${v4()}`;

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: userName,
      email: userEmail,
    },
    create: {
      id: userId,
      name: userName,
      email: userEmail,
    },
  });

  return {
    id: user.id,
    name: user.name ?? userName,
    email: user.email ?? userEmail,
  };
}

/**
 * Creates a test session for the given user and organization
 */
export function createTestSession(
  user: TestUser,
  org: any,
  project: any,
): Session {
  return {
    expires: "1",
    user: {
      id: user.id,
      canCreateOrganizations: true,
      name: user.name,
      organizations: [
        {
          id: org.id,
          name: org.name,
          role: "OWNER",
          plan: "cloud:hobby",
          cloudConfig: undefined,
          metadata: {},
          projects: [
            {
              id: project.id,
              role: "ADMIN",
              retentionDays: 30,
              deletedAt: null,
              name: project.name,
              metadata: {},
            },
          ],
        },
      ],
      featureFlags: {
        excludeClickhouseRead: false,
        templateFlag: true,
      },
      admin: true,
    },
    environment: {
      enableExperimentalFeatures: false,
      selfHostedInstancePlan: "cloud:hobby",
    },
  };
}

/**
 * Sets up a complete test environment for assistants tests
 */
export async function setupAssistantsTest(overrides?: {
  user?: Partial<TestUser>;
  projectId?: string;
}): Promise<TestSetup> {
  // Create organization and project
  const { project, org } = await createOrgProjectAndApiKey({
    projectId: overrides?.projectId,
  });

  // Create test user
  const user = await createTestUser(overrides?.user);

  // Create organization membership
  const orgMembership = await prisma.organizationMembership.upsert({
    where: {
      orgId_userId: {
        userId: user.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      orgId: org.id,
      role: "OWNER",
    },
  });

  // Create project membership
  await prisma.projectMembership.upsert({
    where: {
      projectId_userId: {
        userId: user.id,
        projectId: project.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      projectId: project.id,
      role: "ADMIN",
      orgMembershipId: orgMembership.id,
    },
  });

  // Create session
  const session = createTestSession(user, org, project);

  // Create tRPC context and caller
  const { appRouter } = await import("@/src/server/api/root");
  const { createInnerTRPCContext } = await import("@/src/server/api/trpc");

  const ctx = createInnerTRPCContext({
    session: session,
    headers: {},
  });

  const caller = appRouter.createCaller(ctx);

  return {
    caller,
    project,
    org,
    user,
    session,
  };
}

/**
 * Cleanup function to remove test data
 */
export async function cleanupTestData(setup: TestSetup) {
  try {
    // Clean up in reverse order of dependencies
    await prisma.projectMembership.deleteMany({
      where: {
        userId: setup.user.id,
        projectId: setup.project.id,
      },
    });

    await prisma.organizationMembership.deleteMany({
      where: {
        userId: setup.user.id,
        orgId: setup.org.id,
      },
    });

    await prisma.user.delete({
      where: { id: setup.user.id },
    });

    await prisma.project.delete({
      where: { id: setup.project.id },
    });

    await prisma.organization.delete({
      where: { id: setup.org.id },
    });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn("Cleanup error:", error);
  }
}
