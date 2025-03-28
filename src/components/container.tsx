export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4">
      <section className="container mx-auto py-16 space-y-32">
        {children}
      </section>
    </div>
  );
}
