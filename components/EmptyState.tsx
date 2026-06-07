import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function EmptyState() {
  const t = useTranslations("emptyState");

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 mt-2">
      <div className="text-5xl">📚</div>

      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>

        <p className="text-muted-foreground mt-2 max-w-md">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline">{t("summarize")}</Button>
        <Button variant="outline">{t("themes")}</Button>
        <Button variant="outline">{t("arguments")}</Button>
      </div>
    </div>
  );
}
