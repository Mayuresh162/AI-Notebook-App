import { memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type SidebarIntegrationsProps = {
  syncing: boolean;
  onConnectGoogle: () => void;
  onConnectNotion: () => void;
  onSync: () => void;
};

function SidebarIntegrationsComponent({
  syncing,
  onConnectGoogle,
  onConnectNotion,
  onSync,
}: SidebarIntegrationsProps) {
  const t = useTranslations("sidebar.integrations");

  return (
    <div className="mt-7">
      <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-3">
        {t("heading")}
      </h2>

      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={onConnectGoogle}
          className="w-full justify-between h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          <span>{t("googleDrive")}</span>
          <span>📁</span>
        </Button>

        <Button
          variant="outline"
          onClick={onConnectNotion}
          className="w-full justify-between h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          <span>{t("notion")}</span>
          <span>📝</span>
        </Button>

        <Button
          variant="outline"
          onClick={onSync}
          disabled={syncing}
          className="w-full justify-between h-10 rounded-xl bg-[#151515] border-white/10 hover:bg-[#1d1d1d]"
        >
          <span>{t("sync")}</span>
          <span>🔄</span>
        </Button>
      </div>
    </div>
  );
}

export const SidebarIntegrations = memo(SidebarIntegrationsComponent);
