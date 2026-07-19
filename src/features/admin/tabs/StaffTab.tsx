import { useState } from "react";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  createStaffAccount,
  fetchStaff,
  removeStaffAccount,
  STAFF_TIERS,
  TIER_LABELS,
  TIER_RANK,
  tierAtLeast,
  updateStaffTier,
  type AdminUser,
  type StaffMember,
  type StaffTier,
} from "@/lib/adminApi";
import {
  AdminButton,
  EmptyState,
  Field,
  Panel,
  Row,
  SelectField,
  Tag,
} from "../ui";
import { formatDate, statusTone } from "../utils";
import { useAsyncData } from "../useAsyncData";

export function StaffTab({ currentUser }: { currentUser: AdminUser }) {
  const { data: staff, loading, reload } = useAsyncData(fetchStaff);

  return (
    <>
      <Panel
        title="Staff accounts"
        hint="Everyone with portal access, by tier. Owners manage staff; only super admins can grant owner or super admin."
        actions={
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh staff"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        }
      >
        {staff && staff.length === 0 && (
          <EmptyState>No staff accounts.</EmptyState>
        )}
        <div className="space-y-2">
          {staff?.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              currentUser={currentUser}
              onChanged={reload}
            />
          ))}
        </div>
      </Panel>
      <CreateStaffPanel currentUser={currentUser} onCreated={reload} />
    </>
  );
}

function StaffRow({
  member,
  currentUser,
  onChanged,
}: {
  member: StaffMember;
  currentUser: AdminUser;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const isSelf = member.id === currentUser.id;
  const canManageTier =
    !isSelf &&
    member.tier !== null &&
    TIER_RANK[member.tier] < TIER_RANK[currentUser.tier];
  const canRemoveAccount =
    !isSelf && member.tier !== null && tierAtLeast(currentUser.tier, "owner");

  const assignableTiers = STAFF_TIERS.filter((tier) => {
    if (TIER_RANK[tier] > TIER_RANK[currentUser.tier]) return false;
    if (tierAtLeast(tier, "owner") && currentUser.tier !== "super_admin")
      return false;
    return tier !== member.tier;
  });

  async function removeAccount() {
    const confirmed = window.confirm(
      `Remove @${member.username} from the dashboard entirely? This deletes the staff login account.`,
    );
    if (!confirmed) return;

    setPending(true);
    try {
      await removeStaffAccount(member.id);
      captureAdminEvent("admin_staff_account_removed", { tier: member.tier });
      toast({ title: `@${member.username} staff account removed` });
      onChanged();
    } catch (error) {
      captureAdminException(error, {
        action: "admin_staff_account_remove",
        tier: member.tier,
      });
      toast({
        title: "Could not remove staff account",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  async function setTier(tier: StaffTier | null) {
    setPending(true);
    try {
      await updateStaffTier(member.id, tier);
      captureAdminEvent("admin_staff_tier_changed", { to: tier });
      toast({
        title: tier
          ? `@${member.username} is now ${TIER_LABELS[tier]}`
          : `@${member.username} removed from staff`,
      });
      onChanged();
    } catch (error) {
      captureAdminException(error, { action: "admin_staff_tier_change" });
      toast({
        title: "Could not change tier",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Row>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
          @{member.username}
          {member.tier && <Tag tone="gold">{TIER_LABELS[member.tier]}</Tag>}
          <Tag tone={statusTone(member.status)}>{member.status}</Tag>
          {isSelf && <Tag tone="teal">You</Tag>}
        </p>
        <p className="mt-0.5 text-xs text-raw-silver/45">
          Created {formatDate(member.createdAt)} · Last seen{" "}
          {formatDate(member.lastSeenAt)}
        </p>
      </div>
      {(canManageTier || canRemoveAccount) && (
        <div className="flex flex-wrap gap-2">
          {canManageTier &&
            assignableTiers.map((tier) => (
              <AdminButton
                key={tier}
                tone="outline"
                disabled={pending}
                onClick={() => void setTier(tier)}
              >
                Make {TIER_LABELS[tier]}
              </AdminButton>
            ))}
          {canManageTier && (
            <AdminButton
              tone="danger"
              disabled={pending}
              onClick={() => void setTier(null)}
            >
              Revoke staff
            </AdminButton>
          )}
          {canRemoveAccount && (
            <AdminButton
              tone="danger"
              disabled={pending}
              onClick={() => void removeAccount()}
            >
              <Trash2 className="h-4 w-4" /> Remove account
            </AdminButton>
          )}
        </div>
      )}
    </Row>
  );
}

function CreateStaffPanel({
  currentUser,
  onCreated,
}: {
  currentUser: AdminUser;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<StaffTier>("moderator");
  const [creating, setCreating] = useState(false);

  const creatableTiers = STAFF_TIERS.filter((candidate) => {
    if (TIER_RANK[candidate] > TIER_RANK[currentUser.tier]) return false;
    if (tierAtLeast(candidate, "owner") && currentUser.tier !== "super_admin")
      return false;
    return true;
  });

  async function submit() {
    setCreating(true);
    try {
      await createStaffAccount(username.trim(), password, tier);
      captureAdminEvent("admin_staff_account_created", { tier });
      setUsername("");
      setPassword("");
      toast({ title: "Staff account created" });
      onCreated();
    } catch (error) {
      captureAdminException(error, {
        action: "admin_staff_account_create",
        tier,
      });
      toast({
        title: "Could not create account",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Panel
      title="Create staff account"
      hint="Create a new login with a staff tier."
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_170px_auto]">
        <Field
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
        />
        <Field
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (min 12 chars)"
          type="password"
        />
        <SelectField
          value={tier}
          onChange={(event) => setTier(event.target.value as StaffTier)}
        >
          {creatableTiers.map((candidate) => (
            <option key={candidate} value={candidate}>
              {TIER_LABELS[candidate]}
            </option>
          ))}
        </SelectField>
        <AdminButton
          disabled={creating || !username.trim() || password.length < 12}
          onClick={() => void submit()}
        >
          <UserPlus className="h-4 w-4" /> Create
        </AdminButton>
      </div>
    </Panel>
  );
}
