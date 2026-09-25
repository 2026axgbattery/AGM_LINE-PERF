export function PlaceholderPage({ title, milestone }: { title: string; milestone: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-h1">{title}</h1>
      <p className="text-body text-text-secondary">{milestone}에서 구현 예정입니다.</p>
    </div>
  );
}
