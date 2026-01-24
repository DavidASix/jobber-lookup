export const urls = {
  graphql: "https://api.getjobber.com/api/graphql",
  oauth: "https://api.getjobber.com/api/oauth/token",
};

/**
 * Construct headers for Jobber GraphQL API requests
 */
export function createGraphqlHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-JOBBER-GRAPHQL-VERSION": "2024-12-05",
  };
}
