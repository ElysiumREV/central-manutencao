import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

export default function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><AccessTimeRounded /></div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}
