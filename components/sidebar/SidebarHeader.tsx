import { memo } from "react";
import { Power } from "lucide-react";
import { useTranslations } from "next-intl";

type SidebarHeaderProps = {
  onLogout: () => void;
};

function SidebarHeaderComponent({ onLogout }: SidebarHeaderProps) {
  const t = useTranslations("sidebar");

  return (
    <div className="px-5 pt-5 pb-4 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-[0.18em] mt-1">
            {t("subtitle")}
          </p>
        </div>

        <button
          type="button"
          aria-label={t("logout")}
          onClick={onLogout}
          className="cursor-pointer text-zinc-500 hover:text-white transition"
        >
          <Power size={18} />
        </button>
      </div>
    </div>
  );
}

export const SidebarHeader = memo(SidebarHeaderComponent);
