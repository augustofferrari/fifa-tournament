export interface Player {
  id: string
  name: string
  nickname: string | null
  teamName: string | null
  photoPath: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePlayerInput {
  name: string
  nickname?: string | null
  teamName?: string | null
  photoPath?: string | null
}

export interface UpdatePlayerInput {
  name?: string
  nickname?: string | null
  teamName?: string | null
  photoPath?: string | null
}

export interface ListPlayersOptions {
  teamName?: string
}
