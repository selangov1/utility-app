import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppShell, NotFound } from './AppShell'
import { HomePage } from './HomePage'
import { ToolPage } from './ToolPage'

const rootRoute = createRootRoute({ component: AppShell, notFoundComponent: NotFound })

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })

// Only the tool id is ever placed in the URL — never tool input.
const toolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools/$toolId',
  component: ToolPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, toolRoute]),
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
