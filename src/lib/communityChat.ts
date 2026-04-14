import { format, formatDistanceToNowStrict, isToday, isYesterday, subMinutes } from "date-fns";
import { toUserId, type CommunityRequestRecord } from "@/lib/adminData";

export type CommunityStatus = "Active" | "Early Access";

export interface CommunityChatMemberRecord {
  userId: string;
  username: string;
  joinedAt: string;
  lastSeenAt: string;
  lastReadAt?: string;
  notificationsEnabled: boolean;
}

export interface CommunityChatMessageRecord {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  pinned?: boolean;
  replyToMessageId?: string;
  replyToSenderName?: string;
  replyToText?: string;
  deletedAt?: string;
  deletedByUserId?: string;
}

export interface PersistedCommunityRecord {
  id: string;
  abbr: string;
  title: string;
  logoUrl?: string;
  description: string;
  topic: string;
  status: CommunityStatus;
  createdAt: string;
  createdBy?: string;
  members: CommunityChatMemberRecord[];
  messages: CommunityChatMessageRecord[];
}

interface SendCommunityMessageInput {
  senderId: string;
  senderName: string;
  text: string;
  replyToMessage?: CommunityChatMessageRecord | null;
}

interface JoinCommunityInput {
  userId: string;
  username: string;
}

interface UpdateCommunityPresentationInput {
  actorUserId: string;
  actorUsername?: string;
  title?: string;
  logoUrl?: string;
}

const COMMUNITY_CHATS_STORAGE_KEY = "raw.community-chats.v1";
const ONLINE_WINDOW_MINUTES = 15;

function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestCommunityTimestamp(community: PersistedCommunityRecord): number {
  return Math.max(
    0,
    ...community.messages.map((message) => toTimestamp(message.createdAt)),
    ...community.members.flatMap((member) => [toTimestamp(member.lastSeenAt), toTimestamp(member.lastReadAt)])
  );
}

function createMonotonicIsoTimestamp(previousTimestamp = 0): string {
  return new Date(Math.max(Date.now(), previousTimestamp + 1)).toISOString();
}

function buildCommunityAbbr(title: string): string {
  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  return titleWords.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("").slice(0, 3) || "NEW";
}

