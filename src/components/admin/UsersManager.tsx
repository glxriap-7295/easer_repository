"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button, Select } from "@/components/ui";
import { apiGet, apiPatch } from "@/lib/client";
import { ROLES, ROLE_LABEL, type Role, type UserProfile } from "@/lib/roles";
import { useT } from "@/components/i18n/LanguageProvider";

export function UsersManager({ selfUid }: { selfUid: string }) {
  const { t } = useT();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  function load() {
    setLoading(true); setErr("");
    apiGet<UserProfile[]>("/api/admin/users", true).then(setUsers).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function update(uid: string, patch: { role?: Role; active?: boolean }, tag: string) {
    setBusy(tag); setErr("");
    try { await apiPatch(`/api/admin/users/${uid}`, patch); load(); }
    catch (e: any) { setErr(e.message); setBusy(""); }
  }

  return (
    <div>
      {err && <Card className="mb-4 border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</Card>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="py-2 pr-4">{t("common.email")}</th>
              <th className="py-2 pr-4">{t("admin.role")}</th>
              <th className="py-2 pr-4">{t("admin.active")}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-4 text-stone-500">{t("common.loading")}</td></tr>
            ) : users.map((u) => {
              const isSelf = u.uid === selfUid;
              return (
                <tr key={u.uid} className="border-b border-stone-100">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-stone-900">{u.displayName}</div>
                    <div className="text-xs text-stone-500">{u.email}{isSelf && <> · {t("admin.you")}</>}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <Select value={u.role} disabled={isSelf || !!busy} onChange={(e) => update(u.uid, { role: e.target.value as Role }, u.uid + "role")} className="w-40">
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </Select>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge color={u.active ? "green" : "red"}>{u.active ? t("admin.active") : t("admin.inactive")}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    {!isSelf && (
                      <Button variant={u.active ? "danger" : "secondary"} disabled={!!busy} onClick={() => update(u.uid, { active: !u.active }, u.uid + "active")}>
                        {u.active ? t("admin.deactivate") : t("admin.activate")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && !users.length && <tr><td colSpan={4} className="py-4 text-stone-500">—</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
