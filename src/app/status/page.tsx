import { api } from "~/trpc/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { StatusIndicator } from "~/components/status-indicator";

export default async function StatusPage() {
  const accounts = await api.jobber.getAccountStatuses();

  return (
    <div className="flex min-h-full flex-col gap-8 border-x px-2 py-8 md:p-10">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-4xl font-bold">Account Status</h1>
        <p className="text-muted-foreground text-sm">
          View the connection status of all Jobber accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobber Accounts</CardTitle>
          <CardDescription>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}{" "}
            registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Public ID
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Disconnected At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.public_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIndicator status={account.connection_status} />
                          <span className="capitalize">
                            {account.connection_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{account.name ?? "—"}</td>
                      <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                        {account.public_id}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {account.disconnected_at
                          ? new Date(account.disconnected_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