function ensureString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function ensureBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeMessage(rawMessage: unknown, communityId: string): CommunityChatMessageRecord | null {
  if (!rawMessage || typeof rawMessage !== "object") {
    return null;
  }

  const candidate = rawMessage as Partial<CommunityChatMessageRecord>;
  const senderName = ensureString(candidate.senderName, "unknown");

  return {
    id: ensureString(candidate.id, `${communityId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    communityId,
    senderId: ensureString(candidate.senderId, toUserId(senderName)),
    senderName,
    text: typeof candidate.text === "string" ? candidate.text : "",
    createdAt: ensureString(candidate.createdAt, new Date().toISOString()),
    pinned: ensureBoolean(candidate.pinned),
    replyToMessageId: typeof candidate.replyToMessageId === "string" ? candidate.replyToMessageId : undefined,
    replyToSenderName: typeof candidate.replyToSenderName === "string" ? candidate.replyToSenderName : undefined,
    replyToText: typeof candidate.replyToText === "string" ? candidate.replyToText : undefined,
    deletedAt: typeof candidate.deletedAt === "string" ? candidate.deletedAt : undefined,
    deletedByUserId: typeof candidate.deletedByUserId === "string" ? candidate.deletedByUserId : undefined,
  };
}

function normalizeMember(rawMember: unknown): CommunityChatMemberRecord | null {
  if (!rawMember || typeof rawMember !== "object") {
    return null;
  }

  const candidate = rawMember as Partial<CommunityChatMemberRecord>;
  const username = ensureString(candidate.username, "member");

  return {
    userId: ensureString(candidate.userId, toUserId(username)),
    username,
    joinedAt: ensureString(candidate.joinedAt, new Date().toISOString()),
    lastSeenAt: ensureString(candidate.lastSeenAt, candidate.joinedAt ?? new Date().toISOString()),
    lastReadAt: typeof candidate.lastReadAt === "string" ? candidate.lastReadAt : undefined,
    notificationsEnabled: ensureBoolean(candidate.notificationsEnabled, true),
  };
}

function normalizeCommunity(rawCommunity: unknown): PersistedCommunityRecord | null {
  if (!rawCommunity || typeof rawCommunity !== "object") {
    return null;
  }

  const candidate = rawCommunity as Partial<PersistedCommunityRecord>;
  const id = ensureString(candidate.id, "");
  const title = ensureString(candidate.title, "Untitled Community");
  if (!id) {
    return null;
  }

  return {
    id,
    abbr: ensureString(candidate.abbr, title.slice(0, 2).toUpperCase() || "GC"),
    title,
    logoUrl: typeof candidate.logoUrl === "string" ? candidate.logoUrl : undefined,
    description: ensureString(candidate.description, "Group chat"),
    topic: ensureString(candidate.topic, "Say something real."),
    status: candidate.status === "Active" || candidate.status === "Early Access" ? candidate.status : "Active",
    createdAt: ensureString(candidate.createdAt, new Date().toISOString()),
    createdBy: typeof candidate.createdBy === "string" ? candidate.createdBy : undefined,
    members: Array.isArray(candidate.members) ? candidate.members.map(normalizeMember).filter((member): member is CommunityChatMemberRecord => member !== null) : [],
    messages: Array.isArray(candidate.messages) ? candidate.messages.map((message) => normalizeMessage(message, id)).filter((message): message is CommunityChatMessageRecord => message !== null) : [],
  };
}

function createSeedMessage(
  communityId: string,
  id: string,
  senderName: string,
  text: string,
  createdAt: string,
  pinned = false,
): CommunityChatMessageRecord {
  return {
    id,
    communityId,
    senderId: toUserId(senderName),
    senderName,
    text,
    createdAt,
    pinned,
  };
}

function createSeedMember(username: string, joinedAt: string, notificationsEnabled: boolean): CommunityChatMemberRecord {
  return {
    userId: toUserId(username),
    username,
    joinedAt,
    lastSeenAt: joinedAt,
    lastReadAt: joinedAt,
    notificationsEnabled,
  };
}

function buildDefaultCommunities(): PersistedCommunityRecord[] {
  return [
    {
      id: "lnt",
      abbr: "LNT",
      title: "Late Night Talks",
      description: "Honest conversation when the world gets quiet and people finally say what they actually mean.",
      topic: "What thought has been following you all week?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("ghost_mind", "2026-04-13T22:48:00.000Z", true),
        createSeedMember("neon_drift", "2026-04-13T23:16:00.000Z", true),
        createSeedMember("silent_ash", "2026-04-13T23:57:00.000Z", false),
      ],
      messages: [
        createSeedMessage("lnt", "l1", "ghost_mind", "Does anyone else feel more alive at 2am than at 2pm?", "2026-04-13T23:48:00.000Z", true),
        createSeedMessage("lnt", "l2", "neon_drift", "Night strips away performance. People sound more honest here.", "2026-04-13T23:52:00.000Z"),
        createSeedMessage("lnt", "l3", "silent_ash", "I only journal when the house is asleep. Feels like my thoughts can breathe.", "2026-04-13T23:57:00.000Z"),
      ],
    },
    {
      id: "sic",
      abbr: "SIC",
      title: "Self-Improvement Circle",
      description: "Discipline, accountability, and momentum with people who are trying to become sharper every day.",
      topic: "What are you building discipline around right now?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("iron_will", "2026-04-13T21:52:00.000Z", true),
        createSeedMember("steady_form", "2026-04-13T22:36:00.000Z", true),
        createSeedMember("updraft", "2026-04-13T23:55:00.000Z", false),
      ],
      messages: [
        createSeedMessage("sic", "s1", "iron_will", "Day 30 of cold showers. The real win is doing it when I don’t want to.", "2026-04-13T23:36:00.000Z", true),
        createSeedMessage("sic", "s2", "steady_form", "Micro consistency beats motivation every time.", "2026-04-13T23:43:00.000Z"),
        createSeedMessage("sic", "s3", "updraft", "Who else is tracking sleep and training together instead of separately?", "2026-04-13T23:55:00.000Z"),
      ],
    },
    {
      id: "mw",
      abbr: "MW",
      title: "Mental Wellness",
      description: "Grounded reflection, support, and conversation that feels safe, useful, and real.",
      topic: "What has helped your head feel clearer this week?",
      status: "Early Access",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("soft_signal", "2026-04-13T22:10:00.000Z", true),
        createSeedMember("quiet_flame", "2026-04-13T23:49:00.000Z", true),
        createSeedMember("still_water", "2026-04-13T23:54:00.000Z", false),
      ],
      messages: [
        createSeedMessage("mw", "m1", "soft_signal", "Gratitude check: one thing you’re thankful for today.", "2026-04-13T23:19:00.000Z", true),
        createSeedMessage("mw", "m2", "quiet_flame", "Naming the feeling early has saved me from spiraling later.", "2026-04-13T23:49:00.000Z"),
        createSeedMessage("mw", "m3", "still_water", "Walked without headphones today. My nervous system needed the silence.", "2026-04-13T23:54:00.000Z"),
      ],
    },
    {
      id: "sg",
      abbr: "SG",
      title: "Signal Guild",
      description: "Culture, tech, money, and current events discussed without noise, clout, or recycled takes.",
      topic: "Which signal do you think people are missing right now?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("signal_hunter", "2026-04-13T22:58:00.000Z", true),
        createSeedMember("market_echo", "2026-04-13T23:47:00.000Z", false),
        createSeedMember("frictionless", "2026-04-13T23:56:00.000Z", true),
      ],
      messages: [
        createSeedMessage("sg", "g1", "signal_hunter", "Everyone is watching headlines. Nobody is watching behavioral shift.", "2026-04-13T23:27:00.000Z", true),
        createSeedMessage("sg", "g2", "market_echo", "Trust is becoming the rarest product online.", "2026-04-13T23:47:00.000Z"),
        createSeedMessage("sg", "g3", "frictionless", "The next big products will feel smaller, quieter, and more intimate.", "2026-04-13T23:56:00.000Z"),
      ],
    },
  ];
}

function readStoredCommunities(): PersistedCommunityRecord[] {
  if (typeof window === "undefined") {
    return buildDefaultCommunities();
  }

  try {
    const rawValue = window.localStorage.getItem(COMMUNITY_CHATS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeCommunity).filter((community): community is PersistedCommunityRecord => community !== null);
  } catch {
    return [];
  }
}

function mergeWithDefaults(storedCommunities: PersistedCommunityRecord[]): PersistedCommunityRecord[] {
  const defaultCommunities = buildDefaultCommunities();
  const knownIds = new Set(storedCommunities.map((community) => community.id));
  return [...storedCommunities, ...defaultCommunities.filter((community) => !knownIds.has(community.id))];
}

export function writeCommunityChats(communities: PersistedCommunityRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COMMUNITY_CHATS_STORAGE_KEY, JSON.stringify(communities));
}

export function readCommunityChats(): PersistedCommunityRecord[] {
  const storedCommunities = readStoredCommunities();
  const communities = storedCommunities.length > 0 ? mergeWithDefaults(storedCommunities) : buildDefaultCommunities();

  if (typeof window !== "undefined") {
    writeCommunityChats(communities);
  }

  return communities;
}

export function joinCommunityChat(communityId: string, { userId, username }: JoinCommunityInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = new Date().toISOString();
    const existingMember = community.members.find((member) => member.userId === userId);
    if (existingMember) {
      return {
        ...community,
        members: community.members.map((member) => member.userId === userId ? { ...member, username, lastSeenAt: now } : member),
      };
    }

    return {
      ...community,
      members: [
        ...community.members,
        {
          userId,
          username,
          joinedAt: now,
          lastSeenAt: now,
            lastReadAt: now,
          notificationsEnabled: true,
        },
      ],
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function touchCommunityMemberActivity(communityId: string, { userId, username }: JoinCommunityInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  let didUpdate = false;
  const now = new Date().toISOString();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const hasMember = community.members.some((member) => member.userId === userId);
    if (!hasMember) {
      return community;
    }

    didUpdate = true;
    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, username, lastSeenAt: now } : member),
    };
  });

  if (didUpdate) {
    writeCommunityChats(nextCommunities);
  }

  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function setCommunityNotifications(communityId: string, userId: string, enabled: boolean): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, notificationsEnabled: enabled, lastSeenAt: new Date().toISOString() } : member),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function sendCommunityMessage(communityId: string, input: SendCommunityMessageInput): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = createMonotonicIsoTimestamp(getLatestCommunityTimestamp(community));

    const hasMember = community.members.some((member) => member.userId === input.senderId);
    const members = hasMember
      ? community.members.map((member) => member.userId === input.senderId ? { ...member, username: input.senderName, lastSeenAt: now } : member)
      : [
          ...community.members,
          {
            userId: input.senderId,
            username: input.senderName,
            joinedAt: now,
            lastSeenAt: now,
            lastReadAt: now,
            notificationsEnabled: true,
          },
        ];

    const nextMessage: CommunityChatMessageRecord = {
      id: `${communityId}-${Date.now()}`,
      communityId,
      senderId: input.senderId,
      senderName: input.senderName,
      text: input.text.trim(),
      createdAt: now,
      replyToMessageId: input.replyToMessage?.id,
      replyToSenderName: input.replyToMessage?.senderName,
      replyToText: input.replyToMessage?.text,
    };

    return {
      ...community,
      members,
      messages: [...community.messages, nextMessage],
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function createCommunityFromApprovedRequest(request: CommunityRequestRecord): PersistedCommunityRecord {
  const communities = readCommunityChats();
  const requestCommunityId = `request-${request.id}`;
  const existingCommunity = communities.find((community) => community.id === requestCommunityId);
  if (existingCommunity) {
    return existingCommunity;
  }

  const abbr = buildCommunityAbbr(request.communityName);
  const nextCommunity: PersistedCommunityRecord = {
    id: requestCommunityId,
    abbr,
    title: request.communityName,
    description: request.whyNow,
    topic: request.samplePrompt || request.focusArea,
    status: "Early Access",
    createdAt: request.reviewedAt ?? new Date().toISOString(),
    createdBy: request.requesterId,
    members: [
      {
        userId: request.requesterId,
        username: request.requesterName,
        joinedAt: request.reviewedAt ?? new Date().toISOString(),
        lastSeenAt: request.reviewedAt ?? new Date().toISOString(),
        lastReadAt: request.reviewedAt ?? new Date().toISOString(),
        notificationsEnabled: true,
      },
    ],
    messages: request.samplePrompt
      ? [
          {
            id: `${requestCommunityId}-welcome`,
            communityId: requestCommunityId,
            senderId: request.requesterId,
            senderName: request.requesterName,
            text: request.samplePrompt,
            createdAt: request.reviewedAt ?? new Date().toISOString(),
            pinned: true,
          },
        ]
      : [],
  };

  const nextCommunities = [nextCommunity, ...communities];
  writeCommunityChats(nextCommunities);
  return nextCommunity;
}

export function canManageCommunity(community: PersistedCommunityRecord, userId: string, username?: string): boolean {
  if (!community.createdBy) {
    return false;
  }

  return community.createdBy === userId || (Boolean(username) && community.createdBy === username);
}

export function updateCommunityPresentation(
  communityId: string,
  { actorUserId, actorUsername, title, logoUrl }: UpdateCommunityPresentationInput,
): PersistedCommunityRecord | null {
  const communities = readCommunityChats();
  let updatedCommunity: PersistedCommunityRecord | null = null;

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    if (!canManageCommunity(community, actorUserId, actorUsername)) {
      updatedCommunity = null;
      return community;
    }

    const normalizedTitle = typeof title === "string" ? title.trim() : community.title;
    const normalizedLogoUrl = typeof logoUrl === "string" ? logoUrl.trim() : community.logoUrl;
    if (!normalizedTitle) {
      updatedCommunity = null;
      return community;
    }

    updatedCommunity = {
      ...community,
      title: normalizedTitle,
      abbr: buildCommunityAbbr(normalizedTitle),
      logoUrl: normalizedLogoUrl || undefined,
    };

    return updatedCommunity;
  });

  writeCommunityChats(nextCommunities);
  return updatedCommunity;
}

export function countOnlineMembers(community: PersistedCommunityRecord): number {
  const threshold = subMinutes(new Date(), ONLINE_WINDOW_MINUTES);
  return community.members.filter((member) => new Date(member.lastSeenAt) >= threshold).length;
}

export function countUnreadMessages(community: PersistedCommunityRecord, userId: string): number {
  const currentMember = community.members.find((member) => member.userId === userId);
  const lastReadTime = toTimestamp(currentMember?.lastReadAt);

  return community.messages.filter((message) => {
    if (message.senderId === userId || message.deletedAt) {
      return false;
    }

    return toTimestamp(message.createdAt) > lastReadTime;
  }).length;
}

export function markCommunityRead(communityId: string, userId: string): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    const now = createMonotonicIsoTimestamp(getLatestCommunityTimestamp(community));

    return {
      ...community,
      members: community.members.map((member) => member.userId === userId ? { ...member, lastReadAt: now, lastSeenAt: now } : member),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}

export function formatChatTimestamp(value: string): string {
  const date = new Date(value);
  const minutesAgo = Math.abs(Date.now() - date.getTime()) / 60000;

  if (minutesAgo < 1) {
    return "now";
  }

  if (minutesAgo < 60) {
    return `${Math.floor(minutesAgo)}m`;
  }

  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatChatDayLabel(value: string): string {
  const date = new Date(value);

  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "EEE, MMM d");
}

export function deleteCommunityMessage(communityId: string, messageId: string, requesterId: string): PersistedCommunityRecord | null {
  const communities = readCommunityChats();

  const nextCommunities = communities.map((community) => {
    if (community.id !== communityId) {
      return community;
    }

    return {
      ...community,
      messages: community.messages.map((message) => {
        if (message.id !== messageId || message.senderId !== requesterId || message.deletedAt) {
          return message;
        }

        return {
          ...message,
          text: "This message was deleted.",
          deletedAt: new Date().toISOString(),
          deletedByUserId: requesterId,
          replyToText: message.replyToText,
        };
      }),
    };
  });

  writeCommunityChats(nextCommunities);
  return nextCommunities.find((community) => community.id === communityId) ?? null;
}