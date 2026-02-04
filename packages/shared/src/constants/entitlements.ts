export type PlanName = "FREE" | "PRO" | "POWER";

export const ENTITLEMENT_PLANS: Record<
  PlanName,
  {
    max_calendars: number;
    max_notion_workspaces: number;
    max_notion_dbs: number;
    saves_per_month: number | null;
    features: string[];
  }
> = {
  FREE: {
    max_calendars: 1,
    max_notion_workspaces: 1,
    max_notion_dbs: 1,
    saves_per_month: 30,
    features: ["propose", "manual_approval", "deadline_event"]
  },
  PRO: {
    max_calendars: 3,
    max_notion_workspaces: 1,
    max_notion_dbs: 3,
    saves_per_month: null,
    features: ["multi_block", "plan_regeneration", "edit_plan"]
  },
  POWER: {
    max_calendars: 10,
    max_notion_workspaces: 3,
    max_notion_dbs: 10,
    saves_per_month: null,
    features: ["advanced_rules", "faster_parsing", "multiple_presets"]
  }
};
