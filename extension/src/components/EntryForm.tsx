
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, createEntry } from "@/lib/api";

const NAME_MAX = 20;
const MESSAGE_MAX = 300;

export function EntryForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() !== "" && message.trim() !== "" && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createEntry({ name: name.trim(), message: message.trim() });
      setName("");
      setMessage("");
      onCreated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "글을 남기지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entry-name" className="text-sm font-medium">
              이름
            </label>
            <Input
              id="entry-name"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="entry-message" className="text-sm font-medium">
                메시지
              </label>
              <span className="text-xs text-muted-foreground">
                {message.length}/{MESSAGE_MAX}
              </span>
            </div>
            <Input
              id="entry-message"
              value={message}
              maxLength={MESSAGE_MAX}
              onChange={(e) => setMessage(e.target.value.replace(/[\r\n]+/g, " "))}
              placeholder="한마디를 남겨 주세요"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={!canSubmit} className="self-end">
            남기기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
