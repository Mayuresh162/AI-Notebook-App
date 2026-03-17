import { Button } from "@/components/ui/button";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="text-5xl">📚</div>

      <div>
        <h2 className="text-xl font-semibold">Your research starts here</h2>

        <p className="text-muted-foreground mt-2 max-w-md">
          Add PDFs, YouTube videos, or paste text on the left, then ask anything
          about your sources.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline">Summarize all sources</Button>
        <Button variant="outline">Key themes</Button>
        <Button variant="outline">Main arguments</Button>
      </div>
    </div>
  );
}
