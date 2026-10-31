import { Link, Outlet } from '@tanstack/react-router'
import { CommandPalette } from '@/components/shell/CommandPalette'
import { Sidebar } from '@/components/shell/Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-6 md:p-8">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  )
}

export function NotFound() {
  return (
    <p className="text-sm text-muted-foreground">
      Page not found.{' '}
      <Link to="/" className="underline underline-offset-4">
        Browse all tools
      </Link>
    </p>
  )
}
