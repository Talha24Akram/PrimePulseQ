// Shared utility for posting to Slack / Teams webhooks

type WebhookType = "slack" | "teams";

const ALLOWED_WEBHOOK_HOSTS: Record<WebhookType, string[]> = {
  slack: ["hooks.slack.com"],
  teams: ["outlook.office.com", "outlook.office365.com", "hooks.office.com"],
};

export function isAllowedWebhookUrl(raw: string, type: WebhookType): boolean {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_WEBHOOK_HOSTS[type].some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

export async function postToSlack(webhookUrl: string, payload: {
  title: string;
  text: string;
  surveyUrl?: string;
  companyName?: string;
}) {
  if (!isAllowedWebhookUrl(webhookUrl, "slack")) return false;

  const blocks: object[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${payload.title}*\n${payload.text}`,
      },
    },
  ];

  if (payload.surveyUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Take survey →" },
          style: "primary",
          url: payload.surveyUrl,
        },
      ],
    });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent by ${payload.companyName ?? "PrimePulseQ"} · All responses are anonymous`,
      },
    ],
  });

  const body = { blocks, text: payload.title };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postToTeams(webhookUrl: string, payload: {
  title: string;
  text: string;
  surveyUrl?: string;
  companyName?: string;
}) {
  if (!isAllowedWebhookUrl(webhookUrl, "teams")) return false;

  const body: Record<string, unknown> = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: payload.title,
              weight: "Bolder",
              size: "Medium",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: payload.text,
              wrap: true,
            },
            ...(payload.surveyUrl
              ? [
                  {
                    type: "ActionSet",
                    actions: [
                      {
                        type: "Action.OpenUrl",
                        title: "Take survey →",
                        url: payload.surveyUrl,
                        style: "positive",
                      },
                    ],
                  },
                ]
              : []),
            {
              type: "TextBlock",
              text: `Sent by ${payload.companyName ?? "PrimePulseQ"} · All responses are anonymous`,
              size: "Small",
              isSubtle: true,
              wrap: true,
            },
          ],
        },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyWebhooks(
  slackUrl: string | null | undefined,
  teamsUrl: string | null | undefined,
  payload: { title: string; text: string; surveyUrl?: string; companyName?: string }
) {
  const promises: Promise<boolean>[] = [];
  if (slackUrl && isAllowedWebhookUrl(slackUrl, "slack")) promises.push(postToSlack(slackUrl, payload));
  if (teamsUrl && isAllowedWebhookUrl(teamsUrl, "teams")) promises.push(postToTeams(teamsUrl, payload));
  await Promise.allSettled(promises);
}
