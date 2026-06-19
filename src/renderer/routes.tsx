import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '@renderer/components/MainLayout'
import {
  DashboardPage,
  HeadToHeadPage,
  HistoricalRankingPage,
  PlayerProfilePage,
  PlayersPage,
  SettingsPage,
  StickersPage,
  TournamentDetailPage,
  TournamentsPage,
  TvModePage,
} from '@renderer/pages'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="tv/:tournamentId" element={<TvModePage />} />
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="players/:id" element={<PlayerProfilePage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="ranking" element={<HistoricalRankingPage />} />
        <Route path="head-to-head" element={<HeadToHeadPage />} />
        <Route path="stickers" element={<StickersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
