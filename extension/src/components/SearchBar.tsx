
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  initialName,
  onSearch,
}: {
  initialName: string;
  onSearch: (name: string) => void;
}) {
  const [value, setValue] = useState(initialName);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-2">
      <Input
        type="search"
        aria-label="이름 검색"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="이름으로 검색"
      />
      <Button type="submit" variant="secondary">
        검색
      </Button>
    </form>
  );
}
