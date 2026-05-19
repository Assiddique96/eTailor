type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      {icon && <p className="text-4xl mb-3" aria-hidden>{icon}</p>}
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-secondary mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
