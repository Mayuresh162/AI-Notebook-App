import { memo } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

function SidebarHeaderComponent() {
  const t = useTranslations("sidebar");

  return (
    <div className="px-5 pt-5 pb-4 border-b">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.18em] mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Link
          href="/settings"
          aria-label={t("settings")}
          className="text-muted-foreground transition hover:text-foreground"
        >
          <Settings size={18} />
        </Link>
      </div>
    </div>
  );
}

export const SidebarHeader = memo(SidebarHeaderComponent);
