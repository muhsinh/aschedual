import { redirect } from "next/navigation";

export default function ExtensionSettingsPage() {
  redirect("/settings/integrations?source=extension");
}
